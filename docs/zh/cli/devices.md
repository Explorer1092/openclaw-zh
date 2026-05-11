---
mmh3_hash: "ac12c80b605b0865bd2d8d0d823045a9"
summary: "`openclaw devices` 的 CLI 参考（设备配对 + token 轮换/撤销）"
read_when:
  - 您正在批准设备配对请求
  - 您需要轮换或撤销设备 token
title: "Devices"
---

# `openclaw devices`

管理设备配对请求和设备范围的 token。

## 命令

### `openclaw devices list`

列出待处理的配对请求和已配对的设备。

```
openclaw devices list
openclaw devices list --json
```

待处理请求输出在设备已配对时，将请求的访问权限显示在设备当前已批准的访问权限旁边。这使范围/角色升级变得明确，而不是看起来像配对丢失了。

### `openclaw devices remove <deviceId>`

删除一个已配对的设备条目。

当您使用已配对的设备 token 进行身份验证时，非管理员调用者只能删除**自己的**设备条目。删除其他设备需要 `operator.admin`。

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

通过精确的 `requestId` 批准待处理的设备配对请求。如果省略 `requestId` 或传递 `--latest`，OpenClaw 仅打印所选的待处理请求并退出；在验证详情后，使用精确的请求 ID 重新运行批准。

<Note>
如果设备以更改的身份验证详情（角色、范围或公钥）重试配对，OpenClaw 会取代之前的待处理条目并发出新的 `requestId`。在批准之前立即运行 `openclaw devices list` 以使用当前 ID。
</Note>

如果设备已配对并请求更广泛的范围或更广泛的角色，OpenClaw 保留现有的批准并创建新的待处理升级请求。在批准之前查看 `openclaw devices list` 中的 `Requested` 与 `Approved` 列，或使用 `openclaw devices approve --latest` 预览确切的升级。

如果 Gateway 显式配置了 `gateway.nodes.pairing.autoApproveCidrs`，来自匹配客户端 IP 的首次 `role: node` 请求可以在出现在此列表之前被批准。该策略默认禁用，且永远不适用于 operator/browser 客户端或升级请求。

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

轮换特定角色（可选择更新范围）的设备 token。
目标角色必须已存在于该设备的已批准配对契约中；轮换不能铸造新的未批准角色。
如果省略 `--scope`，使用存储的已轮换 token 的后续重新连接会重用该 token 的缓存已批准范围。如果您传递显式的 `--scope` 值，这些将成为未来缓存 token 重新连接的存储范围集。
非管理员已配对设备调用者只能轮换**自己的**设备 token。
目标 token 范围集必须保持在调用者会话自己的 operator 范围内；轮换不能铸造或保留比调用者已经拥有的更广泛的 operator token。

```
openclaw devices rotate --device <deviceId> --role operator --scope operator.read --scope operator.write
```

以 JSON 格式返回轮换元数据。如果调用者在使用该设备 token 进行身份验证的同时轮换自己的 token，响应还包括替换 token，以便客户端在重新连接之前可以持久化它。共享/管理员轮换不回显 bearer token。

### `openclaw devices revoke --device <id> --role <role>`

撤销特定角色的设备 token。

非管理员已配对设备调用者只能撤销**自己的**设备 token。
撤销其他设备的 token 需要 `operator.admin`。
目标 token 范围集还必须适合调用者会话自己的 operator 范围；仅配对的调用者不能撤销 admin/write operator token。

```
openclaw devices revoke --device <deviceId> --role node
```

以 JSON 格式返回撤销结果。

## 常用选项

- `--url <url>`：Gateway WebSocket URL（配置时默认为 `gateway.remote.url`）。
- `--token <token>`：Gateway token（如果需要）。
- `--password <password>`：Gateway 密码（密码身份验证）。
- `--timeout <ms>`：RPC 超时。
- `--json`：JSON 输出（推荐用于脚本）。

<Warning>
当您设置 `--url` 时，CLI 不会回退到配置或环境凭据。显式传递 `--token` 或 `--password`。缺少显式凭据是错误。
</Warning>

## 注意事项

- Token 轮换返回新的 token（敏感）。像密钥一样对待它。
- 这些命令需要 `operator.pairing`（或 `operator.admin`）范围。一些批准还要求调用者持有目标设备将铸造或继承的 operator 范围；请参阅 [Operator 范围](/gateway/operator-scopes)。
- `gateway.nodes.pairing.autoApproveCidrs` 是仅用于新节点设备配对的选择加入 Gateway 策略；它不改变 CLI 批准权限。
- Token 轮换和撤销保持在该设备的已批准配对角色集和已批准范围基线内。游离的缓存 token 条目不授予 token 管理目标。
- 对于已配对设备 token 会话，跨设备管理仅限管理员：`remove`、`rotate` 和 `revoke` 仅限自身，除非调用者有 `operator.admin`。
- Token 修改也受调用者范围限制：仅配对的会话不能轮换或撤销当前携带 `operator.admin` 或 `operator.write` 的 token。
- `devices clear` 有意通过 `--yes` 门控。
- 如果本地回环上配对范围不可用（且未传递显式 `--url`），list/approve 可以使用本地配对回退。
- `devices approve` 在铸造 token 之前需要显式的请求 ID；省略 `requestId` 或传递 `--latest` 仅预览最新的待处理请求。

## Token 漂移恢复清单

当控制 UI 或其他客户端持续以 `AUTH_TOKEN_MISMATCH` 或 `AUTH_DEVICE_TOKEN_MISMATCH` 失败时使用此清单。

1. 确认当前 Gateway token 来源：

```bash
openclaw config get gateway.auth.token
```

2. 列出已配对的设备并识别受影响的设备 ID：

```bash
openclaw devices list
```

3. 为受影响的设备轮换 operator token：

```bash
openclaw devices rotate --device <deviceId> --role operator
```

4. 如果轮换不够，请删除陈旧的配对并重新批准：

```bash
openclaw devices remove <deviceId>
openclaw devices list
openclaw devices approve <requestId>
```

5. 使用当前共享 token/密码重试客户端连接。

注意：

- 正常的重新连接身份验证优先级是：显式共享 token/密码优先，然后是显式 `deviceToken`，然后是存储的设备 token，然后是引导 token。
- 受信任的 `AUTH_TOKEN_MISMATCH` 恢复可以临时同时发送共享 token 和存储的设备 token 进行一次有界重试。

相关：

- [Dashboard 身份验证故障排除](/web/dashboard#if-you-see-unauthorized-1008)
- [Gateway 故障排除](/gateway/troubleshooting#dashboard-control-ui-connectivity)

## 相关

- [CLI 参考](/cli)
- [Nodes](/nodes)
