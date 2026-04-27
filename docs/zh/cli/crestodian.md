---
mmh3_hash: "74a8e2e356157269c643fb199df604c9"
summary: "Crestodian 的 CLI 参考和安全模型 — 无需配置的安全设置与修复助手"
read_when:
  - 您运行不带命令的 openclaw 并想了解 Crestodian
  - 您需要一种无需配置的安全方式来检查或修复 OpenClaw
  - 您正在设计或启用消息 Channel 救援模式
title: "Crestodian"
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本地设置、修复和配置助手。它被设计为在正常 Agent 路径中断时仍可访问。

不带命令运行 `openclaw` 会在交互式终端中启动 Crestodian。
显式运行 `openclaw crestodian` 也会启动同一助手。

## Crestodian 显示的内容

启动时，交互式 Crestodian 会打开与 `openclaw tui` 相同的 TUI Shell，并使用 Crestodian 聊天后端。聊天日志以简短的问候开始，内容包括：

- 何时启动 Crestodian
- Crestodian 实际使用的模型或确定性规划器路径
- 配置有效性和默认 Agent
- 首次启动探测时 Gateway 的可达性
- Crestodian 可以执行的下一个调试操作

启动时不会转储密钥或加载 Plugin CLI 命令。TUI 仍然提供正常的标题栏、聊天日志、状态行、页脚、自动补全和编辑器控件。

使用 `status` 可查看详细清单，包括配置路径、文档/源码路径、本地 CLI 探测、API 密钥状态、Agent、模型和 Gateway 详情。

Crestodian 使用与普通 Agent 相同的 OpenClaw 参考发现机制。在 Git 检出中，它指向本地 `docs/` 和本地源码树。在 npm 包安装中，它使用随包附带的文档，并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，并明确指导在文档不足时查阅源码。

## 示例

```bash
openclaw
openclaw crestodian
openclaw crestodian --json
openclaw crestodian --message "models"
openclaw crestodian --message "validate config"
openclaw crestodian --message "setup workspace ~/Projects/work model openai/gpt-5.5" --yes
openclaw crestodian --message "set default model openai/gpt-5.5" --yes
openclaw onboard --modern
```

在 Crestodian TUI 内：

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 安全启动

Crestodian 的启动路径经过刻意精简。在以下情况下它仍可运行：

- `openclaw.json` 缺失
- `openclaw.json` 无效
- Gateway 已停止
- Plugin 命令注册不可用
- 尚未配置任何 Agent

`openclaw --help` 和 `openclaw --version` 仍使用正常的快速路径。
非交互式的 `openclaw` 会以简短消息退出，而不是打印根级帮助，因为无命令的产品就是 Crestodian。

## 操作与审批

Crestodian 使用类型化操作，而不是临时编辑配置。

只读操作可立即运行：

- 显示概览
- 列出 Agent
- 显示模型/后端状态
- 运行状态或健康检查
- 检查 Gateway 可达性
- 在不进行交互式修复的情况下运行 doctor
- 验证配置
- 显示审计日志路径

持久化操作在交互模式下需要对话式审批，除非您为直接命令传入 `--yes`：

- 写入配置
- 运行 `config set`
- 通过 `config set-ref` 设置受支持的 SecretRef 值
- 运行设置/引导程序
- 更改默认模型
- 启动、停止或重启 Gateway
- 创建 Agent
- 运行重写配置或状态的 doctor 修复

已应用的写入记录于：

```text
~/.openclaw/audit/crestodian.jsonl
```

发现操作不计入审计。只有已应用的操作和写入才会被记录。

`openclaw onboard --modern` 将 Crestodian 作为现代引导预览启动。
普通的 `openclaw onboard` 仍运行经典引导程序。

## 设置引导程序

`setup` 是以聊天为先的引导程序。它仅通过类型化配置操作写入，并会先请求审批。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

当未配置任何模型时，setup 按以下顺序选择第一个可用的后端，并告知您所选的内容：

- 已有的显式模型（如已配置）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex CLI -> `codex-cli/gpt-5.5`

如果均不可用，setup 仍会写入默认工作区并将模型留空。安装或登录 Codex/Claude Code，或提供 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然后再次运行 setup。

## 模型辅助规划器

Crestodian 始终以确定性模式启动。对于确定性解析器无法理解的模糊命令，本地 Crestodian 可以通过 OpenClaw 的正常运行时路径进行一次有界规划器轮次。它首先使用已配置的 OpenClaw 模型。如果尚无可用的已配置模型，可以回退至机器上已有的本地运行时：

- Claude Code CLI：`claude-cli/claude-opus-4-7`
- Codex 应用服务器套件：`openai/gpt-5.5`，`agentRuntime.id: "codex"`
- Codex CLI：`codex-cli/gpt-5.5`

模型辅助规划器不能直接修改配置。它必须将请求转换为 Crestodian 的某个类型化命令，然后适用正常的审批和审计规则。Crestodian 在运行任何内容之前会打印所使用的模型和解释后的命令。无配置回退规划器轮次是临时性的，在运行时支持的情况下禁用工具，并使用临时工作区/Session。

消息 Channel 救援模式不使用模型辅助规划器。远程救援保持确定性，以防止损坏或被攻击的正常 Agent 路径被用作配置编辑器。

## 切换到 Agent

使用自然语言选择器离开 Crestodian 并打开正常 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 仍直接打开正常的 Agent TUI，不会启动 Crestodian。

切换到正常 TUI 后，使用 `/crestodian` 返回 Crestodian。可以附带后续请求：

```text
/crestodian
/crestodian restart gateway
```

TUI 内的 Agent 切换会留下 `/crestodian` 可用的提示。

## 消息救援模式

消息救援模式是 Crestodian 的消息 Channel 入口点。适用于正常 Agent 已停止但受信任 Channel（如 WhatsApp）仍能接收命令的情况。

支持的文本命令：

- `/crestodian <请求>`

运营者操作流程：

```text
您，在受信任的所有者私信中：/crestodian status
OpenClaw：Crestodian 救援模式。Gateway 可达：否。配置有效：否。
您：/crestodian restart gateway
OpenClaw：计划：重启 Gateway。回复 /crestodian yes 以应用。
您：/crestodian yes
OpenClaw：已应用。审计条目已写入。
```

也可以从本地提示符或救援模式排队创建 Agent：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

远程救援模式是管理员接口，必须像远程配置修复一样对待，而不是普通聊天。

远程救援的安全契约：

- 当沙箱激活时禁用。如果 Agent/Session 处于沙箱中，Crestodian 必须拒绝远程救援，并说明需要使用本地 CLI 修复。
- 默认有效状态为 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已具有非沙箱的本地权限。
- 需要明确的所有者身份。救援不得接受通配符发送者规则、开放的群组策略、未经身份验证的 Webhook 或匿名 Channel。
- 默认仅限所有者私信。群组/Channel 救援需要明确选择启用。
- 远程救援不能打开本地 TUI 或切换到交互式 Agent Session。如需 Agent 移交，请使用本地 `openclaw`。
- 即使在救援模式下，持久化写入仍需审批。
- 审计每次已应用的救援操作。消息 Channel 救援记录 Channel、账户、发送者和源地址元数据。修改配置的操作还会记录修改前后的配置哈希。
- 绝不回显密钥。SecretRef 检查应报告可用性，而非值。
- 如果 Gateway 处于活跃状态，优先使用 Gateway 类型化操作。如果 Gateway 已停止，仅使用不依赖正常 Agent 循环的最小本地修复接口。

配置结构：

```jsonc
{
  "crestodian": {
    "rescue": {
      "enabled": "auto",
      "ownerDmOnly": true,
    },
  },
}
```

`enabled` 接受以下值：

- `"auto"`：默认值。仅当有效运行时为 YOLO 且沙箱关闭时才允许。
- `false`：永不允许消息 Channel 救援。
- `true`：当所有者/Channel 检查通过时明确允许救援。这仍然不得绕过沙箱拒绝。

默认 `"auto"` YOLO 姿态为：

- 沙箱模式解析为 `off`
- `tools.exec.security` 解析为 `full`
- `tools.exec.ask` 解析为 `off`

远程救援由 Docker 通道覆盖测试：

```bash
pnpm test:docker:crestodian-rescue
```

无配置本地规划器回退由以下测试覆盖：

```bash
pnpm test:docker:crestodian-planner
```

可选的实时 Channel 命令接口冒烟测试检查 `/crestodian status` 以及通过救援处理器的持久化审批往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

通过 Crestodian 进行的全新无配置设置由以下测试覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

该通道从空状态目录开始，将裸 `openclaw` 路由到 Crestodian，设置默认模型，创建额外 Agent，通过 Plugin 启用加令牌 SecretRef 配置 Discord，验证配置，并检查审计日志。QA Lab 也有针对同一 Ring 0 流程的仓库支持场景：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相关链接

- [CLI 参考](/cli)
- [Doctor](/cli/doctor)
- [TUI](/cli/tui)
- [Sandbox](/cli/sandbox)
- [Security](/cli/security)
