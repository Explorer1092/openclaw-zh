---
mmh3_hash: "17dcb70bcac7e34c060db083e69ffb10"
title: 沙盒 CLI
sidebarTitle: "沙盒 CLI"
summary: "管理沙盒容器并检查有效的沙盒策略"
read_when: "您正在管理沙盒容器或调试沙盒/工具策略行为。"
status: active
---

# 沙盒 CLI

管理基于 Docker 的沙盒容器以实现隔离的Agent执行。

## 概述

OpenClaw 可以在隔离的 Docker 容器中运行Agent以确保安全。`sandbox` 命令帮助您管理这些容器,特别是在更新或配置更改后。

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

列出所有沙盒容器及其状态和配置。

```bash
openclaw sandbox list
openclaw sandbox list --browser  # 仅列出浏览器容器
openclaw sandbox list --json     # JSON 输出
```

**输出包括:**
- 容器名称和状态(运行/停止)
- Docker 镜像以及是否与配置匹配
- 年龄(自创建以来的时间)
- 空闲时间(自上次使用以来的时间)
- 关联的Session/Agent

### `openclaw sandbox recreate`

删除沙盒容器以强制使用更新的镜像/配置重新创建。

```bash
openclaw sandbox recreate --all                # 重新创建所有容器
openclaw sandbox recreate --session main       # 特定Session
openclaw sandbox recreate --agent mybot        # 特定Agent
openclaw sandbox recreate --browser            # 仅浏览器容器
openclaw sandbox recreate --all --force        # 跳过确认
```

**选项:**
- `--all`:重新创建所有沙盒容器
- `--session <key>`:为特定Session重新创建容器
- `--agent <id>`:为特定Agent重新创建容器
- `--browser`:仅重新创建浏览器容器
- `--force`:跳过确认提示

**重要提示:** 容器在下次使用Agent时会自动重新创建。

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

### 更改 setupCommand 后

```bash
openclaw sandbox recreate --all
# 或只是一个Agent:
openclaw sandbox recreate --agent family
```


### 仅针对特定Agent

```bash
# 仅更新一个Agent的容器
openclaw sandbox recreate --agent alfred
```

## 为什么需要这个?

**问题:** 当您更新沙盒 Docker 镜像或配置时:
- 现有容器继续使用旧设置运行
- 容器仅在 24 小时不活动后才被修剪
- 定期使用的Agent会无限期地保持旧容器运行

**解决方案:** 使用 `openclaw sandbox recreate` 强制删除旧容器。它们将在下次需要时自动使用当前设置重新创建。

提示:优先使用 `openclaw sandbox recreate` 而不是手动 `docker rm`。它使用Gateway的容器命名,并在范围/Session键更改时避免不匹配。

## 配置

沙盒设置位于 `~/.openclaw/openclaw.json` 的 `agents.defaults.sandbox` 下(每个Agent覆盖进入 `agents.list[].sandbox`):

```jsonc
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "all",                    // off, non-main, all
        "scope": "agent",                 // session, agent, shared
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "containerPrefix": "openclaw-sbx-"
          // ... 更多 Docker 选项
        },
        "prune": {
          "idleHours": 24,               // 24 小时空闲后自动修剪
          "maxAgeDays": 7                // 7 天后自动修剪
        }
      }
    }
  }
}
```

## 另请参阅

- [沙盒文档](/gateway/sandboxing)
- [Agent配置](/concepts/agent-workspace)
- [Doctor 命令](/gateway/doctor) - 检查沙盒设置
