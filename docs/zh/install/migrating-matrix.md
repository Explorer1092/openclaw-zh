---
mmh3_hash: "dab63912ac54e8759dc2aedaadba2c76"
summary: "OpenClaw 如何将之前的 Matrix 插件就地升级，包括加密状态恢复限制和手动恢复步骤。"
read_when:
  - 升级现有的 Matrix 安装
  - 迁移加密的 Matrix 历史记录和设备状态
title: "Matrix 迁移"
---

# Matrix 迁移

本页介绍从之前公开的 `matrix` 插件升级到当前实现的过程。

对于大多数用户，升级是就地进行的：

- 插件仍为 `@openclaw/matrix`
- Channel 仍为 `matrix`
- 配置仍在 `channels.matrix` 下
- 缓存的凭据仍在 `~/.openclaw/credentials/matrix/` 下
- 运行时状态仍在 `~/.openclaw/matrix/` 下

你不需要重命名配置键或以新名称重新安装插件。

## 迁移自动完成的工作

当 Gateway 启动时，以及当你运行 [`openclaw doctor --fix`](/gateway/doctor) 时，OpenClaw 会尝试自动修复旧的 Matrix 状态。
在任何可操作的 Matrix 迁移步骤更改磁盘状态之前，OpenClaw 会创建或复用一个专注的恢复快照。

当你使用 `openclaw update` 时，确切的触发取决于 OpenClaw 的安装方式：

- 源码安装在更新流程中运行 `openclaw doctor --fix`，然后默认重启 Gateway
- 包管理器安装会更新包，运行非交互式 doctor 检查，然后依赖默认的 Gateway 重启，以便启动时完成 Matrix 迁移
- 如果使用 `openclaw update --no-restart`，基于启动的 Matrix 迁移将推迟到你稍后运行 `openclaw doctor --fix` 并重启 Gateway

自动迁移涵盖：

- 在 `~/Backups/openclaw-migrations/` 下创建或复用预迁移快照
- 复用缓存的 Matrix 凭据
- 保持相同的账号选择和 `channels.matrix` 配置
- 将最旧的扁平 Matrix 同步存储移动到当前账号作用域位置
- 当目标账号可以安全解析时，将最旧的扁平 Matrix 加密存储移动到当前账号作用域位置
- 当该密钥本地存在时，从旧的 rust 加密存储中提取之前保存的 Matrix 房间密钥备份解密密钥
- 当访问令牌稍后更改时，为同一 Matrix 账号、主服务器和用户复用最完整的现有令牌哈希存储根
- 当 Matrix 访问令牌已更改但账号/设备标识保持不变时，扫描兄弟令牌哈希存储根以查找待处理的加密状态恢复元数据
- 在下次 Matrix 启动时将备份的房间密钥恢复到新的加密存储中

快照详情：

- OpenClaw 在成功快照后将标记文件写入 `~/.openclaw/matrix/migration-snapshot.json`，以便后续启动和修复过程可以复用同一存档。
- 这些自动 Matrix 迁移快照仅备份配置 + 状态（`includeWorkspace: false`）。
- 如果 Matrix 只有警告级别的迁移状态，例如因为 `userId` 或 `accessToken` 仍然缺失，OpenClaw 尚不会创建快照，因为没有可操作的 Matrix 更改。
- 如果快照步骤失败，OpenClaw 会跳过该次运行的 Matrix 迁移，而不是在没有恢复点的情况下更改状态。

关于多账号升级：

- 最旧的扁平 Matrix 存储（`~/.openclaw/matrix/bot-storage.json` 和 `~/.openclaw/matrix/crypto/`）来自单存储布局，因此 OpenClaw 只能将其迁移到一个已解析的 Matrix 账号目标
- 已按账号作用域的遗留 Matrix 存储会按配置的 Matrix 账号检测和准备

## 迁移无法自动完成的工作

之前公开的 Matrix 插件**不会**自动创建 Matrix 房间密钥备份。它持久化本地加密状态并请求设备验证，但不保证你的房间密钥已备份到主服务器。

这意味着某些加密安装只能部分迁移。

OpenClaw 无法自动恢复：

- 从未备份的仅本地房间密钥
- 当目标 Matrix 账号尚未能解析时（因为 `homeserver`、`userId` 或 `accessToken` 仍不可用）的加密状态
- 当配置了多个 Matrix 账号但未设置 `channels.matrix.defaultAccount` 时，一个共享扁平 Matrix 存储的自动迁移
- 固定到仓库路径而非标准 Matrix 包的自定义插件路径安装
- 当旧存储有已备份的密钥但未在本地保留解密密钥时，缺少的恢复密钥

当前警告范围：

- 自定义 Matrix 插件路径安装会在 Gateway 启动和 `openclaw doctor` 中都显示

如果你的旧安装有从未备份的仅本地加密历史记录，升级后部分旧加密消息可能仍无法读取。

## 推荐的升级流程

1. 正常更新 OpenClaw 和 Matrix 插件。
   首选不带 `--no-restart` 的普通 `openclaw update`，这样启动时可以立即完成 Matrix 迁移。
2. 运行：

   ```bash
   openclaw doctor --fix
   ```

   如果 Matrix 有可操作的迁移工作，doctor 将首先创建或复用预迁移快照并打印存档路径。

3. 启动或重启 Gateway。
4. 检查当前验证和备份状态：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 如果 OpenClaw 告诉你需要恢复密钥，运行：

   ```bash
   openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"
   ```

6. 如果此设备仍未验证，运行：

   ```bash
   openclaw matrix verify device "<your-recovery-key>"
   ```

7. 如果你打算放弃无法恢复的旧历史记录，并希望为未来的消息建立全新的备份基线，运行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. 如果服务器端尚不存在密钥备份，为未来的恢复创建一个：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密迁移的工作原理

加密迁移是一个两阶段过程：

1. 启动或 `openclaw doctor --fix` 会在加密迁移可操作时创建或复用预迁移快照。
2. 启动或 `openclaw doctor --fix` 通过活跃的 Matrix 插件安装检查旧的 Matrix 加密存储。
3. 如果找到备份解密密钥，OpenClaw 将其写入新的恢复密钥流程并标记房间密钥恢复为待处理。
4. 在下次 Matrix 启动时，OpenClaw 自动将已备份的房间密钥恢复到新的加密存储中。

如果旧存储报告了从未备份的房间密钥，OpenClaw 会发出警告而不是假装恢复成功。

## 常见消息及其含义

### 升级和检测消息

`Matrix plugin upgraded in place.`

- 含义：检测到旧的磁盘 Matrix 状态并已迁移到当前布局。
- 操作：除非同一输出还包含警告，否则无需操作。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 含义：OpenClaw 在更改 Matrix 状态前创建了恢复存档。
- 操作：保留打印的存档路径，直到确认迁移成功。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 含义：OpenClaw 找到了现有的 Matrix 迁移快照标记，并复用了该存档而非创建重复备份。
- 操作：保留打印的存档路径，直到确认迁移成功。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含义：旧的 Matrix 状态存在，但 OpenClaw 因未配置 Matrix 而无法将其映射到当前 Matrix 账号。
- 操作：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 Gateway。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：OpenClaw 找到旧状态，但仍无法确定确切的当前账号/设备根。
- 操作：使用正常工作的 Matrix 登录启动一次 Gateway，或在缓存凭据存在后重新运行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到一个共享扁平 Matrix 存储，但拒绝猜测哪个命名 Matrix 账号应该接收它。
- 操作：将 `channels.matrix.defaultAccount` 设置为目标账号，然后重新运行 `openclaw doctor --fix` 或重启 Gateway。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 含义：新的账号作用域位置已有同步或加密存储，因此 OpenClaw 不会自动覆盖它。
- 操作：在手动删除或移动冲突目标之前，验证当前账号是否是正确的。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含义：OpenClaw 尝试移动旧的 Matrix 状态，但文件系统操作失败。
- 操作：检查文件系统权限和磁盘状态，然后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 含义：OpenClaw 找到旧的加密 Matrix 存储，但没有当前 Matrix 配置可以附加。
- 操作：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 Gateway。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：加密存储存在，但 OpenClaw 无法安全地确定它属于哪个当前账号/设备。
- 操作：使用正常工作的 Matrix 登录启动一次 Gateway，或在缓存凭据可用后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到一个共享扁平遗留加密存储，但拒绝猜测哪个命名 Matrix 账号应该接收它。
- 操作：将 `channels.matrix.defaultAccount` 设置为目标账号，然后重新运行 `openclaw doctor --fix` 或重启 Gateway。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含义：OpenClaw 检测到旧的 Matrix 状态，但迁移仍因缺少标识或凭据数据而阻塞。
- 操作：完成 Matrix 登录或配置设置，然后重新运行 `openclaw doctor --fix` 或重启 Gateway。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 含义：OpenClaw 找到旧的加密 Matrix 状态，但无法从通常检查该存储的 Matrix 插件加载辅助入口点。
- 操作：重新安装或修复 Matrix 插件（`openclaw plugins install @openclaw/matrix`，或从仓库检出时 `openclaw plugins install ./extensions/matrix`），然后重新运行 `openclaw doctor --fix` 或重启 Gateway。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 含义：OpenClaw 找到一个逃出插件根目录或未通过插件边界检查的辅助文件路径，因此拒绝导入。
- 操作：从可信路径重新安装 Matrix 插件，然后重新运行 `openclaw doctor --fix` 或重启 Gateway。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 含义：OpenClaw 因无法首先创建恢复快照而拒绝更改 Matrix 状态。
- 操作：解决备份错误，然后重新运行 `openclaw doctor --fix` 或重启 Gateway。

`Failed migrating legacy Matrix client storage: ...`

- 含义：Matrix 客户端侧回退找到旧的扁平存储，但移动失败。OpenClaw 现在会中止该回退，而不是静默地以全新存储启动。
- 操作：检查文件系统权限或冲突，保持旧状态完好，修复错误后重试。

`Matrix is installed from a custom path: ...`

- 含义：Matrix 固定到路径安装，因此主线更新不会自动将其替换为仓库的标准 Matrix 包。
- 操作：当你想返回默认 Matrix 插件时，使用 `openclaw plugins install @openclaw/matrix` 重新安装。

### 加密状态恢复消息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 含义：已备份的房间密钥已成功恢复到新的加密存储中。
- 操作：通常无需操作。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 含义：某些旧的房间密钥仅存在于旧本地存储中，从未上传到 Matrix 备份。
- 操作：预期某些旧的加密历史记录将不可用，除非你能从另一个已验证的客户端手动恢复这些密钥。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 含义：备份存在，但 OpenClaw 无法自动恢复恢复密钥。
- 操作：运行 `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"`。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 含义：OpenClaw 找到旧的加密存储，但无法安全地检查以准备恢复。
- 操作：重新运行 `openclaw doctor --fix`。如果问题持续，保持旧状态目录完好，并使用另一个已验证的 Matrix 客户端加 `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` 进行恢复。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 含义：OpenClaw 检测到备份密钥冲突，拒绝自动覆盖当前恢复密钥文件。
- 操作：在重试任何恢复命令之前，验证哪个恢复密钥是正确的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 含义：这是旧存储格式的硬限制。
- 操作：仍然可以恢复已备份的密钥，但仅本地加密历史记录可能仍无法访问。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 含义：新插件尝试恢复，但 Matrix 返回错误。
- 操作：运行 `openclaw matrix verify backup status`，如有需要，再使用 `openclaw matrix verify backup restore --recovery-key "<your-recovery-key>"` 重试。

### 手动恢复消息

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 含义：OpenClaw 知道你应该有备份密钥，但它未在此设备上激活。
- 操作：运行 `openclaw matrix verify backup restore`，如有需要传入 `--recovery-key`。

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- 含义：此设备当前未存储恢复密钥。
- 操作：先用恢复密钥验证设备，然后恢复备份。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- 含义：存储的密钥与活跃的 Matrix 备份不匹配。
- 操作：使用正确的密钥重新运行 `openclaw matrix verify device "<your-recovery-key>"`。

如果你接受丢失无法恢复的旧加密历史记录，也可以使用 `openclaw matrix verify backup reset --yes` 重置当前备份基线。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- 含义：备份存在，但此设备尚未足够强地信任交叉签名链。
- 操作：重新运行 `openclaw matrix verify device "<your-recovery-key>"`。

`Matrix recovery key is required`

- 含义：你尝试了一个需要恢复密钥的恢复步骤，但没有提供。
- 操作：使用恢复密钥重新运行命令。

`Invalid Matrix recovery key: ...`

- 含义：提供的密钥无法解析或不符合预期格式。
- 操作：使用来自 Matrix 客户端或恢复密钥文件的确切恢复密钥重试。

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- 含义：密钥已应用，但设备仍无法完成验证。
- 操作：确认你使用了正确的密钥，且账号上有可用的交叉签名，然后重试。

`Matrix key backup is not active on this device after loading from secret storage.`

- 含义：密钥存储未在此设备上产生活跃的备份会话。
- 操作：先验证设备，然后使用 `openclaw matrix verify backup status` 重新检查。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- 含义：此设备在设备验证完成之前无法从密钥存储恢复。
- 操作：先运行 `openclaw matrix verify device "<your-recovery-key>"`。

### 自定义插件安装消息

`Matrix is installed from a custom path that no longer exists: ...`

- 含义：你的插件安装记录指向一个已消失的本地路径。
- 操作：使用 `openclaw plugins install @openclaw/matrix` 重新安装，或从仓库检出运行时，使用 `openclaw plugins install ./extensions/matrix`。

## 如果加密历史记录仍无法恢复

按顺序运行这些检查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<your-recovery-key>" --verbose
```

如果备份成功恢复但某些旧房间的历史记录仍然缺失，这些缺失的密钥可能从未被之前的插件备份过。

## 如果你想为未来的消息重新开始

如果你接受丢失无法恢复的旧加密历史记录，只想为未来建立干净的备份基线，按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果之后设备仍未验证，通过比较 SAS 表情符号或十进制代码并确认它们匹配，从 Matrix 客户端完成验证。

## 相关页面

- [Matrix](/channels/matrix)
- [Doctor](/gateway/doctor)
- [迁移](/install/migrating)
- [插件](/tools/plugin)
