---
mmh3_hash: "efae822582b0f879708ff083a14f2b1e"
title: "Pi 开发工作流"
summary: "Pi 集成的开发工作流：构建、测试和实时验证"
read_when:
  - 在 Pi 集成代码或测试上工作时
  - 运行 Pi 特定的代码检查、类型检查和实时测试流程时
---

# Pi 开发工作流

本指南总结了在 OpenClaw 中进行 pi 集成工作的合理工作流程。

## 类型检查和代码检查

- 默认本地门控：`pnpm check`
- 构建门控：当变更可能影响构建输出、打包或延迟加载/模块边界时，运行 `pnpm build`
- Pi 密集型变更的完整落地门控：`pnpm check && pnpm test`

## 运行 Pi 测试

使用 Vitest 直接运行 pi 专项测试集：

```bash
pnpm test \
  "src/agents/pi-*.test.ts" \
  "src/agents/pi-embedded-*.test.ts" \
  "src/agents/pi-tools*.test.ts" \
  "src/agents/pi-settings.test.ts" \
  "src/agents/pi-tool-definition-adapter*.test.ts" \
  "src/agents/pi-hooks/**/*.test.ts"
```

要包含实际 Provider 行为的实时测试：

```bash
OPENCLAW_LIVE_TEST=1 pnpm test src/agents/pi-embedded-runner-extraparams.live.test.ts
```

该脚本覆盖主要 Pi 单元套件：

- `src/agents/pi-*.test.ts`
- `src/agents/pi-embedded-*.test.ts`
- `src/agents/pi-tools*.test.ts`
- `src/agents/pi-settings.test.ts`
- `src/agents/pi-tool-definition-adapter.test.ts`
- `src/agents/pi-hooks/*.test.ts`

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
- `agents/<agentId>/agent/auth-profiles.json` 用于模型身份验证配置文件（API 密钥 + OAuth）
- `credentials/` 用于仍在身份验证配置文件存储之外的 Provider/Channel 状态
- `agents/<agentId>/sessions/` 用于 Agent 会话历史
- `agents/<agentId>/sessions/sessions.json` 用于会话索引
- `sessions/` 如果存在旧版路径
- `workspace/` 如果你想要空白工作区

如果只想重置会话，请删除该 Agent 的 `agents/<agentId>/sessions/`。如果想保留认证，请保留 `agents/<agentId>/agent/auth-profiles.json` 和 `credentials/` 下的任何 Provider 状态。

## 参考资料

- [测试](/help/testing)
- [快速开始](/start/getting-started)

## 相关

- [Pi 集成架构](/pi)
