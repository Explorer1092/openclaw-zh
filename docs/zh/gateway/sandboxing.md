---
mmh3_hash: "36b763b925fe376b8b504c18a072ed47"
summary: "OpenClaw 沙盒的工作原理:模式、作用域、工作空间访问和镜像"
title: 沙盒
read_when: "您想要沙盒的专门解释或需要调整 agents.defaults.sandbox。"
status: active
---

# 沙盒

OpenClaw 可以在**沙盒后端内运行工具**以减少爆炸半径。这是**可选的**,由配置控制(`agents.defaults.sandbox` 或 `agents.list[].sandbox`)。如果沙盒关闭,工具在主机上运行。Gateway 保持在主机上;当启用时,工具执行在隔离的沙盒中运行。

这不是完美的安全边界,但当模型做了蠢事时,它实质上限制了文件系统和进程访问。

## 什么被沙盒化

- 工具执行(`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等)。
- 可选的沙盒 Browser(`agents.defaults.sandbox.browser`)。
  - 默认情况下,沙盒 Browser 自动启动(确保 CDP 可访问)当 Browser 工具需要它时。
    通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 配置。
  - 默认情况下,沙盒 Browser 容器使用专用的 Docker 网络(`openclaw-sandbox-browser`)而不是全局 `bridge` 网络。
    使用 `agents.defaults.sandbox.browser.network` 配置。
  - 可选的 `agents.defaults.sandbox.browser.cdpSourceRange` 使用 CIDR 允许列表限制容器边缘 CDP 入口(例如 `172.21.0.1/32`)。
  - noVNC 观察器访问默认受密码保护;OpenClaw 发出短期令牌 URL,提供本地引导页面并以 URL 片段(而不是查询/标头日志)中的密码打开 noVNC。
  - `agents.defaults.sandbox.browser.allowHostControl` 让沙盒 Session 明确定向主机 Browser。
  - 可选的允许列表控制 `target: "custom"`: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

未沙盒化:

- Gateway 进程本身。
- 任何明确允许在主机上运行的工具(例如 `tools.elevated`)。
  - **Elevated exec 在主机上运行并绕过沙盒化。**
  - 如果沙盒化关闭,`tools.elevated` 不会改变执行(已经在主机上)。参见[Elevated 模式](/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制**何时**使用沙盒化:

- `"off"`:无沙盒化。
- `"non-main"`:仅对**非主**Session 沙盒化(如果您希望普通聊天在主机上,这是默认值)。
- `"all"`:每个 Session 都在沙盒中运行。
  注意:`"non-main"` 基于 `session.mainKey`(默认 `"main"`),而不是 Agent ID。
  群组/Channel Session 使用它们自己的键,因此它们算作非主,将被沙盒化。

## 作用域

`agents.defaults.sandbox.scope` 控制**创建多少容器**:

- `"session"`(默认):每个 Session 一个容器。
- `"agent"`:每个 Agent 一个容器。
- `"shared"`:一个容器由所有沙盒化 Session 共享。

## 后端

`agents.defaults.sandbox.backend` 控制**哪个运行时**提供沙盒:

- `"docker"`(默认):本地 Docker 支持的沙盒运行时。
- `"ssh"`:通用 SSH 支持的远程沙盒运行时。
- `"openshell"`:OpenShell 支持的沙盒运行时。

SSH 特定配置位于 `agents.defaults.sandbox.ssh` 下。
OpenShell 特定配置位于 `plugins.entries.openshell.config` 下。

### SSH 后端

当您想要 OpenClaw 在任意 SSH 可访问的机器上沙盒化 `exec`、文件工具和媒体读取时,使用 `backend: "ssh"`。

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
          // 或者使用 SecretRefs / 内联内容代替本地文件:
          // identityData: { source: "env", provider: "default", id: "SSH_IDENTITY" },
          // certificateData: { source: "env", provider: "default", id: "SSH_CERTIFICATE" },
          // knownHostsData: { source: "env", provider: "default", id: "SSH_KNOWN_HOSTS" },
        },
      },
    },
  },
}
```

工作原理:

- OpenClaw 在 `sandbox.ssh.workspaceRoot` 下创建每个作用域的远程根。
- 在创建或重新创建后首次使用时,OpenClaw 从本地 workspace 一次性为该远程 workspace 播种。
- 之后,`exec`、`read`、`write`、`edit`、`apply_patch`、提示媒体读取和入站媒体暂存通过 SSH 直接针对远程 workspace 运行。
- OpenClaw 不会自动将远程更改同步回本地 workspace。

认证材料:

- `identityFile`、`certificateFile`、`knownHostsFile`:使用现有本地文件并通过 OpenSSH 配置传递它们。
- `identityData`、`certificateData`、`knownHostsData`:使用内联字符串或 SecretRefs。OpenClaw 通过普通 secrets 运行时快照解析它们,将它们写入具有 `0600` 权限的临时文件,并在 SSH Session 结束时删除它们。
- 如果同一项目同时设置了 `*File` 和 `*Data`,则该 SSH Session 使用 `*Data`。

这是一个**远程规范**模型。远程 SSH workspace 在初始播种后成为真实的沙盒状态。

重要后果:

- 在播种步骤之后,在 OpenClaw 外部进行的本地主机编辑在远程不可见,直到您重新创建沙盒。
- `openclaw sandbox recreate` 删除每个作用域的远程根,并在下次使用时从本地重新播种。
- SSH 后端不支持 Browser 沙盒化。
- `sandbox.docker.*` 设置不适用于 SSH 后端。

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

OpenShell 模式:

- `mirror`(默认):本地 workspace 保持规范。OpenClaw 在 exec 之前将本地文件同步到 OpenShell,并在 exec 之后将远程 workspace 同步回来。
- `remote`:沙盒创建后,OpenShell workspace 成为规范。OpenClaw 从本地 workspace 一次性播种远程 workspace,然后文件工具和 exec 直接针对远程沙盒运行,不将更改同步回来。

OpenShell 重用与通用 SSH 后端相同的核心 SSH 传输和远程文件系统桥。插件添加了 OpenShell 特定的生命周期(`sandbox create/get/delete`、`sandbox ssh-config`)和可选的 `mirror` 模式。

远程传输详情:

- OpenClaw 通过 `openshell sandbox ssh-config <name>` 向 OpenShell 请求特定于沙盒的 SSH 配置。
- 核心将该 SSH 配置写入临时文件,打开 SSH Session,并重用 `backend: "ssh"` 使用的相同远程文件系统桥。
- 在 `mirror` 模式中,只有生命周期不同:exec 之前将本地同步到远程,然后 exec 之后同步回来。

当前 OpenShell 限制:

- 沙盒 Browser 尚不支持
- `sandbox.docker.binds` 在 OpenShell 后端不支持
- `sandbox.docker.*` 下的 Docker 特定运行时旋钮仍仅适用于 Docker 后端

## OpenShell workspace 模式

OpenShell 有两种 workspace 模型。这是实践中最重要的部分。

### `mirror`

当您希望**本地 workspace 保持规范**时,使用 `plugins.entries.openshell.config.mode: "mirror"`。

行为:

- 在 `exec` 之前,OpenClaw 将本地 workspace 同步到 OpenShell 沙盒。
- 在 `exec` 之后,OpenClaw 将远程 workspace 同步回本地 workspace。
- 文件工具仍通过沙盒桥操作,但本地 workspace 在轮次之间保持真实来源。

在以下情况下使用:

- 您在 OpenClaw 外部本地编辑文件,希望这些更改自动出现在沙盒中
- 您希望 OpenShell 沙盒尽可能类似于 Docker 后端
- 您希望主机 workspace 在每次 exec 轮次后反映沙盒写入

权衡:

- exec 之前和之后的额外同步成本

### `remote`

当您希望 **OpenShell workspace 成为规范**时,使用 `plugins.entries.openshell.config.mode: "remote"`。

行为:

- 沙盒首次创建时,OpenClaw 从本地 workspace 一次性播种远程 workspace。
- 之后,`exec`、`read`、`write`、`edit` 和 `apply_patch` 直接针对远程 OpenShell workspace 操作。
- OpenClaw **不会**在 exec 之后将远程更改同步回本地 workspace。
- 提示时媒体读取仍然有效,因为文件和媒体工具通过沙盒桥读取,而不是假设本地主机路径。
- 传输是通过 `openshell sandbox ssh-config` 返回的 SSH 进入 OpenShell 沙盒。

重要后果:

- 如果您在播种步骤之后在主机上的 OpenClaw 外部编辑文件,远程沙盒**不会**自动看到这些更改。
- 如果沙盒被重新创建,远程 workspace 从本地 workspace 再次播种。
- 使用 `scope: "agent"` 或 `scope: "shared"`,该远程 workspace 在相同作用域共享。

在以下情况下使用:

- 沙盒应主要位于远程 OpenShell 端
- 您希望降低每轮次同步开销
- 您不希望本地主机编辑静默覆盖远程沙盒状态

如果您将沙盒视为临时执行环境,选择 `mirror`。
如果您将沙盒视为真实 workspace,选择 `remote`。

## OpenShell 生命周期

OpenShell 沙盒仍通过普通沙盒生命周期管理:

- `openclaw sandbox list` 也显示 OpenShell 运行时以及 Docker 运行时
- `openclaw sandbox recreate` 删除当前运行时,让 OpenClaw 在下次使用时重新创建
- prune 逻辑也感知后端

对于 `remote` 模式,recreate 尤为重要:

- recreate 删除该作用域的规范远程 workspace
- 下次使用从本地 workspace 播种新鲜远程 workspace

对于 `mirror` 模式,recreate 主要重置远程执行环境,因为本地 workspace 无论如何都保持规范。

## Workspace 访问

`agents.defaults.sandbox.workspaceAccess` 控制**沙盒可以看到什么**:

- `"none"`(默认):工具在 `~/.openclaw/sandboxes` 下看到沙盒 workspace。
- `"ro"`:将 Agent workspace 以只读方式挂载在 `/agent`(禁用 `write`/`edit`/`apply_patch`)。
- `"rw"`:将 Agent workspace 以读写方式挂载在 `/workspace`。

使用 OpenShell 后端:

- `mirror` 模式仍使用本地 workspace 作为 exec 轮次之间的规范来源
- `remote` 模式在初始播种后使用远程 OpenShell workspace 作为规范来源
- `workspaceAccess: "ro"` 和 `"none"` 仍以相同方式限制写入行为

入站媒体被复制到活跃沙盒 workspace(`media/inbound/*`)。
Skills 注意:`read` 工具以沙盒为根。使用 `workspaceAccess: "none"`,OpenClaw 将符合条件的 Skills 镜像到沙盒 workspace(`.../skills`)以便它们可以被读取。使用 `"rw"`,workspace Skills 可从 `/workspace/skills` 读取。

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 将额外的主机目录挂载到容器中。
格式:`host:container:mode`(例如 `"/home/user/source:/source:rw"`)。

全局和每个 Agent 的绑定**合并**(不替换)。在 `scope: "shared"` 下,每个 Agent 的绑定被忽略。

`agents.defaults.sandbox.browser.binds` 将额外的主机目录挂载到**沙盒 Browser** 容器中。

- 当设置(包括 `[]`)时,它替换 Browser 容器的 `agents.defaults.sandbox.docker.binds`。
- 当省略时,Browser 容器回退到 `agents.defaults.sandbox.docker.binds`(向后兼容)。

示例(只读源 + 额外数据目录):

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

安全注意事项:

- 绑定绕过沙盒文件系统:它们以您设置的模式(`:ro` 或 `:rw`)暴露主机路径。
- OpenClaw 阻止危险的绑定来源(例如:`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev` 以及会暴露它们的父挂载)。
- 敏感挂载(密钥、SSH 密钥、服务凭证)应该是 `:ro`,除非绝对必要。
- 如果只需要对 workspace 的读访问,结合 `workspaceAccess: "ro"`;绑定模式保持独立。
- 参见[沙盒 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)了解绑定如何与工具策略和 elevated exec 交互。

## 镜像 + 设置

默认 Docker 镜像:`openclaw-sandbox:bookworm-slim`

一次性构建:

```bash
scripts/sandbox-setup.sh
```

注意:默认镜像**不**包含 Node。如果 Skill 需要 Node(或其他运行时),要么烘焙自定义镜像,要么通过 `sandbox.docker.setupCommand` 安装(需要网络出口 + 可写根 + root 用户)。

如果您想要一个具有常用工具(例如 `curl`、`jq`、`nodejs`、`python3`、`git`)的更功能性沙盒镜像,构建:

```bash
scripts/sandbox-common-setup.sh
```

然后将 `agents.defaults.sandbox.docker.image` 设置为 `openclaw-sandbox-common:bookworm-slim`。

沙盒 Browser 镜像:

```bash
scripts/sandbox-browser-setup.sh
```

默认情况下,Docker 沙盒容器以**无网络**运行。
使用 `agents.defaults.sandbox.docker.network` 覆盖。

捆绑的沙盒 Browser 镜像还对容器化工作负载应用保守的 Chromium 启动默认值。当前容器默认值包括:

- `--remote-debugging-address=127.0.0.1`
- `--remote-debugging-port=<from OPENCLAW_BROWSER_CDP_PORT>`
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
- 当启用 `noSandbox` 时的 `--no-sandbox` 和 `--disable-setuid-sandbox`。
- 三个图形硬化标志(`--disable-3d-apis`、`--disable-software-rasterizer`、`--disable-gpu`)是可选的,当容器缺乏 GPU 支持时很有用。如果您的工作负载需要 WebGL 或其他 3D/浏览器功能,设置 `OPENCLAW_BROWSER_DISABLE_GRAPHICS_FLAGS=0`。
- `--disable-extensions` 默认启用,可以用 `OPENCLAW_BROWSER_DISABLE_EXTENSIONS=0` 禁用以用于依赖扩展的流程。
- `--renderer-process-limit=2` 由 `OPENCLAW_BROWSER_RENDERER_PROCESS_LIMIT=<N>` 控制,其中 `0` 保持 Chromium 的默认值。

如果您需要不同的运行时配置文件,使用自定义 Browser 镜像并提供您自己的入口点。对于本地(非容器)Chromium 配置文件,使用 `browser.extraArgs` 追加额外的启动标志。

安全默认值:

- `network: "host"` 被阻止。
- `network: "container:<id>"` 默认被阻止(命名空间加入绕过风险)。
- 紧急方案覆盖:`agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin: true`。

Docker 安装和容器化 Gateway 在此:[Docker](/install/docker)

对于 Docker Gateway 部署,`docker-setup.sh` 可以引导沙盒配置。设置 `OPENCLAW_SANDBOX=1`(或 `true`/`yes`/`on`)以启用该路径。您可以使用 `OPENCLAW_DOCKER_SOCKET` 覆盖 socket 位置。完整设置和环境参考:[Docker](/install/docker#enable-agent-sandbox-for-docker-gateway-opt-in)。

## setupCommand(一次性容器设置)

`setupCommand` 在沙盒容器创建后运行**一次**(不是每次运行)。它通过 `sh -lc` 在容器内执行。

路径:

- 全局:`agents.defaults.sandbox.docker.setupCommand`
- 每个 Agent:`agents.list[].sandbox.docker.setupCommand`

常见陷阱:

- 默认 `docker.network` 是 `"none"`(无出口),因此软件包安装会失败。
- `docker.network: "container:<id>"` 需要 `dangerouslyAllowContainerNamespaceJoin: true`,仅作为紧急方案。
- `readOnlyRoot: true` 阻止写入;设置 `readOnlyRoot: false` 或烘焙自定义镜像。
- `user` 必须是 root 才能进行软件包安装(省略 `user` 或设置 `user: "0:0"`)。
- 沙盒 exec **不**继承主机 `process.env`。使用 `agents.defaults.sandbox.docker.env`(或自定义镜像)用于 Skill API 密钥。

## 工具策略 + 应急方案

工具允许/拒绝策略在沙盒规则之前仍然适用。如果工具被全局或每个 Agent 拒绝,沙盒化不会将其带回。

`tools.elevated` 是一个显式的应急方案,在主机上运行 `exec`。
`/exec` 指令仅适用于授权发送者,并在 Session 中持续存在;要硬禁用 `exec`,使用工具策略拒绝(参见[沙盒 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated))。

调试:

- 使用 `openclaw sandbox explain` 检查有效的沙盒模式、工具策略和修复配置键。
- 参见[沙盒 vs 工具策略 vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated)了解"为什么这被阻止?"的思维模型。
  保持锁定。

## 多 Agent 覆盖

每个 Agent 可以覆盖沙盒 + 工具:
`agents.list[].sandbox` 和 `agents.list[].tools`(加上用于沙盒工具策略的 `agents.list[].tools.sandbox.tools`)。
参见[多 Agent 沙盒与工具](/tools/multi-agent-sandbox-tools)了解优先级。

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

- [沙盒配置](/gateway/configuration#agentsdefaults-sandbox)
- [多 Agent 沙盒与工具](/tools/multi-agent-sandbox-tools)
- [安全](/gateway/security)
