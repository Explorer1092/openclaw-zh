---
mmh3_hash: "76f585bbb050b637b8d93308b7f57ea5"
summary: "OpenClaw 如何安全处理本地文件访问，以及可选的 fs-safe Python 辅助程序为何默认关闭"
read_when:
  - 更改文件访问、归档提取、工作区存储或 Plugin 文件系统辅助程序
title: "安全文件操作"
---

OpenClaw 使用 [`@openclaw/fs-safe`](https://github.com/openclaw/fs-safe) 处理安全敏感的本地文件操作：根目录限定的读写、原子替换、归档提取、临时工作区、JSON 状态和 secret 文件处理。

目标是为接收不受信任路径名的受信任 OpenClaw 代码提供一致的**库保护**。这不是沙盒。主机文件系统权限、操作系统用户、容器和 Agent/工具策略仍然定义实际的影响范围。

## 默认：无 Python 辅助程序

OpenClaw 默认将 fs-safe POSIX Python 辅助程序设为**关闭**。

原因：

- 除非 operator 选择启用，否则 Gateway 不应生成持久的 Python sidecar；
- 许多安装不需要额外的父目录变更强化；
- 禁用 Python 使包/运行时行为在桌面、Docker、CI 和捆绑应用环境中更可预测。

OpenClaw 只改变默认值。如果您显式设置了模式，fs-safe 会遵守：

```bash
# 默认 OpenClaw 行为：仅使用 Node 的 fs-safe 回退。
OPENCLAW_FS_SAFE_PYTHON_MODE=off

# 在可用时选择启用辅助程序，不可用时回退。
OPENCLAW_FS_SAFE_PYTHON_MODE=auto

# 如果辅助程序无法启动则安全关闭。
OPENCLAW_FS_SAFE_PYTHON_MODE=require

# 可选的显式解释器。
OPENCLAW_FS_SAFE_PYTHON=/usr/bin/python3
```

通用的 fs-safe 名称也适用：`FS_SAFE_PYTHON_MODE` 和 `FS_SAFE_PYTHON`。

## 无 Python 时仍受保护的内容

禁用辅助程序后，OpenClaw 仍使用 fs-safe 的 Node 路径来：

- 拒绝相对路径逃逸，如仅允许名称的地方出现 `..`、绝对路径和路径分隔符；
- 通过受信任的根句柄解析操作，而非即席 `path.resolve(...).startsWith(...)` 检查；
- 在需要该策略的 API 上拒绝符号链接和硬链接模式；
- 在 API 返回或消费文件内容时通过身份检查打开文件；
- 对状态/配置文件进行原子兄弟临时写入；
- 对读取和归档提取设置字节限制；
- 在 API 需要时为 secret 和状态文件设置私有模式。

这些保护涵盖了正常的 OpenClaw 威胁模型：在单一受信任 operator 边界内，受信任的 Gateway 代码处理来自不受信任的模型/Plugin/Channel 的路径输入。

## Python 增加的保护

在 POSIX 上，fs-safe 的可选辅助程序保持一个持久的 Python 进程，并使用相对于文件描述符的文件系统操作来处理父目录变更，例如重命名、删除、创建目录、stat/列出以及某些写入路径。

这缩小了同 UID 竞争窗口，即其他进程可能在验证和变更之间交换父目录的情况。对于存在不受信任本地进程可以修改 OpenClaw 正在操作的相同目录的主机，这是纵深防御。

如果您的部署存在该风险且 Python 保证存在，请使用：

```bash
OPENCLAW_FS_SAFE_PYTHON_MODE=require
```

当辅助程序是安全策略的一部分时，使用 `require` 而非 `auto`；如果辅助程序不可用，`auto` 会故意回退到仅 Node 的行为。

## Plugin 和核心指南

- 当路径来自消息、模型输出、配置或 Plugin 输入时，面向 Plugin 的文件访问应通过 `openclaw/plugin-sdk/*` 辅助程序，而非原始的 `fs`。
- 核心代码应使用 `src/infra/*` 下的本地 fs-safe 包装器，以便一致应用 OpenClaw 的进程策略。
- 归档提取应使用带有明确大小、条目数、链接和目标限制的 fs-safe 归档辅助程序。
- Secret 应使用 OpenClaw secret 辅助程序或 fs-safe secret/私有状态辅助程序；不要在 `fs.writeFile` 周围手工编写模式检查。
- 如果您需要隔离敌对的本地用户，不要仅依赖 fs-safe。在独立的操作系统用户/主机下运行独立的 Gateway，或使用沙盒。

相关：[Security](/gateway/security)、[Sandboxing](/gateway/sandboxing)、[Exec 审批](/tools/exec-approvals)、[Secrets](/gateway/secrets)。
