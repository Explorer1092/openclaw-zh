---
title: "创建自定义技能 🛠"
mmh3_hash: "fea70e96c0616c8daae287cbc71d0ace"
---
# 创建自定义技能 🛠

OpenClaw 被设计为易于扩展。"技能"是向您的助手添加新功能的主要方式。

## 什么是技能?
技能是一个包含 `SKILL.md` 文件(向 LLM 提供指令和工具定义)以及可选的一些脚本或资源的目录。

## 分步指南: 您的第一个技能

### 1. 创建目录
技能位于您的工作区中,通常是 `~/.openclaw/workspace/skills/`。为您的技能创建一个新文件夹:
```bash
mkdir -p ~/.openclaw/workspace/skills/hello-world
```

### 2. 定义 `SKILL.md`
在该目录中创建一个 `SKILL.md` 文件。该文件使用 YAML frontmatter 作为元数据,使用 Markdown 作为指令。

```markdown
---
name: hello_world
description: 一个简单的打招呼技能。
---

# Hello World 技能
当用户要求打招呼时,使用 `echo` 工具说"Hello from your custom skill!"。
```

### 3. 添加工具(可选)
您可以在 frontmatter 中定义自定义工具,或指示 agent 使用现有的系统工具(如 `bash` 或 `browser`)。

### 4. 刷新 OpenClaw
要求您的 agent"刷新技能"或重启网关。OpenClaw 将发现新目录并索引 `SKILL.md`。

## 最佳实践
- **简洁**: 指示模型*做什么*,而不是如何成为 AI。
- **安全第一**: 如果您的技能使用 `bash`,确保提示不允许来自不受信任的用户输入的任意命令注入。
- **本地测试**: 使用 `openclaw agent --message "use my new skill"` 进行测试。

## 共享技能
您还可以在 [ClawdHub](https://clawdhub.com) 上浏览和贡献技能。

