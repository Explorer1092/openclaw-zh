---
mmh3_hash: "972c524c0f176b311fc08236825d23aa"
summary: "OpenClaw 如何就地升级之前的 Matrix Plugin，包括加密状态恢复限制和手动恢复步骤。"
read_when:
  - 升级现有的 Matrix 安装
  - 迁移加密的 Matrix 历史记录和设备状态
title: "Matrix 迁移"
---

从之前的公开 `matrix` Plugin 升级到当前实现。

对大多数用户来说，升级是就地进行的：

- Plugin 保持 `@openclaw/matrix`
- channel 保持 `matrix`
- 您的配置保持在 `channels.matrix` 下
- 缓存的凭据保持在 `~/.openclaw/credentials/matrix/` 下
- 运行时状态保持在 `~/.openclaw/matrix/` 下

您无需重命名配置键或以新名称重新安装 Plugin。

## 迁移自动执行的操作

当 gateway 启动时，以及当您运行 [`openclaw doctor --fix`](/gateway/doctor) 时，OpenClaw 会尝试自动修复旧的 Matrix 状态。
在任何可操作的 Matrix 迁移步骤修改磁盘状态之前，OpenClaw 会创建或复用一个专注的恢复快照。

当您使用 `openclaw update` 时，确切的触发时机取决于 OpenClaw 的安装方式：

- 源代码安装在更新流程中运行 `openclaw doctor --fix`，然后默认重启 gateway
- 包管理器安装更新包，运行非交互式 doctor 遍历，然后依赖默认 gateway 重启，以便启动可以完成 Matrix 迁移
- 如果您使用 `openclaw update --no-restart`，基于启动的 Matrix 迁移将延迟，直到您后来运行 `openclaw doctor --fix` 并重启 gateway

自动迁移涵盖：

- 在 `~/Backups/openclaw-migrations/` 下创建或复用迁移前快照
- 复用您缓存的 Matrix 凭据
- 保留相同的账户选择和 `channels.matrix` 配置
- 将最旧的扁平 Matrix 同步存储移动到当前账户范围位置
- 当目标账户可以安全解析时，将最旧的扁平 Matrix 加密存储移动到当前账户范围位置
- 当该密钥在本地存在时，从旧的 rust 加密存储中提取之前保存的 Matrix 房间密钥备份解密密钥
- 当访问 token 之后更改时，为相同的 Matrix 账户、主服务器和用户复用最完整的现有 token 哈希存储根目录
- 当 Matrix 访问 token 更改但账户/设备身份保持不变时，扫描兄弟 token 哈希存储根目录以查找待处理的加密状态恢复元数据
- 在下次 Matrix 启动时将备份的房间密钥恢复到新的加密存储中

快照详情：

- 成功快照后，OpenClaw 在 `~/.openclaw/matrix/migration-snapshot.json` 写入标记文件，以便后续启动和修复遍历可以复用相同的存档。
- 这些自动 Matrix 迁移快照仅备份配置 + 状态（`includeWorkspace: false`）。
- 如果 Matrix 只有仅警告的迁移状态（例如因为 `userId` 或 `accessToken` 仍然缺失），OpenClaw 还不会创建快照，因为没有 Matrix 修改是可操作的。
- 如果快照步骤失败，OpenClaw 会跳过该运行的 Matrix 迁移，而不是在没有恢复点的情况下修改状态。

关于多账户升级：

- 最旧的扁平 Matrix 存储（`~/.openclaw/matrix/bot-storage.json` 和 `~/.openclaw/matrix/crypto/`）来自单存储布局，因此 OpenClaw 只能将其迁移到一个已解析的 Matrix 账户目标
- 已经按账户范围的旧版 Matrix 存储会按配置的 Matrix 账户进行检测和准备

## 迁移无法自动执行的操作

之前的公开 Matrix Plugin **不会**自动创建 Matrix 房间密钥备份。它持久化了本地加密状态并请求了设备验证，但不保证您的房间密钥已备份到主服务器。

这意味着某些加密安装只能部分迁移。

OpenClaw 无法自动恢复：

- 从未备份的本地专有房间密钥
- 当目标 Matrix 账户因为 `homeserver`、`userId` 或 `accessToken` 仍然不可用而尚未解析时的加密状态
- 当配置了多个 Matrix 账户但未设置 `channels.matrix.defaultAccount` 时，对一个共享扁平 Matrix 存储的自动迁移
- 固定到仓库路径而不是标准 Matrix 包的自定义 Plugin 路径安装
- 当旧存储有备份密钥但本地没有保存解密密钥时的缺失恢复密钥

当前警告范围：

- 自定义 Matrix Plugin 路径安装由 gateway 启动和 `openclaw doctor` 都会提示

如果您的旧安装有从未备份的本地专有加密历史记录，升级后一些较旧的加密消息可能仍然无法读取。

## 推荐的升级流程

1. 正常更新 OpenClaw 和 Matrix Plugin。
   优先使用不带 `--no-restart` 的普通 `openclaw update`，以便启动可以立即完成 Matrix 迁移。
2. 运行：

   ```bash
   openclaw doctor --fix
   ```

   如果 Matrix 有可操作的迁移工作，doctor 将首先创建或复用迁移前快照并打印存档路径。

3. 启动或重启 gateway。
4. 检查当前验证和备份状态：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 将正在修复的 Matrix 账户的恢复密钥放入账户特定的环境变量中。对于单个默认账户，`MATRIX_RECOVERY_KEY` 即可。对于多个账户，每个账户使用一个变量，例如 `MATRIX_RECOVERY_KEY_ASSISTANT`，并向命令添加 `--account assistant`。

6. 如果 OpenClaw 告诉您需要恢复密钥，请为匹配的账户运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify backup restore --recovery-key-stdin --account assistant
   ```

7. 如果此设备仍未验证，请为匹配的账户运行命令：

   ```bash
   printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin
   printf '%s\n' "$MATRIX_RECOVERY_KEY_ASSISTANT" | openclaw matrix verify device --recovery-key-stdin --account assistant
   ```

   如果恢复密钥被接受且备份可用，但 `Cross-signing verified`
   仍然为 `no`，请从另一个 Matrix 客户端完成自我验证：

   ```bash
   openclaw matrix verify self
   ```

   在另一个 Matrix 客户端中接受请求，比较表情符号或小数，
   仅在它们匹配时输入 `yes`。该命令仅在 `Cross-signing verified` 变为 `yes` 后才成功退出。

8. 如果您有意放弃不可恢复的旧历史记录，并希望为未来消息建立全新的备份基线，请运行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

9. 如果还没有服务器端密钥备份，请为未来恢复创建一个：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密迁移的工作原理

加密迁移是一个两阶段过程：

1. 启动或 `openclaw doctor --fix` 在加密迁移可操作时创建或复用迁移前快照。
2. 启动或 `openclaw doctor --fix` 通过活跃的 Matrix Plugin 安装检查旧的 Matrix 加密存储。
3. 如果找到备份解密密钥，OpenClaw 将其写入新的恢复密钥流程并将房间密钥恢复标记为待处理。
4. 在下次 Matrix 启动时，OpenClaw 自动将备份的房间密钥恢复到新的加密存储中。

如果旧存储报告了从未备份的房间密钥，OpenClaw 会发出警告，而不是假装恢复成功。

## 常见消息及其含义

### 升级和检测消息

`Matrix plugin upgraded in place.`

- 含义：检测到旧的磁盘 Matrix 状态并将其迁移到当前布局。
- 操作：无需操作，除非同一输出还包含警告。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 含义：OpenClaw 在修改 Matrix 状态之前创建了恢复存档。
- 操作：保留打印的存档路径，直到您确认迁移成功。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 含义：OpenClaw 找到了现有的 Matrix 迁移快照标记，并复用了该存档，而不是创建重复备份。
- 操作：保留打印的存档路径，直到您确认迁移成功。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含义：旧的 Matrix 状态存在，但 OpenClaw 无法将其映射到当前 Matrix 账户，因为 Matrix 未配置。
- 操作：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：OpenClaw 找到了旧状态，但仍然无法确定确切的当前账户/设备根目录。
- 操作：使用有效的 Matrix 登录启动 gateway 一次，或在缓存凭据存在后重新运行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到了一个共享的扁平 Matrix 存储，但拒绝猜测哪个命名的 Matrix 账户应该接收它。
- 操作：将 `channels.matrix.defaultAccount` 设置为预期账户，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 含义：新的账户范围位置已经有同步或加密存储，因此 OpenClaw 没有自动覆盖它。
- 操作：在手动删除或移动冲突目标之前，验证当前账户是否正确。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含义：OpenClaw 尝试移动旧的 Matrix 状态，但文件系统操作失败。
- 操作：检查文件系统权限和磁盘状态，然后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 含义：OpenClaw 找到了旧的加密 Matrix 存储，但没有当前 Matrix 配置可以附加到它。
- 操作：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：加密存储存在，但 OpenClaw 无法安全地决定它属于哪个当前账户/设备。
- 操作：使用有效的 Matrix 登录启动 gateway 一次，或在缓存凭据可用后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到了一个共享的扁平旧版加密存储，但拒绝猜测哪个命名的 Matrix 账户应该接收它。
- 操作：将 `channels.matrix.defaultAccount` 设置为预期账户，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含义：OpenClaw 检测到旧的 Matrix 状态，但迁移仍然因缺少身份或凭据数据而被阻止。
- 操作：完成 Matrix 登录或配置设置，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 含义：OpenClaw 找到了旧的加密 Matrix 状态，但无法从通常检查该存储的 Matrix Plugin 加载帮助程序入口点。
- 操作：重新安装或修复 Matrix Plugin（`openclaw plugins install @openclaw/matrix`，或对于仓库检出使用 `openclaw plugins install ./path/to/local/matrix-plugin`），然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 含义：OpenClaw 找到了一个逃离 Plugin 根目录或未通过 Plugin 边界检查的帮助程序文件路径，因此拒绝导入它。
- 操作：从受信任的路径重新安装 Matrix Plugin，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 含义：OpenClaw 拒绝修改 Matrix 状态，因为它无法首先创建恢复快照。
- 操作：解决备份错误，然后重新运行 `openclaw doctor --fix` 或重启 gateway。

`Failed migrating legacy Matrix client storage: ...`

- 含义：Matrix 客户端侧回退找到了旧的扁平存储，但移动失败。OpenClaw 现在中止该回退，而不是静默地以全新存储启动。
- 操作：检查文件系统权限或冲突，保持旧状态完好，修复错误后重试。

`Matrix is installed from a custom path: ...`

- 含义：Matrix 固定到路径安装，因此主线更新不会自动用仓库的标准 Matrix 包替换它。
- 操作：当您想返回默认 Matrix Plugin 时，使用 `openclaw plugins install @openclaw/matrix` 重新安装。

### 加密状态恢复消息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 含义：备份的房间密钥已成功恢复到新的加密存储中。
- 操作：通常无需操作。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 含义：一些旧的房间密钥只存在于旧的本地存储中，从未上传到 Matrix 备份。
- 操作：除非您可以从另一个已验证的客户端手动恢复这些密钥，否则一些旧的加密历史记录将无法访问。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key-stdin" after upgrade if they have the recovery key.`

- 含义：备份存在，但 OpenClaw 无法自动恢复恢复密钥。
- 操作：运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 含义：OpenClaw 找到了旧的加密存储，但无法足够安全地检查它以准备恢复。
- 操作：重新运行 `openclaw doctor --fix`。如果重复出现，保持旧状态目录完好，并使用另一个已验证的 Matrix 客户端加上 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 进行恢复。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 含义：OpenClaw 检测到备份密钥冲突，并拒绝自动覆盖当前恢复密钥文件。
- 操作：在重试任何恢复命令之前，验证哪个恢复密钥是正确的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 含义：这是旧存储格式的硬限制。
- 操作：备份的密钥仍然可以恢复，但本地专有的加密历史记录可能仍然无法访问。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 含义：新 Plugin 尝试恢复，但 Matrix 返回了错误。
- 操作：运行 `openclaw matrix verify backup status`，如有需要，使用 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin` 重试。

### 手动恢复消息

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 含义：OpenClaw 知道您应该有一个备份密钥，但它在此设备上不活跃。
- 操作：运行 `openclaw matrix verify backup restore`，或设置 `MATRIX_RECOVERY_KEY` 并运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin`（如有需要）。

`Store a recovery key with 'openclaw matrix verify device --recovery-key-stdin', then run 'openclaw matrix verify backup restore'.`

- 含义：此设备当前未存储恢复密钥。
- 操作：设置 `MATRIX_RECOVERY_KEY`，运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`，然后恢复备份。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin' with the matching recovery key.`

- 含义：存储的密钥与活跃的 Matrix 备份不匹配。
- 操作：将 `MATRIX_RECOVERY_KEY` 设置为正确的密钥，并运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

如果您接受失去不可恢复的旧加密历史记录，可以改为使用
`openclaw matrix verify backup reset --yes` 重置当前备份基线。当
存储的备份密钥损坏时，该重置也可能会重新创建密钥存储，以便
新的备份密钥在重启后可以正确加载。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device --recovery-key-stdin'.`

- 含义：备份存在，但此设备尚未足够强地信任交叉签名链。
- 操作：设置 `MATRIX_RECOVERY_KEY` 并运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Matrix recovery key is required`

- 含义：您在需要恢复密钥时尝试了恢复步骤，但没有提供。
- 操作：使用 `--recovery-key-stdin` 重新运行命令，例如 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

`Invalid Matrix recovery key: ...`

- 含义：提供的密钥无法解析或与预期格式不匹配。
- 操作：使用来自 Matrix 客户端或恢复密钥文件的确切恢复密钥重试。

`Matrix recovery key was applied, but this device still lacks full Matrix identity trust.`

- 含义：OpenClaw 可以应用恢复密钥，但 Matrix 尚未
  为此设备建立完整的交叉签名身份信任。检查
  命令输出中的 `Recovery key accepted`、`Backup usable`、
  `Cross-signing verified` 和 `Device verified by owner`。
- 操作：运行 `openclaw matrix verify self`，在另一个
  Matrix 客户端中接受请求，比较 SAS，仅在匹配时输入 `yes`。该
  命令在报告成功之前等待完整的 Matrix 身份信任。仅在您有意
  替换当前交叉签名身份时才使用
  `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify bootstrap --recovery-key-stdin --force-reset-cross-signing`。

`Matrix key backup is not active on this device after loading from secret storage.`

- 含义：密钥存储在此设备上没有产生活跃的备份 Session。
- 操作：首先验证设备，然后使用 `openclaw matrix verify backup status` 重新检查。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device --recovery-key-stdin' first.`

- 含义：此设备在设备验证完成之前无法从密钥存储恢复。
- 操作：首先运行 `printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify device --recovery-key-stdin`。

### 自定义 Plugin 安装消息

`Matrix is installed from a custom path that no longer exists: ...`

- 含义：您的 Plugin 安装记录指向一个已消失的本地路径。
- 操作：使用 `openclaw plugins install @openclaw/matrix` 重新安装，或者如果您从仓库检出运行，则使用 `openclaw plugins install ./path/to/local/matrix-plugin`。

## 如果加密历史记录仍然没有恢复

按顺序运行这些检查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
printf '%s\n' "$MATRIX_RECOVERY_KEY" | openclaw matrix verify backup restore --recovery-key-stdin --verbose
```

如果备份恢复成功但一些旧房间仍然缺少历史记录，这些缺失的密钥可能从未被之前的 Plugin 备份过。

## 如果您想为未来消息重新开始

如果您接受失去不可恢复的旧加密历史记录，只希望为将来建立干净的备份基线，请按顺序运行这些命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果之后设备仍未验证，请通过比较 SAS 表情符号或十进制代码并确认它们匹配来从 Matrix 客户端完成验证。

## 相关

- [Matrix](/channels/matrix)：channel 设置和配置。
- [Matrix 推送规则](/channels/matrix-push-rules)：通知路由。
- [Doctor](/gateway/doctor)：健康检查和自动迁移触发器。
- [迁移指南](/install/migrating)：所有迁移路径（机器迁移、跨系统导入）。
- [Plugins](/tools/plugin)：Plugin 安装和注册。
