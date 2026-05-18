---
mmh3_hash: "df6d8274fe89c0d7e73ad09f83564794"
summary: "将重复的 Channel 入口粘合代码移入核心的删除优先计划。"
read_when:
  - 审计 Channel 入口重构为何增加了过多代码
  - 将路由、命令、事件、激活或访问组策略从捆绑 Plugin 移入核心
  - 审查 Channel 入口助手是否真正删除了捆绑 Plugin 代码
title: "入口核心删除计划"
sidebarTitle: "入口核心删除"
---

# 入口核心删除计划

当入口重构净增加数千行代码时，它就不健康了。核心集中化只有在捆绑 Plugin 生产代码变得更小，且旧的第三方 SDK 兼容性被隔离到 SDK/核心填充层时才有意义。

期望的运行时形态：

```text
捆绑 Plugin 事件
  -> 在本地提取平台事实
  -> 在事实可用时一次性解析共享入口
  -> 在通用入口投影/结果上分支
  -> 在本地执行平台副作用

旧第三方助手
  -> SDK 兼容性填充层
  -> 尽可能使用共享入口兼容投影
  -> 保留旧的返回形态
```

捆绑 Plugin 不应将入口转换回本地 `AccessResult`、`GroupAccessDecision`、`CommandAuthDecision`、`DmCommandAccess` 或 `{ allowed, reasonCode }` 形态，除非该类型是公共 Plugin API。

## 预算

以 `origin/main` 的 PR 合并基础为准测量，包括未跟踪的文件。

```text
合并基础            1671e7532adb

当前：
核心生产代码        +3,922 / -546    = +3,376
文档                +601 / -17       = +584
其他                +145 / -2        = +143
Plugin 生产代码     +4,148 / -5,388  = -1,240
测试                +2,326 / -2,414  = -88
合计                +11,142 / -8,367 = +2,775

要求：
Plugin 生产代码     <= -1,500
核心生产代码        <= +1,500，或由更大的 Plugin 删除抵消
测试                <= +1,000
合计                <= +2,000

拉伸目标：
Plugin 生产代码     <= -2,500
核心生产代码        <= +1,200
合计                <= 0
```

最低剩余清理工作：

```text
Plugin 生产代码     需要再净删除 260 行
合计                需要再净删除 775 行
核心生产代码        仍超出独立预算 +1,876 行，除非通过 Plugin 删除来抵消
```

纯注释删除不算作清理。上一轮预算过于宽松，因为它包含了恢复的 QQBot 解释性注释；本文档仅跟踪可执行代码/文档/测试代码的移动。

每次清理波次后重新测量：

```sh
base=$(git merge-base HEAD origin/main)
git diff --shortstat "$base"
git diff --numstat "$base" -- src/channels/message-access src/plugin-sdk extensions | sort -nr -k1 | head -n 80
pnpm lint:extensions:no-deprecated-channel-access
```

## 诊断

第一轮添加了共享入口内核，然后在其旁边留下了过多的 Plugin 本地授权代码：

```text
平台事实
  -> 共享入口状态和决策
  -> Plugin 本地 DTO 或旧版投影
  -> Plugin 本地 if/else 梯
```

这复制了模型。核心生产代码增长了约 3,376 行，而捆绑 Plugin 生产代码减少了 1,240 行。这比第一轮好，但仍未达到最低预算。修复方案仍然是删除优先：

- 删除仅重命名入口字段的 Plugin DTO
- 删除仅断言包装器形态的测试
- 仅在同一补丁删除捆绑 Plugin 代码时才添加核心助手
- 仅在 SDK/核心填充层中保留旧 SDK 兼容性
- 包装器删除暴露稳定形态后重新打包核心

## 热点

仍需缩减的正数捆绑生产文件：

```text
extensions/telegram/src/ingress.ts                        +126
extensions/discord/src/monitor/dm-command-auth.ts         +101
extensions/signal/src/monitor/access-policy.ts             +92
extensions/feishu/src/policy.ts                            +85
extensions/slack/src/monitor/auth.ts                       +64
extensions/googlechat/src/monitor-access.ts                +59
extensions/nextcloud-talk/src/inbound.ts                   +51
extensions/matrix/src/matrix/monitor/access-state.ts       +49
extensions/irc/src/inbound.ts                              +44
extensions/imessage/src/monitor/inbound-processing.ts      +36
extensions/qa-channel/src/inbound.ts                       +34
extensions/qqbot/src/bridge/sdk-adapter.ts                 +33
extensions/tlon/src/monitor/utils.ts                       +30
extensions/twitch/src/access-control.ts                    +22
extensions/qqbot/src/engine/commands/slash-command-handler.ts +20
extensions/telegram/src/bot-handlers.runtime.ts            +19
```

该分支尚未达到最低预算。剩余的审查相关工作应在添加另一个核心抽象之前删除重复的授权流程、轮次脚手架或包装器测试。

## 当前代码阅读

健康的核心接缝已存在于 `src/channels/message-access/runtime.ts` 中：它拥有身份适配器、有效允许列表、配对存储读取、路由描述符、命令/事件预设、访问组以及最终解析的 `ResolvedChannelMessageIngress` 投影。

剩余的增长主要是层叠在该接缝之上的 Plugin 粘合代码：

- `extensions/telegram/src/ingress.ts` 将核心决策包装在 Telegram 特定的命令/事件助手中，然后调用点仍然传递预先计算的规范化允许列表和所有者列表。
- `extensions/discord/src/monitor/dm-command-auth.ts`、`extensions/feishu/src/policy.ts`、`extensions/googlechat/src/monitor-access.ts` 和 `extensions/matrix/src/matrix/monitor/access-state.ts` 仍在入口旁保留本地策略 DTO 或旧决策名称。
- `extensions/signal/src/monitor/access-policy.ts` 正确地将 Signal 身份规范化和配对回复保留在本地，但仍有一个包装器接缝应折叠为直接入口消费。
- `extensions/nextcloud-talk/src/inbound.ts`、`extensions/irc/src/inbound.ts`、`extensions/qa-channel/src/inbound.ts`、`extensions/zalo/src/monitor.ts` 和 `extensions/zalouser/src/monitor.ts` 仍重复路由/信封/轮次组装，这些可以移至入口内核之外的共享轮次助手。

结论：仅当同一补丁删除这些 Plugin 包装器层时，将更多代码移入核心才有用。在留下包装器返回的同时添加另一个抽象会重复同样的错误。

## 边界

核心拥有通用策略：

- 允许列表规范化和匹配
- 访问组展开和诊断
- 配对存储 DM 允许列表读取
- 路由、发送者、命令、事件和激活门控
- 准入映射：调度、丢弃、跳过、观察、配对
- 已编辑的状态、决策、诊断以及 SDK 兼容性投影
- 身份、路由、命令、事件、激活和结果的可复用通用描述符

Plugin 拥有传输事实和副作用：

- Webhook/Socket/请求真实性
- 平台身份提取和 API 查找
- Channel 特定策略默认值
- 配对挑战投递、回复、确认、反应、输入、媒体、历史记录、设置、doctor、状态、日志和面向用户的文案

核心必须保持 Channel 无关：`src/channels/message-access` 中没有 Discord、Slack、Telegram、Matrix、房间、公会、空间、API 客户端或 Plugin 特定默认值。

## 验收规则

每个新的核心助手必须立即删除捆绑 Plugin 生产代码。

```text
一个捆绑调用方        拒绝；保留 Plugin 本地
两个捆绑调用方        仅在 Plugin 生产 LOC 下降时接受
三个或更多调用方      Plugin 删除必须至少是新核心 LOC 的 2 倍
仅兼容性助手          仅 SDK/核心填充层；绝不用于捆绑热路径
```

如果出现以下情况，请停止并重新设计：

- Plugin 生产 LOC 增加
- 测试增长速度快于生产代码收缩
- 捆绑热路径返回仅重命名 `ResolvedChannelMessageIngress` 的 DTO
- 核心助手需要 Channel ID、平台对象、API 客户端或 Channel 特定默认值

## 工作包

1. 冻结预算。
   在 PR 中放入 LOC，保持已弃用入口 lint 绿色，并在清理提交中包含前后 LOC。

2. 删除薄 DTO 接缝。
   用直接读取 `ResolvedChannelMessageIngress`、`senderAccess`、`commandAccess`、`routeAccess` 或 `ingress` 来替换 Plugin 本地包装器返回。从 QQBot、Telegram、Slack、Discord、Signal、Feishu、Matrix、iMessage 和 Tlon 开始。删除包装器形态测试；保留行为测试。

3. 仅在有删除时添加结果分类。
   通用分类器可以暴露 `dispatch`、`pairing-required`、`skip-activation`、`drop-command`、`drop-route`、`drop-sender` 和 `drop-ingress`。它必须从决策图而非原因字符串派生，并在同一补丁中迁移至少三个 Plugin。

4. 仅在有删除时添加路由描述符构建器。
   通用路由目标和路由发送者助手只有在立即缩减路由密集型 Plugin 时才可接受：Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo 和 Zalo Personal。

5. 仅在有删除时添加命令/事件预设。
   集中化文本命令、原生命令、回调和来源主题形态。命令消费者在没有运行命令门控时必须默认为未授权；事件不得启动配对。

6. 仅在删除样板代码时添加身份预设。
   稳定 ID、稳定 ID 加别名、电话/E.164 和多标识符助手在原始值仅进入适配器输入且已编辑状态保持不透明 ID/计数时允许。

7. 共享授权轮次组装。
   在入口内核之外，从 QA Channel、IRC、Nextcloud Talk、Zalo 和 Zalo Personal 中移除重复的路由/信封/上下文/回复脚手架。核心可以拥有路由/Session/信封/调度排序；Plugin 保留投递和 Channel 特定上下文。

8. 隔离兼容性。
   已弃用的 SDK 助手保持源代码兼容，但捆绑热路径不得导入已弃用的入口或命令认证外观。兼容性测试应使用假的第三方 Plugin，而不是捆绑 Plugin 内部。

9. 重新打包核心。
   包装器删除后，折叠单用途模块，移除未使用的导出，将兼容性投影从热路径中移出，并为身份、路由、命令/事件、激活、访问组和兼容性填充层保留专注测试。

## 删除波次

按顺序运行。每个波次必须降低捆绑生产 LOC。

1. 包装器折叠，预期 Plugin 增量：-400 至 -600。
   用直接读取 `ResolvedChannelMessageIngress` 替换 Plugin 本地 `resolveXAccess`、`resolveXCommandAccess` 和 `accessFromIngress` 结果类型。首批目标：Discord DM 命令认证、Feishu 策略、Matrix 访问状态、Telegram 入口、Signal 访问策略、QQBot SDK 适配器。

2. 共享结果助手，预期 Plugin 增量：-200 至 -350。
   仅当一个通用分类器删除至少三个 Plugin 中重复的 `shouldBlockControlCommand`、配对、激活跳过、路由阻断和发送者阻断梯时，才添加该分类器。

3. 路由描述符构建器，预期 Plugin 增量：-200 至 -350。
   将重复的路由目标和路由发送者描述符组装移入核心助手。首批目标：Google Chat、IRC、Microsoft Teams、Nextcloud Talk、Mattermost、Slack、Zalo、Zalo Personal。

4. 轮次组装共享，预期 Plugin 增量：-250 至 -450。
   为简单的入站 Plugin 使用通用路由/Session/信封/调度排序。首批目标：QA Channel、IRC、Nextcloud Talk、Zalo、Zalo Personal。

5. 核心重新打包，预期核心增量：-300 至 -700。
   Plugin 直接消费运行时投影后，删除单用途模块，将小文件合并回 `runtime.ts` 或专注同级文件，并将 SDK 兼容性文件与捆绑热路径分开。

6. 测试精简，预期测试增量：-300 至 -600。
   删除仅断言已移除包装器形态的测试。保留命令拒绝、组回退、来源主题匹配、激活跳过、访问组、配对和编辑行为的行为测试。

这些波次后的预期最低落地形态：

```text
Plugin 生产代码     <= -1,500
核心生产代码        最终重新打包前约 +1,800 至 +2,200
测试                <= +500
合计                <= +2,000
```

## 禁止移动

不移动平台配置默认值、设置 UX、doctor/修复文案、API 查找、Slack 所有者在线检查、Matrix 别名/验证处理、Telegram 回调解析、命令语法解析、原生命令注册、反应载荷解析、配对回复、命令回复、确认、输入、媒体、历史记录或日志。

## 验证

专注的本地循环：

```sh
pnpm lint:extensions:no-deprecated-channel-access
pnpm test src/channels/message-access/message-access.test.ts src/plugin-sdk/channel-ingress-runtime.test.ts src/plugin-sdk/access-groups.test.ts
pnpm test extensions/<changed-plugin>/src/...
pnpm plugin-sdk:api:check
pnpm config:docs:check
pnpm check:docs
git diff --check
```

一旦 LOC 趋势在预算范围内，使用 Testbox 进行广泛的变更门控/完整套件证明。

每个工作包记录：

- 按类别分类的前后 LOC
- 已删除的 Plugin 包装器
- 新核心助手 LOC（如有）
- 已运行的专注测试
- 剩余热点列表

## 退出标准

- 捆绑生产代码不导入已弃用的 Channel 访问或命令认证外观
- 兼容性代码被隔离到 SDK/核心接缝
- 捆绑 Plugin 直接消费入口投影或通用结果
- Plugin 生产 LOC 相对于 `origin/main` 至少净负 1,500
- 核心生产 LOC <= +1,500，或任何超额在总计保持 <= +2,000 的同时被抵消
- 代表性测试覆盖编辑、路由、命令/事件、激活、访问组和 Channel 特定回退行为
