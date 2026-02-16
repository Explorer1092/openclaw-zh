---
mmh3_hash: "808dcf3dee3ab28f706424b4930d6b80"
summary: "OpenClaw 沙盒的工作原理:模式、作用域、工作空间访问和镜像"
title: 沙盒
read_when: "您想要沙盒的专门解释或需要调整 agents.defaults.sandbox。"
status: active
---

# 沙盒

OpenClaw 可以**在 Docker 容器内运行工具**以减少爆炸半径。
这是**可选的**,由配置控制(`agents.defaults.sandbox` 或 `agents.list[].sandbox`)。如果沙盒关闭,工具在主机上运行。
Gateway 保持在主机上;启用时工具执行在隔离沙盒中运行。

这不是完美的安全边界,但当模型做一些愚蠢的事情时,它实质上限制了文件系统和进程访问。

## 什么被沙盒化

- 工具执行(`exec`、`read`、`write`、`edit`、`apply_patch`、`process` 等)。
- 可选的沙盒 Browser(`agents.defaults.sandbox.browser`)。
  - 默认情况下,沙盒 Browser 自动启动(确保 CDP 可达)当 Browser 工具需要它时。
    通过 `agents.defaults.sandbox.browser.autoStart` 和 `agents.defaults.sandbox.browser.autoStartTimeoutMs` 配置。
  - `agents.defaults.sandbox.browser.allowHostControl` 允许沙盒 Session 显式定位主机 Browser。
  - 可选的允许列表门控 `target: "custom"`: `allowedControlUrls`、`allowedControlHosts`、`allowedControlPorts`。

不沙盒化:

- Gateway 进程本身。
- 任何明确允许在主机上运行的工具(例如 `tools.elevated`)。
  - **Elevated Exec 在主机上运行并绕过沙盒。**
  - 如果沙盒关闭,`tools.elevated` 不会改变执行(已在主机上)。参见 [Elevated 模式](/tools/elevated)。

## 模式

`agents.defaults.sandbox.mode` 控制**何时**使用沙盒:

- `"off"`:无沙盒。
- `"non-main"`:仅沙盒**非主** Session(如果您希望正常聊天在主机上,则为默认值)。
- `"all"`:每个 Session 都在沙盒中运行。
  注意:`"non-main"` 基于 `session.mainKey`(默认 `"main"`),而不是 Agent ID。
  群组/Channel Session 使用自己的键,因此它们算作非主并将被沙盒化。

## 作用域

`agents.defaults.sandbox.scope` 控制**创建多少容器**:

- `"session"`(默认):每个 Session 一个容器。
- `"agent"`:每个 Agent 一个容器。
- `"shared"`:所有沙盒 Session 共享一个容器。

## 工作空间访问

`agents.defaults.sandbox.workspaceAccess` 控制**沙盒可以看到什么**:

- `"none"`(默认):工具看到 `~/.openclaw/sandboxes` 下的沙盒工作空间。
- `"ro"`:在 `/agent` 以只读方式挂载 Agent 工作空间(禁用 `write`/`edit`/`apply_patch`)。
- `"rw"`:在 `/workspace` 以读/写方式挂载 Agent 工作空间。

入站媒体被复制到活动沙盒工作空间(`media/inbound/*`)。
Skill 注意:`read` 工具是沙盒根的。使用 `workspaceAccess: "none"`,
OpenClaw 将符合条件的 Skill 镜像到沙盒工作空间(`.../skills`)以便可以读取它们。使用 `"rw"`,工作空间 Skill 可从 `/workspace/skills` 读取。

## 自定义绑定挂载

`agents.defaults.sandbox.docker.binds` 将额外的主机目录挂载到容器中。
格式:`host:container:mode`(例如,`"/home/user/source:/source:rw"`)。

全局和每个 Agent 的绑定**合并**(不替换)。在 `scope: "shared"` 下,每个 Agent 的绑定被忽略。

`agents.defaults.sandbox.browser.binds` 仅将额外的主机目录挂载到**沙盒 Browser** 容器。

- 设置时(包括 `[]`),它为 Browser 容器替换 `agents.defaults.sandbox.docker.binds`。
- 省略时,Browser 容器回退到 `agents.defaults.sandbox.docker.binds`(向后兼容)。

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

- 绑定绕过沙盒文件系统:它们以您设置的任何模式(`:ro` 或 `:rw`)公开主机路径。
- OpenClaw 阻止危险的绑定源(例如:`docker.sock`、`/etc`、`/proc`、`/sys`、`/dev`,以及会公开它们的父挂载)。
- 敏感挂载(秘密、SSH 密钥、服务凭证)应为 `:ro`,除非绝对必要。
- 如果您只需要对工作空间的读访问,则与 `workspaceAccess: "ro"` 结合使用;绑定模式保持独立。
- 参见 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) 了解绑定如何与工具策略和 Elevated Exec 交互。

## 镜像 + 设置

默认镜像:`openclaw-sandbox:bookworm-slim`

构建一次:

```bash
scripts/sandbox-setup.sh
```

注意:默认镜像**不**包含 Node。如果 Skill 需要 Node(或其他运行时),要么烘焙自定义镜像,要么通过 `sandbox.docker.setupCommand` 安装(需要网络出口 + 可写根 + root 用户)。

沙盒 Browser 镜像:

```bash
scripts/sandbox-browser-setup.sh
```

默认情况下,沙盒容器以**无网络**运行。
使用 `agents.defaults.sandbox.docker.network` 覆盖。

Docker 安装和容器化 Gateway 在此:
[Docker](/install/docker)

## setupCommand(一次性容器设置)

`setupCommand` 在沙盒容器创建后**运行一次**(不是每次运行)。
它通过 `sh -lc` 在容器内执行。

路径:

- 全局:`agents.defaults.sandbox.docker.setupCommand`
- 每个 Agent:`agents.list[].sandbox.docker.setupCommand`

常见陷阱:

- 默认 `docker.network` 是 `"none"`(无出口),因此包安装将失败。
- `readOnlyRoot: true` 阻止写入;设置 `readOnlyRoot: false` 或烘焙自定义镜像。
- `user` 必须是 root 才能进行包安装(省略 `user` 或设置 `user: "0:0"`)。
- Sandbox Exec **不**继承主机 `process.env`。使用 `agents.defaults.sandbox.docker.env`(或自定义镜像)为 Skill API 密钥。

## 工具策略 + 逃生舱

工具允许/拒绝策略仍在沙盒规则之前应用。如果全局或每个 Agent 拒绝工具,沙盒不会将其带回。

`tools.elevated` 是在主机上运行 `exec` 的显式逃生舱。
`/exec` 指令仅适用于授权发送者并在每个 Session 中持久化;要硬禁用 `exec`,使用工具策略拒绝(参见 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated))。

调试:

- 使用 `openclaw sandbox explain` 检查有效的沙盒模式、工具策略和修复配置键。
- 参见 [Sandbox vs Tool Policy vs Elevated](/gateway/sandbox-vs-tool-policy-vs-elevated) 了解"为什么这被阻止?"心理模型。
  保持锁定。

## 多 Agent 覆盖

每个 Agent 可以覆盖沙盒 + 工具:
`agents.list[].sandbox` 和 `agents.list[].tools`(加上 `agents.list[].tools.sandbox.tools` 用于沙盒工具策略)。
参见 [多 Agent Sandbox 和工具](/tools/multi-agent-sandbox-tools) 了解优先级。

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

- [Sandbox 配置](/gateway/configuration#agentsdefaults-sandbox)
- [多 Agent Sandbox 和工具](/tools/multi-agent-sandbox-tools)
- [安全](/gateway/security)
