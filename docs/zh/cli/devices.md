---
mmh3_hash: "ade8db05e80915ac27ae29c25cd1b0b1"
title: "`openclaw devices`"
summary: "`openclaw devices` 的 CLI 参考(设备配对 + 令牌轮换/撤销)"
read_when:
  - 您正在批准设备配对请求
  - 您需要轮换或撤销设备令牌
---

# `openclaw devices`

管理设备配对请求和设备范围的令牌。

## 命令

### `openclaw devices list`

列出待处理的配对请求和已配对的设备。

```
openclaw devices list
openclaw devices list --json
```

待处理请求的输出在设备已配对时,会在设备当前已批准的访问权限旁显示所请求的访问权限。这使得范围/角色升级一目了然,而不会看起来像是配对已丢失。

### `openclaw devices remove <deviceId>`

删除一个已配对的设备条目。

使用配对设备令牌进行身份验证时,非管理员调用者只能删除**自己的**设备条目。删除其他设备需要 `operator.admin`。

```
openclaw devices remove <deviceId>
openclaw devices remove <deviceId> --json
```

### `openclaw devices clear --yes [--pending]`

批量清除已配对的设备。

```
openclaw devices clear --yes
openclaw devices clear --yes --pending
openclaw devices clear --yes --pending --json
```

### `openclaw devices approve [requestId] [--latest]`

通过精确的 `requestId` 批准待处理的设备配对请求。如果省略 `requestId` 或传递 `--latest`，OpenClaw 仅打印选定的待处理请求并退出；验证详情后请使用精确的请求 ID 重新运行批准。

注意:如果设备以更改的身份验证详情(角色/范围/公钥)重试配对,OpenClaw 会覆盖之前的待处理条目并发出新的 `requestId`。批准前请运行 `openclaw devices list` 以使用当前 ID。

如果设备已配对并请求更广泛的范围或角色,OpenClaw 会保留现有批准并创建新的待处理升级请求。在批准前,请查看 `openclaw devices list` 中的 `Requested` 与 `Approved` 列,或使用 `openclaw devices approve --latest` 预览确切的升级内容。

```
openclaw devices approve
openclaw devices approve <requestId>
openclaw devices approve --latest
```

### `openclaw devices reject <requestId>`

拒绝待处理的设备配对请求。

```
openclaw devices reject <requestId>
```

### `openclaw devices rotate --device <id> --role <role> [--scope <scope...>]`

为特定角色轮换设备令牌(可选更新范围)。目标角色必须已存在于该设备的批准配对合约中;轮换不能铸造新的未批准角色。如果省略 `--scope`,使用存储的轮换令牌的后续重新连接会重用该令牌的缓存批准范围。如果传递显式的 `--scope` 值,这些将成为未来缓存令牌重新连接的存储范围集。非管理员配对设备调用者只能轮换**自己的**设备令牌。另外,任何显式的 `--scope` 值必须保持在调用者 Session 自身的操作者范围内;轮换不能铸造比调用者已有的更广泛的操作者令牌。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

返回新令牌载荷为 JSON。

### `openclaw devices revoke --device <id> --role <role>`

撤销特定角色的设备令牌。

非管理员配对设备调用者只能撤销**自己的**设备令牌。撤销其他设备的令牌需要 `operator.admin`。

```
openclaw devices revoke --device <deviceId> --role node
```

返回撤销结果为 JSON。

## 常用选项

- `--url <url>`:Gateway WebSocket URL(配置时默认为 `gateway.remote.url`)。
- `--token <token>`:Gateway 令牌(如果需要)。
- `--password <password>`:Gateway 密码(密码认证)。
- `--timeout <ms>`:RPC 超时。
- `--json`:JSON 输出(推荐用于脚本)。

注意:当您设置 `--url` 时,CLI 不会回退到配置或环境凭据。显式传递 `--token` 或 `--password`。缺少显式凭据会导致错误。

## 注意

- 令牌轮换返回新令牌(敏感)。将其视为机密。
- 这些命令需要 `operator.pairing`(或 `operator.admin`)范围。
- 令牌轮换保持在批准的配对角色集和该设备批准的范围基线内。无关的缓存令牌条目不会授予新的轮换目标。
- 对于配对设备令牌 Session,跨设备管理仅限管理员:`remove`、`rotate` 和 `revoke` 仅限自己操作,除非调用者具有 `operator.admin`。
- `devices clear` 有意通过 `--yes` 进行门控。
- 如果本地回环上的配对范围不可用(且未传递显式 `--url`),list/approve 可以使用本地配对回退。
- `devices approve` 在铸造令牌前需要显式的请求 ID；省略 `requestId` 或传递 `--latest` 仅预览最新的待处理请求。

## 令牌漂移恢复检查清单

当 Control UI 或其他客户端持续出现 `AUTH_TOKEN_MISMATCH` 或 `AUTH_DEVICE_TOKEN_MISMATCH` 时使用此检查清单。

1. 确认当前 Gateway 令牌来源:

```bash
openclaw config get gateway.auth.token
```

2. 列出已配对设备并识别受影响的设备 ID:

```bash
openclaw devices list
```

3. 为受影响的设备轮换 operator 令牌:

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 如果轮换还不够,删除过期配对并重新批准:

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用当前共享令牌/密码重试客户端连接。

说明:

- 正常重新连接认证优先级为:显式共享令牌/密码优先,然后是显式 `deviceToken`,然后是存储的设备令牌,然后是引导令牌。
- 受信任的 `AUTH_TOKEN_MISMATCH` 恢复可以临时同时发送共享令牌和存储的设备令牌,用于一次有界的重试。

相关:

- [Dashboard 身份验证故障排除](/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 故障排除](/gateway/troubleshooting#dashboard-control-ui-connectivity)
