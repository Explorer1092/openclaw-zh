---
mmh3_hash: "772ab72f735cf5f95b6670dd99e5627c"
summary: "Doctor 命令:健康检查、配置迁移和修复步骤"
read_when:
  - 添加或修改 doctor 迁移
  - 引入破坏性配置更改
---
# Doctor

`openclaw doctor` 是 OpenClaw 的修复 + 迁移工具。它修复过时的配置/状态,检查健康状况,并提供可操作的修复步骤。

## 快速入门

```bash
openclaw doctor
```

### 无头/自动化

```bash
openclaw doctor --yes
```

接受默认值而不提示(包括适用时的重启/服务/沙箱修复步骤)。

```bash
openclaw doctor --repair
```

应用推荐的修复而不提示(在安全时修复 + 重启)。

```bash
openclaw doctor --repair --force
```

也应用激进的修复(覆盖自定义 supervisor 配置)。

```bash
openclaw doctor --non-interactive
```

在不提示的情况下运行,仅应用安全迁移(配置规范化 + 磁盘状态移动)。跳过需要人工确认的重启/服务/沙箱操作。检测到旧版状态迁移时自动运行。

```bash
openclaw doctor --deep
```

扫描系统服务以查找额外的 gateway 安装(launchd/systemd/schtasks)。

如果您想在写入之前查看更改,请先打开配置文件:

```bash
cat ~/.openclaw/openclaw.json
```

## 它做什么(摘要)
- git 安装的可选预检更新(仅交互式)。
- UI 协议新鲜度检查(当协议 schema 较新时重建 Control UI)。
- 健康检查 + 重启提示。
- Skills 状态摘要(符合条件/缺失/被阻止)。
- 旧版值的配置规范化。
- OpenCode Zen provider 覆盖警告(`models.providers.opencode`)。
- 旧版磁盘状态迁移(sessions/agent dir/WhatsApp 认证)。
- 状态完整性和权限检查(sessions、transcripts、state dir)。
- 本地运行时的配置文件权限检查(chmod 600)。
- 模型认证健康:检查 OAuth 过期,可以刷新即将过期的令牌,并报告 auth-profile 冷却/禁用状态。
- 额外的 workspace 目录检测(`~/openclaw`)。
- 启用沙箱时的沙箱镜像修复。
- 旧版服务迁移和额外 gateway 检测。
- Gateway 运行时检查(已安装服务但未运行;缓存的 launchd 标签)。
- Channel 状态警告(从正在运行的 gateway 探测)。
- Supervisor 配置审计(launchd/systemd/schtasks)带有可选修复。
- Gateway 运行时最佳实践检查(Node vs Bun,version-manager 路径)。
- Gateway 端口冲突诊断(默认 `18789`)。
- 开放 DM 策略的安全警告。
- 未设置 `gateway.auth.token` 时的 Gateway 认证警告(本地模式;提供令牌生成)。
- Linux 上的 systemd linger 检查。
- 源安装检查(pnpm workspace 不匹配,缺少 UI 资产,缺少 tsx 二进制文件)。
- 写入更新的配置 + 向导元数据。

## 详细行为和理由

### 0) 可选更新(git 安装)
如果这是 git checkout 并且 doctor 以交互方式运行,它会在运行 doctor 之前提供更新(fetch/rebase/build)。

### 1) 配置规范化
如果配置包含旧版值形状(例如 `messages.ackReaction` 没有特定 channel 的覆盖),doctor 将它们规范化为当前 schema。

### 2) 旧版配置键迁移
当配置包含已弃用的键时,其他命令拒绝运行并要求您运行 `openclaw doctor`。

Doctor 将:
- 解释找到了哪些旧版键。
- 显示它应用的迁移。
- 用更新的 schema 重写 `~/.openclaw/openclaw.json`。

Gateway 在启动时检测到旧版配置格式时也会自动运行 doctor 迁移,因此无需手动干预即可修复过时的配置。

当前迁移:
- `routing.allowFrom` → `channels.whatsapp.allowFrom`
- `routing.groupChat.requireMention` → `channels.whatsapp/telegram/imessage.groups."*".requireMention`
- `routing.groupChat.historyLimit` → `messages.groupChat.historyLimit`
- `routing.groupChat.mentionPatterns` → `messages.groupChat.mentionPatterns`
- `routing.queue` → `messages.queue`
- `routing.bindings` → 顶级 `bindings`
- `routing.agents`/`routing.defaultAgentId` → `agents.list` + `agents.list[].default`
- `routing.agentToAgent` → `tools.agentToAgent`
- `routing.transcribeAudio` → `tools.media.audio.models`
- `bindings[].match.accountID` → `bindings[].match.accountId`
- `identity` → `agents.list[].identity`
- `agent.*` → `agents.defaults` + `tools.*`(tools/elevated/exec/sandbox/subagents)
- `agent.model`/`allowedModels`/`modelAliases`/`modelFallbacks`/`imageModelFallbacks`
  → `agents.defaults.models` + `agents.defaults.model.primary/fallbacks` + `agents.defaults.imageModel.primary/fallbacks`

### 2b) OpenCode Zen provider 覆盖
如果您手动添加了 `models.providers.opencode`(或 `opencode-zen`),它会覆盖来自 `@mariozechner/pi-ai` 的内置 OpenCode Zen 目录。这可能会强制每个模型使用单个 API 或将成本清零。Doctor 会发出警告,以便您可以删除覆盖并恢复每个模型的 API 路由 + 成本。

### 3) 旧版状态迁移(磁盘布局)
Doctor 可以将较旧的磁盘布局迁移到当前结构:
- Sessions 存储 + transcripts:
  - 从 `~/.openclaw/sessions/` 到 `~/.openclaw/agents/<agentId>/sessions/`
- Agent 目录:
  - 从 `~/.openclaw/agent/` 到 `~/.openclaw/agents/<agentId>/agent/`
- WhatsApp 认证状态(Baileys):
  - 从旧版 `~/.openclaw/credentials/*.json`(除了 `oauth.json`)
  - 到 `~/.openclaw/credentials/whatsapp/<accountId>/...`(默认 account id:`default`)

这些迁移是尽力而为且幂等的;当它将任何旧版文件夹作为备份留下时,doctor 将发出警告。Gateway/CLI 也会在启动时自动迁移旧版 sessions + agent dir,因此历史/认证/模型会进入每个 agent 的路径,而无需手动运行 doctor。WhatsApp 认证仅通过 `openclaw doctor` 迁移。

### 4) 状态完整性检查(session 持久化、路由和安全)
状态目录是操作脑干。如果它消失,您将丢失 sessions、凭证、日志和配置(除非您在其他地方有备份)。

Doctor 检查:
- **状态目录缺失**:警告灾难性状态丢失,提示重新创建目录,并提醒您它无法恢复丢失的数据。
- **状态目录权限**:验证可写性;提供修复权限(并在检测到所有者/组不匹配时发出 `chown` 提示)。
- **Session 目录缺失**:`sessions/` 和 session 存储目录是持久化历史和避免 `ENOENT` 崩溃所必需的。
- **Transcript 不匹配**:当最近的 session 条目缺少 transcript 文件时发出警告。
- **主 session"1 行 JSONL"**:当主 transcript 只有一行时标记(历史未累积)。
- **多个状态目录**:当多个 `~/.openclaw` 文件夹存在于主目录或 `OPENCLAW_STATE_DIR` 指向其他地方时发出警告(历史可能在安装之间分裂)。
- **远程模式提醒**:如果 `gateway.mode=remote`,doctor 提醒您在远程主机上运行它(状态在那里)。
- **配置文件权限**:如果 `~/.openclaw/openclaw.json` 是组/其他可读的,则发出警告并提供收紧到 `600`。

### 5) 模型认证健康(OAuth 过期)
Doctor 检查认证存储中的 OAuth 配置文件,在令牌即将过期/已过期时发出警告,并在安全时刷新它们。如果 Anthropic Claude Code 配置文件过时,它建议运行 `claude setup-token`(或粘贴 setup-token)。刷新提示仅在以交互方式运行(TTY)时出现;`--non-interactive` 跳过刷新尝试。

Doctor 还报告由于以下原因暂时不可用的认证配置文件:
- 短冷却(速率限制/超时/认证失败)
- 更长的禁用(计费/信用失败)

### 6) Hooks 模型验证
如果设置了 `hooks.gmail.model`,doctor 会根据目录和 allowlist 验证模型引用,并在无法解析或被禁止时发出警告。

### 7) 沙箱镜像修复
启用沙箱时,doctor 检查 Docker 镜像,并在当前镜像缺失时提供构建或切换到旧版名称。

### 8) Gateway 服务迁移和清理提示
Doctor 检测旧版 gateway 服务(launchd/systemd/schtasks)并提供删除它们并使用当前 gateway 端口安装 OpenClaw 服务。它还可以扫描额外的类似 gateway 的服务并打印清理提示。配置文件命名的 OpenClaw gateway 服务被视为一流的,不会被标记为"额外"。

### 9) 安全警告
当 provider 对没有 allowlist 的 DM 开放,或者策略以危险方式配置时,Doctor 会发出警告。

### 10) systemd linger(Linux)
如果作为 systemd 用户服务运行,doctor 确保启用 lingering,以便 gateway 在注销后保持活动。

### 11) Skills 状态
Doctor 为当前 workspace 打印符合条件/缺失/被阻止的 skills 的快速摘要。

### 12) Gateway 认证检查(本地令牌)
当本地 gateway 上缺少 `gateway.auth` 时,Doctor 会发出警告并提供生成令牌。在自动化中使用 `openclaw doctor --generate-gateway-token` 强制创建令牌。

### 13) Gateway 健康检查 + 重启
Doctor 运行健康检查,并在看起来不健康时提供重启 gateway。

### 14) Channel 状态警告
如果 gateway 健康,doctor 运行 channel 状态探测并报告带有建议修复的警告。

### 15) Supervisor 配置审计 + 修复
Doctor 检查已安装的 supervisor 配置(launchd/systemd/schtasks)是否缺少或过时的默认值(例如,systemd network-online 依赖项和重启延迟)。当它发现不匹配时,它建议更新并可以将服务文件/任务重写为当前默认值。

注意:
- `openclaw doctor` 在重写 supervisor 配置之前提示。
- `openclaw doctor --yes` 接受默认修复提示。
- `openclaw doctor --repair` 应用推荐的修复而不提示。
- `openclaw doctor --repair --force` 覆盖自定义 supervisor 配置。
- 您始终可以通过 `openclaw gateway install --force` 强制完全重写。

### 16) Gateway 运行时 + 端口诊断
Doctor 检查服务运行时(PID,最后退出状态)并在服务已安装但实际上未运行时发出警告。它还检查 gateway 端口(默认 `18789`)上的端口冲突,并报告可能的原因(gateway 已运行,SSH 隧道)。

### 17) Gateway 运行时最佳实践
当 gateway 服务在 Bun 或版本管理的 Node 路径(`nvm`、`fnm`、`volta`、`asdf` 等)上运行时,Doctor 会发出警告。WhatsApp + Telegram channels 需要 Node,并且版本管理器路径可能在升级后中断,因为服务不加载您的 shell init。当系统 Node 安装可用(Homebrew/apt/choco)时,Doctor 提供迁移到它。

### 18) 配置写入 + 向导元数据
Doctor 持久化任何配置更改并标记向导元数据以记录 doctor 运行。

### 19) Workspace 提示(备份 + 内存系统)
当缺失时,Doctor 建议 workspace 内存系统,并在 workspace 尚未在 git 下时打印备份提示。

有关 workspace 结构和 git 备份的完整指南(推荐私有 GitHub 或 GitLab),请参见 [/zh/concepts/agent-workspace](/zh/concepts/agent-workspace)。
