---
read_when:
  - 升级现有的 Matrix 安装
  - 迁移加密的 Matrix 历史记录和设备状态
summary: OpenClaw 如何就地升级旧版 Matrix 插件，包括加密状态恢复限制和手动恢复步骤
title: Matrix 迁移
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: 69b7530846b977632b699dc3f880841c959c157919fb8115b783eca674a497fb
  source_path: install/migrating-matrix.md
  workflow: 15
---

# Matrix 迁移

本页介绍从旧版公共 `matrix` 插件升级到当前实现的过程。

对于大多数用户，升级是就地进行的：

- 插件仍为 `@openclaw/matrix`
- 渠道仍为 `matrix`
- 配置仍在 `channels.matrix` 下
- 缓存的凭证仍在 `~/.openclaw/credentials/matrix/`
- 运行时状态仍在 `~/.openclaw/matrix/`

你不需要重命名配置键，也不需要以新名称重新安装插件。

## 自动迁移的内容

当 Gateway 网关启动时，以及当你运行 [`openclaw doctor --fix`](/gateway/doctor) 时，OpenClaw 会尝试自动修复旧版 Matrix 状态。
在任何可操作的 Matrix 迁移步骤修改磁盘状态之前，OpenClaw 会创建或复用一个专注的恢复快照。

当你使用 `openclaw update` 时，触发时机取决于 OpenClaw 的安装方式：

- 源码安装在更新流程中运行 `openclaw doctor --fix`，然后默认重启 Gateway 网关
- 包管理器安装更新包，运行非交互式 doctor 检查，然后依赖默认的 Gateway 网关重启以完成 Matrix 迁移
- 如果你使用 `openclaw update --no-restart`，启动时的 Matrix 迁移会推迟到你后续运行 `openclaw doctor --fix` 并重启 Gateway 网关

自动迁移涵盖：

- 在 `~/Backups/openclaw-migrations/` 下创建或复用迁移前快照
- 复用你缓存的 Matrix 凭证
- 保持相同的账户选择和 `channels.matrix` 配置
- 将最旧的扁平 Matrix 同步存储移到当前账户范围内的位置
- 当目标账户可以安全解析时，将最旧的扁平 Matrix 加密存储移到当前账户范围内的位置
- 从旧版 rust 加密存储中提取之前保存的 Matrix 房间密钥备份解密密钥（当该密钥本地存在时）
- 当访问令牌后来发生变化时，为相同 Matrix 账户、主服务器和用户复用最完整的现有令牌哈希存储根
- 当 Matrix 访问令牌发生变化但账户/设备身份保持不变时，扫描同级令牌哈希存储根以查找待处理的加密状态恢复元数据
- 在下次 Matrix 启动时将备份的房间密钥恢复到新的加密存储中

快照详情：

- OpenClaw 在成功快照后在 `~/.openclaw/matrix/migration-snapshot.json` 写入标记文件，以便后续的启动和修复过程可以复用同一归档。
- 这些自动 Matrix 迁移快照仅备份配置和状态（`includeWorkspace: false`）。
- 如果 Matrix 只有仅警告的迁移状态（例如因为 `userId` 或 `accessToken` 仍缺失），OpenClaw 不会创建快照，因为还没有可操作的 Matrix 变更。
- 如果快照步骤失败，OpenClaw 会跳过该次运行的 Matrix 迁移，而不是在没有恢复点的情况下修改状态。

关于多账户升级：

- 最旧的扁平 Matrix 存储（`~/.openclaw/matrix/bot-storage.json` 和 `~/.openclaw/matrix/crypto/`）来自单存储布局，因此 OpenClaw 只能将其迁移到一个已解析的 Matrix 账户目标
- 已按账户分组的旧版 Matrix 存储会按配置的 Matrix 账户逐一检测和准备

## 自动迁移无法做到的

旧版公共 Matrix 插件**没有**自动创建 Matrix 房间密钥备份。它持久化了本地加密状态并请求设备验证，但没有保证你的房间密钥备份到了主服务器。

这意味着一些加密安装只能部分迁移。

OpenClaw 无法自动恢复：

- 从未备份的仅本地房间密钥
- 当目标 Matrix 账户尚未解析（因为 `homeserver`、`userId` 或 `accessToken` 仍不可用）时的加密状态
- 当配置了多个 Matrix 账户但未设置 `channels.matrix.defaultAccount` 时，一个共享扁平 Matrix 存储的自动迁移
- 固定到仓库路径而非标准 Matrix 包的自定义插件路径安装
- 当旧存储有备份密钥但未在本地保留解密密钥时缺失的恢复密钥

当前警告范围：

- 自定义 Matrix 插件路径安装会在 Gateway 网关启动和 `openclaw doctor` 中显示

如果你的旧安装有从未备份的仅本地加密历史记录，升级后部分较旧的加密消息可能仍然无法读取。

## 推荐升级流程

1. 正常更新 OpenClaw 和 Matrix 插件。
   优先使用不带 `--no-restart` 的普通 `openclaw update`，以便启动时可以立即完成 Matrix 迁移。
2. 运行：

   ```bash
   openclaw doctor --fix
   ```

   如果 Matrix 有可操作的迁移工作，doctor 会先创建或复用迁移前快照并打印归档路径。

3. 启动或重启 Gateway 网关。
4. 检查当前验证和备份状态：

   ```bash
   openclaw matrix verify status
   openclaw matrix verify backup status
   ```

5. 如果 OpenClaw 告知需要恢复密钥，运行：

   ```bash
   openclaw matrix verify backup restore --recovery-key "<你的恢复密钥>"
   ```

6. 如果此设备仍未验证，运行：

   ```bash
   openclaw matrix verify device "<你的恢复密钥>"
   ```

7. 如果你打算放弃无法恢复的旧历史记录并想要未来消息的新备份基线，运行：

   ```bash
   openclaw matrix verify backup reset --yes
   ```

8. 如果服务器端尚无密钥备份，创建一个以供将来恢复：

   ```bash
   openclaw matrix verify bootstrap
   ```

## 加密迁移的工作原理

加密迁移是一个两阶段过程：

1. 启动或 `openclaw doctor --fix` 在加密迁移可操作时创建或复用迁移前快照。
2. 启动或 `openclaw doctor --fix` 通过活跃的 Matrix 插件安装检查旧版 Matrix 加密存储。
3. 如果找到备份解密密钥，OpenClaw 将其写入新的恢复密钥流程并将房间密钥恢复标记为待处理。
4. 在下次 Matrix 启动时，OpenClaw 自动将备份的房间密钥恢复到新的加密存储中。

如果旧存储报告有从未备份的房间密钥，OpenClaw 会发出警告，而不是假装恢复成功。

## 常见消息及其含义

### 升级和检测消息

`Matrix plugin upgraded in place.`

- 含义：检测到旧版磁盘 Matrix 状态并已迁移到当前布局。
- 操作：无需操作，除非同一输出中还包含警告。

`Matrix migration snapshot created before applying Matrix upgrades.`

- 含义：OpenClaw 在修改 Matrix 状态之前创建了恢复归档。
- 操作：保留打印的归档路径，直到确认迁移成功。

`Matrix migration snapshot reused before applying Matrix upgrades.`

- 含义：OpenClaw 找到现有的 Matrix 迁移快照标记并复用了该归档，而不是创建重复备份。
- 操作：保留打印的归档路径，直到确认迁移成功。

`Legacy Matrix state detected at ... but channels.matrix is not configured yet.`

- 含义：存在旧版 Matrix 状态，但 OpenClaw 无法将其映射到当前 Matrix 账户，因为 Matrix 未配置。
- 操作：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix state detected at ... but the new account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：OpenClaw 找到了旧状态，但仍无法确定确切的当前账户/设备根目录。
- 操作：使用有效的 Matrix 登录启动 Gateway 网关一次，或在缓存凭证存在后重新运行 `openclaw doctor --fix`。

`Legacy Matrix state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到一个共享的扁平 Matrix 存储，但拒绝猜测哪个命名 Matrix 账户应该接收它。
- 操作：将 `channels.matrix.defaultAccount` 设置为预期账户，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Matrix legacy sync store not migrated because the target already exists (...)`

- 含义：新的账户范围位置已有同步或加密存储，因此 OpenClaw 不会自动覆盖它。
- 操作：在手动删除或移动冲突目标之前，验证当前账户是否正确。

`Failed migrating Matrix legacy sync store (...)` 或 `Failed migrating Matrix legacy crypto store (...)`

- 含义：OpenClaw 尝试移动旧版 Matrix 状态但文件系统操作失败。
- 操作：检查文件系统权限和磁盘状态，然后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but channels.matrix is not configured yet.`

- 含义：OpenClaw 找到旧版加密 Matrix 存储，但没有当前 Matrix 配置可供附加。
- 操作：配置 `channels.matrix`，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix encrypted state detected at ... but the account-scoped target could not be resolved yet (need homeserver, userId, and access token for channels.matrix...).`

- 含义：加密存储存在，但 OpenClaw 无法安全确定它属于哪个当前账户/设备。
- 操作：使用有效的 Matrix 登录启动 Gateway 网关一次，或在缓存凭证可用后重新运行 `openclaw doctor --fix`。

`Legacy Matrix encrypted state detected at ... but multiple Matrix accounts are configured and channels.matrix.defaultAccount is not set.`

- 含义：OpenClaw 找到一个共享的扁平旧版加密存储，但拒绝猜测哪个命名 Matrix 账户应该接收它。
- 操作：将 `channels.matrix.defaultAccount` 设置为预期账户，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Matrix migration warnings are present, but no on-disk Matrix mutation is actionable yet. No pre-migration snapshot was needed.`

- 含义：OpenClaw 检测到旧版 Matrix 状态，但迁移仍被缺失的身份或凭证数据阻塞。
- 操作：完成 Matrix 登录或配置设置，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Legacy Matrix encrypted state was detected, but the Matrix plugin helper is unavailable. Install or repair @openclaw/matrix so OpenClaw can inspect the old rust crypto store before upgrading.`

- 含义：OpenClaw 找到旧版加密 Matrix 状态，但无法从 Matrix 插件加载通常检查该存储的辅助入口点。
- 操作：重新安装或修复 Matrix 插件（`openclaw plugins install @openclaw/matrix`，或对于仓库检出 `openclaw plugins install ./path/to/local/matrix-plugin`），然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Matrix plugin helper path is unsafe: ... Reinstall @openclaw/matrix and try again.`

- 含义：OpenClaw 找到一个从插件根目录逃逸或未通过插件边界检查的辅助文件路径，因此拒绝导入它。
- 操作：从受信任的路径重新安装 Matrix 插件，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`- Failed creating a Matrix migration snapshot before repair: ...`

`- Skipping Matrix migration changes for now. Resolve the snapshot failure, then rerun "openclaw doctor --fix".`

- 含义：OpenClaw 拒绝修改 Matrix 状态，因为它无法先创建恢复快照。
- 操作：解决备份错误，然后重新运行 `openclaw doctor --fix` 或重启 Gateway 网关。

`Failed migrating legacy Matrix client storage: ...`

- 含义：Matrix 客户端侧回退找到旧的扁平存储，但移动失败。OpenClaw 现在会中止该回退，而不是悄悄以新存储启动。
- 操作：检查文件系统权限或冲突，保持旧状态完整，修复错误后重试。

`Matrix is installed from a custom path: ...`

- 含义：Matrix 固定到路径安装，因此主线更新不会自动将其替换为仓库的标准 Matrix 包。
- 操作：当你想返回默认 Matrix 插件时，使用 `openclaw plugins install @openclaw/matrix` 重新安装。

### 加密状态恢复消息

`matrix: restored X/Y room key(s) from legacy encrypted-state backup`

- 含义：备份的房间密钥已成功恢复到新的加密存储中。
- 操作：通常无需操作。

`matrix: N legacy local-only room key(s) were never backed up and could not be restored automatically`

- 含义：一些旧房间密钥只存在于旧本地存储中，从未上传到 Matrix 备份。
- 操作：预期一些旧加密历史记录将保持不可访问，除非你能从另一个已验证的客户端手动恢复这些密钥。

`Legacy Matrix encrypted state for account "..." has backed-up room keys, but no local backup decryption key was found. Ask the operator to run "openclaw matrix verify backup restore --recovery-key <key>" after upgrade if they have the recovery key.`

- 含义：备份存在，但 OpenClaw 无法自动恢复恢复密钥。
- 操作：运行 `openclaw matrix verify backup restore --recovery-key "<你的恢复密钥>"`。

`Failed inspecting legacy Matrix encrypted state for account "..." (...): ...`

- 含义：OpenClaw 找到旧的加密存储，但无法安全地检查它以准备恢复。
- 操作：重新运行 `openclaw doctor --fix`。如果重复出现，保持旧状态目录完整，使用另一个已验证的 Matrix 客户端加上 `openclaw matrix verify backup restore --recovery-key "<你的恢复密钥>"` 进行恢复。

`Legacy Matrix backup key was found for account "...", but .../recovery-key.json already contains a different recovery key. Leaving the existing file unchanged.`

- 含义：OpenClaw 检测到备份密钥冲突，拒绝自动覆盖当前恢复密钥文件。
- 操作：在重试任何恢复命令之前，验证哪个恢复密钥是正确的。

`Legacy Matrix encrypted state for account "..." cannot be fully converted automatically because the old rust crypto store does not expose all local room keys for export.`

- 含义：这是旧存储格式的硬性限制。
- 操作：备份的密钥仍然可以恢复，但仅本地的加密历史记录可能仍然不可访问。

`matrix: failed restoring room keys from legacy encrypted-state backup: ...`

- 含义：新插件尝试恢复，但 Matrix 返回了错误。
- 操作：运行 `openclaw matrix verify backup status`，然后在需要时使用 `openclaw matrix verify backup restore --recovery-key "<你的恢复密钥>"` 重试。

### 手动恢复消息

`Backup key is not loaded on this device. Run 'openclaw matrix verify backup restore' to load it and restore old room keys.`

- 含义：OpenClaw 知道你应该有一个备份密钥，但它在此设备上未激活。
- 操作：运行 `openclaw matrix verify backup restore`，如果需要则传入 `--recovery-key`。

`Store a recovery key with 'openclaw matrix verify device <key>', then run 'openclaw matrix verify backup restore'.`

- 含义：此设备当前未存储恢复密钥。
- 操作：先用你的恢复密钥验证设备，然后恢复备份。

`Backup key mismatch on this device. Re-run 'openclaw matrix verify device <key>' with the matching recovery key.`

- 含义：存储的密钥与活跃的 Matrix 备份不匹配。
- 操作：使用正确的密钥重新运行 `openclaw matrix verify device "<你的恢复密钥>"`。

如果你接受丢失无法恢复的旧加密历史记录，可以改用 `openclaw matrix verify backup reset --yes` 重置当前备份基线。

`Backup trust chain is not verified on this device. Re-run 'openclaw matrix verify device <key>'.`

- 含义：备份存在，但此设备尚未足够强地信任交叉签名链。
- 操作：重新运行 `openclaw matrix verify device "<你的恢复密钥>"`。

`Matrix recovery key is required`

- 含义：你在需要恢复密钥的情况下尝试了恢复步骤但未提供恢复密钥。
- 操作：用你的恢复密钥重新运行命令。

`Invalid Matrix recovery key: ...`

- 含义：提供的密钥无法解析或与预期格式不匹配。
- 操作：使用来自你的 Matrix 客户端或恢复密钥文件的确切恢复密钥重试。

`Matrix device is still unverified after applying recovery key. Verify your recovery key and ensure cross-signing is available.`

- 含义：密钥已应用，但设备仍无法完成验证。
- 操作：确认你使用了正确的密钥，且账户上交叉签名可用，然后重试。

`Matrix key backup is not active on this device after loading from secret storage.`

- 含义：秘密存储未在此设备上产生活跃的备份会话。
- 操作：先验证设备，然后用 `openclaw matrix verify backup status` 重新检查。

`Matrix crypto backend cannot load backup keys from secret storage. Verify this device with 'openclaw matrix verify device <key>' first.`

- 含义：此设备在设备验证完成之前无法从秘密存储恢复。
- 操作：先运行 `openclaw matrix verify device "<你的恢复密钥>"`。

### 自定义插件安装消息

`Matrix is installed from a custom path that no longer exists: ...`

- 含义：你的插件安装记录指向一个已不存在的本地路径。
- 操作：使用 `openclaw plugins install @openclaw/matrix` 重新安装，或者如果你从仓库检出运行，则使用 `openclaw plugins install ./path/to/local/matrix-plugin`。

## 如果加密历史记录仍然无法恢复

按顺序运行以下检查：

```bash
openclaw matrix verify status --verbose
openclaw matrix verify backup status --verbose
openclaw matrix verify backup restore --recovery-key "<你的恢复密钥>" --verbose
```

如果备份成功恢复，但一些旧房间仍然缺少历史记录，这些缺失的密钥可能从未被之前的插件备份过。

## 如果你想为未来的消息重新开始

如果你接受丢失无法恢复的旧加密历史记录，只想要一个干净的备份基线以供将来使用，按顺序运行以下命令：

```bash
openclaw matrix verify backup reset --yes
openclaw matrix verify backup status --verbose
openclaw matrix verify status
```

如果此后设备仍未验证，从你的 Matrix 客户端通过比较 SAS 表情或十进制代码并确认它们匹配来完成验证。

## 相关页面

- [Matrix](/channels/matrix)
- [Doctor](/gateway/doctor)
- [迁移](/install/migrating)
- [插件](/tools/plugin)
