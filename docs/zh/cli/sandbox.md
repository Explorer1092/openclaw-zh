---
mmh3_hash: "0d6be7f6952f7cce6fbdca18529c09ce"
title: 沙盒 CLI
sidebarTitle: "沙盒 CLI"
summary: "管理沙盒运行时并检查有效的沙盒策略"
read_when: "您正在管理沙盒运行时或调试沙盒/工具策略行为。"
status: active
---

# 沙盒 CLI

管理用于隔离 Agent 执行的沙盒运行时。

## 概述

OpenClaw 可以在隔离的沙盒运行时中运行 Agent 以确保安全。`sandbox` 命令帮助您在更新或配置更改后检查和重新创建这些运行时。

目前通常意味着:

- Docker 沙盒容器
- 当 `agents.defaults.sandbox.backend = "ssh"` 时的 SSH 沙盒运行时
- 当 `agents.defaults.sandbox.backend = "openshell"` 时的 OpenShell 沙盒运行时

对于 `ssh` 和 OpenShell `remote`,重新创建比 Docker 更重要:

- 初始种子后远程工作区是权威的
- `openclaw sandbox recreate` 会删除所选范围的权威远程工作区
- 下次使用时会从当前本地工作区重新种子

## 命令

### `openclaw sandbox explain`

检查**有效的**沙盒模式/范围/工作区访问、沙盒工具策略和提升的门控(带有修复配置键路径)。

```bash
openclaw sandbox explain
openclaw sandbox explain --session agent:main:main
openclaw sandbox explain --agent work
openclaw sandbox explain --json
```

### `openclaw sandbox list`

列出所有沙盒运行时及其状态和配置。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # 仅列出浏览器容器
openclaw sandbox list --json     # JSON 输出
```

**输出包括:**

- 运行时名称和状态
- 后端(`docker`、`openshell` 等)
- 配置标签以及是否与当前配置匹配
- 年龄(自创建以来的时间)
- 空闲时间(自上次使用以来的时间)
- 关联的 Session/Agent

### `openclaw sandbox recreate`

删除沙盒运行时以强制使用更新的配置重新创建。

```bash
openclaw sandbox recreate --all                # 重新创建所有容器
openclaw sandbox recreate --session main       # 特定 Session
openclaw sandbox recreate --agent mybot        # 特定 Agent
openclaw sandbox recreate --browser            # 仅浏览器容器
openclaw sandbox recreate --all --force        # 跳过确认
```

**选项:**

- `--all`:重新创建所有沙盒容器
- `--session <key>`:为特定 Session 重新创建容器
- `--agent <id>`:为特定 Agent 重新创建容器
- `--browser`:仅重新创建浏览器容器
- `--force`:跳过确认提示

<Note>
运行时在下次使用 Agent 时会自动重新创建。
</Note>

## 用例

### 更新 Docker 镜像后

```bash
# 拉取新镜像
docker pull openclaw-sandbox:latest
docker tag openclaw-sandbox:latest openclaw-sandbox:bookworm-slim

# 更新配置以使用新镜像
# 编辑配置:agents.defaults.sandbox.docker.image(或 agents.list[].sandbox.docker.image)

# 重新创建容器
openclaw sandbox recreate --all
```

### 更改沙盒配置后

```bash
# 编辑配置:agents.defaults.sandbox.*(或 agents.list[].sandbox.*)

# 重新创建以应用新配置
openclaw sandbox recreate --all
```

### 更改 SSH 目标或 SSH 认证材料后

```bash
# 编辑配置:
# - agents.defaults.sandbox.backend
# - agents.defaults.sandbox.ssh.target
# - agents.defaults.sandbox.ssh.workspaceRoot
# - agents.defaults.sandbox.ssh.identityFile / certificateFile / knownHostsFile
# - agents.defaults.sandbox.ssh.identityData / certificateData / knownHostsData

openclaw sandbox recreate --all
```

对于核心 `ssh` 后端,重新创建会删除 SSH 目标上的每范围远程工作区根目录。下次运行时会从本地工作区重新种子。

### 更改 OpenShell 来源、策略或模式后

```bash
# 编辑配置:
# - agents.defaults.sandbox.backend
# - plugins.entries.openshell.config.from
# - plugins.entries.openshell.config.mode
# - plugins.entries.openshell.config.policy

openclaw sandbox recreate --all
```

对于 OpenShell `remote` 模式,重新创建会删除该范围的权威远程工作区。下次运行时会从本地工作区重新种子。

### 更改 setupCommand 后

```bash
openclaw sandbox recreate --all
# 或只是一个 Agent:
openclaw sandbox recreate --agent family
```

### 仅针对特定 Agent

```bash
# 仅更新一个 Agent 的容器
openclaw sandbox recreate --agent alfred
```

## 为什么需要这个

当您更新沙盒配置时:

- 现有运行时继续使用旧设置运行。
- 运行时仅在 24 小时不活动后才被修剪。
- 定期使用的 Agent 会无限期地保持旧运行时运行。

使用 `openclaw sandbox recreate` 强制删除旧运行时。它们将在下次需要时自动使用当前设置重新创建。

<Tip>
优先使用 `openclaw sandbox recreate` 而不是手动后端特定清理。它使用 Gateway 的运行时注册表,并在范围/Session 键更改时避免不匹配。
</Tip>

## 配置

沙盒设置位于 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 下(每个 Agent 覆盖进入 `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all", // off, non-main, all
        "backend": "docker", // docker, ssh, openshell
        "scope": "agent", // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-",
          // ... 更多 Docker 选项
        },
        "prune": {
          "idleHours": 24, // 24 小时空闲后自动修剪
          "maxAgeDays": 7, // 7 天后自动修剪
        },
      },
    },
  },
}
```

## 相关

- [CLI 参考](/cli)
- [沙盒](/gateway/sandboxing)
- [Agent 工作区](/concepts/agent-workspace)
- [Doctor](/gateway/doctor):检查沙盒设置。
