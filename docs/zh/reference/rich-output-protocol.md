---
mmh3_hash: "2756b4693ab1bf2a53687d1cf466029a"
---
# 富输出协议

助手输出可以携带一小组投递/渲染指令：

- `MEDIA:` 用于附件投递
- `[[audio_as_voice]]` 用于音频呈现提示
- `[[reply_to_current]]` / `[[reply_to:<id>]]` 用于回复元数据
- `[embed ...]` 用于 Control UI 富渲染

这些指令是独立的。`MEDIA:` 和回复/语音标签保持投递元数据；`[embed ...]` 是仅限 Web 的富渲染路径。

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
