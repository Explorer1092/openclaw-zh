---
mmh3_hash: "152edea79cf6b9a3727a5c47de306907"
summary: "Zalo personal account support via zca-cli (QR login), capabilities, and configuration"
read_when:
  - Setting up Zalo Personal for OpenClaw
  - Debugging Zalo Personal login or message flow
---
# Zalo Personal (非官方)

状态：实验性。此集成通过 `zca-cli` 自动化 **个人 Zalo 账户**。

> **警告：** 这是一个非官方集成，可能导致账户被暂停/封禁。使用风险自负。

## 需要插件
Zalo Personal 作为插件提供，不包含在核心安装中。
- 通过 CLI 安装：`openclaw plugins install @openclaw/zalouser`
- 或从源码检出安装：`openclaw plugins install ./extensions/zalouser`
- 详情：[插件](/plugin)

## 前置条件：zca-cli
Gateway 机器必须在 `PATH` 中可以访问 `zca` 二进制文件。

- 验证：`zca --version`
- 如果缺失，请安装 zca-cli（参见 `extensions/zalouser/README.md` 或上游 zca-cli 文档）。

## 快速设置（新手）
1) 安装插件（见上文）。
2) 登录（二维码，在 Gateway 机器上）：
   - `openclaw channels login --channel zalouser`
   - 使用 Zalo 移动应用扫描终端中的二维码。
3) 启用通道：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      dmPolicy: "pairing"
    }
  }
}
```

4) 重启 Gateway（或完成初始化配置）。
5) DM 访问默认为配对模式；首次联系时批准配对码。

## 它是什么
- 使用 `zca listen` 接收入站消息。
- 使用 `zca msg ...` 发送回复（文本/媒体/链接）。
- 专为无法使用 Zalo Bot API 的"个人账户"使用场景设计。

## 命名
通道 id 为 `zalouser`，明确表示这是自动化 **个人 Zalo 用户账户**（非官方）。我们保留 `zalo` 用于未来可能的官方 Zalo API 集成。

## 查找 ID（目录）
使用目录 CLI 发现对等方/群组及其 ID：

```bash
openclaw directory self --channel zalouser
openclaw directory peers list --channel zalouser --query "name"
openclaw directory groups list --channel zalouser --query "work"
```

## 限制
- 出站文本会被分块为约 2000 个字符（Zalo 客户端限制）。
- 默认情况下阻止流式传输。

## 访问控制（私信）
`channels.zalouser.dmPolicy` 支持：`pairing | allowlist | open | disabled`（默认：`pairing`）。
`channels.zalouser.allowFrom` 接受用户 ID 或名称。向导在可用时通过 `zca friend find` 将名称解析为 ID。

通过以下方式批准：
- `openclaw pairing list zalouser`
- `openclaw pairing approve zalouser <code>`

## 群组访问（可选）
- 默认：`channels.zalouser.groupPolicy = "open"`（允许群组）。使用 `channels.defaults.groupPolicy` 在未设置时覆盖默认值。
- 使用白名单限制：
  - `channels.zalouser.groupPolicy = "allowlist"`
  - `channels.zalouser.groups`（键为群组 ID 或名称）
- 阻止所有群组：`channels.zalouser.groupPolicy = "disabled"`。
- 配置向导可以提示输入群组白名单。
- 启动时，OpenClaw 将白名单中的群组/用户名称解析为 ID 并记录映射；未解析的条目保持原样。

示例：
```json5
{
  channels: {
    zalouser: {
      groupPolicy: "allowlist",
      groups: {
        "123456789": { allow: true },
        "Work Chat": { allow: true }
      }
    }
  }
}
```

## 多账户
账户映射到 zca 配置文件。示例：

```json5
{
  channels: {
    zalouser: {
      enabled: true,
      defaultAccount: "default",
      accounts: {
        work: { enabled: true, profile: "work" }
      }
    }
  }
}
```

## 故障排除

**找不到 `zca`：**
- 安装 zca-cli 并确保它在 Gateway 进程的 `PATH` 中。

**登录状态无法保持：**
- `openclaw channels status --probe`
- 重新登录：`openclaw channels logout --channel zalouser && openclaw channels login --channel zalouser`