---
mmh3_hash: "84b280a3b3088432a7bd23a1bc30195d"
title: "形式验证（安全模型）"
sidebarTitle: "形式验证"
summary: OpenClaw 最高风险路径的机器检查安全模型。
read_when:
  - 审查形式安全模型保证或限制时
  - 重现或更新 TLA+/TLC 安全模型检查时
permalink: /security/formal-verification/
---

本页跟踪 OpenClaw 的**形式安全模型**（目前为 TLA+/TLC；根据需要会添加更多）。

> 注意：一些旧链接可能引用以前的项目名称。

**目标（北极星）：** 提供机器检查的论证，证明 OpenClaw 在明确假设下执行了其预期的安全策略（授权、Session 隔离、工具门控和错误配置安全）。

**现状（当前）：** 一个可执行的、攻击者驱动的**安全回归套件**：

- 每个声明都有在有限状态空间上可运行的模型检查。
- 许多声明都有配套的**负面模型**，为现实的 bug 类生成反例跟踪。

**现状尚未实现：** 证明"OpenClaw 在所有方面都是安全的"或完整 TypeScript 实现是正确的。

## 模型存放位置

模型在独立仓库中维护：[vignesh07/openclaw-formal-models](https://github.com/vignesh07/openclaw-formal-models)。

## 重要注意事项

- 这些是**模型**，不是完整的 TypeScript 实现。模型和代码之间的漂移是可能的。
- 结果受 TLC 探索的状态空间限制；"绿色"不意味着超出建模假设和范围的安全性。
- 某些声明依赖于明确的环境假设（例如，正确的部署、正确的配置输入）。

## 重现结果

目前，通过在本地克隆模型仓库并运行 TLC 来重现结果（见下文）。未来的迭代可能提供：

- 带有公共构件的 CI 运行模型（反例跟踪、运行日志）
- 用于小型有界检查的托管"运行此模型"工作流

入门：

```bash
git clone https://github.com/vignesh07/openclaw-formal-models
cd openclaw-formal-models

# 需要 Java 11+（TLC 在 JVM 上运行）。
# 仓库提供了一个固定的 `tla2tools.jar`（TLA+ 工具）并提供 `bin/tlc` + Make 目标。

make <target>
```

### Gateway 暴露和开放 Gateway 错误配置

**声明：** 在没有认证的情况下绑定到回环以外的位置可能使远程入侵成为可能/增加暴露；Token/密码会阻止未认证的攻击者（根据模型假设）。

- 绿色运行：
  - `make gateway-exposure-v2`
  - `make gateway-exposure-v2-protected`
- 红色（预期）：
  - `make gateway-exposure-v2-negative`

另见：模型仓库中的 `docs/gateway-exposure-matrix.md`。

### Node 执行流水线（最高风险能力）

**声明：** `exec host=node` 需要 (a) Node 命令允许列表加已声明的命令，以及 (b) 配置时的实时批准；批准被令牌化以防止重放（在模型中）。

- 绿色运行：
  - `make nodes-pipeline`
  - `make approvals-token`
- 红色（预期）：
  - `make nodes-pipeline-negative`
  - `make approvals-token-negative`

### 配对存储（DM 门控）

**声明：** 配对请求遵守 TTL 和待处理请求上限。

- 绿色运行：
  - `make pairing`
  - `make pairing-cap`
- 红色（预期）：
  - `make pairing-negative`
  - `make pairing-cap-negative`

### 入站门控（提及 + 控制命令绕过）

**声明：** 在需要提及的群组上下文中，未授权的"控制命令"无法绕过提及门控。

- 绿色：
  - `make ingress-gating`
- 红色（预期）：
  - `make ingress-gating-negative`

### 路由/Session 键隔离

**声明：** 来自不同对等方的 DM 不会折叠到同一个 Session，除非被明确链接/配置。

- 绿色：
  - `make routing-isolation`
- 红色（预期）：
  - `make routing-isolation-negative`

## v1++：额外的有界模型（并发、重试、跟踪正确性）

这些是后续模型，围绕现实世界的失败模式（非原子更新、重试和消息扇出）收紧保真度。

### 配对存储并发/幂等性

**声明：** 即使在交错下（即"检查后写入"必须是原子的/锁定的；刷新不应该创建重复），配对存储也应该执行 `MaxPending` 和幂等性。

含义：

- 在并发请求下，一个 Channel 不能超过 `MaxPending`。
- 同一 `(channel, sender)` 的重复请求/刷新不应创建重复的活动待处理行。

- 绿色运行：
  - `make pairing-race`（原子/锁定的上限检查）
  - `make pairing-idempotency`
  - `make pairing-refresh`
  - `make pairing-refresh-race`
- 红色（预期）：
  - `make pairing-race-negative`（非原子开始/提交上限竞争）
  - `make pairing-idempotency-negative`
  - `make pairing-refresh-negative`
  - `make pairing-refresh-race-negative`

### 入站跟踪关联/幂等性

**声明：** 摄取应该在扇出过程中保留跟踪关联，并在 Provider 重试下保持幂等。

含义：

- 当一个外部事件变成多个内部消息时，每个部分都保持相同的跟踪/事件标识。
- 重试不会导致重复处理。
- 如果 Provider 事件 ID 缺失，去重会回退到安全键（如跟踪 ID）以避免丢失不同的事件。

- 绿色：
  - `make ingress-trace`
  - `make ingress-trace2`
  - `make ingress-idempotency`
  - `make ingress-dedupe-fallback`
- 红色（预期）：
  - `make ingress-trace-negative`
  - `make ingress-trace2-negative`
  - `make ingress-idempotency-negative`
  - `make ingress-dedupe-fallback-negative`

### 路由 dmScope 优先级 + identityLinks

**声明：** 路由必须默认保持 DM Session 隔离，只有在明确配置时才折叠 Session（Channel 优先级 + 身份链接）。

含义：

- Channel 特定的 dmScope 覆盖必须优先于全局默认值。
- identityLinks 应该只在明确链接的组内折叠，而不是跨不相关的对等方。

- 绿色：
  - `make routing-precedence`
  - `make routing-identitylinks`
- 红色（预期）：
  - `make routing-precedence-negative`
  - `make routing-identitylinks-negative`

## 相关

- [威胁模型](/security/THREAT-MODEL-ATLAS)
- [为威胁模型做贡献](/security/CONTRIBUTING-THREAT-MODEL)
