---
mmh3_hash: "f987d767317992c60a9130b169a5d796"
summary: "安全地更新 OpenClaw（全局安装或源码），以及回滚策略"
read_when:
  - 更新 OpenClaw
  - 更新后出现问题
title: "更新"
---

# 更新

保持 OpenClaw 最新。

## 推荐：`openclaw update`

最快的更新方式。它检测你的安装类型（npm 或 git），获取最新版本，运行 `openclaw doctor`，并重启 Gateway。

```bash
openclaw update
```

切换频道或指定特定版本：

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # 预览而不实际应用
```

频道语义请参阅[发布频道](/install/development-channels)。

## 替代方案：重新运行安装程序

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

添加 `--no-onboard` 跳过引导向导。对于源码安装，传入 `--install-method git --no-onboard`。

## 替代方案：手动 npm 或 pnpm

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

## 自动更新程序

自动更新程序默认关闭。在 `~/.openclaw/openclaw.json` 中启用：

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| 频道     | 行为                                                                                           |
| -------- | ---------------------------------------------------------------------------------------------- |
| `stable` | 看到新版本时等待 `stableDelayHours`，然后在 `stableJitterHours` 内应用确定性抖动（分散部署）。 |
| `beta`   | 每 `betaCheckIntervalHours`（默认：每小时）检查一次，有可用更新时立即应用。                    |
| `dev`    | 不自动应用。使用 `openclaw update` 手动更新。                                                  |

Gateway 也会在启动时记录更新提示（通过 `update.checkOnStart: false` 禁用）。

## 更新后

<Steps>

### 运行 doctor

```bash
openclaw doctor
```

迁移配置、审计 DM 策略并检查 Gateway 健康状况。详情：[Doctor](/gateway/doctor)

### 重启 Gateway

```bash
openclaw gateway restart
```

### 验证

```bash
openclaw health
```

</Steps>

## 回滚

### 固定版本（npm）

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

提示：`npm view openclaw version` 显示当前发布的版本。

### 固定提交（源码）

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

返回最新版本：`git checkout main && git pull`。

## 遇到问题时

- 再次运行 `openclaw doctor` 并仔细阅读输出。
- 查看：[故障排除](/gateway/troubleshooting)
- 在 Discord 中提问：[https://discord.gg/clawd](https://discord.gg/clawd)
