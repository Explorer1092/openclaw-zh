---
title: "Poll"
mmh3_hash: "9ffa93bb16fef117cddb4fb937843dcf"
---
--channel: `whatsapp` (默认), `discord`, 或 `msteams`
--poll-multi: 允许选择多个选项
--poll-duration-hours: 仅 Discord (省略时默认为 24)

## 网关 RPC

方法: `poll`

参数:
- `to` (字符串, 必需)
- `question` (字符串, 必需)
- `options` (字符串数组, 必需)
- `maxSelections` (数字, 可选)
- `durationHours` (数字, 可选)
- `channel` (字符串, 可选, 默认: `whatsapp`)
- `idempotencyKey` (字符串, 必需)

## 频道差异
- WhatsApp: 2-12 个选项, `maxSelections` 必须在选项计数内, 忽略 `durationHours`.
- Discord: 2-10 个选项, `durationHours` 限制在 1-768 小时 (默认 24). `maxSelections > 1` 启用多选; Discord 不支持严格的选择计数.
- MS Teams: 自适应卡片投票 (OpenClaw 管理). 无原生投票 API; `durationHours` 被忽略.

## 智能体工具 (Message)
使用带有 `poll` 动作 (`to`, `pollQuestion`, `pollOption`, 可选 `pollMulti`, `pollDurationHours`, `channel`) 的 `message` 工具。

注意：Discord 没有“精确选择 N 个”模式；`pollMulti` 映射到多选。
Teams 投票渲染为自适应卡片，并要求网关保持在线以在 `~/.openclaw/msteams-polls.json` 中记录投票。

```