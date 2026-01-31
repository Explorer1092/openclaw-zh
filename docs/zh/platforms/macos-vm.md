---
title: "macOS VM 上的 OpenClaw (沙盒)"
sidebarTitle: "macOS VM"
mmh3_hash: "7a068774e79000b9c59e1889e7e3ab82"
summary: "在沙盒 macOS VM(本地或托管)中运行 OpenClaw,当你需要隔离或 iMessage"
read_when:
  - 你希望 OpenClaw 与主 macOS 环境隔离
  - 你想要在沙箱中集成 iMessage(BlueBubbles)
  - 你想要一个可以克隆的可重置 macOS 环境
  - 你想比较本地 vs 托管 macOS VM 选项
---

# macOS VM 上的 OpenClaw (沙盒)

## 推荐默认(大多数用户)

- **小型 Linux VPS** 用于始终在线的网关和低成本。参见 [VPS 托管](/vps)。
- **专用硬件**(Mac mini 或 Linux 机器)如果你想要完全控制和**住宅 IP**
  用于浏览器自动化。许多站点阻止数据中心 IP,因此本地浏览通常效果更好。
- **混合:** 将网关保持在廉价的 VPS 上,并在需要浏览器/UI 自动化时将 Mac
  连接为**节点**。参见[节点](/nodes)和[网关远程](/gateway/remote)。

当你特别需要仅限 macOS 的功能(iMessage/BlueBubbles)或希望从日常 Mac 严格隔离时,使用 macOS VM。

## macOS VM 选项

### 在 Apple Silicon Mac 上的本地 VM(Lume)

使用 [Lume](https://cua.ai/docs/lume) 在现有的 Apple Silicon Mac 上的沙盒 macOS VM 中运行 OpenClaw。

这为你提供:
- 隔离中的完整 macOS 环境(你的主机保持干净)
- 通过 BlueBubbles 支持 iMessage(在 Linux/Windows 上不可能)
- 通过克隆 VM 立即重置
- 无需额外硬件或云成本

### 托管 Mac 提供商(云)

如果你想要云中的 macOS,托管 Mac 提供商也可以工作:
- [MacStadium](https://www.macstadium.com/)(托管 Mac)
- 其他托管 Mac 供应商也可以工作;遵循他们的 VM + SSH 文档

一旦你可以 SSH 访问 macOS VM,请在下面的步骤 6 继续。

---

## 快速路径(Lume,有经验的用户)

1. 安装 Lume
2. `lume create openclaw --os macos --ipsw latest`
3. 完成设置助手,启用远程登录(SSH)
4. `lume run openclaw --no-display`
5. SSH 进入,安装 OpenClaw,配置通道
6. 完成

---

## 你需要什么(Lume)

- Apple Silicon Mac(M1/M2/M3/M4)
- 主机上的 macOS Sequoia 或更高版本
- 每个 VM 约 60 GB 可用磁盘空间
- 约 20 分钟

---

## 1) 安装 Lume

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/trycua/cua/main/libs/lume/scripts/install.sh)"
```

如果 `~/.local/bin` 不在你的 PATH 中:

```bash
echo 'export PATH="$PATH:$HOME/.local/bin"' >> ~/.zshrc && source ~/.zshrc
```

验证:

```bash
lume --version
```

文档:[Lume 安装](https://cua.ai/docs/lume/guide/getting-started/installation)

---

## 2) 创建 macOS VM

```bash
lume create openclaw --os macos --ipsw latest
```

这会下载 macOS 并创建 VM。VNC 窗口会自动打开。

注意:下载可能需要一段时间,具体取决于你的连接。

---

## 3) 完成设置助手

在 VNC 窗口中:
1. 选择语言和地区
2. 跳过 Apple ID(或如果稍后想要 iMessage 则登录)
3. 创建用户账户(记住用户名和密码)
4. 跳过所有可选功能

设置完成后,启用 SSH:
1. 打开系统设置 → General → Sharing
2. 启用"Remote Login"

---

## 4) 获取 VM 的 IP 地址

```bash
lume get openclaw
```

查找 IP 地址(通常为 `192.168.64.x`)。

---

## 5) SSH 进入 VM

```bash
ssh <username>@<vm-ip>
```

现在你在 VM 内部,可以继续安装 OpenClaw。

---

## 6) 在 VM 中安装 OpenClaw

按照标准 [macOS 安装](/platforms/macos)指南:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/openclaw/openclaw/main/public/install.sh)"
```

然后运行入门:

```bash
openclaw onboard --install-daemon
```

---

## 7) 配置通道

在 VM 内部,登录到你的通道:

```bash
openclaw channels login whatsapp
openclaw channels login telegram
```

如果你想要 iMessage,在 VM 内部设置 BlueBubbles(需要 Apple ID + iMessage 激活)。

---

## 8) 运行无头

退出 VNC,无头运行 VM:

```bash
lume run openclaw --no-display
```

VM 在后台运行。通过 SSH 访问它:

```bash
ssh <username>@<vm-ip>
```

---

## 故障排除

### VM 未启动
- 确保主机上有足够的 RAM/磁盘空间
- 检查 Lume 日志:`lume logs openclaw`

### SSH 拒绝连接
- 在 VM 内部验证远程登录已启用
- 从 `lume get openclaw` 确认 IP 地址

### BlueBubbles 设置
- 参见 [BlueBubbles 文档](https://bluebubbles.app/)用于 macOS VM 设置
- 你需要在 VM 中使用 Apple ID 登录 iMessage

---

## 清理

停止 VM:

```bash
lume stop openclaw
```

删除 VM:

```bash
lume delete openclaw
```

---

## 另请参阅

- [macOS 平台指南](/platforms/macos)
- [VPS 托管](/vps)
- [节点](/nodes)
