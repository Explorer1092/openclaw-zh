---
title: "Qwen"
mmh3_hash: "273ef37185086229f59df75798fc55cd"
summary: "在 OpenClaw 中使用 Qwen OAuth (免费层)"
read_when: ["您想将 Qwen 与 OpenClaw 一起使用","您想要免费层 OAuth 访问 Qwen Coder"]
---
# Qwen

Qwen 为 Qwen Coder 和 Qwen Vision 模型提供免费层 OAuth 流程
(每天 2,000 个请求,受 Qwen 速率限制约束)。

## 启用插件

```bash
openclaw plugins enable qwen-portal-auth
```

启用后重新启动网关。

## 身份验证

```bash
openclaw models auth login --provider qwen-portal --set-default
```

这将运行 Qwen 设备代码 OAuth 流程,并将提供商条目写入您的
`models.json`(加上用于快速切换的 `qwen` 别名)。

## 模型 ID

- `qwen-portal/coder-model`
- `qwen-portal/vision-model`

使用以下命令切换模型:

```bash
openclaw models set qwen-portal/coder-model
```

## 重用 Qwen Code CLI 登录

如果您已经使用 Qwen Code CLI 登录,OpenClaw 将在加载身份验证存储时从 `~/.qwen/oauth_creds.json` 同步凭据。您仍然需要一个 `models.providers.qwen-portal` 条目(使用上面的登录命令创建一个)。

## 注意事项

- 令牌自动刷新;如果刷新失败或访问被撤销,请重新运行登录命令。
- 默认基础 URL: `https://portal.qwen.ai/v1`(如果 Qwen 提供不同的端点,请使用 `models.providers.qwen-portal.baseUrl` 覆盖)。
- 有关提供商范围的规则,请参见 [模型提供商](/concepts/model-providers)。
{/*  source-hash: 1a6d36a480a0d6be73b2ffb3d731312c  */}
