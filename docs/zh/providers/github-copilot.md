---
mmh3_hash: "02f577bf00e06de01c15ed28e2777cca"
title: "GitHub Copilot"
sidebarTitle: "GitHub Copilot"
summary: "使用设备流从 OpenClaw 登录 GitHub Copilot"
read_when:
  - 您想将 GitHub Copilot 用作模型 Provider
  - 您需要 `openclaw models auth login-github-copilot` 流程
---

# GitHub Copilot

## 什么是 GitHub Copilot？

GitHub Copilot 是 GitHub 的 AI 编码助手。它为您的 GitHub 账户和计划提供对 Copilot 模型的访问。OpenClaw 可以通过两种不同的方式将 Copilot 用作模型 Provider。

## 在 OpenClaw 中使用 Copilot 的两种方式

### 1) 内置 GitHub Copilot Provider（`github-copilot`）

使用原生设备登录流程获取 GitHub 令牌，然后在 OpenClaw 运行时将其交换为 Copilot API 令牌。这是**默认**且最简单的路径，因为它不需要 VS Code。

### 2) Copilot Proxy 插件（`copilot-proxy`）

使用 **Copilot Proxy** VS Code 扩展作为本地桥接。OpenClaw 与代理的 `/v1` 端点通信，并使用您在那里配置的模型列表。当您已经在 VS Code 中运行 Copilot Proxy 或需要通过它路由时选择此选项。您必须启用插件并保持 VS Code 扩展运行。

将 GitHub Copilot 用作模型 Provider（`github-copilot`）。登录命令运行 GitHub 设备流程，保存身份验证配置文件，并更新您的配置以使用该配置文件。

## CLI 设置

```bash
openclaw models auth login-github-copilot
```

系统将提示您访问一个 URL 并输入一次性代码。保持终端打开直到完成。

### 可选标志

```bash
openclaw models auth login-github-copilot --yes
```

要在一步中同时应用 Provider 的推荐默认模型，请改用通用身份验证命令：

```bash
openclaw models auth login --provider github-copilot --method device --set-default
```

## 设置默认模型

```bash
openclaw models set github-copilot/gpt-4o
```

### 配置片段

```json5
{
  agents: { defaults: { model: { primary: "github-copilot/gpt-4o" } } },
}
```

## 注意事项

- 需要交互式 TTY；直接在终端中运行。
- Copilot 模型可用性取决于您的计划；如果模型被拒绝，请尝试另一个 ID（例如 `github-copilot/gpt-4.1`）。
- Claude 模型 ID 自动使用 Anthropic Messages 传输；GPT、o 系列和 Gemini 模型保持 OpenAI Responses 传输。
- 登录在身份验证配置文件存储中存储 GitHub 令牌，并在 OpenClaw 运行时将其交换为 Copilot API 令牌。
