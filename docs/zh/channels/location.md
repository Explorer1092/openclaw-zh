---
title: "频道位置解析"
sidebarTitle: "频道位置解析"
mmh3_hash: "217d36d7852048c64187fc3703b33d73"
summary: "入站渠道位置解析（Telegram + WhatsApp）和上下文字段"
read_when:
  - Adding or modifying channel location parsing
  - Using location context fields in agent prompts or tools
---

# 频道位置解析

OpenClaw 将来自聊天渠道的共享位置规范化为：
- 附加到入站消息正文的人类可读文本，以及
- 自动回复上下文载荷中的结构化字段。

当前支持：
- **Telegram**（位置标记 + 场所 + 实时位置）
- **WhatsApp**（locationMessage + liveLocationMessage）
- **Matrix**（带有 `geo_uri` 的 `m.location`）

## 文本格式
位置呈现为友好的文本行，不带括号：

- 位置标记：
  - `📍 48.858844, 2.294351 ±12m`
- 命名地点：
  - `📍 Eiffel Tower — Champ de Mars, Paris (48.858844, 2.294351 ±12m)`
- 实时共享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果渠道包含说明/评论，它会被附加到下一行：
```
📍 48.858844, 2.294351 ±12m
Meet here
```

## 上下文字段
当存在位置时，这些字段会被添加到 `ctx`：
- `LocationLat`（数字）
- `LocationLon`（数字）
- `LocationAccuracy`（数字，米；可选）
- `LocationName`（字符串；可选）
- `LocationAddress`（字符串；可选）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（布尔值）

## 渠道说明
- **Telegram**：场所映射到 `LocationName/LocationAddress`；实时位置使用 `live_period`。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 会作为说明行附加。
- **Matrix**：`geo_uri` 被解析为位置标记；海拔被忽略，`LocationIsLive` 始终为 false。
