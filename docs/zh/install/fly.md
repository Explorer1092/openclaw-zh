---
mmh3_hash: "e4e8ac5e2f7a3b691702263187adc7e4"
title: Fly.io
summary: "在 Fly.io 上逐步部署 OpenClaw，支持持久存储和 HTTPS"
read_when:
  - 在 Fly.io 上部署 OpenClaw
  - 设置 Fly 卷、密钥和首次运行配置
---

# Fly.io 部署

**目标：** OpenClaw Gateway 在 [Fly.io](https://fly.io) 机器上运行，具有持久存储、自动 HTTPS 和 Discord/channel 访问。

## 你需要什么

- 已安装 [flyctl CLI](https://fly.io/docs/hands-on/install-flyctl/)
- Fly.io 账户（免费层可用）
- 模型认证：所选模型 provider 的 API 密钥
- Channel 凭据：Discord bot token、Telegram token 等

## 初学者快速路径

1. 克隆仓库 → 自定义 `fly.toml`
2. 创建应用 + 卷 → 设置密钥
3. 使用 `fly deploy` 部署
4. SSH 进入以创建配置或使用控制 UI

<Steps>
  <Step title="创建 Fly 应用">
    ```bash
    # 克隆仓库
    git clone https://github.com/openclaw/openclaw.git
    cd openclaw

    # 创建新的 Fly 应用（选择你自己的名称）
    fly apps create my-openclaw

    # 创建持久卷（1GB 通常足够）
    fly volumes create openclaw_data --size 1 --region iad
    ```

    **提示：** 选择离你近的地区。常用选项：`lhr`（伦敦）、`iad`（弗吉尼亚）、`sjc`（圣何塞）。

  </Step>

  <Step title="配置 fly.toml">
    编辑 `fly.toml` 以匹配你的应用名称和需求。

    **安全说明：** 默认配置暴露公共 URL。要进行无公网 IP 的强化部署，请参阅 [私有部署](#private-deployment-hardened) 或使用 `fly.private.toml`。

    ```toml
    app = "my-openclaw"  # 你的应用名称
    primary_region = "iad"

    [build]
      dockerfile = "Dockerfile"

    [env]
      NODE_ENV = "production"
      OPENCLAW_PREFER_PNPM = "1"
      OPENCLAW_STATE_DIR = "/data"
      NODE_OPTIONS = "--max-old-space-size=1536"

    [processes]
      app = "node dist/index.js gateway --allow-unconfigured --port 3000 --bind lan"

    [http_service]
      internal_port = 3000
      force_https = true
      auto_stop_machines = false
      auto_start_machines = true
      min_machines_running = 1
      processes = ["app"]

    [[vm]]
      size = "shared-cpu-2x"
      memory = "2048mb"

    [mounts]
      source = "openclaw_data"
      destination = "/data"
    ```

    **关键设置：**

    | 设置                           | 原因                                                                        |
    | ------------------------------ | --------------------------------------------------------------------------- |
    | `--bind lan`                   | 绑定到 `0.0.0.0` 以便 Fly 的代理可以访问 gateway                            |
    | `--allow-unconfigured`         | 无配置文件启动（之后创建）                                                   |
    | `internal_port = 3000`         | 必须与 `--port 3000`（或 `OPENCLAW_GATEWAY_PORT`）匹配以进行 Fly 健康检查   |
    | `memory = "2048mb"`            | 512MB 太小；推荐 2GB                                                         |
    | `OPENCLAW_STATE_DIR = "/data"` | 在卷上持久化状态                                                             |

  </Step>

  <Step title="设置密钥">
    ```bash
    # 必需：Gateway token（用于非 loopback 绑定）
    fly secrets set OPENCLAW_GATEWAY_TOKEN=$(openssl rand -hex 32)

    # 模型 provider API 密钥
    fly secrets set ANTHROPIC_API_KEY=sk-ant-...

    # 可选：其他 provider
    fly secrets set OPENAI_API_KEY=sk-...
    fly secrets set GOOGLE_API_KEY=...

    # Channel token
    fly secrets set DISCORD_BOT_TOKEN=MTQ...
    ```

    **说明：**

    - 非 loopback 绑定（`--bind lan`）需要有效的 gateway 认证路径。此 Fly.io 示例使用 `OPENCLAW_GATEWAY_TOKEN`，但 `gateway.auth.password` 或正确配置的非 loopback `trusted-proxy` 部署也满足此要求。
    - 将这些 token 视为密码。
    - **优先使用环境变量而不是配置文件**保存所有 API 密钥和 token。这可以防止密钥出现在 `openclaw.json` 中被意外暴露或记录。

  </Step>

  <Step title="部署">
    ```bash
    fly deploy
    ```

    首次部署构建 Docker 镜像（约 2-3 分钟）。后续部署更快。

    部署后，验证：

    ```bash
    fly status
    fly logs
    ```

    你应该看到：

    ```
    [gateway] listening on ws://0.0.0.0:3000 (PID xxx)
    [discord] logged in to discord as xxx
    ```

  </Step>

  <Step title="创建配置文件">
    SSH 进入机器以创建正确的配置：

    ```bash
    fly ssh console
    ```

    创建配置目录和文件：

    ```bash
    mkdir -p /data
    cat > /data/openclaw.json << 'EOF'
    {
      "agents": {
        "defaults": {
          "model": {
            "primary": "anthropic/claude-opus-4-6",
            "fallbacks": ["anthropic/claude-sonnet-4-6", "openai/gpt-5.4"]
          },
          "maxConcurrent": 4
        },
        "list": [
          {
            "id": "main",
            "default": true
          }
        ]
      },
      "auth": {
        "profiles": {
          "anthropic:default": { "mode": "token", "provider": "anthropic" },
          "openai:default": { "mode": "token", "provider": "openai" }
        }
      },
      "bindings": [
        {
          "agentId": "main",
          "match": { "channel": "discord" }
        }
      ],
      "channels": {
        "discord": {
          "enabled": true,
          "groupPolicy": "allowlist",
          "guilds": {
            "YOUR_GUILD_ID": {
              "channels": { "general": { "allow": true } },
              "requireMention": false
            }
          }
        }
      },
      "gateway": {
        "mode": "local",
        "bind": "auto",
        "controlUi": {
          "allowedOrigins": [
            "https://my-openclaw.fly.dev",
            "http://localhost:3000",
            "http://127.0.0.1:3000"
          ]
        }
      },
      "meta": {}
    }
    EOF
    ```

    **说明：** `OPENCLAW_STATE_DIR=/data` 时，配置路径为 `/data/openclaw.json`。

    **说明：** 将 `https://my-openclaw.fly.dev` 替换为你真实的 Fly 应用
    来源。Gateway 启动时会从运行时
    `--bind` 和 `--port` 值中自动设置本地控制 UI 来源，以便首次启动可以在配置存在之前进行，
    但通过 Fly 的浏览器访问仍然需要在
    `gateway.controlUi.allowedOrigins` 中列出确切的 HTTPS 来源。

    **说明：** Discord token 可以来自：

    - 环境变量：`DISCORD_BOT_TOKEN`（推荐用于密钥）
    - 配置文件：`channels.discord.token`

    如果使用环境变量，无需在配置中添加 token。Gateway 会自动读取 `DISCORD_BOT_TOKEN`。

    重启以应用：

    ```bash
    exit
    fly machine restart <machine-id>
    ```

  </Step>

  <Step title="访问 Gateway">
    ### 控制 UI

    在浏览器中打开：

    ```bash
    fly open
    ```

    或访问 `https://my-openclaw.fly.dev/`

    使用配置的共享密钥进行认证。本指南使用来自 `OPENCLAW_GATEWAY_TOKEN` 的 gateway token；如果你切换到密码认证，请改用该密码。

    ### 日志

    ```bash
    fly logs              # 实时日志
    fly logs --no-tail    # 最近日志
    ```

    ### SSH 控制台

    ```bash
    fly ssh console
    ```

  </Step>
</Steps>

## 故障排除

### "应用未在预期地址监听"

Gateway 绑定到 `127.0.0.1` 而不是 `0.0.0.0`。

**解决方法：** 在 `fly.toml` 的进程命令中添加 `--bind lan`。

### 健康检查失败 / 连接被拒绝

Fly 无法在配置的端口上访问 gateway。

**解决方法：** 确保 `internal_port` 与 gateway 端口匹配（设置 `--port 3000` 或 `OPENCLAW_GATEWAY_PORT=3000`）。

### OOM / 内存问题

容器持续重启或被终止。迹象：`SIGABRT`、`v8::internal::Runtime_AllocateInYoungGeneration` 或静默重启。

**解决方法：** 在 `fly.toml` 中增加内存：

```toml
[[vm]]
  memory = "2048mb"
```

或更新现有机器：

```bash
fly machine update <machine-id> --vm-memory 2048 -y
```

**说明：** 512MB 太小。1GB 可能工作但在负载下或使用详细日志时可能 OOM。**推荐 2GB。**

### Gateway 锁定问题

Gateway 拒绝以"已在运行"错误启动。

这发生在容器重启但 PID 锁定文件保留在卷上时。

**解决方法：** 删除锁定文件：

```bash
fly ssh console --command "rm -f /data/gateway.*.lock"
fly machine restart <machine-id>
```

锁定文件位于 `/data/gateway.*.lock`（不在子目录中）。

### 配置未被读取

`--allow-unconfigured` 仅绕过启动保护。它不创建或修复 `/data/openclaw.json`，因此确保你的真实配置存在，并在需要正常本地 gateway 启动时包含 `gateway.mode="local"`。

验证配置是否存在：

```bash
fly ssh console --command "cat /data/openclaw.json"
```

### 通过 SSH 写入配置

`fly ssh console -C` 命令不支持 shell 重定向。要写入配置文件：

```bash
# 使用 echo + tee（从本地通过管道到远程）
echo '{"your":"config"}' | fly ssh console -C "tee /data/openclaw.json"

# 或使用 sftp
fly sftp shell
> put /local/path/config.json /data/openclaw.json
```

**说明：** 如果文件已存在，`fly sftp` 可能会失败。先删除：

```bash
fly ssh console --command "rm /data/openclaw.json"
```

### 状态未持久化

如果重启后丢失认证配置文件、channel/provider 状态或 session，
状态目录正在向容器文件系统写入。

**解决方法：** 确保在 `fly.toml` 中设置 `OPENCLAW_STATE_DIR=/data` 并重新部署。

## 更新

```bash
# 拉取最新更改
git pull

# 重新部署
fly deploy

# 检查健康状态
fly status
fly logs
```

### 更新机器命令

如果你需要更改启动命令而无需完整重新部署：

```bash
# 获取机器 ID
fly machines list

# 更新命令
fly machine update <machine-id> --command "node dist/index.js gateway --port 3000 --bind lan" -y

# 或增加内存
fly machine update <machine-id> --vm-memory 2048 --command "node dist/index.js gateway --port 3000 --bind lan" -y
```

**说明：** `fly deploy` 后，机器命令可能会重置为 `fly.toml` 中的内容。如果你进行了手动更改，请在部署后重新应用。

## 私有部署（强化）

默认情况下，Fly 分配公网 IP，使你的 gateway 可通过 `https://your-app.fly.dev` 访问。这很方便，但意味着你的部署可被互联网扫描器发现（Shodan、Censys 等）。

要进行**无公开暴露**的强化部署，请使用私有模板。

### 何时使用私有部署

- 你只进行**出站**呼叫/消息（无入站 webhook）
- 你使用 **ngrok 或 Tailscale** 隧道进行任何 webhook 回调
- 你通过 **SSH、代理或 WireGuard** 而不是浏览器访问 gateway
- 你希望部署**对互联网扫描器隐藏**

### 设置

使用 `fly.private.toml` 代替标准配置：

```bash
# 使用私有配置部署
fly deploy -c fly.private.toml
```

或转换现有部署：

```bash
# 列出当前 IP
fly ips list -a my-openclaw

# 释放公网 IP
fly ips release <public-ipv4> -a my-openclaw
fly ips release <public-ipv6> -a my-openclaw

# 切换到私有配置以使未来部署不重新分配公网 IP
# （删除 [http_service] 或使用私有模板部署）
fly deploy -c fly.private.toml

# 分配仅私有的 IPv6
fly ips allocate-v6 --private -a my-openclaw
```

此后，`fly ips list` 应该只显示 `private` 类型的 IP：

```
VERSION  IP                   TYPE             REGION
v6       fdaa:x:x:x:x::x      private          global
```

### 访问私有部署

由于没有公共 URL，使用以下方法之一：

**选项 1：本地代理（最简单）**

```bash
# 将本地端口 3000 转发到应用
fly proxy 3000:3000 -a my-openclaw

# 然后在浏览器中打开 http://localhost:3000
```

**选项 2：WireGuard VPN**

```bash
# 创建 WireGuard 配置（一次性）
fly wireguard create

# 导入到 WireGuard 客户端，然后通过内部 IPv6 访问
# 示例：http://[fdaa:x:x:x:x::x]:3000
```

**选项 3：仅 SSH**

```bash
fly ssh console -a my-openclaw
```

### 私有部署的 Webhook

如果你需要 webhook 回调（Twilio、Telnyx 等）而不公开暴露：

1. **ngrok 隧道** — 在容器内或作为 sidecar 运行 ngrok
2. **Tailscale Funnel** — 通过 Tailscale 暴露特定路径
3. **仅出站** — 某些 provider（Twilio）对于没有 webhook 的出站呼叫工作正常

使用 ngrok 的语音呼叫配置示例：

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        enabled: true,
        config: {
          provider: "twilio",
          tunnel: { provider: "ngrok" },
          webhookSecurity: {
            allowedHosts: ["example.ngrok.app"],
          },
        },
      },
    },
  },
}
```

ngrok 隧道在容器内运行，提供公共 webhook URL，而不暴露 Fly 应用本身。将 `webhookSecurity.allowedHosts` 设置为公共隧道主机名，以便转发的主机头被接受。

### 安全优势

| 方面            | 公开           | 私有        |
| --------------- | -------------- | ----------- |
| 互联网扫描器    | 可发现         | 隐藏        |
| 直接攻击        | 可能           | 已阻止      |
| 控制 UI 访问    | 浏览器         | 代理/VPN    |
| Webhook 传递    | 直接           | 通过隧道    |

## 说明

- Fly.io 使用 **x86 架构**（非 ARM）
- Dockerfile 与两种架构兼容
- 对于 WhatsApp/Telegram 引导，使用 `fly ssh console`
- 持久数据存储在 `/data` 卷上
- Signal 需要 Java + signal-cli；使用自定义镜像并保持内存在 2GB+。

## 费用

使用推荐配置（`shared-cpu-2x`，2GB RAM）：

- 每月约 $10-15，具体取决于使用情况
- 免费层包含一些配额

详情请参阅 [Fly.io 定价](https://fly.io/docs/about/pricing/)。

## 下一步

- 设置消息 channel：[Channels](/channels)
- 配置 Gateway：[Gateway 配置](/gateway/configuration)
- 保持 OpenClaw 最新：[更新](/install/updating)

## 相关

- [安装概览](/install)
- [Hetzner](/install/hetzner)
- [Docker](/install/docker)
- [VPS 托管](/vps)
