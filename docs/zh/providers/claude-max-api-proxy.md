---
title: "Claude Max API Proxy"
sidebarTitle: "Claude Max API Proxy"
mmh3_hash: "51a95f8b87b960b106dca4bd2912f049"
summary: "社区代理，将 Claude 订阅凭据公开为 OpenAI 兼容端点"
read_when:
  - 您想将 Claude Max 订阅与 OpenAI 兼容工具一起使用
  - 您想要一个包装 Claude Code CLI 的本地 API 服务器
  - 您想评估基于订阅与基于 API 密钥的 Anthropic 访问
---

**claude-max-api-proxy** 是一个社区工具，它将您的 Claude Max/Pro 订阅公开为 OpenAI 兼容的 API 端点。这允许您将订阅与任何支持 OpenAI API 格式的工具一起使用。

<Warning>
此路径仅适用于技术兼容性。Anthropic 过去曾阻止 Claude Code 之外的某些订阅使用。您必须自行决定是否使用它，并在依赖它之前验证 Anthropic 的当前条款。
</Warning>

## 为什么使用这个？

| 方法                    | 成本                                                      | 最适合                         |
| ----------------------- | --------------------------------------------------------- | ------------------------------ |
| Anthropic API           | 按 token 付费（Opus 约 $15/M 输入，$75/M 输出）           | 生产应用，高容量                |
| Claude Max 订阅         | 每月 $200 固定费用                                        | 个人使用，开发，无限使用         |

如果您有 Claude Max 订阅并想将其与 OpenAI 兼容工具一起使用，此代理可能会降低某些工作流的成本。API 密钥仍然是生产用途中更清晰的策略路径。

## 工作原理

```
您的应用 → claude-max-api-proxy → Claude Code CLI → Anthropic（通过订阅）
    (OpenAI 格式)              (转换格式)        (使用您的登录)
```

代理：

1. 在 `http://localhost:3456/v1/chat/completions` 接受 OpenAI 格式的请求
2. 将它们转换为 Claude Code CLI 命令
3. 以 OpenAI 格式返回响应（支持流式传输）

## 快速开始

<Steps>
  <Step title="安装代理">
    需要 Node.js 20+ 和 Claude Code CLI。

    ```bash
    npm install -g claude-max-api-proxy

    # 验证 Claude CLI 已认证
    claude --version
    ```

  </Step>
  <Step title="启动服务器">
    ```bash
    claude-max-api
    # 服务器运行在 http://localhost:3456
    ```
  </Step>
  <Step title="测试代理">
    ```bash
    # 健康检查
    curl http://localhost:3456/health

    # 列出模型
    curl http://localhost:3456/v1/models

    # 聊天补全
    curl http://localhost:3456/v1/chat/completions \
      -H "Content-Type: application/json" \
      -d '{
        "model": "claude-opus-4",
        "messages": [{"role": "user", "content": "Hello!"}]
      }'
    ```

  </Step>
  <Step title="配置 OpenClaw">
    将 OpenClaw 指向代理作为自定义 OpenAI 兼容端点：

    ```json5
    {
      env: {
        OPENAI_API_KEY: "not-needed",
        OPENAI_BASE_URL: "http://localhost:3456/v1",
      },
      agents: {
        defaults: {
          model: { primary: "openai/claude-opus-4" },
        },
      },
    }
    ```

  </Step>
</Steps>

## 内置目录

| Model ID          | 映射到          |
| ----------------- | --------------- |
| `claude-opus-4`   | Claude Opus 4   |
| `claude-sonnet-4` | Claude Sonnet 4 |
| `claude-haiku-4`  | Claude Haiku 4  |

## 高级配置

<AccordionGroup>
  <Accordion title="代理式 OpenAI 兼容注意事项">
    此路径使用与其他自定义 `/v1` 后端相同的代理式 OpenAI 兼容路由：

    - 原生 OpenAI 专用请求整形不适用
    - 无 `service_tier`、无 Responses `store`、无 prompt 缓存提示、无 OpenAI 推理兼容负载整形
    - 隐藏的 OpenClaw 归因标头（`originator`、`version`、`User-Agent`）不在代理 URL 上注入

  </Accordion>

  <Accordion title="在 macOS 上使用 LaunchAgent 自动启动">
    创建一个 LaunchAgent 以自动运行代理：

    ```bash
    cat > ~/Library/LaunchAgents/com.claude-max-api.plist << 'EOF'
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
    <plist version="1.0">
    <dict>
      <key>Label</key>
      <string>com.claude-max-api</string>
      <key>RunAtLoad</key>
      <true/>
      <key>KeepAlive</key>
      <true/>
      <key>ProgramArguments</key>
      <array>
        <string>/usr/local/bin/node</string>
        <string>/usr/local/lib/node_modules/claude-max-api-proxy/dist/server/standalone.js</string>
      </array>
      <key>EnvironmentVariables</key>
      <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:~/.local/bin:/usr/bin:/bin</string>
      </dict>
    </dict>
    </plist>
    EOF

    launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.claude-max-api.plist
    ```

  </Accordion>
</AccordionGroup>

## 链接

- **npm:** [https://www.npmjs.com/package/claude-max-api-proxy](https://www.npmjs.com/package/claude-max-api-proxy)
- **GitHub:** [https://github.com/atalovesyou/claude-max-api-proxy](https://github.com/atalovesyou/claude-max-api-proxy)
- **Issues:** [https://github.com/atalovesyou/claude-max-api-proxy/issues](https://github.com/atalovesyou/claude-max-api-proxy/issues)

## 注意事项

- 这是一个**社区工具**，不受 Anthropic 或 OpenClaw 官方支持
- 需要使用 Claude Code CLI 认证的活动 Claude Max/Pro 订阅
- 代理在本地运行，不会将数据发送到任何第三方服务器
- 完全支持流式响应

<Note>
有关使用 Claude CLI 或 API 密钥的原生 Anthropic 集成，请参见 [Anthropic provider](/providers/anthropic)。有关 OpenAI/Codex 订阅，请参见 [OpenAI provider](/providers/openai)。
</Note>

## 相关

<CardGroup cols={2}>
  <Card title="Anthropic provider" href="/providers/anthropic" icon="bolt">
    使用 Claude CLI 或 API 密钥的原生 OpenClaw 集成。
  </Card>
  <Card title="OpenAI provider" href="/providers/openai" icon="robot">
    用于 OpenAI/Codex 订阅。
  </Card>
  <Card title="模型 Provider" href="/concepts/model-providers" icon="layers">
    所有 Provider、模型引用和故障转移行为的概述。
  </Card>
  <Card title="配置" href="/gateway/configuration" icon="gear">
    完整配置参考。
  </Card>
</CardGroup>
