---
title: "创建技能"
mmh3_hash: "15e1142b81f8caaff5c55840e7dc6ecf"
summary: "使用 SKILL.md 构建和测试自定义工作区技能"
read_when:
  - 在工作区中创建新的自定义技能
  - 需要基于 SKILL.md 的技能的快速入门工作流程
---

技能教 Agent 如何以及何时使用工具。每个技能是一个包含 `SKILL.md` 文件的目录，该文件具有 YAML frontmatter 和 Markdown 指令。

有关技能如何加载和优先级排序，参见 [技能](/tools/skills)。

## 创建你的第一个技能

<Steps>
  <Step title="创建技能目录">
    技能位于你的工作区中。创建一个新文件夹：

    ```bash
    mkdir -p ~/.openclaw/workspace/skills/hello-world
    ```

  </Step>

  <Step title="编写 SKILL.md">
    在该目录中创建 `SKILL.md`。frontmatter 定义元数据，Markdown 正文包含 Agent 的指令。

    ```markdown
    ---
    name: hello-world
    description: A simple skill that says hello.
    ---

    # Hello World Skill

    When the user asks for a greeting, use the `echo` tool to say
    "Hello from your custom skill!".
    ```

  </Step>

  <Step title="添加工具（可选）">
    你可以在 frontmatter 中定义自定义工具 Schema，或指示 Agent 使用现有的系统工具（如 `exec` 或 `browser`）。技能也可以与它们记录的工具一起打包在 Plugin 中。

  </Step>

  <Step title="加载技能">
    启动新 Session，让 OpenClaw 获取技能：

    ```bash
    # 在聊天中
    /new

    # 或重启 Gateway
    openclaw gateway restart
    ```

    验证技能已加载：

    ```bash
    openclaw skills list
    ```

  </Step>

  <Step title="测试">
    发送应触发技能的消息：

    ```bash
    openclaw agent --message "give me a greeting"
    ```

    或者直接与 Agent 聊天并请求问候语。

  </Step>
</Steps>

## 技能元数据参考

YAML frontmatter 支持以下字段：

| 字段                                | 必填 | 描述                                        |
| ----------------------------------- | ---- | ------------------------------------------- |
| `name`                              | 是   | 使用小写字母、数字和连字符的唯一标识符      |
| `description`                       | 是   | 向 Agent 显示的单行描述                     |
| `metadata.openclaw.os`              | 否   | 操作系统过滤器（`["darwin"]`、`["linux"]` 等）|
| `metadata.openclaw.requires.bins`   | 否   | PATH 上所需的二进制文件                     |
| `metadata.openclaw.requires.config` | 否   | 所需的配置键                                |

## 最佳实践

- **简洁** — 指示模型做_什么_，而不是如何成为 AI
- **安全第一** — 如果你的技能使用 `exec`，确保提示不允许来自不受信任的输入的任意命令注入
- **本地测试** — 在共享前使用 `openclaw agent --message "..."` 进行测试
- **使用 ClawHub** — 在 [ClawHub](https://clawhub.ai) 浏览和贡献技能

## 技能存放位置

| 位置                                    | 优先级 | 范围                 |
| --------------------------------------- | ------ | -------------------- |
| `\<workspace\>/skills/`                 | 最高   | 每个 Agent           |
| `\<workspace\>/.agents/skills/`         | 高     | 每个工作区 Agent     |
| `~/.agents/skills/`                     | 中等   | 共享 Agent 配置文件  |
| `~/.openclaw/skills/`                   | 中等   | 共享（所有 Agent）   |
| 捆绑（随 OpenClaw 附带）                | 低     | 全局                 |
| `skills.load.extraDirs`                 | 最低   | 自定义共享文件夹     |

## 相关

- [技能参考](/tools/skills) — 加载、优先级和限制规则
- [技能配置](/tools/skills-config) — `skills.*` 配置 Schema
- [ClawHub](/clawhub) — 公共技能注册表
- [构建 Plugin](/plugins/building-plugins) — Plugin 可以打包技能
