---
mmh3_hash: "16fae32e5f49f72b568646dc1607c1f2"
summary: "Crestodian 的 CLI 参考和安全模型 — 无需配置的安全设置与修复助手"
read_when:
  - 您运行不带命令的 openclaw 并想了解 Crestodian
  - 您需要一种无需配置的安全方式来检查或修复 OpenClaw
  - 您正在设计或启用消息 Channel 救援模式
title: "Crestodian"
---

# `openclaw crestodian`

Crestodian 是 OpenClaw 的本地设置、修复和配置助手。它被设计为在正常 Agent 路径中断时仍然可以访问。

在活跃配置文件缺失或没有已编写设置（空文件或仅含元数据）时，不带命令运行 `openclaw` 会首先启动经典入职。配置文件有已编写设置后，不带命令运行 `openclaw` 会在交互式终端中启动 Crestodian。运行 `openclaw crestodian` 会显式启动相同的助手。

## Crestodian 显示的内容

启动时，交互式 Crestodian 打开 `openclaw tui` 使用的同一 TUI Shell，并带有 Crestodian 聊天后端。聊天日志以简短的问候开始：

- 何时启动 Crestodian
- Crestodian 实际使用的模型或确定性规划路径
- 配置有效性和默认 Agent
- 首次启动探测的 Gateway 可达性
- Crestodian 可以采取的下一个调试操作

它不会为了启动而转储密钥或加载 Plugin CLI 命令。TUI 仍然提供正常的标题、聊天日志、状态行、页脚、自动完成和编辑器控件。

使用 `status` 获取详细清单，包含配置路径、文档/源路径、本地 CLI 探测、API 密钥是否存在、Agent、模型和 Gateway 详情。

Crestodian 使用与常规 Agent 相同的 OpenClaw 参考发现。在 Git 检出中，它将自身指向本地 `docs/` 和本地源代码树。在 npm 包安装中，它使用捆绑的包文档并链接到 [https://github.com/openclaw/openclaw](https://github.com/openclaw/openclaw)，并明确指导在文档不足时查看源代码。

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

在 Crestodian TUI 中：

```text
status
health
doctor
doctor fix
validate config
setup
setup workspace ~/Projects/work model openai/gpt-5.5
config set gateway.port 19001
config set-ref gateway.auth.token env OPENCLAW_GATEWAY_TOKEN
gateway status
restart gateway
agents
create agent work workspace ~/Projects/work
models
set default model openai/gpt-5.5
plugins list
plugins search slack
plugin install clawhub:openclaw-codex-app-server
plugin uninstall openclaw-codex-app-server
talk to work agent
talk to agent for ~/Projects/work
audit
quit
```

## 安全启动

Crestodian 的启动路径故意很小。它可以在以下情况下运行：

- `openclaw.json` 缺失
- `openclaw.json` 无效
- Gateway 关闭
- Plugin 命令注册不可用
- 尚未配置任何 Agent

`openclaw --help` 和 `openclaw --version` 仍然使用正常的快速路径。非交互式裸 `openclaw` 以简短消息退出，而不是打印根帮助。在全新安装时，该消息指向非交互式入职；设置完成后，它指向一次性 Crestodian 命令。

## 操作和审批

Crestodian 使用类型化操作而不是临时编辑配置。

只读操作可以立即运行：

- 显示概览
- 列出 Agent
- 列出已安装的 Plugin
- 搜索 ClawHub Plugin
- 显示模型/后端状态
- 运行状态或健康检查
- 检查 Gateway 可达性
- 不带交互式修复运行 doctor
- 验证配置
- 显示审计日志路径

持久操作在交互模式下需要对话审批，除非您为直接命令传递 `--yes`：

- 写入配置
- 运行 `config set`
- 通过 `config set-ref` 设置支持的 SecretRef 值
- 运行设置/入职引导
- 更改默认模型
- 启动、停止或重启 Gateway
- 创建 Agent
- 从 ClawHub 或 npm 安装 Plugin
- 卸载 Plugin
- 运行重写配置或状态的 doctor 修复

已应用的写入记录在：

```text
~/.openclaw/audit/crestodian.jsonl
```

发现操作不被审计。只有已应用的操作和写入才会被记录。

`openclaw onboard --modern` 将 Crestodian 作为现代入职预览启动。普通的 `openclaw onboard` 仍然运行经典入职。

## 设置引导

`setup` 是聊天优先的入职引导。它仅通过类型化配置操作写入，并首先请求审批。

```text
setup
setup workspace ~/Projects/work
setup workspace ~/Projects/work model openai/gpt-5.5
```

当没有配置模型时，setup 按此顺序选择第一个可用后端并告知您它选择了什么：

- 已配置的现有显式模型（如果已配置）
- `OPENAI_API_KEY` -> `openai/gpt-5.5`
- `ANTHROPIC_API_KEY` -> `anthropic/claude-opus-4-7`
- Claude Code CLI -> `claude-cli/claude-opus-4-7`
- Codex -> `openai/gpt-5.5`（通过 Codex 应用服务器运行环境）

如果都不可用，setup 仍会写入默认工作区并保持模型未设置。安装或登录 Codex/Claude Code，或暴露 `OPENAI_API_KEY`/`ANTHROPIC_API_KEY`，然后再次运行 setup。

## 模型辅助规划器

Crestodian 始终以确定性模式启动。对于确定性解析器无法理解的模糊命令，本地 Crestodian 可以通过 OpenClaw 的正常运行时路径进行一次有界规划器轮次。它首先使用配置的 OpenClaw 模型。如果尚无可用的配置模型，它可以回退到机器上已存在的本地运行时：

- Claude Code CLI：`claude-cli/claude-opus-4-7`
- Codex 应用服务器运行环境：`openai/gpt-5.5`

模型辅助规划器不能直接修改配置。它必须将请求转换为 Crestodian 的类型化命令之一，然后应用正常的审批和审计规则。Crestodian 在运行任何内容之前打印它使用的模型和解释的命令。无配置回退规划器轮次是临时的，在运行时支持的情况下禁用工具，并使用临时工作区/Session。

消息 Channel 救援模式不使用模型辅助规划器。远程救援保持确定性，因此破损或受损的正常 Agent 路径不能用作配置编辑器。

## 切换到 Agent

使用自然语言选择器离开 Crestodian 并打开正常的 TUI：

```text
talk to agent
talk to work agent
switch to main agent
```

`openclaw tui`、`openclaw chat` 和 `openclaw terminal` 仍然直接打开正常的 Agent TUI。它们不启动 Crestodian。

切换到正常 TUI 后，使用 `/crestodian` 返回 Crestodian。您可以包含后续请求：

```text
/crestodian
/crestodian restart gateway
```

TUI 内的 Agent 切换会留下 `/crestodian` 可用的提示。

## 消息救援模式

消息救援模式是 Crestodian 的消息 Channel 入口点。它适用于您的正常 Agent 已死，但像 WhatsApp 这样的受信任 Channel 仍然接收命令的情况。

支持的文本命令：

- `/crestodian <request>`

操作员流程：

```text
您，在受信任的拥有者 DM 中：/crestodian status
OpenClaw：Crestodian 救援模式。Gateway 可达：否。配置有效：否。
您：/crestodian restart gateway
OpenClaw：计划：重启 Gateway。回复 /crestodian yes 以应用。
您：/crestodian yes
OpenClaw：已应用。审计条目已写入。
```

Agent 创建也可以从本地提示或救援模式排队：

```text
create agent work workspace ~/Projects/work model openai/gpt-5.5
/crestodian create agent work workspace ~/Projects/work
```

远程救援模式是管理员界面。它必须像远程配置修复一样对待，而不是像普通聊天一样。

远程救援的安全契约：

- 沙盒处于活跃状态时禁用。如果 Agent/Session 处于沙盒中，Crestodian 必须拒绝远程救援并解释需要本地 CLI 修复。
- 默认有效状态为 `auto`：仅在受信任的 YOLO 操作中允许远程救援，此时运行时已具有无沙盒的本地权限。
- 需要明确的拥有者身份。救援不得接受通配符发送者规则、开放群组策略、未经身份验证的 webhook 或匿名 Channel。
- 默认仅限拥有者 DM。群组/Channel 救援需要明确的选择加入。
- Plugin 搜索和列表是只读的。Plugin 安装默认仅本地，因为它下载可执行代码。当救援策略允许持久写入时，Plugin 卸载可以作为已批准的修复操作允许。
- 远程救援不能打开本地 TUI 或切换到交互式 Agent Session。对于 Agent 切换，使用本地 `openclaw`。
- 即使在救援模式下，持久写入仍需要审批。
- 审计每个已应用的救援操作。消息 Channel 救援记录 Channel、账户、发送者和源地址元数据。配置修改操作还记录修改前后的配置哈希值。
- 永远不要回显密钥。SecretRef 检查应报告可用性，而不是值。
- 如果 Gateway 处于活跃状态，优先使用 Gateway 类型化操作。如果 Gateway 死机，仅使用不依赖于正常 Agent 循环的最小本地修复界面。

配置形状：

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

`enabled` 应接受：

- `"auto"`：默认值。仅在有效运行时为 YOLO 且沙盒关闭时允许。
- `false`：永不允许消息 Channel 救援。
- `true`：当拥有者/Channel 检查通过时明确允许救援。这仍然不得绕过沙盒拒绝。

默认的 `"auto"` YOLO 姿态是：

- 沙盒模式解析为 `off`
- `tools.exec.security` 解析为 `full`
- `tools.exec.ask` 解析为 `off`

远程救援由 Docker 通道覆盖：

```bash
pnpm test:docker:crestodian-rescue
```

无配置本地规划器回退由以下覆盖：

```bash
pnpm test:docker:crestodian-planner
```

可选的实时 Channel 命令界面冒烟检查 `/crestodian status` 加上通过救援处理程序的持久审批往返：

```bash
pnpm test:live:crestodian-rescue-channel
```

通过 Crestodian 的新鲜无配置设置由以下覆盖：

```bash
pnpm test:docker:crestodian-first-run
```

该通道以空状态目录开始，将裸 `openclaw` 路由到 Crestodian，设置默认模型，创建额外的 Agent，通过 Plugin 启用加上 token SecretRef 配置 Discord，验证配置，并检查审计日志。QA Lab 也有同一 Ring 0 流程的基于仓库的场景：

```bash
pnpm openclaw qa suite --scenario crestodian-ring-zero-setup
```

## 相关

- [CLI 参考](/cli)
- [Doctor](/cli/doctor)
- [TUI](/cli/tui)
- [Sandbox](/cli/sandbox)
- [Security](/cli/security)
