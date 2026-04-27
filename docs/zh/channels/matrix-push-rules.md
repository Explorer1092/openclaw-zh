---
mmh3_hash: "28d07444b24480f3889f515cdbfceeac"
summary: "为安静的已完成预览编辑设置每个接收者的 Matrix 推送规则"
read_when:
  - 为自托管 Synapse 或 Tuwunel 配置 Matrix 安静流式传输
  - 用户希望仅在完成块时收到通知，而不是每次预览编辑时
title: "Matrix 安静预览推送规则"
---

当 `channels.matrix.streaming` 设置为 `"quiet"` 时，OpenClaw 会就地编辑单个预览事件，并使用自定义内容标记来标记已完成的编辑。Matrix 客户端仅当每用户推送规则匹配该标记时才会对最终编辑发送通知。本页适用于自托管 Matrix 并希望为每个接收者账户安装该规则的运营者。

如果您只想使用标准 Matrix 通知行为，请使用 `streaming: "partial"` 或关闭流式传输。请参阅 [Matrix Channel 设置](/channels/matrix#streaming-previews)。

## 前提条件

- 接收者用户 = 应接收通知的人
- 机器人用户 = 发送回复的 OpenClaw Matrix 账户
- 使用接收者用户的访问令牌调用下述 API
- 在推送规则中将 `sender` 匹配为机器人用户的完整 MXID
- 接收者账户必须已有正常工作的推送器 — 安静预览规则仅在正常 Matrix 推送送达正常时才有效

## 步骤

<Steps>
  <Step title="配置安静预览">

```json5
{
  channels: {
    matrix: {
      streaming: "quiet",
    },
  },
}
```

  </Step>

  <Step title="获取接收者的访问令牌">
    尽量复用现有的客户端 Session 令牌。如需创建新令牌：

```bash
curl -sS -X POST \
  "https://matrix.example.org/_matrix/client/v3/login" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "m.login.password",
    "identifier": { "type": "m.id.user", "user": "@alice:example.org" },
    "password": "REDACTED"
  }'
```

  </Step>

  <Step title="验证推送器是否存在">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushers"
```

如果没有返回推送器，请先为该账户修复正常的 Matrix 推送送达，再继续操作。

  </Step>

  <Step title="安装覆盖推送规则">
    OpenClaw 使用 `content["com.openclaw.finalized_preview"] = true` 标记已完成的纯文本预览编辑。安装一条同时匹配该标记和机器人 MXID 作为发送者的规则：

```bash
curl -sS -X PUT \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname" \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "conditions": [
      { "kind": "event_match", "key": "type", "pattern": "m.room.message" },
      {
        "kind": "event_property_is",
        "key": "content.m\\.relates_to.rel_type",
        "value": "m.replace"
      },
      {
        "kind": "event_property_is",
        "key": "content.com\\.openclaw\\.finalized_preview",
        "value": true
      },
      { "kind": "event_match", "key": "sender", "pattern": "@bot:example.org" }
    ],
    "actions": [
      "notify",
      { "set_tweak": "sound", "value": "default" },
      { "set_tweak": "highlight", "value": false }
    ]
  }'
```

    运行前请替换以下内容：

    - `https://matrix.example.org`：您的家服务器基础 URL
    - `$USER_ACCESS_TOKEN`：接收者用户的访问令牌
    - `openclaw-finalized-preview-botname`：每个机器人每个接收者唯一的规则 ID（格式：`openclaw-finalized-preview-<botname>`）
    - `@bot:example.org`：您的 OpenClaw 机器人 MXID，而非接收者的 MXID

  </Step>

  <Step title="验证">

```bash
curl -sS \
  -H "Authorization: Bearer $USER_ACCESS_TOKEN" \
  "https://matrix.example.org/_matrix/client/v3/pushrules/global/override/openclaw-finalized-preview-botname"
```

然后测试一次流式回复。在安静模式下，房间会显示安静的草稿预览，并在块或轮次完成时发送一次通知。

  </Step>
</Steps>

若需稍后删除规则，请使用接收者令牌对同一规则 URL 发送 `DELETE` 请求。

## 多机器人说明

推送规则以 `ruleId` 为键：对同一 ID 重新执行 `PUT` 会更新单条规则。若多个 OpenClaw 机器人向同一接收者发送通知，请为每个机器人创建一条具有不同发送者匹配的规则。

新的用户自定义 `override` 规则会插入在默认抑制规则之前，因此无需额外的排序参数。该规则仅影响可就地完成的纯文本预览编辑；媒体回退和过期预览回退使用正常的 Matrix 送达方式。

## 家服务器说明

<AccordionGroup>
  <Accordion title="Synapse">
    无需修改特殊的 `homeserver.yaml` 配置。如果正常的 Matrix 通知已能送达该用户，则接收者令牌加上上述 `pushrules` 调用就是主要配置步骤。

    如果您在反向代理或 worker 后面运行 Synapse，请确保 `/_matrix/client/.../pushrules/` 能正确到达 Synapse。推送送达由主进程或 `synapse.app.pusher` / 配置的推送 worker 处理 — 请确保这些组件运行正常。

    该规则使用 `event_property_is` 推送规则条件（MSC3758，推送规则 v1.10），该条件于 2023 年添加到 Synapse 中。旧版 Synapse 接受 `PUT pushrules/...` 调用，但会静默地无法匹配该条件 — 如果在已完成的预览编辑上未收到通知，请升级 Synapse。

  </Accordion>

  <Accordion title="Tuwunel">
    流程与 Synapse 相同；已完成预览标记无需任何 Tuwunel 专属配置。

    如果用户在另一台设备上处于活跃状态时通知消失，请检查是否启用了 `suppress_push_when_active`。Tuwunel 在 1.4.2 版本（2025 年 9 月）中添加了此选项，它可能会在一台设备处于活跃状态时故意抑制向其他设备的推送。

  </Accordion>
</AccordionGroup>

## 相关链接

- [Matrix Channel 设置](/channels/matrix)
- [流式传输概念](/concepts/streaming)
