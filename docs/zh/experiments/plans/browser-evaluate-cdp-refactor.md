---
mmh3_hash: "23c8858427354c710ba3b51524966990"
title: "Browser Evaluate CDP 重构"
summary: "计划：使用 CDP 将 browser act:evaluate 从 Playwright 队列中隔离，设置端到端截止时间并改进引用解析"
read_when:
  - 处理 browser `act:evaluate` 的超时、中止或队列阻塞问题
  - 规划基于 CDP 的 evaluate 执行隔离方案
owner: "openclaw"
status: "draft"
last_updated: "2026-02-10"
---

# Browser Evaluate CDP 重构计划

## 背景

`act:evaluate` 在页面中执行用户提供的 JavaScript。目前通过 Playwright（`page.evaluate` 或 `locator.evaluate`）运行。Playwright 按页面序列化 CDP 命令，因此卡住或长时间运行的 evaluate 会阻塞页面命令队列，使该标签页上的后续操作看起来"卡住了"。

PR #13498 添加了一个实用的安全网（有界 evaluate、中止传播和尽力恢复）。本文档描述了一个更大规模的重构，使 `act:evaluate` 从本质上与 Playwright 隔离，防止卡住的 evaluate 阻塞正常的 Playwright 操作。

## 目标

- `act:evaluate` 不能永久阻塞同一标签页上的后续浏览器操作。
- 超时是端到端的单一可信来源，调用者可以依赖预算。
- 中止和超时在 HTTP 和进程内分发中以相同方式处理。
- 支持 evaluate 的元素定位，无需将所有操作都迁移离 Playwright。
- 保持与现有调用者和 payload 的向后兼容。

## 非目标

- 用 CDP 实现替换所有浏览器操作（点击、输入、等待等）。
- 移除 PR #13498 引入的现有安全网（它仍是有用的回退）。
- 在现有 `browser.evaluateEnabled` 门控之外引入新的不安全能力。
- 为 evaluate 添加进程隔离（worker 进程/线程）。如果此次重构后仍出现难以恢复的卡死状态，这将作为后续方案。

## 当前架构（为何会卡住）

总体上：

- 调用者向浏览器控制服务发送 `act:evaluate`。
- 路由处理程序调用 Playwright 执行 JavaScript。
- Playwright 序列化页面命令，因此永不结束的 evaluate 会阻塞队列。
- 队列卡住意味着该标签页上的后续点击/输入/等待操作看起来会挂起。

## 提议架构

### 1. 截止时间传播

引入单一预算概念，并从中派生所有内容：

- 调用者设置 `timeoutMs`（或未来的截止时间）。
- 外部请求超时、路由处理程序逻辑以及页面内执行预算均使用相同的预算，在序列化开销需要时留有少量余量。
- 中止通过 `AbortSignal` 在所有地方传播，使取消行为保持一致。

实现方向：

- 添加一个小型辅助函数（例如 `createBudget({ timeoutMs, signal })`），返回：
  - `signal`：关联的 AbortSignal
  - `deadlineAtMs`：绝对截止时间
  - `remainingMs()`：子操作的剩余预算
- 在以下位置使用此辅助函数：
  - `src/browser/client-fetch.ts`（HTTP 和进程内分发）
  - `src/node-host/runner.ts`（代理路径）
  - 浏览器操作实现（Playwright 和 CDP）

### 2. 独立 Evaluate 引擎（CDP 路径）

添加基于 CDP 的 evaluate 实现，不共享 Playwright 的按页命令队列。关键特性是 evaluate 传输使用独立的 WebSocket 连接和附加到目标的独立 CDP session。

实现方向：

- 新模块，例如 `src/browser/cdp-evaluate.ts`，功能包括：
  - 连接到配置的 CDP 端点（浏览器级 socket）。
  - 使用 `Target.attachToTarget({ targetId, flatten: true })` 获取 `sessionId`。
  - 运行：
    - `Runtime.evaluate` 用于页面级 evaluate，或
    - `DOM.resolveNode` 加 `Runtime.callFunctionOn` 用于元素 evaluate。
  - 超时或中止时：
    - 尽力发送 `Runtime.terminateExecution` 到该 session。
    - 关闭 WebSocket 并返回明确的错误。

注意：

- 这仍在页面中执行 JavaScript，因此终止可能有副作用。优势在于它不会阻塞 Playwright 队列，并且可以通过关闭 CDP session 在传输层取消。

### 3. 引用处理（无需完全重写的元素定位）

难点在于元素定位。CDP 需要 DOM 句柄或 `backendDOMNodeId`，而目前大多数浏览器操作使用基于快照中引用的 Playwright locator。

推荐方案：保留现有引用，但附加可选的 CDP 可解析 id。

#### 3.1 扩展存储的引用信息

扩展存储的角色引用元数据以可选地包含 CDP id：

- 当前：`{ role, name, nth }`
- 提议：`{ role, name, nth, backendDOMNodeId?: number }`

这使所有现有的 Playwright 操作继续正常工作，并允许 CDP evaluate 在 `backendDOMNodeId` 可用时接受相同的 `ref` 值。

#### 3.2 在快照时填充 backendDOMNodeId

生成角色快照时：

1. 像今天一样生成现有的角色引用映射（role, name, nth）。
2. 通过 CDP 获取 AX 树（`Accessibility.getFullAXTree`），使用相同的重复处理规则计算 `(role, name, nth) -> backendDOMNodeId` 的并行映射。
3. 将 id 合并回当前标签页的存储引用信息中。

如果某个引用映射失败，则将 `backendDOMNodeId` 设为 undefined。这使该功能成为尽力而为且安全可推出的。

#### 3.3 带引用的 Evaluate 行为

在 `act:evaluate` 中：

- 如果 `ref` 存在且有 `backendDOMNodeId`，通过 CDP 运行元素 evaluate。
- 如果 `ref` 存在但没有 `backendDOMNodeId`，回退到 Playwright 路径（带安全网）。

可选的逃生舱：

- 扩展请求形状，允许高级调用者直接传入 `backendDOMNodeId`（用于调试），同时保持 `ref` 为主接口。

### 4. 保留最后手段恢复路径

即使使用 CDP evaluate，仍有其他方式使标签页或连接卡住。保留现有恢复机制（终止执行 + 断开 Playwright）作为最后手段，用于：

- 旧版调用者
- CDP 附加被阻止的环境
- Playwright 意外边缘情况

## 实施计划（单次迭代）

### 交付物

- 在 Playwright 按页命令队列之外运行的 CDP evaluate 引擎。
- 调用者和处理程序一致使用的单一端到端超时/中止预算。
- 可选携带 `backendDOMNodeId` 用于元素 evaluate 的引用元数据。
- `act:evaluate` 尽可能优先使用 CDP 引擎，不可用时回退到 Playwright。
- 证明卡住的 evaluate 不会阻塞后续操作的测试。
- 使故障和回退可见的日志/指标。

### 实施清单

1. 添加共享"预算"辅助函数，将 `timeoutMs` + 上游 `AbortSignal` 链接为：
   - 单个 `AbortSignal`
   - 绝对截止时间
   - 用于下游操作的 `remainingMs()` 辅助函数
2. 更新所有调用路径使用该辅助函数，使 `timeoutMs` 在所有地方含义一致：
   - `src/browser/client-fetch.ts`（HTTP 和进程内分发）
   - `src/node-host/runner.ts`（node 代理路径）
   - 调用 `/act` 的 CLI 封装（为 `browser evaluate` 添加 `--timeout-ms`）
3. 实现 `src/browser/cdp-evaluate.ts`：
   - 连接到浏览器级 CDP socket
   - `Target.attachToTarget` 获取 `sessionId`
   - 运行 `Runtime.evaluate` 用于页面 evaluate
   - 运行 `DOM.resolveNode` + `Runtime.callFunctionOn` 用于元素 evaluate
   - 超时/中止时：尽力执行 `Runtime.terminateExecution` 然后关闭 socket
4. 扩展存储的角色引用元数据，可选地包含 `backendDOMNodeId`：
   - 保留 Playwright 操作的现有 `{ role, name, nth }` 行为
   - 添加 `backendDOMNodeId?: number` 用于 CDP 元素定位
5. 在快照创建期间填充 `backendDOMNodeId`（尽力而为）：
   - 通过 CDP 获取 AX 树（`Accessibility.getFullAXTree`）
   - 计算 `(role, name, nth) -> backendDOMNodeId` 并合并到存储的引用映射中
   - 如果映射不明确或缺失，将 id 设为 undefined
6. 更新 `act:evaluate` 路由：
   - 无 `ref`：始终使用 CDP evaluate
   - `ref` 解析为 `backendDOMNodeId`：使用 CDP 元素 evaluate
   - 否则：回退到 Playwright evaluate（仍有界且可中止）
7. 保留现有的"最后手段"恢复路径作为回退，而非默认路径。
8. 添加测试：
   - 卡住的 evaluate 在预算内超时，且下一个点击/输入成功
   - 中止取消 evaluate（客户端断开或超时）并解除后续操作的阻塞
   - 映射失败时干净地回退到 Playwright
9. 添加可观测性：
   - evaluate 持续时间和超时计数器
   - terminateExecution 使用情况
   - 回退率（CDP -> Playwright）及原因

### 验收标准

- 故意挂起的 `act:evaluate` 在调用者预算内返回，且不使标签页在后续操作中卡住。
- `timeoutMs` 在 CLI、Agent 工具、node 代理和进程内调用中行为一致。
- 如果 `ref` 能映射到 `backendDOMNodeId`，元素 evaluate 使用 CDP；否则回退路径仍有界且可恢复。

## 测试计划

- 单元测试：
  - `(role, name, nth)` 角色引用与 AX 树节点之间的匹配逻辑。
  - 预算辅助函数行为（余量、剩余时间计算）。
- 集成测试：
  - CDP evaluate 超时在预算内返回，且不阻塞下一个操作。
  - 中止取消 evaluate 并触发尽力终止。
- 契约测试：
  - 确保 `BrowserActRequest` 和 `BrowserActResponse` 保持兼容。

## 风险与缓解

- 映射不完美：
  - 缓解：尽力映射，回退到 Playwright evaluate，并添加调试工具。
- `Runtime.terminateExecution` 有副作用：
  - 缓解：仅在超时/中止时使用，并在错误中记录该行为。
- 额外开销：
  - 缓解：仅在请求快照时获取 AX 树，按目标缓存，保持 CDP session 短暂存活。
- 扩展中继限制：
  - 缓解：当按页 socket 不可用时使用浏览器级附加 API，并保留当前 Playwright 路径作为回退。

## 待解决问题

- 新引擎是否应该可配置为 `playwright`、`cdp` 或 `auto`？
- 是否希望为高级用户公开新的 "nodeRef" 格式，还是仅保留 `ref`？
- 帧快照和选择器范围快照如何参与 AX 映射？
