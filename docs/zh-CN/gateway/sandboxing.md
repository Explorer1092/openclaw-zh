---
read_when: You want a dedicated explanation of sandboxing or need to tune agents.defaults.sandbox.
status: active
summary: OpenClaw 沙箱隔离的工作原理：模式、作用域、工作区访问和镜像
title: 沙箱隔离
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: anthropic
  source_hash: 94e346f66c6b9b0b4cd7b8cd7e0a0804e52e2314d319c985d3af479b95e95d10
  source_path: gateway/sandboxing.md
  workflow: 15
---

# 沙箱隔离

OpenClaw 可以**在沙箱后端内运行工具**以减少影响范围。
这是**可选的**，由配置控制（`agents.defaults.sandbox` 或 `agents.list[].sandbox`）。如果沙箱隔离关闭，工具在主机上运行。
Gateway 网关保留在主机上；启用时工具执行在隔离的沙箱中运行。

这不是完美的安全边界，但当模型做出愚蠢行为时，它实质性地限制了文件系统和进程访问。

## 什么会被沙箱隔离

- 工具执行（`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等）。
- 可选的沙箱浏览器（`agents.defaults.sandbox.browser`）。
  - 默认情况下，当浏览器工具需要时，沙箱浏览器会自动启动（确保 CDP 可达）。
    通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 配置。
  - 默认情况下，沙箱浏览器容器使用专用 Docker 网络（`openclaw-sandbox-browser`）而非全局 `bridge` 网络。
    通过 `agents.defaults.sandbox.browser.network` 配置。
  - 可选的 `agents.defaults.sandbox.browser.cdpSourceRange` 使用 CIDR 允许列表限制容器边缘 CDP 入站（例如 `172.21.0.1/32`）。
  - noVNC 观察者访问默认受密码保护；OpenClaw 生成一个短期令牌 URL，提供本地引导页并通过 URL 片段（而非查询/请求头日志）携带密码打开 noVNC。
  - `agents.defaults.sandbox.browser.allowHostControl` 允许沙箱会话显式定位主机浏览器。
  - 可选的允许列表限制 `target: "custom"`：`allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

不被沙箱隔离：

- Gateway 网关进程本身。
- 任何明确允许在主机上运行的工具（例如 `tools.elevated`）。
  - **提权 exec 在主机上运行并绕过沙箱隔离。**
  - 如果沙箱隔离关闭，`tools.elevated` 不会改变执行（已经在主机上）。参见[提权模式](/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制**何时**使用沙箱隔离：

- `"off"`：不使用沙箱隔离。
- `"non-main"`：仅沙箱隔离**非主**会话（如果你想让普通聊天在主机上运行，这是默认值）。
- `"all"`：每个会话都在沙箱中运行。
  注意：`"non-main"` 基于 `session.mainKey`（默认 `"main"`），而不是智能体 ID。
  群组/频道会话使用它们自己的键，因此它们算作非主会话并将被沙箱隔离。

## 作用域

`agents.defaults.sandbox.scope` 控制**创建多少容器**：

- `"session"`（默认）：每个会话一个容器。
- `"agent"`：每个智能体一个容器。
- `"shared"`：所有沙箱会话共享一个容器。

## 后端

`agents.defaults.sandbox.backend` 控制**哪个运行时**提供沙箱：

- `"docker"`（默认）：本地 Docker 支持的沙箱运行时。
- `"ssh"`：通用 SSH 支持的远程沙箱运行时。
- `"openshell"`：OpenShell 支持的沙箱运行时。

SSH 专用配置在 `agents.defaults.sandbox.ssh` 下。
OpenShell 专用配置在 `plugins.entries.openshell.config` 下。

### 选择后端

|                     | Docker                           | SSH                            | OpenShell                                           |
| ------------------- | -------------------------------- | ------------------------------ | --------------------------------------------------- |
| **运行位置**        | 本地容器                         | 任何 SSH 可访问的主机          | OpenShell 托管沙箱                                  |
| **设置**            | `scripts/sandbox-setup.sh`       | SSH 密钥 + 目标主机            | 启用 OpenShell 插件                                 |
| **工作区模型**      | 绑定挂载或复制                   | 远程规范（一次性种子）         | `mirror` 或 `remote`                                |
| **网络控制**        | `docker.network`（默认：无）     | 取决于远程主机                 | 取决于 OpenShell                                    |
| **浏览器沙箱**      | 支持                             | 不支持                         | 尚未支持                                            |
| **绑定挂载**        | `docker.binds`                   | 不适用                         | 不适用                                              |
| **最适合**          | 本地开发，完全隔离               | 卸载到远程机器                 | 可选双向同步的托管远程沙箱                          |

### SSH 后端

当你想让 OpenClaw 在任意 SSH 可访问的机器上沙箱隔离 `exec`、文件工具和媒体读取时，使用 `backend: "ssh"`。

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "all",
        backend: "ssh",
        scope: "session",
        workspaceAccess: "rw",
        ssh: {
          target: "user@gateway-host:22",
          workspaceRoot: "/tmp/openclaw-sandboxes",
          strictHostKeyChecking: true,
          updateHostKeys: true,
          identityFile: "~/.ssh/id_ed25519",
          certificateFile: "~/.ssh/id_ed25519-cert.pub",
          knownHostsFile: "~/.ssh/known_hosts",
          // 或者使用 SecretRef / 内联内容代替本地文件：
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

工作原理：

- OpenClaw 在 `sandbox.ssh.workspaceRoot` 下为每个作用域创建一个远程根目录。
- 在创建或重建后首次使用时，OpenClaw 将本地工作区一次性种子到远程工作区。
- 之后，`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒体读取和入站媒体暂存直接通过 SSH 对远程工作区运行。
- OpenClaw 不会自动将远程变更同步回本地工作区。

认证材料：

- `identityFile`、`certificateFile`、`knownHostsFile`：使用现有本地文件并通过 OpenSSH 配置传递。
- `identityData`、`certificateData`、`knownHostsData`：使用内联字符串或 SecretRef。OpenClaw 通过正常的密钥运行时快照解析它们，以 `0600` 权限写入临时文件，并在 SSH 会话结束时删除。
- 如果同一项同时设置了 `*File` 和 `*Data`，该 SSH 会话中 `*Data` 优先。

这是**远程规范**模型。初始种子后，远程 SSH 工作区成为真实的沙箱状态。

重要后果：

- 种子步骤后在 OpenClaw 外部对主机进行的本地编辑在远程不可见，直到你重建沙箱。
- `openclaw sandbox recreate` 删除每个作用域的远程根目录并在下次使用时再次从本地种子。
- SSH 后端不支持浏览器沙箱。
- `sandbox.docker.*` 设置不适用于 SSH 后端。

### OpenShell 后端

当你想让 OpenClaw 在 OpenShell 托管的远程环境中沙箱隔离工具时，使用 `backend: "openshell"`。完整设置指南、配置参考和工作区模式比较，请参阅专门的 [OpenShell 页面](/gateway/openshell)。

OpenShell 复用与通用 SSH 后端相同的核心 SSH 传输和远程文件系统桥，并添加 OpenShell 特定的生命周期（`sandbox create/get/delete`、`sandbox ssh-config`）以及可选的 `mirror` 工作区模式。

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
          mode: "remote", // mirror | remote
          remoteWorkspaceDir: "/sandbox",
          remoteAgentWorkspaceDir: "/agent",
        },
      },
    },
  },
}
```

OpenShell 模式：

- `mirror`（默认）：本地工作区保持规范。OpenClaw 在 exec 前将本地文件同步到 OpenShell，exec 后将远程工作区同步回来。
- `remote`：OpenShell 工作区在沙箱创建后成为规范。OpenClaw 从本地工作区一次性种子远程工作区，然后文件工具和 exec 直接对远程 OpenShell 工作区运行，不将变更同步回来。

远程传输细节：

- OpenClaw 通过 `openshell sandbox ssh-config <name>` 向 OpenShell 请求沙箱特定的 SSH 配置。
- 核心将该 SSH 配置写入临时文件，打开 SSH 会话，并复用与 `backend: "ssh"` 相同的远程文件系统桥。
- 仅在 `mirror` 模式下生命周期有所不同：exec 前将本地同步到远程，exec 后再同步回来。

当前 OpenShell 限制：

- 尚未支持沙箱浏览器
- OpenShell 后端不支持 `sandbox.docker.binds`
- `sandbox.docker.*` 下的 Docker 特定运行时旋钮仍仅适用于 Docker 后端

#### 工作区模式

OpenShell 有两种工作区模型，这是实践中最重要的部分。

##### `mirror`

当你希望**本地工作区保持规范**时，使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为：

- 在 `exec` 之前，OpenClaw 将本地工作区同步到 OpenShell 沙箱。
- 在 `exec` 之后，OpenClaw 将远程工作区同步回本地工作区。
- 文件工具仍通过沙箱桥运行，但本地工作区在每轮之间保持为真实来源。

适用场景：

- 你在 OpenClaw 外部本地编辑文件，并希望这些变更自动出现在沙箱中
- 你希望 OpenShell 沙箱的行为尽可能像 Docker 后端
- 你希望主机工作区在每次 exec 轮次后反映沙箱写入

权衡：

- exec 前后额外的同步开销

##### `remote`

当你希望 **OpenShell 工作区成为规范**时，使用 `plugins.entries.openshell.config.mode: "remote"`。

行为：

- 首次创建沙箱时，OpenClaw 从本地工作区一次性种子远程工作区。
- 之后，`exec`、`read`、`write`、`edit` 和 `apply_patch` 直接对远程 OpenShell 工作区操作。
- OpenClaw **不会**在 exec 后将远程变更同步回本地工作区。
- 提示时的媒体读取仍然有效，因为文件和媒体工具通过沙箱桥读取，而不是假设本地主机路径。
- 传输通过 SSH 进入 `openshell sandbox ssh-config` 返回的 OpenShell 沙箱。

重要后果：

- 如果你在种子步骤后在 OpenClaw 外部编辑主机上的文件，远程沙箱**不会**自动看到这些变更。
- 如果沙箱被重建，远程工作区将再次从本地工作区种子。
- 使用 `scope: "agent"` 或 `scope: "shared"` 时，远程工作区在相同作用域下共享。

适用场景：

- 沙箱主要应存在于远程 OpenShell 侧
- 你希望降低每轮同步开销
- 你不希望主机本地编辑静默覆盖远程沙箱状态

如果你认为沙箱是临时执行环境，选择 `mirror`。
如果你认为沙箱是真实工作区，选择 `remote`。

#### OpenShell 生命周期

OpenShell 沙箱仍通过正常的沙箱生命周期管理：

- `openclaw sandbox list` 也显示 OpenShell 运行时和 Docker 运行时
- `openclaw sandbox recreate` 删除当前运行时，并让 OpenClaw 在下次使用时重建
- 清理逻辑也感知后端

对于 `remote` 模式，重建尤为重要：

- 重建删除该作用域的规范远程工作区
- 下次使用时从本地工作区种子新的远程工作区

对于 `mirror` 模式，重建主要重置远程执行环境，因为本地工作区无论如何仍是规范的。

## 工作区访问

`agents.defaults.sandbox.workspaceAccess` 控制**沙箱可以看到什么**：

- `"none"`（默认）：工具看到 `~/.openclaw/sandboxes` 下的沙箱工作区。
- `"ro"`：以只读方式在 `/agent` 挂载智能体工作区（禁用 `write`/`edit`/`apply_patch`）。
- `"rw"`：以读写方式在 `/workspace` 挂载智能体工作区。

使用 OpenShell 后端时：

- `mirror` 模式仍使用本地工作区作为 exec 轮次之间的规范来源
- `remote` 模式在初始种子后使用远程 OpenShell 工作区作为规范来源
- `workspaceAccess: "ro"` 和 `"none"` 仍以相同方式限制写行为

入站媒体被复制到活动沙箱工作区（`media/inbound/*`）。
Skills 注意事项：`read` 工具以沙箱为根。使用 `workspaceAccess: "none"` 时，OpenClaw 将符合条件的 Skills 镜像到沙箱工作区（`.../skills`）以便可以读取。使用 `"rw"` 时，工作区 Skills 可从 `/workspace/skills` 读取。

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 将额外的主机目录挂载到容器中。
格式：`host:container:mode`（例如 `"/home/user/source:/source:rw"`）。

全局和每智能体的绑定是**合并**的（不是替换）。在 `scope: "shared"` 下，每智能体的绑定被忽略。

`agents.defaults.sandbox.browser.binds` 将额外的主机目录仅挂载到**沙箱浏览器**容器中。

- 当设置（包括 `[]`）时，它替换浏览器容器的 `agents.defaults.sandbox.docker.binds`。
- 当省略时，浏览器容器回退到 `agents.defaults.sandbox.docker.binds`（向后兼容）。

示例（只读源码 + 额外数据目录）：

```json5
{
  agents: {
    defaults: {
      sandbox: {
        docker: {
          binds: ["/home/user/source:/source:ro", "/var/data/myapp:/data:ro"],
        },
      },
    },
    list: [
      {
        id: "build",
        sandbox: {
          docker: {
            binds: ["/mnt/cache:/cache:rw"],
          },
        },
      },
    ],
  },
}
```

安全注意事项：

- 绑定绕过沙箱文件系统：它们以你设置的任何模式（`:ro` 或 `:rw`）暴露主机路径。
- OpenClaw 阻止危险的绑定源（例如：`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev` 以及可能暴露它们的父挂载）。
- 敏感挂载（密钥、SSH 密钥、服务凭证）应该是 `:ro`，除非绝对必要。
- 如果你只需要对工作区的读取访问，请结合 `workspaceAccess: "ro"`；绑定模式保持独立。
- 参见[沙箱 vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated)了解绑定如何与工具策略和提权 exec 交互。

## 镜像 + 设置

默认 Docker 镜像：`openclaw-sandbox:bookworm-slim`

构建一次：

```bash
scripts/sandbox-setup.sh
```

注意：默认镜像**不**包含 Node。如果 Skills 需要 Node（或其他运行时），要么构建自定义镜像，要么通过 `sandbox.docker.setupCommand` 安装（需要网络出口 + 可写根 + root 用户）。

如果你需要一个包含常用工具（例如 `curl`、`jq`、`nodejs`、`python3`、`git`）的更完整沙箱镜像，构建：

```bash
scripts/sandbox-common-setup.sh
```

然后将 `agents.defaults.sandbox.docker.image` 设置为 `openclaw-sandbox-common:bookworm-slim`。

沙箱浏览器镜像：

```bash
scripts/sandbox-browser-setup.sh
```

默认情况下，Docker 沙箱容器运行时**没有网络**。
通过 `agents.defaults.sandbox.docker.network` 覆盖。

捆绑的沙箱浏览器镜像也为容器化工作负载应用了保守的 Chromium 启动默认值。当前容器默认值包括：

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<从 OPENCLAW_BROWSER_CDP_PORT 派生>`
- `--user-data-dir=${HOME}/.chrome`
- `--no-first-run`
- `--no-default-browser-check`
- `--disable-3d-apis`
- `--disable-gpu`
- `--disable-dev-shm-usage`
- `--disable-background-networking`
- `--disable-extensions`
- `--disable-features=TranslateUI`
- `--disable-breakpad`
- `--disable-crash-reporter`
- `--disable-software-rasterizer`
- `--no-zygote`
- `--metrics-recording-only`
- `--renderer-process-limit=2`
- 当启用 `noSandbox` 时使用 `--no-sandbox` 和 `--disable-setuid-sandbox`。
- 三个图形加固标志（`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`）是可选的，当容器缺乏 GPU 支持时很有用。如果你的工作负载需要 WebGL 或其他 3D/浏览器功能，设置 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
- `--disable-extensions` 默认启用，可以使用 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 为依赖扩展的流程禁用。
- `--renderer-process-limit=2` 由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制，其中 `0` 保留 Chromium 的默认值。

如果你需要不同的运行时配置文件，使用自定义浏览器镜像并提供你自己的入口点。对于本地（非容器）Chromium 配置文件，使用 `browser.extraArgs` 追加额外的启动标志。

安全默认值：

- `network: "host"` 被阻止。
- `network: "container:<id>"` 默认被阻止（命名空间加入绕过风险）。
- 紧急情况覆盖：`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker 安装和容器化 Gateway 网关在此：
[Docker](/install/docker)

对于 Docker Gateway 网关部署，`scripts/docker/setup.sh` 可以引导沙箱配置。
设置 `OPENCLAW_SANDBOX=1`（或 `true`/`yes`/`on`）启用该路径。你可以使用 `OPENCLAW_DOCKER_SOCKET` 覆盖套接字位置。完整设置和环境参考：[Docker](/install/docker#agent-sandbox)。

## setupCommand（一次性容器设置）

`setupCommand` 在沙箱容器创建后**运行一次**（不是每次运行）。
它通过 `sh -lc` 在容器内执行。

路径：

- 全局：`agents.defaults.sandbox.docker.setupCommand`
- 每智能体：`agents.list[].sandbox.docker.setupCommand`

常见陷阱：

- 默认 `docker.network` 是 `"none"`（无出口），因此包安装会失败。
- `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`，仅用于紧急情况。
- `readOnlyRoot: true` 阻止写入；设置 `readOnlyRoot: false` 或构建自定义镜像。
- `user` 必须是 root 才能安装包（省略 `user` 或设置 `user: "0:0"`）。
- 沙箱 exec **不**继承主机 `process.env`。使用 `agents.defaults.sandbox.docker.env`（或自定义镜像）设置 Skills API 密钥。

## 工具策略 + 逃逸通道

工具允许/拒绝策略仍在沙箱规则之前应用。如果工具在全局或每智能体被拒绝，沙箱隔离不会恢复它。

`tools.elevated` 是一个显式的逃逸通道，在主机上运行 `exec`。
`/exec` 指令仅适用于授权发送者并按会话持久化；要硬禁用 `exec`，使用工具策略拒绝（参见[沙箱 vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated)）。

调试：

- 使用 `openclaw sandbox explain` 检查生效的沙箱模式、工具策略和修复配置键。
- 参见[沙箱 vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated)了解"为什么被阻止？"的心智模型。
  保持锁定。

## 多智能体覆盖

每个智能体可以覆盖沙箱 + 工具：
`agents.list[].sandbox` 和 `agents.list[].tools`（加上 `agents.list[].tools.sandbox.tools` 用于沙箱工具策略）。
参见[多智能体沙箱与工具](/tools/multi-agent-sandbox-tools)了解优先级。

## 最小启用示例

```json5
{
  agents: {
    defaults: {
      sandbox: {
        mode: "non-main",
        scope: "session",
        workspaceAccess: "none",
      },
    },
  },
}
```

## 相关文档

- [OpenShell](/gateway/openshell) -- 托管沙箱后端设置、工作区模式和配置参考
- [沙箱配置](/gateway/configuration-reference#agentsdefaultssandbox)
- [沙箱 vs 工具策略 vs 提权](/gateway/sandbox-vs-tool-policy-vs-elevated) -- 调试"为什么被阻止？"
- [多智能体沙箱与工具](/tools/multi-agent-sandbox-tools) -- 每智能体覆盖和优先级
- [安全](/gateway/security)
