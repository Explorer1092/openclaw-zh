---
mmh3_hash: "691964c433ac917000d7bfe27a484162"
title: OpenShell
summary: "将 OpenShell 作为 OpenClaw agent 的托管沙盒后端"
read_when:
  - 你想要云托管沙盒而不是本地 Docker
  - 你正在设置 OpenShell plugin
  - 你需要在 mirror 和 remote workspace 模式之间选择
---

# OpenShell

OpenShell 是 OpenClaw 的托管沙盒后端。OpenClaw 将沙盒生命周期委托给 `openshell` CLI,而不是在本地运行 Docker 容器,`openshell` CLI 会预配具有基于 SSH 命令执行的远程环境。

OpenShell plugin 重用与通用 [SSH 后端](/gateway/sandboxing#ssh-backend)相同的核心 SSH 传输和远程文件系统桥。它添加了 OpenShell 特定的生命周期(`sandbox create/get/delete`、`sandbox ssh-config`)和可选的 `mirror` workspace 模式。

## 先决条件

- 已安装 `openshell` CLI 并在 `PATH` 中(或通过 `plugins.entries.openshell.config.command` 设置自定义路径)
- 具有沙盒访问权限的 OpenShell 账户
- 在主机上运行的 OpenClaw Gateway

## 快速开始

1. 启用 plugin 并设置沙盒后端:

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "session",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

2. 重启 Gateway。在下一个 agent 回合中,OpenClaw 创建一个 OpenShell 沙盒并通过它路由工具执行。

3. 验证:

```bash
openclaw sandbox list
openclaw sandbox explain
```

## Workspace 模式

这是使用 OpenShell 时最重要的决定。

### `mirror`

当你希望**本地 workspace 保持权威**时,使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为:

- 在 `exec` 之前,OpenClaw 将本地 workspace 同步到 OpenShell 沙盒中。
- 在 `exec` 之后,OpenClaw 将远程 workspace 同步回本地 workspace。
- 文件工具仍通过沙盒桥操作,但本地 workspace 在回合之间保持真相来源。

最适合:

- 你在 OpenClaw 外部本地编辑文件,并希望这些更改在沙盒中自动可见。
- 你希望 OpenShell 沙盒的行为尽可能像 Docker 后端。
- 你希望主机 workspace 在每次 exec 回合后反映沙盒写入。

权衡:每次 exec 前后有额外的同步成本。

### `remote`

当你希望 **OpenShell workspace 成为权威**时,使用 `plugins.entries.openshell.config.mode: "remote"`。

行为:

- 首次创建沙盒时,OpenClaw 从本地 workspace 播种远程 workspace 一次。
- 之后,`exec`、`read`、`write`、`edit` 和 `apply_patch` 直接针对远程 OpenShell workspace 操作。
- OpenClaw **不**将远程更改同步回本地 workspace。
- 由于文件和媒体工具通过沙盒桥读取,prompt 时间媒体读取仍然有效。

最适合:

- 沙盒应主要存在于远程端。
- 你想要更低的每回合同步开销。
- 你不希望主机本地编辑静默覆盖远程沙盒状态。

重要提示:如果你在初始播种后在 OpenClaw 外部在主机上编辑文件,远程沙盒**不**会看到这些更改。使用 `openclaw sandbox recreate` 重新播种。

### 选择模式

|                          | `mirror`                    | `remote`                  |
| ------------------------ | --------------------------- | ------------------------- |
| **权威 workspace**       | 本地主机                    | 远程 OpenShell            |
| **同步方向**             | 双向(每次 exec)             | 一次性播种                |
| **每回合开销**           | 较高(上传 + 下载)           | 较低(直接远程操作)        |
| **本地编辑可见?**        | 是,在下一次 exec 时         | 否,直到 recreate          |
| **最适合**               | 开发工作流                  | 长期运行 agent、CI        |

## 配置参考

所有 OpenShell 配置位于 `plugins.entries.openshell.config` 下:

| 键                        | 类型                     | 默认值         | 描述                                               |
| ------------------------- | ------------------------ | -------------- | -------------------------------------------------- |
| `mode`                    | `"mirror"` 或 `"remote"` | `"mirror"`     | Workspace 同步模式                                 |
| `command`                 | `string`                 | `"openshell"`  | `openshell` CLI 的路径或名称                       |
| `from`                    | `string`                 | `"openclaw"`   | 首次创建的沙盒来源                                 |
| `gateway`                 | `string`                 | —              | OpenShell gateway 名称(`--gateway`)                |
| `gatewayEndpoint`         | `string`                 | —              | OpenShell gateway 端点 URL(`--gateway-endpoint`)   |
| `policy`                  | `string`                 | —              | 沙盒创建的 OpenShell 策略 ID                       |
| `providers`               | `string[]`               | `[]`           | 创建沙盒时要附加的 provider 名称                   |
| `gpu`                     | `boolean`                | `false`        | 请求 GPU 资源                                      |
| `autoProviders`           | `boolean`                | `true`         | 沙盒创建期间传递 `--auto-providers`                |
| `remoteWorkspaceDir`      | `string`                 | `"/sandbox"`   | 沙盒内的主要可写 workspace                         |
| `remoteAgentWorkspaceDir` | `string`                 | `"/agent"`     | Agent workspace 挂载路径(用于只读访问)             |
| `timeoutSeconds`          | `number`                 | `120`          | `openshell` CLI 操作的超时                         |

沙盒级设置(`mode`、`scope`、`workspaceAccess`)在 `agents.defaults.sandbox` 下配置,与任何后端一样。参见 [Sandboxing](/gateway/sandboxing) 了解完整矩阵。

## 示例

### 最小 remote 设置

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
        },
      },
    },
  },
}
```

### 带 GPU 的 Mirror 模式

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "openshell",
        scope: "agent",
        workspaceAccess: "rw",
      },
    },
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "mirror",
          gpu: true,
          providers: ["openai"],
          timeoutSeconds: 180,
        },
      },
    },
  },
}
```

### 带自定义 gateway 的每个 agent OpenShell

```json5
{
  agents: {
    defaults: {
      sandbox: { mode: "off" },
    },
    list: [
      {
        id: "researcher",
        sandbox: {
          mode: "all",
          backend: "openshell",
          scope: "agent",
          workspaceAccess: "rw",
        },
      },
    ],
  },
  plugins: {
    entries: {
      openshell: {
        enabled: true,
        config: {
          from: "openclaw",
          mode: "remote",
          gateway: "lab",
          gatewayEndpoint: "https://lab.example",
          policy: "strict",
        },
      },
    },
  },
}
```

## 生命周期管理

OpenShell 沙盒通过正常的沙盒 CLI 管理:

```bash
# 列出所有沙盒 runtime(Docker + OpenShell)
openclaw sandbox list

# 检查有效策略
openclaw sandbox explain

# 重新创建(删除远程 workspace,在下次使用时重新播种)
openclaw sandbox recreate --all
```

对于 `remote` 模式,**recreate 尤其重要**:它删除该 scope 的权威远程 workspace。下次使用时从本地 workspace 播种新的远程 workspace。

对于 `mirror` 模式,recreate 主要重置远程执行环境,因为本地 workspace 保持权威。

### 何时需要 recreate

在更改以下任何内容后进行 recreate:

- `agents.defaults.sandbox.backend`
- `plugins.entries.openshell.config.from`
- `plugins.entries.openshell.config.mode`
- `plugins.entries.openshell.config.policy`

```bash
openclaw sandbox recreate --all
```

## 当前限制

- OpenShell 后端不支持沙盒浏览器。
- `sandbox.docker.binds` 不适用于 OpenShell。
- `sandbox.docker.*` 下的 Docker 特定 runtime 设置仅适用于 Docker 后端。

## 工作原理

1. OpenClaw 调用 `openshell sandbox create`(使用配置的 `--from`、`--gateway`、`--policy`、`--providers`、`--gpu` 标志)。
2. OpenClaw 调用 `openshell sandbox ssh-config <name>` 获取沙盒的 SSH 连接详情。
3. Core 将 SSH 配置写入临时文件,并使用与通用 SSH 后端相同的远程文件系统桥打开 SSH session。
4. 在 `mirror` 模式中:exec 之前将本地同步到远程,运行,exec 之后同步回来。
5. 在 `remote` 模式中:创建时一次性播种,然后直接在远程 workspace 上操作。

## 另请参见

- [Sandboxing](/gateway/sandboxing) — 模式、scope 和后端比较
- [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) — 调试被阻止的工具
- [Multi-Agent Sandbox and Tools](/tools/multi-agent-sandbox-tools) — 每个 agent 覆盖
- [Sandbox CLI](/cli/sandbox) — `openclaw sandbox` 命令
