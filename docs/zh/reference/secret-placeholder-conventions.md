---
mmh3_hash: "572db7db164a751015c030a8047bd780"
summary: "适用于文档和示例的密钥扫描器安全占位符规范"
read_when:
  - 编写包含令牌、API Key 或凭证片段的文档
  - 更新可能被密钥检测工具扫描的示例
title: "Secret Placeholder Conventions"
---

# 密钥占位符规范

使用人类可读但不像真实密钥的占位符。

## 推荐风格

- 优先使用描述性值，例如 `example-openai-key-not-real` 或 `example-discord-bot-token`。
- 在 shell 代码片段中，优先使用 `${OPENAI_API_KEY}` 而非内联的令牌字符串。
- 保持示例明显为虚构，并与用途（Provider、Channel、Auth 类型）相符。

## 文档中应避免的模式

- 字面量 PEM 私钥头部或尾部文本。
- 类似真实凭证的前缀，例如 `sk-...`、`xoxb-...`、`AKIA...`。
- 从运行时日志中复制的逼真 bearer token。

## 示例

```bash
# 好的做法
export OPENAI_API_KEY="example-openai-key-not-real"

# 更好的做法（当文档关于环境变量配置时）
export OPENAI_API_KEY="${OPENAI_API_KEY}"
```
