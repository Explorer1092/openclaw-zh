---
mmh3_hash: "e9cc0f95317a47ada30447ef4b77c971"
summary: "embed、媒体、音频提示和回复的富输出短代码协议"
read_when:
  - 在 Control UI 中更改助手输出渲染
  - 调试 `[embed ...]`、`MEDIA:`、回复或音频呈现指令
title: "富输出协议"
---

# 富输出协议

助手输出可以携带一小组投递/渲染指令：

- `MEDIA:` 用于附件投递
- `[[audio_as_voice]]` 用于音频呈现提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

远程 `MEDIA:` 附件必须是公开的 `https:` URL。纯 `http:`、回环、链路本地、私有和内部主机名将被忽略为附件指令；服务器端媒体获取器仍然会执行自己的网络守卫。

这些指令是独立的。`MEDIA:` 和回复/语音标签保持投递元数据；`[embed ...]` 是仅限 Web 的富渲染路径。受信任的工具结果媒体在投递前使用相同的 `MEDIA:` / `[[audio_as_voice]]` 解析器，因此文本工具输出仍然可以将音频附件标记为语音消息。

当启用块流式传输时，`MEDIA:` 在一轮中仍然是单次投递元数据。如果相同的媒体 URL 在流式块中发送并在最终助手有效负载中重复，OpenClaw 只投递一次附件并从最终有效负载中删除重复项。

## `[embed ...]`

`[embed ...]` 是 Control UI 中面向 Agent 的唯一富渲染语法。

自闭合示例：

```text
[embed ref="cv_123" title="Status" /]
```

规则：

- `[view ...]` 对于新输出不再有效。
- Embed 短代码仅在助手消息界面中渲染。
- 只有 URL 支持的 embed 会被渲染。使用 `ref="..."` 或 `url="..."`。
- 块形式内联 HTML embed 短代码不会被渲染。
- Web UI 从可见文本中剥离短代码并内联渲染 embed。
- `MEDIA:` 不是 embed 别名，不应用于富 embed 渲染。

## 存储的渲染形状

规范化/存储的助手内容块是一个结构化的 `canvas` 项目：

```json
{
  "type": "canvas",
  "preview": {
    "kind": "canvas",
    "surface": "assistant_message",
    "render": "url",
    "viewId": "cv_123",
    "url": "/__openclaw__/canvas/documents/cv_123/index.html",
    "title": "Status",
    "preferredHeight": 320
  }
}
```

存储/渲染的富块直接使用这个 `canvas` 形状。`present_view` 不被识别。

## 相关

- [RPC 适配器](/reference/rpc)
- [Typebox](/concepts/typebox)
