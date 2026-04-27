---
mmh3_hash: "4e027da9e81ef263d981c2b0b1e8b1da"
summary: "ClawHub：OpenClaw 技能和 Plugin 的公共注册表、原生安装流程和 ClawHub CLI 工作流"
read_when:
  - 搜索、安装或更新技能或 Plugin
  - 向注册表发布技能或 Plugin
  - 配置 clawhub CLI 或其环境变量覆盖
title: "ClawHub"
sidebarTitle: "ClawHub"
---

ClawHub 是 **OpenClaw 技能和 Plugin 的公共注册表**。

- 使用原生 `openclaw` 命令从 ClawHub 搜索、安装和更新技能，以及安装 Plugin。
- 当你需要注册表认证、发布、删除/取消删除或同步工作流时，使用独立的 `clawhub` CLI。

网站：[clawhub.ai](https://clawhub.ai)

## 快速入门

<Steps>
  <Step title="搜索">
    ```bash
    openclaw skills search "calendar"
    ```
  </Step>
  <Step title="安装">
    ```bash
    openclaw skills install <skill-slug>
    ```
  </Step>
  <Step title="使用">
    启动新的 OpenClaw Session — 它会获取新技能。
  </Step>
  <Step title="发布（可选）">
    如需注册表认证工作流（发布、同步、管理），请安装独立的 `clawhub` CLI：

    ```bash
    npm i -g clawhub
    # 或
    pnpm add -g clawhub
    ```

  </Step>
</Steps>

## 原生 OpenClaw 流程

<Tabs>
  <Tab title="技能">
    ```bash
    openclaw skills search "calendar"
    openclaw skills install <skill-slug>
    openclaw skills update --all
    ```

    原生 `openclaw` 命令安装到活动工作区并持久化源元数据，以便后续 `update` 调用可以保持在 ClawHub 上。

  </Tab>
  <Tab title="Plugin">
    ```bash
    openclaw plugins install clawhub:<package>
    openclaw plugins update --all
    ```

    裸 npm 安全的 Plugin 规格也会在 npm 之前尝试 ClawHub：

    ```bash
    openclaw plugins install openclaw-codex-app-server
    ```

    当你希望仅使用 npm 解析而不查询 ClawHub 时，使用 `npm:<package>`：

    ```bash
    openclaw plugins install npm:openclaw-codex-app-server
    ```

    Plugin 安装会在归档安装运行前验证公示的 `pluginApi` 和 `minGatewayVersion` 兼容性，因此不兼容的主机会提前失败，而不是部分安装包。

  </Tab>
</Tabs>

<Note>
`openclaw plugins install clawhub:...` 仅接受可安装的插件系列。如果 ClawHub 包实际上是一个技能，OpenClaw 会停止并指向 `openclaw skills install <slug>`。

匿名 ClawHub Plugin 安装对私有包也会失败关闭。社区或其他非官方 Channel 仍然可以安装，但 OpenClaw 会发出警告，以便运营者在启用之前检查来源和验证。
</Note>

## ClawHub 是什么

- OpenClaw 技能和 Plugin 的公共注册表。
- 技能包和元数据的版本化存储。
- 支持搜索、标签和使用信号的发现界面。

典型技能是一个版本化的文件包，包括：

- 一个包含主要描述和使用说明的 `SKILL.md` 文件。
- 可选的配置、脚本或技能使用的支持文件。
- 标签、摘要和安装要求等元数据。

ClawHub 使用元数据来支持发现并安全地暴露技能能力。注册表跟踪使用信号（星标、下载量）以改善排名和可见性。每次发布都会创建一个新的 semver 版本，注册表保留版本历史以供用户审计变更。

## 工作区与技能加载

独立的 `clawhub` CLI 也将技能安装到当前工作目录下的 `./skills`。如果配置了 OpenClaw 工作区，`clawhub` 会回退到该工作区，除非你覆盖 `--workdir`（或 `CLAWHUB_WORKDIR`）。OpenClaw 从 `<workspace>/skills` 加载工作区技能，并将在**下一个** Session 中获取它们。

如果你已经使用 `~/.openclaw/skills` 或捆绑技能，工作区技能优先。有关如何加载、共享和限制技能的更多详细信息，参见[技能](/tools/skills)。

## 服务功能

| 功能           | 说明                                                        |
| -------------- | ----------------------------------------------------------- |
| 公开浏览       | 技能及其 `SKILL.md` 内容可公开查看。                        |
| 搜索           | 由嵌入（向量搜索）支持，而不仅仅是关键字。                  |
| 版本控制       | Semver、更新日志和标签（包括 `latest`）。                   |
| 下载           | 每个版本作为 zip。                                          |
| 星标和评论     | 社区反馈。                                                  |
| 审核           | 批准和审计。                                                |
| CLI 友好的 API | 适合自动化和脚本编写。                                      |

## 安全与审核

ClawHub 默认开放 — 任何人都可以上传技能，但 GitHub 账号必须**至少一周大**才能发布。这有助于减缓滥用，而不阻止合法的贡献者。

<AccordionGroup>
  <Accordion title="举报">
    - 任何已登录用户都可以举报技能。
    - 举报原因是必填的并会被记录。
    - 每个用户一次最多可以有 20 个活跃举报。
    - 有超过 3 个唯一举报的技能默认自动隐藏。
  </Accordion>
  <Accordion title="审核">
    - 版主可以查看隐藏技能、取消隐藏、删除它们或封禁用户。
    - 滥用举报功能可能导致账号封禁。
    - 有兴趣成为版主？在 OpenClaw Discord 中询问并联系版主或维护者。
  </Accordion>
</AccordionGroup>

## ClawHub CLI

仅在需要注册表认证工作流（如发布/同步）时才需要。

### 全局选项

<ParamField path="--workdir <dir>" type="string">
  工作目录。默认：当前目录；回退到 OpenClaw 工作区。
</ParamField>
<ParamField path="--dir <dir>" type="string" default="skills">
  技能目录，相对于 workdir。
</ParamField>
<ParamField path="--site <url>" type="string">
  站点基础 URL（浏览器登录）。
</ParamField>
<ParamField path="--registry <url>" type="string">
  注册表 API 基础 URL。
</ParamField>
<ParamField path="--no-input" type="boolean">
  禁用提示（非交互式）。
</ParamField>
<ParamField path="-V, --cli-version" type="boolean">
  打印 CLI 版本。
</ParamField>

### 命令

<AccordionGroup>
  <Accordion title="认证（login / logout / whoami）">
    ```bash
    clawhub login              # 浏览器流程
    clawhub login --token <token>
    clawhub logout
    clawhub whoami
    ```

    登录选项：

    - `--token <token>` — 粘贴 API 令牌。
    - `--label <label>` — 为浏览器登录令牌存储的标签（默认：`CLI token`）。
    - `--no-browser` — 不打开浏览器（需要 `--token`）。

  </Accordion>
  <Accordion title="搜索">
    ```bash
    clawhub search "query"
    ```

    - `--limit <n>` — 最大结果数。

  </Accordion>
  <Accordion title="安装 / 更新 / 列表">
    ```bash
    clawhub install <slug>
    clawhub update <slug>
    clawhub update --all
    clawhub list
    ```

    选项：

    - `--version <version>` — 安装或更新到特定版本（`update` 仅适用于单个 slug）。
    - `--force` — 如果文件夹已存在，或本地文件与任何已发布版本不匹配时覆盖。
    - `clawhub list` 读取 `.clawhub/lock.json`。

  </Accordion>
  <Accordion title="发布技能">
    ```bash
    clawhub skill publish <path>
    ```

    选项：

    - `--slug <slug>` — 技能 slug。
    - `--name <name>` — 显示名称。
    - `--version <version>` — Semver 版本。
    - `--changelog <text>` — 更新日志文本（可以为空）。
    - `--tags <tags>` — 逗号分隔的标签（默认：`latest`）。

  </Accordion>
  <Accordion title="发布 Plugin">
    ```bash
    clawhub package publish <source>
    ```

    `<source>` 可以是本地文件夹、`owner/repo`、`owner/repo@ref` 或 GitHub URL。

    选项：

    - `--dry-run` — 构建确切的发布计划而不上传任何内容。
    - `--json` — 为 CI 输出机器可读格式。
    - `--source-repo`、`--source-commit`、`--source-ref` — 自动检测不足时的可选覆盖。

  </Accordion>
  <Accordion title="删除 / 取消删除（仅所有者或管理员）">
    ```bash
    clawhub delete <slug> --yes
    clawhub undelete <slug> --yes
    ```
  </Accordion>
  <Accordion title="同步（扫描本地 + 发布新/更新）">
    ```bash
    clawhub sync
    ```

    选项：

    - `--root <dir...>` — 额外的扫描根目录。
    - `--all` — 无需提示即上传所有内容。
    - `--dry-run` — 显示将上传的内容。
    - `--bump <type>` — 更新的 `patch|minor|major`（默认：`patch`）。
    - `--changelog <text>` — 非交互式更新的更新日志。
    - `--tags <tags>` — 逗号分隔的标签（默认：`latest`）。
    - `--concurrency <n>` — 注册表检查（默认：`4`）。

  </Accordion>
</AccordionGroup>

## 常见工作流

<Tabs>
  <Tab title="搜索">
    ```bash
    clawhub search "postgres backups"
    ```
  </Tab>
  <Tab title="安装">
    ```bash
    clawhub install my-skill-pack
    ```
  </Tab>
  <Tab title="更新全部">
    ```bash
    clawhub update --all
    ```
  </Tab>
  <Tab title="发布单个技能">
    ```bash
    clawhub skill publish ./my-skill --slug my-skill --name "My Skill" --version 1.0.0 --tags latest
    ```
  </Tab>
  <Tab title="同步多个技能">
    ```bash
    clawhub sync --all
    ```
  </Tab>
  <Tab title="从 GitHub 发布 Plugin">
    ```bash
    clawhub package publish your-org/your-plugin --dry-run
    clawhub package publish your-org/your-plugin
    clawhub package publish your-org/your-plugin@v1.0.0
    clawhub package publish https://github.com/your-org/your-plugin
    ```
  </Tab>
</Tabs>

### Plugin 包元数据

代码 Plugin 必须在 `package.json` 中包含所需的 OpenClaw 元数据：

```json
{
  "name": "@myorg/openclaw-my-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./src/index.ts"],
    "runtimeExtensions": ["./dist/index.js"],
    "compat": {
      "pluginApi": ">=2026.3.24-beta.2",
      "minGatewayVersion": "2026.3.24-beta.2"
    },
    "build": {
      "openclawVersion": "2026.3.24-beta.2",
      "pluginSdkVersion": "2026.3.24-beta.2"
    }
  }
}
```

发布的包应包含**已构建的 JavaScript** 并将 `runtimeExtensions` 指向该输出。从 Git 检出安装时，如果没有构建文件，仍然可以回退到 TypeScript 源码，但构建好的运行时入口可避免启动、doctor 和 Plugin 加载路径中的运行时 TypeScript 编译。

## 版本控制、锁定文件与遥测

<AccordionGroup>
  <Accordion title="版本控制和标签">
    - 每次发布都会创建一个新的 **semver** `SkillVersion`。
    - 标签（如 `latest`）指向一个版本；移动标签可以让你回滚。
    - 更新日志附加到每个版本，并且在同步或发布更新时可以为空。
  </Accordion>
  <Accordion title="本地更改与注册表版本">
    更新会使用内容哈希将本地技能内容与注册表版本进行比较。如果本地文件与任何已发布版本不匹配，CLI 会在覆盖之前询问（或在非交互式运行中需要 `--force`）。
  </Accordion>
  <Accordion title="同步扫描和回退根目录">
    `clawhub sync` 首先扫描你的当前 workdir。如果未找到技能，它会回退到已知的旧版位置（例如 `~/openclaw/skills` 和 `~/.openclaw/skills`）。这旨在查找较旧的技能安装，而无需额外的标志。
  </Accordion>
  <Accordion title="存储和锁定文件">
    - 已安装的技能记录在 workdir 下的 `.clawhub/lock.json` 中。
    - 认证令牌存储在 ClawHub CLI 配置文件中（通过 `CLAWHUB_CONFIG_PATH` 覆盖）。
  </Accordion>
  <Accordion title="遥测（安装计数）">
    当你在登录时运行 `clawhub sync`，CLI 会发送最小快照以计算安装计数。你可以完全禁用此功能：

    ```bash
    export CLAWHUB_DISABLE_TELEMETRY=1
    ```

  </Accordion>
</AccordionGroup>

## 环境变量

| 变量                            | 作用                                          |
| ------------------------------- | --------------------------------------------- |
| `CLAWHUB_SITE`                  | 覆盖站点 URL。                                |
| `CLAWHUB_REGISTRY`              | 覆盖注册表 API URL。                          |
| `CLAWHUB_CONFIG_PATH`           | 覆盖 CLI 存储令牌/配置的位置。                |
| `CLAWHUB_WORKDIR`               | 覆盖默认 workdir。                            |
| `CLAWHUB_DISABLE_TELEMETRY=1`   | 在 `sync` 时禁用遥测。                        |

## 相关

- [社区 Plugin](/plugins/community)
- [Plugin](/tools/plugin)
- [技能](/tools/skills)
