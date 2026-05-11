---
mmh3_hash: "398d1f1300127f8ec9bc336924617589"
summary: "在沙箱化的 macOS VM（本地或托管）中运行 OpenClaw，当你需要隔离或 iMessage 时"
read_when:
  - 你希望 OpenClaw 与主 macOS 环境隔离
  - 你想要在沙箱中使用 iMessage 集成
  - 你想要一个可以克隆的可重置 macOS 环境
  - 你想比较本地与托管 macOS VM 选项
title: "macOS VMs"
---

## 推荐默认（大多数用户）

- **小型 Linux VPS** 用于始终在线的 Gateway 和低成本。请参阅 [VPS 托管](/vps)。
- **专用硬件**（Mac mini 或 Linux 机器），如果你需要完全控制和**住宅 IP** 用于浏览器自动化。许多网站会封锁数据中心 IP，因此本地浏览通常效果更好。
- **混合**：将 Gateway 保留在廉价的 VPS 上，当你需要浏览器/UI 自动化时将 Mac 作为 **node** 连接。请参阅 [Nodes](/nodes) 和 [Gateway 远程](/gateway/remote)。

当你特别需要 macOS 独有的功能（如 iMessage）或希望与日常 Mac 严格隔离时，请使用 macOS VM。

## macOS VM 选项

### 在 Apple Silicon Mac 上的本地 VM（Lume）

使用 [Lume](https://cua.ai/docs/lume) 在现有 Apple Silicon Mac 上的沙箱化 macOS VM 中运行 OpenClaw。

这给你带来：

- 完全隔离的 macOS 环境（主机保持干净）
- 通过 `imsg` 支持 iMessage（默认本地路径在 Linux/Windows 上不可用）
- 通过克隆 VM 即时重置
- 无需额外硬件或云成本

### 托管 Mac provider（云）

如果你想要云中的 macOS，托管 Mac provider 也可以：

- [MacStadium](https://www.macstadium.com/)（托管 Mac）
- 其他托管 Mac 供应商也可以；遵循其 VM + SSH 文档

一旦你有了对 macOS VM 的 SSH 访问，请继续下面的第 6 步。

---

## 快速路径（Lume，有经验的用户）

1. 安装 Lume
2. `lume create openclaw --os macos --ipsw latest`
3. 完成设置助手，启用远程登录（SSH）
4. `lume run openclaw --no-display`
5. SSH 进入，安装 OpenClaw，配置 channel
6. 完成

---

## 你需要什么（Lume）

- Apple Silicon Mac（M1/M2/M3/M4）
- 主机上 macOS Sequoia 或更高版本
- 每个 VM 约 60 GB 可用磁盘空间
- 约 20 分钟

---

## 1) 安装 Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

如果 `~/.local/bin` 不在你的 PATH 中：

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

验证：

```bash
lume --version
```

文档：[Lume 安装](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) 创建 macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

这会下载 macOS 并创建 VM。VNC 窗口会自动打开。

<Note>
下载时间取决于你的连接速度，可能需要一段时间。
</Note>

---

## 3) 完成设置助手

在 VNC 窗口中：

1. 选择语言和地区
2. 跳过 Apple ID（或如果之后想要 iMessage 则登录）
3. 创建用户账户（记住用户名和密码）
4. 跳过所有可选功能

设置完成后，启用 SSH：

1. 打开"系统设置"→"通用"→"共享"
2. 启用"远程登录"

---

## 4) 获取 VM IP 地址

```bash
lume get openclaw
```

查找 IP 地址（通常是 `192.168.64.x`）。

---

## 5) SSH 进入 VM

```bash
ssh youruser@192.168.64.X
```

将 `youruser` 替换为你创建的账户，将 IP 替换为你的 VM IP。

---

## 6) 安装 OpenClaw

在 VM 内部：

```bash
npm install -g openclaw@latest
openclaw onboard --install-daemon
```

按照引导提示设置你的模型 provider（Anthropic、OpenAI 等）。

---

## 7) 配置 channel

编辑配置文件：

```bash
nano ~/.openclaw/openclaw.json
```

添加你的 channel：

```json5
{
  channels: {
    whatsapp: {
      dmPolicy: "allowlist",
      allowFrom: ["+15551234567"],
    },
    telegram: {
      botToken: "YOUR_BOT_TOKEN",
    },
  },
}
```

然后登录 WhatsApp（扫描 QR）：

```bash
openclaw channels login
```

---

## 8) 无头运行 VM

停止 VM 并无显示器重启：

```bash
lume stop openclaw
lume run openclaw --no-display
```

VM 在后台运行。OpenClaw 的守护进程保持 gateway 运行。

检查状态：

```bash
ssh youruser@192.168.64.X "openclaw status"
```

---

## 额外功能：iMessage 集成

这是在 macOS 上运行的杀手级功能。使用 [iMessage](/channels/imessage) 和 `imsg` 将 Messages 添加到 OpenClaw。

在 VM 内部：

1. 登录 Messages。
2. 安装 `imsg`。
3. 为运行 OpenClaw/`imsg` 的进程授予完全磁盘访问权限和自动化权限。
4. 使用 `imsg rpc --help` 验证 RPC 支持。

添加到 OpenClaw 配置：

```json5
{
  channels: {
    imessage: {
      enabled: true,
      cliPath: "imsg",
      dbPath: "~/Library/Messages/chat.db",
    },
  },
}
```

重启 gateway。现在你的 agent 可以发送和接收 iMessage 了。

完整设置详情：[iMessage channel](/channels/imessage)

---

## 保存黄金镜像

在进一步自定义之前，快照你的干净状态：

```bash
lume stop openclaw
lume clone openclaw openclaw-golden
```

随时重置：

```bash
lume stop openclaw && lume delete openclaw
lume clone openclaw-golden openclaw
lume run openclaw --no-display
```

---

## 全天候运行

通过以下方式保持 VM 运行：

- 保持 Mac 插电
- 在"系统设置"→"节能"中禁用睡眠
- 如果需要，使用 `caffeinate`

对于真正的始终在线，请考虑专用 Mac mini 或小型 VPS。请参阅 [VPS 托管](/vps)。

---

## 故障排除

| 问题                   | 解决方案                                                                       |
| ---------------------- | ------------------------------------------------------------------------------ |
| 无法 SSH 进入 VM       | 检查 VM 的"系统设置"中是否启用了"远程登录"                                    |
| VM IP 未显示           | 等待 VM 完全启动，再次运行 `lume get openclaw`                                |
| 找不到 Lume 命令       | 将 `~/.local/bin` 添加到你的 PATH                                              |
| WhatsApp QR 无法扫描   | 确保在运行 `openclaw channels login` 时登录到 VM（而不是主机）                |

---

## 相关文档

- [VPS 托管](/vps)
- [Nodes](/nodes)
- [Gateway 远程](/gateway/remote)
- [iMessage channel](/channels/imessage)
- [Lume 快速入门](https://cua.ai/docs/lume/guide/getting-started/quickstart)
- [Lume CLI 参考](https://cua.ai/docs/lume/reference/cli-reference)
- [无人值守 VM 设置](https://cua.ai/docs/lume/guide/fundamentals/unattended-setup)（高级）
- [Docker 沙箱](/install/docker)（替代隔离方法）
