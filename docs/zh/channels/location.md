---
mmh3_hash: "327e734ac2b0f23d66f35dd9dbad9ec4"
summary: "入站渠道位置解析（Telegram/WhatsApp/Matrix）和上下文字段"
read_when:
  - 添加或修改渠道位置解析
  - 在 Agent 提示或工具中使用位置上下文字段
title: "Channel location parsing"
sidebarTitle: "频道位置解析"
---

OpenClaw 将来自聊天渠道的共享位置规范化为：

- 附加到入站消息正文的简洁坐标文本，以及
- 自动回复上下文载荷中的结构化字段。渠道提供的标签、地址和说明/评论通过共享的非信任元数据 JSON 块渲染到提示中，而不是内联在用户正文中。

当前支持：

- **Telegram**（位置标记 + 场所 + 实时位置）
- **WhatsApp**（locationMessage + liveLocationMessage）
- **Matrix**（带有 `geo_uri` 的 `m.location`）

## 文本格式

位置呈现为友好的文本行，不带括号：

- 位置标记：
  - `📍 48.858844, 2.294351 ±12m`
- 命名地点：
  - `📍 48.858844, 2.294351 ±12m`
- 实时共享：
  - `🛰 Live location: 48.858844, 2.294351 ±12m`

如果渠道包含标签、地址或说明/评论，它会被保留在上下文载荷中，并在提示中以受限的非信任 JSON 形式出现：

````text
Location (untrusted metadata):
```json
{
  "latitude": 48.858844,
  "longitude": 2.294351,
  "name": "Eiffel Tower",
  "address": "Champ de Mars, Paris",
  "caption": "Meet here"
}
```
````

## 上下文字段

当存在位置时，这些字段会被添加到 `ctx`：

- `LocationLat`（数字）
- `LocationLon`（数字）
- `LocationAccuracy`（数字，米；可选）
- `LocationName`（字符串；可选）
- `LocationAddress`（字符串；可选）
- `LocationSource`（`pin | place | live`）
- `LocationIsLive`（布尔值）
- `LocationCaption`（字符串；可选）

提示渲染器将 `LocationName`、`LocationAddress` 和 `LocationCaption` 视为非信任元数据，并通过与其他渠道上下文相同的有界 JSON 路径进行序列化。

## 渠道说明

- **Telegram**：场所映射到 `LocationName/LocationAddress`；实时位置使用 `live_period`。
- **WhatsApp**：`locationMessage.comment` 和 `liveLocationMessage.caption` 填充 `LocationCaption`。
- **Matrix**：`geo_uri` 被解析为位置标记；海拔被忽略，`LocationIsLive` 始终为 false。

## 相关

- [Location command (nodes)](/nodes/location-command)
- [Camera capture](/nodes/camera)
- [Media understanding](/nodes/media-understanding)
