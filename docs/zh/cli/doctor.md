---
mmh3_hash: "d2a0ebe6ec44f3688584dfe8e3f09387"
summary: "`openclaw doctor` 的 CLI 参考（健康检查 + 指导性修复）"
read_when:
  - 您有连接性/身份验证问题并想要指导性修复
  - 您更新后想要进行完整性检查
title: "Doctor"
---

# `openclaw doctor`

Gateway 和 Channel 的健康检查 + 快速修复。

相关：

- 故障排除：[Troubleshooting](/gateway/troubleshooting)
- 安全审计：[Security](/gateway/security)

## 为何使用它

`openclaw doctor` 是 OpenClaw 的健康检查界面。当 Gateway、Channel、Plugin、Skill、模型路由、本地状态或配置迁移行为不符合预期，且您希望通过一条命令解释问题时，请使用它。

Doctor 有三种检查姿态：

| 姿态   | 命令                     | 行为                                                              |
| ------ | ------------------------ | ----------------------------------------------------------------- |
| 检查   | `openclaw doctor`        | 面向人工的检查和引导式提示。                                      |
| 修复   | `openclaw doctor --fix`  | 应用支持的修复，除非非交互式修复安全，否则使用提示。              |
| 代码检查 | `openclaw doctor --lint` | 用于 CI、预检和审查门控的只读结构化发现。                        |

当自动化需要稳定结果时，首选 `--lint`。当人工操作员有意希望 doctor 编辑配置或状态时，首选 `--fix`。

## 示例

```bash
openclaw doctor
openclaw doctor --lint
openclaw doctor --lint --json
openclaw doctor --lint --severity-min warning
openclaw doctor --deep
openclaw doctor --fix
openclaw doctor --fix --non-interactive
openclaw doctor --generate-gateway-token
```

对于 Channel 特定的权限，请使用 Channel 探测而不是 `doctor`：

```bash
openclaw channels capabilities --channel discord --target channel:<channel-id>
openclaw channels status --probe
```

有针对性的 Discord 能力探测报告机器人的有效 Channel 权限；状态探测审计已配置的 Discord Channel 和语音自动加入目标。

## 选项

- `--no-workspace-suggestions`：禁用工作区 Memory/搜索建议
- `--yes`：接受默认值而不提示
- `--repair`：在不提示的情况下应用推荐的非服务修复；Gateway 服务安装和重写仍需要交互式确认或显式 Gateway 命令
- `--fix`：`--repair` 的别名
- `--force`：应用激进的修复，包括在需要时覆盖自定义服务配置
- `--non-interactive`：不带提示运行；仅安全迁移和非服务修复
- `--generate-gateway-token`：生成并配置 Gateway token
- `--deep`：扫描系统服务以查找额外的 Gateway 安装并报告最近的 Gateway 监控器重启移交
- `--lint`：以只读模式运行现代化健康检查并发出诊断发现
- `--json`：与 `--lint` 配合，发出 JSON 发现而非人工输出
- `--severity-min <level>`：与 `--lint` 配合，丢弃低于 `info`、`warning` 或 `error` 的发现
- `--skip <id>`：与 `--lint` 配合，跳过某个检查 ID；重复此参数可跳过多个
- `--only <id>`：与 `--lint` 配合，仅运行某个检查 ID；重复此参数可运行少量选定的检查

## Lint 模式

`openclaw doctor --lint` 是 doctor 检查的只读自动化姿态。它使用结构化健康检查路径，不提示，也不修复或重写配置/状态。在 CI、预检脚本和审查工作流中使用它，当您希望获得机器可读发现而非引导式修复提示时。`--json`、`--severity-min`、`--only` 和 `--skip` 等 lint 输出选项仅在与 `--lint` 一起使用时有效。

```bash
openclaw doctor --lint
openclaw doctor --lint --severity-min warning
openclaw doctor --lint --json
openclaw doctor --lint --only core/doctor/gateway-config --json
```

人工输出较为紧凑：

```text
doctor --lint: ran 6 check(s), 1 finding(s)
  [warning] core/doctor/gateway-config gateway.mode - gateway.mode is unset; gateway start will be blocked.
    fix: Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`.
```

JSON 输出是 lint 运行的脚本界面：

```json
{
  "ok": false,
  "checksRun": 5,
  "checksSkipped": 0,
  "findings": [
    {
      "checkId": "core/doctor/gateway-config",
      "severity": "warning",
      "message": "gateway.mode is unset; gateway start will be blocked.",
      "path": "gateway.mode",
      "fixHint": "Run `openclaw configure` and set Gateway mode (local/remote), or `openclaw config set gateway.mode local`."
    }
  ]
}
```

退出行为：

- `0`：在所选严重性阈值及以上无发现
- `1`：至少一个发现满足所选阈值
- `2`：在 lint 发现可以产生之前发生命令/运行时失败

`--severity-min` 同时控制可见发现和退出阈值。例如，即使存在较低严重性的 `info` 或 `warning` 发现，`openclaw doctor --lint --severity-min error` 也可以不打印发现并以 `0` 退出。

## 结构化健康检查

现代 doctor 检查使用小型结构化契约：

```ts
detect(ctx, scope?) -> HealthFinding[]
repair?(ctx, findings) -> HealthRepairResult
```

`detect()` 驱动 `doctor --lint`。`repair()` 是可选的，仅由 `doctor --fix` / `doctor --repair` 考虑。尚未迁移到此形状的检查继续使用旧版 doctor 贡献流程。

该分离是有意为之：`detect()` 拥有诊断，而 `repair()` 拥有报告其更改或将更改的内容。修复上下文可以携带 `dryRun`/`diff` 请求，修复结果可以返回结构化的 `diffs` 用于配置/文件编辑，以及 `effects` 用于服务、进程、包、状态或其他副作用。这使已转换的检查可以在不将变更规划移入 `detect()` 的情况下，逐步实现 `doctor --fix --dry-run` 和差异报告。

`repair()` 通过 `status: "repaired" | "skipped" | "failed"` 报告是否尝试了所请求的修复。省略状态意味着 `repaired`，因此简单的修复检查只需返回更改。当修复返回 `skipped` 或 `failed` 时，doctor 报告原因且不为该检查运行验证。

成功的结构化修复后，doctor 以已修复的发现作为范围重新运行 `detect()`。检查可以使用选定的发现、路径或 `ocPath` 值进行聚焦验证。如果发现仍然存在，doctor 报告修复警告而不是将更改视为静默完成。

发现包含：

| 字段             | 用途                                           |
| ---------------- | ---------------------------------------------- |
| `checkId`        | 用于跳过/仅过滤器和 CI 允许列表的稳定 ID。    |
| `severity`       | `info`、`warning` 或 `error`。                 |
| `message`        | 人类可读的问题陈述。                           |
| `path`           | 配置、文件或逻辑路径（如可用）。               |
| `line` / `column`| 源代码位置（如可用）。                         |
| `ocPath`         | 当检查可以指向时的精确 `oc://` 地址。          |
| `fixHint`        | 建议的操作员操作或修复摘要。                   |

本次发布在结构化健康路径上注册了现代化的核心 doctor 检查。`openclaw/plugin-sdk/health` 子路径为捆绑的后续消费者公开了相同的契约，但 Plugin 支持的检查只有在其拥有的包在活跃命令路径中注册它们后才运行。

## 检查选择

在工作流需要聚焦门控时，使用 `--only` 和 `--skip`：

```bash
openclaw doctor --lint --only core/doctor/gateway-config --json
openclaw doctor --lint --skip core/doctor/skills-readiness
```

`--only` 和 `--skip` 接受完整的检查 ID，可以重复使用。如果 `--only` ID 未注册，则该 ID 不运行任何检查；使用命令的 `checksRun` 和 `checksSkipped` 字段验证聚焦门控是否正在选择您期望的检查。

注意：

- 在 Nix 模式（`OPENCLAW_NIX_MODE=1`）下，只读 doctor 检查仍然有效，但 `doctor --fix`、`doctor --repair`、`doctor --yes` 和 `doctor --generate-gateway-token` 被禁用，因为 `openclaw.json` 是不可变的。改为编辑此安装的 Nix 源；对于 nix-openclaw，请使用 Agent 优先的[快速入门](https://github.com/openclaw/nix-openclaw#quick-start)。
- 交互式提示（如密钥链/OAuth 修复）仅在 stdin 是 TTY 且**未**设置 `--non-interactive` 时运行。无头运行（cron、Telegram、无终端）将跳过提示。
- 性能：非交互式 `doctor` 运行跳过急切的插件加载，以使无头健康检查保持快速。交互式 doctor 会话仍然加载旧版健康和修复流程所需的插件界面。
- `--lint` 比 `--non-interactive` 更严格：它始终是只读的，从不提示，也从不应用安全迁移。当您希望 doctor 进行更改时，运行 `doctor --fix` 或 `doctor --repair`。
- `--fix`（`--repair` 的别名）将备份写入 `~/.openclaw/openclaw.json.bak` 并删除未知的配置键，列出每个删除项。
- 现代化健康检查可以为 `doctor --fix` 公开 `repair()` 路径；不公开的检查继续通过现有的 doctor 修复流程。
- `doctor --fix --non-interactive` 报告缺少或陈旧的 Gateway 服务定义，但不在更新修复模式之外安装或重写它们。对于缺少的服务运行 `openclaw gateway install`，或当您有意想要替换启动器时运行 `openclaw gateway install --force`。
- 状态完整性检查现在检测 sessions 目录中的孤立转录文件。将它们归档为 `.deleted.<timestamp>` 需要交互式确认；`--fix`、`--yes` 和无头运行会将其保留原位。
- Doctor 还扫描 `~/.openclaw/cron/jobs.json`（或 `cron.store`）以查找旧版 cron 作业形状，并可以在调度器不得不在运行时自动规范化它们之前就地重写它们。
- Doctor 报告具有显式 `payload.model` 覆盖的 cron 作业，包括 Provider 命名空间计数和与 `agents.defaults.model` 的不匹配，使在身份验证或计费调查期间不继承默认模型的计划作业可见。
- 在 Linux 上，当用户的 crontab 仍然运行旧版 `~/.openclaw/bin/ensure-whatsapp.sh` 时，doctor 会发出警告；该脚本不再维护，并且当 cron 缺少 systemd 用户总线环境时可能记录错误的 WhatsApp Gateway 中断。
- 当 WhatsApp 启用时，doctor 检查本地 `openclaw-tui` 客户端仍在运行的降级 Gateway 事件循环。`doctor --fix` 仅停止已验证的本地 TUI 客户端，以使 WhatsApp 回复不会排在陈旧的 TUI 刷新循环后面。
- Doctor 将旧版 `openai-codex/*` 模型 ref 重写为跨主要模型、回退、heartbeat/子 Agent/压缩覆盖、Hook、Channel 模型覆盖和陈旧 Session 路由固定的规范 `openai/*` ref。`--fix` 将 Codex 意图移到 Provider/模型范围的 `agentRuntime.id: "codex"` 条目上，保留 Session auth-profile 固定（如 `openai-codex:...`），删除陈旧的整 Agent/Session 运行时固定，并保持修复后的 OpenAI Agent ref 在 Codex auth 路由上，而不是直接 OpenAI API 密钥 auth。
- Doctor 清理旧版 OpenClaw 版本创建的旧版插件依赖暂存状态。它还修复配置引用的缺失可下载插件，如 `plugins.entries`、已配置的 Channel、已配置的 Provider/搜索设置或已配置的 Agent 运行时。在包更新期间，doctor 跳过包管理器插件修复直到包交换完成；如果已配置的插件仍需要恢复，之后重新运行 `openclaw doctor --fix`。如果下载失败，doctor 报告安装错误并保留已配置的插件条目以供下次修复尝试。
- Doctor 通过从 `plugins.allow`/`plugins.deny`/`plugins.entries` 中删除缺失的插件 ID 来修复陈旧的插件配置，以及当插件发现是健康的时，匹配的悬空 Channel 配置、heartbeat 目标和 Channel 模型覆盖。
- Doctor 通过禁用受影响的 `plugins.entries.<id>` 条目并删除其无效的 `config` 有效载荷来隔离无效的插件配置。Gateway 启动已经仅跳过那个坏插件，以便其他插件和 Channel 可以继续运行。
- 当另一个监督者拥有 Gateway 生命周期时，设置 `OPENCLAW_SERVICE_REPAIR_POLICY=external`。Doctor 仍然报告 Gateway/服务健康状况并应用非服务修复，但跳过服务安装/启动/重启/引导和旧版服务清理。
- 在 Linux 上，doctor 忽略不活跃的额外类似 Gateway 的 systemd 单元，并且在修复期间不重写运行中的 systemd Gateway 服务的命令/入口点元数据。先停止服务，或者当您有意想要替换活跃启动器时使用 `openclaw gateway install --force`。
- Doctor 自动迁移旧版扁平 Talk 配置（`talk.voiceId`、`talk.modelId` 及相关内容）到 `talk.provider` + `talk.providers.<provider>`。
- 重复的 `doctor --fix` 运行在唯一的区别是对象键顺序时不再报告/应用 Talk 规范化。
- Doctor 包含一个 Memory 搜索就绪检查，并可以在嵌入凭据缺失时推荐 `openclaw configure --section model`。
- 当没有配置命令拥有者时，doctor 会发出警告。命令拥有者是允许运行仅拥有者命令和批准危险操作的人类操作员账户。DM 配对只允许某人与机器人通话；如果您在首次拥有者引导存在之前批准了发送者，请显式设置 `commands.ownerAllowFrom`。
- 当配置了 Codex 模式 Agent 且操作员的 Codex 主目录中存在个人 Codex CLI 资产时，doctor 会报告信息提示。本地 Codex 应用服务器启动使用隔离的每 Agent 主目录，因此如果需要，请先安装 Codex Plugin，然后使用 `openclaw migrate plan codex` 来清点应该有意提升的资产。
- Doctor 删除已退役的 `plugins.entries.codex.config.codexDynamicToolsProfile`；Codex 应用服务器始终保持 Codex 原生工作区工具为原生。
- 当允许默认 Agent 的 Skill 在当前运行时环境中因缺少二进制文件、env 变量、配置或操作系统要求而不可用时，doctor 会发出警告。`doctor --fix` 可以用 `skills.entries.<skill>.enabled=false` 禁用那些不可用的 Skill；当您想要保持 Skill 活跃时，请安装/配置缺少的要求。
- 如果启用了沙盒模式但 Docker 不可用，doctor 报告高信号警告并提供补救措施（`install Docker` 或 `openclaw config set agents.defaults.sandbox.mode off`）。
- 如果旧版沙盒注册表文件（`~/.openclaw/sandbox/containers.json` 或 `~/.openclaw/sandbox/browsers.json`）存在，doctor 报告它们；`openclaw doctor --fix` 将有效条目迁移到分片注册表目录并隔离无效的旧版文件。
- 如果 `gateway.auth.token`/`gateway.auth.password` 是 SecretRef 管理的且在当前命令路径中不可用，doctor 报告只读警告且不写入明文回退凭据。
- 如果 Channel SecretRef 检查在修复路径中失败，doctor 继续并报告警告而不是提前退出。
- 状态目录迁移后，当启用的默认 Telegram 或 Discord 账户依赖 env 回退且 `TELEGRAM_BOT_TOKEN` 或 `DISCORD_BOT_TOKEN` 对 doctor 进程不可用时，doctor 会发出警告。
- Telegram `allowFrom` 用户名自动解析（`doctor --fix`）需要当前命令路径中可解析的 Telegram token。如果 token 检查不可用，doctor 报告警告并跳过该轮次的自动解析。

## macOS：`launchctl` env 覆盖

如果您之前运行了 `launchctl setenv OPENCLAW_GATEWAY_TOKEN ...`（或 `...PASSWORD`），该值会覆盖您的配置文件并可能导致持久的"unauthorized"错误。

```bash
launchctl getenv OPENCLAW_GATEWAY_TOKEN
launchctl getenv OPENCLAW_GATEWAY_PASSWORD

launchctl unsetenv OPENCLAW_GATEWAY_TOKEN
launchctl unsetenv OPENCLAW_GATEWAY_PASSWORD
```

## 相关

- [CLI 参考](/cli)
- [Gateway doctor](/gateway/doctor)
