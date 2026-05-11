---
mmh3_hash: "4e4f8af1bda43425905969a9ee457af1"
summary: "用于确定性 OpenClaw QA 场景的合成 Slack 级别 Channel 插件"
title: "QA channel"
read_when:
  - 将合成 QA 传输连接到本地或 CI 测试运行中
  - 需要内置的 qa-channel 配置界面
  - 正在迭代端到端 QA 自动化
---

`qa-channel` 是用于自动化 OpenClaw QA 的内置合成消息传输。这不是生产 Channel——它的存在是为了行使真实传输所使用的相同 Channel 插件边界，同时保持状态确定性且完全可检查。

## 功能

- Slack 级别的目标语法：
  - `dm:<user>`
  - `channel:<room>`
  - `group:<room>`
  - `thread:<room>/<thread>`
- 共享的 `channel:` 和 `group:` 对话以群组/Channel 聊天室形式呈现给 Agent，行使 Discord、Slack、Telegram 等传输所使用的相同可见回复和消息工具路由策略。
- HTTP 支持的合成总线，用于入站消息注入、出站转录捕获、话题串创建、反应、编辑、删除以及搜索/读取操作。
- 主机端自检运行器，向 `.artifacts/qa-e2e/` 写入 Markdown 报告。

## 配置

```json
{
  "channels": {
    "qa-channel": {
      "baseUrl": "http://127.0.0.1:43123",
      "botUserId": "openclaw",
      "botDisplayName": "OpenClaw QA",
      "allowFrom": ["*"],
      "pollTimeoutMs": 1000
    }
  }
}
```

账户键：

- `enabled` — 此账户的主开关。
- `name` — 可选的显示标签。
- `baseUrl` — 合成总线 URL。
- `botUserId` — 目标语法中使用的 Matrix 风格 bot 用户 ID。
- `botDisplayName` — 出站消息的显示名称。
- `pollTimeoutMs` — 长轮询等待窗口。100 到 30000 之间的整数。
- `allowFrom` — 发送者 allowlist（用户 ID 或 `"*"`）。私信和 allowlist 群组策略都使用这些合成发送者 ID。
- `groupPolicy` — 共享聊天室策略：`"open"`（默认）、`"allowlist"` 或 `"disabled"`。
- `groupAllowFrom` — 可选的共享聊天室发送者 allowlist。在 `"allowlist"` 策略下省略时，QA Channel 回退到 `allowFrom`。
- `groups.<room>.requireMention` — 在特定群组/Channel 聊天室中要求提及 bot 才回复。`groups."*"` 设置默认值。
- `defaultTo` — 未指定时的回退目标。
- `actions.messages` / `actions.reactions` / `actions.search` / `actions.threads` — 每个操作的工具门控。

顶层多账户键：

- `accounts` — 按账户 ID 键入的命名账户覆盖记录。
- `defaultAccount` — 配置多个账户时的首选账户 ID。

## 运行器

主机端自检（在 `.artifacts/qa-e2e/` 下写入 Markdown 报告）：

```bash
pnpm qa:e2e
```

通过 `qa-lab` 路由，启动仓库内的 QA 总线，引导内置的 `qa-channel` 运行时切片，并运行确定性自检。

完整仓库支持的场景套件：

```bash
pnpm openclaw qa suite
```

在 QA Gateway 通道上并行运行场景。场景、配置文件和 Provider 模式见 [QA 概述](/concepts/qa-e2e-automation)。

Docker 支持的 QA 站点（Gateway + QA Lab 调试器 UI 组合技术栈）：

```bash
pnpm qa:lab:up
```

构建 QA 站点，启动 Docker 支持的 Gateway + QA Lab 技术栈，并打印 QA Lab URL。从该站点可以选择场景、选择模型通道、启动单个运行并实时查看结果。QA Lab 调试器与随附的 Control UI 包分离。

## 相关

- [QA 概述](/concepts/qa-e2e-automation) — 整体技术栈、传输适配器、场景编写
- [Matrix QA](/concepts/qa-matrix) — 驱动真实 Channel 的示例实时传输运行器
- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Channels 概述](/channels)
