---
mmh3_hash: "ac857360b9629074bb0bb61bf16e94af"
summary: "用于确定性 OpenClaw QA 场景的合成 Slack 级别 Channel 插件"
title: "QA channel"
read_when:
  - 将合成 QA 传输连接到本地或 CI 测试运行中
  - 需要内置的 qa-channel 配置界面
  - 正在迭代端到端 QA 自动化
---

`qa-channel` 是用于自动化 OpenClaw QA 的内置合成消息传输。

这不是生产 Channel。它的存在是为了行使真实传输所使用的相同 Channel 插件边界，同时保持状态确定性且完全可检查。

## 当前功能

- Slack 级别的目标语法：
  - `dm:<user>`
  - `channel:<room>`
  - `thread:<room>/<thread>`
- HTTP 支持的合成总线，用于：
  - 入站消息注入
  - 出站转录捕获
  - 线程创建
  - 反应
  - 编辑
  - 删除
  - 搜索和读取操作
- 内置主机端自检运行器，写入 Markdown 报告

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

支持的账户键：

- `baseUrl`
- `botUserId`
- `botDisplayName`
- `pollTimeoutMs`
- `allowFrom`
- `defaultTo`
- `actions.messages`
- `actions.reactions`
- `actions.search`
- `actions.threads`

## 运行器

当前垂直切片：

```bash
pnpm qa:e2e
```

这现在通过内置的 `qa-lab` 扩展路由。它启动仓库内的 QA 总线，启动内置的 `qa-channel` 运行时切片，运行确定性自检，并在 `.artifacts/qa-e2e/` 下写入 Markdown 报告。

私有调试器 UI：

```bash
pnpm qa:lab:up
```

该命令构建 QA 站点，启动 Docker 支持的 Gateway + QA Lab 技术栈，并打印 QA Lab URL。从该站点可以选择场景、选择模型通道、启动单个运行并实时查看结果。

完整仓库支持的 QA 套件：

```bash
pnpm openclaw qa suite
```

这会在本地 URL 启动私有 QA 调试器，与随附的 Control UI 包分离。

## 范围

当前范围故意较窄：

- 总线 + 插件传输
- 线程路由语法
- Channel 拥有的消息操作
- Markdown 报告
- Docker 支持的 QA 站点及运行控制

后续工作将添加：

- provider/模型矩阵执行
- 更丰富的场景发现
- 后续的 OpenClaw 原生编排

## 相关

- [Pairing](/channels/pairing)
- [Groups](/channels/groups)
- [Channels 概述](/channels)
