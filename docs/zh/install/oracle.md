---
mmh3_hash: "79828b5df21ec983b37a39f718298a68"
summary: "在 Oracle Cloud 永久免费 ARM 层上托管 OpenClaw"
read_when:
  - 在 Oracle Cloud 上设置 OpenClaw
  - 寻找 OpenClaw 的免费 VPS 托管
  - 想在小型服务器上全天候运行 OpenClaw
title: "Oracle Cloud"
---

在 Oracle Cloud 的**永久免费** ARM 层（最多 4 OCPU、24 GB RAM、200 GB 存储）上免费运行持久的 OpenClaw Gateway。

## 前提条件

- Oracle Cloud 帐户（[注册](https://www.oracle.com/cloud/free/)）— 如果遇到问题，请参阅[社区注册指南](https://gist.github.com/rssnyder/51e3cfedd730e7dd5f4a816143b25dbd)
- Tailscale 帐户（在 [tailscale.com](https://tailscale.com) 免费）
- SSH 密钥对
- 大约 30 分钟

## 设置

<Steps>
  <Step title="创建 OCI 实例">
    1. 登录 [Oracle Cloud 控制台](https://cloud.oracle.com/)。
    2. 导航到**计算 > 实例 > 创建实例**。
    3. 配置：
       - **名称：** `openclaw`
       - **镜像：** Ubuntu 24.04 (aarch64)
       - **形状：** `VM.Standard.A1.Flex`（Ampere ARM）
       - **OCPU：** 2（最多 4）
       - **内存：** 12 GB（最多 24 GB）
       - **启动卷：** 50 GB（最多 200 GB 免费）
       - **SSH 密钥：** 添加你的公钥
    4. 点击**创建**并记录公网 IP 地址。

    <Tip>
    如果实例创建因"容量不足"而失败，请尝试不同的可用域或稍后重试。免费层容量有限。
    </Tip>

  </Step>

  <Step title="连接并更新系统">
    ```bash
    ssh ubuntu@YOUR_PUBLIC_IP

    sudo apt update && sudo apt upgrade -y
    sudo apt install -y build-essential
    ```

    `build-essential` 是某些依赖项的 ARM 编译所必需的。

  </Step>

  <Step title="配置用户和主机名">
    ```bash
    sudo hostnamectl set-hostname openclaw
    sudo passwd ubuntu
    sudo loginctl enable-linger ubuntu
    ```

    启用 linger 使用户服务在注销后继续运行。

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

    当提示"你想如何孵化你的 bot？"时，选择**稍后进行**。

  </Step>

  <Step title="配置 gateway">
    使用 token 认证和 Tailscale Serve 实现安全远程访问。

    ```bash
    openclaw config set gateway.bind loopback
    openclaw config set gateway.auth.mode token
    openclaw doctor --generate-gateway-token
    openclaw config set gateway.tailscale.mode serve
    openclaw config set gateway.trustedProxies '["127.0.0.1"]'

    systemctl --user restart openclaw-gateway.service
    ```

    这里的 `gateway.trustedProxies=["127.0.0.1"]` 仅用于本地 Tailscale Serve 代理的转发 IP/本地客户端处理。它**不是** `gateway.auth.mode: "trusted-proxy"`。在此设置中，差异查看器路由保持失败关闭行为：没有转发代理头的原始 `127.0.0.1` 查看器请求可能返回 `Diff not found`。对于附件，使用 `mode=file` / `mode=both`，或者如果需要可共享的查看器链接，则有意启用远程查看器并设置 `plugins.entries.diffs.config.viewerBaseUrl`（或传递代理 `baseUrl`）。

  </Step>

  <Step title="锁定 VCN 安全">
    在网络边缘阻止除 Tailscale 以外的所有流量：

    1. 在 OCI 控制台中转到**网络 > 虚拟云网络**。
    2. 点击你的 VCN，然后点击**安全列表 > 默认安全列表**。
    3. **删除**除 `0.0.0.0/0 UDP 41641`（Tailscale）之外的所有入站规则。
    4. 保留默认出站规则（允许所有出站）。

    这在网络边缘阻止了端口 22 上的 SSH、HTTP、HTTPS 和其他一切。从此刻起，你只能通过 Tailscale 连接。

  </Step>

  <Step title="验证">
    ```bash
    openclaw --version
    systemctl --user status openclaw-gateway.service
    tailscale serve status
    curl http://localhost:18789
    ```

    从你 tailnet 上的任何设备访问控制 UI：

    ```
    https://openclaw.<tailnet-name>.ts.net/
    ```

    将 `<tailnet-name>` 替换为你的 tailnet 名称（在 `tailscale status` 中可见）。

  </Step>
</Steps>

## 备用方案：SSH 隧道

如果 Tailscale Serve 不起作用，从你的本地机器使用 SSH 隧道：

```bash
ssh -L 18789:127.0.0.1:18789 ubuntu@openclaw
```

然后打开 `http://localhost:18789`。

## 故障排除

**实例创建失败（"容量不足"）** — 免费层 ARM 实例很受欢迎。尝试不同的可用域或在非高峰时段重试。

**Tailscale 无法连接** — 运行 `sudo tailscale up --ssh --hostname=openclaw --reset` 重新认证。

**Gateway 无法启动** — 运行 `openclaw doctor --non-interactive` 并用 `journalctl --user -u openclaw-gateway.service -n 50` 检查日志。

**ARM 二进制文件问题** — 大多数 npm 包在 ARM64 上正常工作。对于本机二进制文件，查找 `linux-arm64` 或 `aarch64` 版本。用 `uname -m` 验证架构。

## 下一步

- [Channels](/channels) — 连接 Telegram、WhatsApp、Discord 等
- [Gateway 配置](/gateway/configuration) — 所有配置选项
- [更新](/install/updating) — 保持 OpenClaw 最新

## 相关

- [安装概览](/install)
- [GCP](/install/gcp)
- [VPS 托管](/vps)
