---
mmh3_hash: "42c4e46f670957361373015a2942b599"
summary: "Twitch 聊天机器人配置和设置"
read_when:
  - 为 OpenClaw 配置 Twitch 聊天集成
title: "Twitch"
sidebarTitle: "Twitch"
---

通过 IRC 连接支持 Twitch 聊天。OpenClaw 以 Twitch 用户（机器人账户）身份连接，在 Channel 中接收和发送消息。

## 内置插件

<Note>
Twitch 在当前 OpenClaw 版本中作为内置插件提供，因此正常的打包构建无需单独安装。
</Note>

如果您使用的是较旧的构建版本或不包含 Twitch 的自定义安装，请手动安装：

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="本地检出">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

使用裸包名称可跟随当前官方发布标签。仅在需要可复现安装时才固定确切版本。

详情：[插件](/tools/plugin)

## 快速设置（新手）

<Steps>
  <Step title="确保插件可用">
    当前打包的 OpenClaw 版本已内置。较旧/自定义安装可使用上述命令手动添加。
  </Step>
  <Step title="创建 Twitch 机器人账户">
    为机器人创建一个专用的 Twitch 账户（或使用现有账户）。
  </Step>
  <Step title="生成凭据">
    使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

    - 选择 **Bot Token**
    - 验证已选择 `chat:read` 和 `chat:write` 范围
    - 复制 **Client ID** 和 **Access Token**

  </Step>
  <Step title="查找您的 Twitch 用户 ID">
    使用 [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) 将用户名转换为 Twitch 用户 ID。
  </Step>
  <Step title="配置 token">
    - 环境变量：`OPENCLAW_TWITCH_ACCESS_TOKEN=...`（仅默认账户）
    - 或配置：`channels.twitch.accessToken`

    如果两者都设置，配置优先（环境变量回退仅用于默认账户）。

  </Step>
  <Step title="启动 Gateway">
    使用已配置的 Channel 启动 Gateway。
  </Step>
</Steps>

<Warning>
添加访问控制（`allowFrom` 或 `allowedRoles`）以防止未授权用户触发机器人。`requireMention` 默认为 `true`。
</Warning>

最小配置：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // 机器人的 Twitch 账户
      accessToken: "oauth:abc123...", // OAuth Access Token（或使用 OPENCLAW_TWITCH_ACCESS_TOKEN 环境变量）
      clientId: "xyz789...", // 来自 Token Generator 的 Client ID
      channel: "vevisk", // 要加入的 Twitch Channel 聊天室（必需）
      allowFrom: ["123456789"], // （推荐）仅您的 Twitch 用户 ID - 从 https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/ 获取
    },
  },
}
```

## 它是什么

- 由 Gateway 拥有的 Twitch Channel。
- 确定性路由：回复始终返回到 Twitch。
- 每个账户映射到一个隔离的 Session 键 `agent:<agentId>:twitch:<accountName>`。
- `username` 是机器人的账户（谁进行身份验证），`channel` 是要加入的聊天室。

## 设置（详细）

### 生成凭据

使用 [Twitch Token Generator](https://twitchtokengenerator.com/)：

- 选择 **Bot Token**
- 验证已选择 `chat:read` 和 `chat:write` 范围
- 复制 **Client ID** 和 **Access Token**

<Note>
无需手动注册应用。Token 在几小时后过期。
</Note>

### 配置机器人

<Tabs>
  <Tab title="环境变量（仅默认账户）">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="配置">
    ```json5
    {
      channels: {
        twitch: {
          enabled: true,
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
      },
    }
    ```
  </Tab>
</Tabs>

如果同时设置了环境变量和配置，配置优先。

### 访问控制（推荐）

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // （推荐）仅您的 Twitch 用户 ID
    },
  },
}
```

优先使用 `allowFrom` 作为硬性 allowlist。如需基于角色的访问，改用 `allowedRoles`。

**可用角色：** `"moderator"`、`"owner"`、`"vip"`、`"subscriber"`、`"all"`。

<Note>
**为什么使用用户 ID？** 用户名可以更改，允许冒充。用户 ID 是永久的。

查找您的 Twitch 用户 ID：[https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)（将您的 Twitch 用户名转换为 ID）
</Note>

## Token 刷新（可选）

来自 [Twitch Token Generator](https://twitchtokengenerator.com/) 的 token 无法自动刷新——过期时重新生成。

要实现自动 token 刷新，请在 [Twitch Developer Console](https://dev.twitch.tv/console) 创建您自己的 Twitch 应用程序，并添加到配置中：

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

机器人会在过期前自动刷新 token 并记录刷新事件。

## 多账户支持

使用 `channels.twitch.accounts` 配置每个账户的 token。有关共享模式，请参阅 [配置](/gateway/configuration)。

示例（一个机器人账户在两个 Channel 中）：

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

<Note>
每个账户需要自己的 token（每个 Channel 一个 token）。
</Note>

## 访问控制

<Tabs>
  <Tab title="用户 ID allowlist（最安全）">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowFrom: ["123456789", "987654321"],
            },
          },
        },
      },
    }
    ```
  </Tab>
  <Tab title="基于角色">
    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              allowedRoles: ["moderator", "vip"],
            },
          },
        },
      },
    }
    ```

    `allowFrom` 是硬性 allowlist。设置后，只允许其中的用户 ID。如果需要基于角色的访问，请不设置 `allowFrom`，改为配置 `allowedRoles`。

  </Tab>
  <Tab title="禁用 @mention 要求">
    默认情况下，`requireMention` 为 `true`。要禁用并响应所有消息：

    ```json5
    {
      channels: {
        twitch: {
          accounts: {
            default: {
              requireMention: false,
            },
          },
        },
      },
    }
    ```

  </Tab>
</Tabs>

## 故障排除

首先，运行诊断命令：

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="机器人不响应消息">
    - **检查访问控制：** 确保您的用户 ID 在 `allowFrom` 中，或暂时移除 `allowFrom` 并设置 `allowedRoles: ["all"]` 进行测试。
    - **检查机器人是否在 Channel 中：** 机器人必须加入 `channel` 中指定的 Channel。
  </Accordion>
  <Accordion title="Token 问题">
    "Failed to connect" 或身份验证错误：

    - 验证 `accessToken` 是 OAuth access token 值（通常以 `oauth:` 前缀开头）
    - 检查 token 是否具有 `chat:read` 和 `chat:write` 范围
    - 如果使用 token 刷新，验证已设置 `clientSecret` 和 `refreshToken`

  </Accordion>
  <Accordion title="Token 刷新不起作用">
    检查日志中的刷新事件：

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    如果看到 "token refresh disabled (no refresh token)"：

    - 确保提供了 `clientSecret`
    - 确保提供了 `refreshToken`

  </Accordion>
</AccordionGroup>

## 配置

### 账户配置

<ParamField path="username" type="string">
  机器人用户名。
</ParamField>
<ParamField path="accessToken" type="string">
  带有 `chat:read` 和 `chat:write` 的 OAuth access token。
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID（来自 Token Generator 或您的应用）。
</ParamField>
<ParamField path="channel" type="string" required>
  要加入的 Channel。
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  启用此账户。
</ParamField>
<ParamField path="clientSecret" type="string">
  可选：用于自动 token 刷新。
</ParamField>
<ParamField path="refreshToken" type="string">
  可选：用于自动 token 刷新。
</ParamField>
<ParamField path="expiresIn" type="number">
  Token 过期时间（秒）。
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Token 获取时间戳。
</ParamField>
<ParamField path="allowFrom" type="string[]">
  用户 ID allowlist。
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  基于角色的访问控制。
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  需要 @mention。
</ParamField>

### Provider 选项

- `channels.twitch.enabled` - 启用/禁用 Channel 启动
- `channels.twitch.username` - 机器人用户名（简化的单账户配置）
- `channels.twitch.accessToken` - OAuth access token（简化的单账户配置）
- `channels.twitch.clientId` - Twitch Client ID（简化的单账户配置）
- `channels.twitch.channel` - 要加入的 Channel（简化的单账户配置）
- `channels.twitch.accounts.<accountName>` - 多账户配置（上述所有账户字段）

完整示例：

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Tool actions

Agent 可以调用带有 action 的 `twitch`：

- `send` - 向 Channel 发送消息

示例：

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## 安全和运维

- **像密码一样对待 token** — 永远不要将 token 提交到 git。
- **使用自动 token 刷新** 用于长期运行的机器人。
- **使用用户 ID allowlist** 而不是用户名进行访问控制。
- **监控日志** 以查看 token 刷新事件和连接状态。
- **最小化 token 范围** — 仅请求 `chat:read` 和 `chat:write`。
- **如果卡住**：在确认没有其他进程拥有 Session 后重启 Gateway。

## 限制

- 每条消息 **500 个字符**（在单词边界处自动分块）。
- 分块前会去除 Markdown。
- 无速率限制（使用 Twitch 的内置速率限制）。

## 相关

- [Channel 路由](/channels/channel-routing) — 消息的 Session 路由
- [Channels 概述](/channels) — 所有支持的 Channels
- [Groups](/channels/groups) — 群聊行为和提及门控
- [Pairing](/channels/pairing) — DM 认证和配对流程
- [Security](/gateway/security) — 访问模型和安全加固
