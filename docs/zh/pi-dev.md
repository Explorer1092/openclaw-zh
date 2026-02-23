---
mmh3_hash: "f33cb3039fd46ce006306a0aa444563e"
title: "Pi 开发工作流"
summary: "Pi 集成的开发工作流：构建、测试和实时验证"
read_when:
  - 在 Pi 集成代码或测试上工作时
  - 运行 Pi 特定的代码检查、类型检查和实时测试流程时
---

# Pi 开发工作流

本指南总结了在 OpenClaw 中进行 pi 集成工作的合理工作流程。

## 类型检查和代码检查

- 类型检查和构建: `pnpm build`
- 代码检查: `pnpm lint`
- 格式检查: `pnpm format`
- 推送前的完整检查: `pnpm lint && pnpm build && pnpm test`

## 运行 Pi 测试

使用 Vitest 直接运行 pi 专项测试集：

```bash
pnpm test -- \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-extensions/**/*.test.ts"
```

要包含实际 Provider 行为的实时测试：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test -- src/agents/pi-embedded-runner-extraparams.live.test.ts
```

该脚本通过以下 glob 模式覆盖主要 Pi 单元套件：

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-extensions/*.test.ts`

## 手动测试

推荐流程：

- 在开发模式下运行 Gateway：
  - `pnpm gateway:dev`
- 直接触发 Agent：
  - `pnpm openclaw agent --message "Hello" --thinking low`
- 使用 TUI 进行交互式调试：
  - `pnpm tui`

对于工具调用行为，提示进行 `read` 或 `exec` 操作，以便观察工具流式传输和负载处理。

## 清空状态重置

状态位于 OpenClaw 状态目录下。默认为 `~/.openclaw`。如果设置了 `OPENCLAW_STATE_DIR`，则使用该目录。

要重置所有内容：

- `openclaw.json` 用于配置
- `credentials/` 用于认证配置文件和令牌
- `agents/<agentId>/sessions/` 用于 Agent 会话历史
- `agents/<agentId>/sessions.json` 用于会话索引
- `sessions/` 如果存在旧版路径
- `workspace/` 如果你想要空白工作区

如果只想重置会话，请删除该 Agent 的 `agents/<agentId>/sessions/` 和 `agents/<agentId>/sessions.json`。如果不想重新认证，请保留 `credentials/`。

## 参考资料

- [https://docs.openclaw.ai/testing](https://docs.openclaw.ai/testing)
- [https://docs.openclaw.ai/start/getting-started](https://docs.openclaw.ai/start/getting-started)
