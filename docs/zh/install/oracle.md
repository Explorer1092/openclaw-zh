---
mmh3_hash: "4b194adc07805c5e89fb70bb8daa87df"
summary: "在 Oracle Cloud 永久免费 ARM 层上托管 OpenClaw"
read_when:
  - 在 Oracle Cloud 上设置 OpenClaw
  - 寻找免费的 VPS 主机来运行 OpenClaw
  - 想要在小型服务器上 24/7 运行 OpenClaw
title: "Oracle Cloud"
---

在 Oracle Cloud 的**永久免费** ARM 层（最多 4 OCPU、24 GB RAM、200 GB 存储）上免费运行持久的 OpenClaw Gateway。

## 前提条件

- Oracle Cloud 账户（[注册](https://www.oracle.com/cloud/free/)）-- 如果遇到问题，请参阅[社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 账户（在 [tailscale.com](https://tailscale.com) 免费注册）
- SSH 密钥对
- 大约 30 分钟

## 设置

<Steps>
  <Step title="创建 OCI 实例">
    1. 登录 [Oracle Cloud Console](https://cloud.oracle.com/)。
    2. 导航到**计算 > 实例 > 创建实例**。
    3. 配置：
       - **名称：** `openclaw`
       - **镜像：** Ubuntu 24.04 (aarch64)
       - **规格：** `VM.Standard.A1.Flex`（Ampere ARM）
       - **OCPU：** 2（最多 4）
       - **内存：** 12 GB（最多 24 GB）
       - **启动卷：** 50 GB（最多 200 GB 免费）
       - **SSH 密钥：** 添加你的公钥
    4. 点击**创建**并记录公网 IP 地址。

    <Tip>
    如果实例创建失败并显示"容量不足"，请尝试其他可用域或稍后重试。免费层容量有限。
    </Tip>

  </Step>

  <Step title="连接并更新系统">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` 是编译某些依赖项的 ARM 代码所必需的。

  </Step>

  <Step title="配置用户和主机名">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    启用 linger 可以在注销后保持用户服务运行。

  </Step>

  <Step title="安装 Tailscale">
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    sudo tailscale up --ssh --hostname=openclaw
    ```

    从现在起，通过 Tailscale 连接：`ssh ubuntu@openclaw`。

  </Step>

  <Step title="安装 OpenClaw">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    source ~/.bashrc
    ```

    当提示"你想如何孵化你的 bot？"时，选择**稍后再做**。

  </Step>

  <Step title="配置 gateway">
    使用令牌认证和 Tailscale Serve 实现安全远程访问。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    `gateway.trustedProxies=["127.0.0.1"]` 仅用于本地 Tailscale Serve 代理的转发 IP/本地客户端处理。这**不是** `gateway.auth.mode: "trusted-proxy"`。在此设置中，差异查看器路由保持失败关闭行为：没有转发代理标头的原始 `127.0.0.1` 查看器请求可能会返回 `Diff not found`。如需附件，请使用 `mode=file` / `mode=both`，或者如果需要可共享的查看器链接，请有意启用远程查看器并设置 `plugins.entries.diffs.config.viewerBaseUrl`（或传递代理 `baseUrl`）。

  </Step>

  <Step title="锁定 VCN 安全">
    在网络边缘阻止除 Tailscale 之外的所有流量：

    1. 在 OCI 控制台中转到**网络 > 虚拟云网络**。
    2. 点击你的 VCN，然后**安全列表 > 默认安全列表**。
    3. **删除**除 `0.0.0.0/0 UDP 41641`（Tailscale）之外的所有入站规则。
    4. 保留默认出站规则（允许所有出站）。

    这会在网络边缘阻止 22 端口的 SSH、HTTP、HTTPS 以及其他所有内容。从此以后，你只能通过 Tailscale 连接。

  </Step>

  <Step title="验证">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    从 tailnet 上的任意设备访问控制 UI：

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    将 `<tailnet-name>` 替换为你的 tailnet 名称（在 `tailscale status` 中可见）。

  </Step>
</Steps>

## 验证安全态势

锁定 VCN 后（仅开放 UDP 41641）且 Gateway 绑定到回环地址，公共流量在网络边缘被阻止，管理员访问仅限 tailnet。这消除了传统 VPS 加固步骤的需要：

| 传统步骤           | 是否需要 | 原因                                             |
| ------------------ | -------- | ------------------------------------------------ |
| UFW 防火墙         | 否       | VCN 在流量到达实例之前就将其阻止。               |
| fail2ban           | 否       | 22 端口在 VCN 处被阻止；没有暴力破解攻击面。    |
| sshd 加固          | 否       | Tailscale SSH 不使用 sshd。                      |
| 禁用 root 登录     | 否       | Tailscale 通过 tailnet 身份认证，而不是系统用户。|
| 仅 SSH 密钥认证    | 否       | 同上——tailnet 身份替代了系统 SSH 密钥。          |
| IPv6 加固          | 通常不需 | 取决于 VCN/子网设置；验证实际分配/暴露的内容。  |

仍建议：

- `chmod 700 ~/.openclaw` 以限制凭据文件权限。
- `openclaw security audit` 用于 OpenClaw 特定的安全态势检查。
- 定期 `sudo apt update && sudo apt upgrade` 以获取操作系统补丁。
- 定期在 [Tailscale 管理控制台](https://login.tailscale.com/admin)中审查设备。

快速验证命令：

```bash
# 确认没有公共端口在监听
sudo ss -tlnp | grep -v '127.0.0.1\|::1'

# 验证 Tailscale SSH 已激活
tailscale status | grep -q 'offers: ssh' && echo "Tailscale SSH active"

# 可选：一旦确认 Tailscale SSH 正常工作，可完全禁用 sshd
sudo systemctl disable --now ssh
```

## ARM 注意事项

永久免费层是 ARM（`aarch64`）。大多数 OpenClaw 功能运行正常；少数本地二进制文件需要 ARM 构建：

- Node.js、Telegram、WhatsApp（Baileys）：纯 JavaScript，没有问题。
- 大多数带有本地代码的 npm 包：提供预构建的 `linux-arm64` 构件。
- 可选的 CLI 辅助工具（例如 skill 附带的 Go/Rust 二进制文件）：安装前检查是否有 `aarch64` / `linux-arm64` 版本。

使用 `uname -m`（应打印 `aarch64`）验证架构。对于没有 ARM 构建的二进制文件，请从源码安装或跳过。

## 持久化和备份

OpenClaw 状态存储在：

- `~/.openclaw/` — `openclaw.json`、每个 agent 的 `auth-profiles.json`、channel/provider 状态和 session 数据。
- `~/.openclaw/workspace/` — agent 工作区（SOUL.md、内存、构件）。

这些在重启后仍然存在。要创建便携快照：

```bash
openclaw backup create
```

## 备用方案：SSH 隧道

如果 Tailscale Serve 不起作用，请从本地机器使用 SSH 隧道：

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

## 故障排除

**实例创建失败（"容量不足"）** -- 免费层 ARM 实例很受欢迎。尝试不同的可用域或在非高峰时段重试。

**Tailscale 无法连接** -- 运行 `sudo tailscale up --ssh --hostname=openclaw --reset` 重新认证。

**Gateway 无法启动** -- 运行 `openclaw doctor --non-interactive` 并用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**ARM 二进制文件问题** -- 大多数 npm 包在 ARM64 上运行正常。对于本地二进制文件，请查找 `linux-arm64` 或 `aarch64` 版本。使用 `uname -m` 验证架构。

## 下一步

- [Channels](/channels) -- 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/gateway/configuration) -- 所有配置选项
- [更新](/install/updating) -- 保持 OpenClaw 最新

## 相关

- [安装概览](/install)
- [GCP](/install/gcp)
- [VPS 主机](/vps)
