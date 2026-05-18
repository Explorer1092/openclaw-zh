---
title: "Skill 配置"
sidebarTitle: "Skill 配置"
mmh3_hash: "06ccac0e997f5c1bea87cf93ed737a13"
summary: "Skill 配置架构和示例"
read_when:
  - 添加或修改 Skill 配置
  - 调整捆绑允许列表或安装行为
---

大多数 Skill 加载器/安装配置位于 `~/.openclaw/openclaw.json` 中的 `skills` 下。每个 Agent 的 Skill 可见性位于 `agents.defaults.skills` 和 `agents.list[].skills` 下。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway 运行时仍然是 Node;不推荐 bun)
      allowUploadedArchives: false,
    },
    entries: {
      "image-lab": {
        enabled: true,
        apiKey: { source: "env", provider: "default", id: "GEMINI_API_KEY" }, // 或纯文本字符串
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE",
        },
      },
      peekaboo: { enabled: true },
      sag: { enabled: false },
    },
  },
}
```

对于内置图像生成/编辑，优先使用 `agents.defaults.imageGenerationModel` 加上核心 `image_generate` 工具。`skills.entries.*` 仅适用于自定义或第三方 Skill 工作流。

如果你选择特定的图像 Provider/模型，还需要配置该 Provider 的认证/API 密钥。典型示例：`google/*` 使用 `GEMINI_API_KEY` 或 `GOOGLE_API_KEY`，`openai/*` 使用 `OPENAI_API_KEY`，`fal/*` 使用 `FAL_KEY`。

示例：

- 原生 Nano Banana Pro 风格设置：`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 原生 fal 设置：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## Agent Skill 允许列表

当你想要相同的机器/工作区 Skill 根，但每个 Agent 有不同的可见 Skill 集时，使用 Agent 配置。

```json5
{
  agents: {
    defaults: {
      skills: ["github", "weather"],
    },
    list: [
      { id: "writer" }, // 继承默认值 -> github, weather
      { id: "docs", skills: ["docs-search"] }, // 替换默认值
      { id: "locked-down", skills: [] }, // 无 Skill
    ],
  },
}
```

规则：

- `agents.defaults.skills`：省略 `agents.list[].skills` 的 Agent 的共享基线允许列表。
- 省略 `agents.defaults.skills` 以默认保持 Skill 不受限制。
- `agents.list[].skills`：该 Agent 的显式最终 Skill 集；它不与默认值合并。
- `agents.list[].skills: []`：为该 Agent 不暴露任何 Skill。

## 字段

- 内置 Skill 根始终包括 `~/.openclaw/skills`、`~/.agents/skills`、`<workspace>/.agents/skills` 和 `<workspace>/skills`。
- `allowBundled`：**仅捆绑** Skill 的可选允许列表。设置时，仅列表中的捆绑 Skill 符合条件（管理/Agent/工作区 Skill 不受影响）。
- `load.extraDirs`：要扫描的其他 Skill 目录（最低优先级）。
- `load.allowSymlinkTargets`：受信任的真实目标目录，符号链接的工作区、项目 Agent 或 extra-dir Skill 文件夹可以解析进入这些目录，即使符号链接本身位于该目标根之外。用于像 `<workspace>/skills/manager -> ~/Projects/manager/skills` 这样有意的兄弟仓库布局。托管 `~/.openclaw/skills` 和个人 `~/.agents/skills` 根目录默认允许本地 Skill 管理器跟随 Skill 目录符号链接，但每个 `SKILL.md` 仍然必须解析在其自身的 Skill 目录内。
- `load.watch`：监视 Skill 文件夹并刷新 Skill 快照（默认：true）。
- `load.watchDebounceMs`：Skill 监视器事件的去抖动（毫秒）（默认：250）。
- `install.preferBrew`：在可用时优先使用 brew 安装程序（默认：true）。
- `install.nodeManager`：节点安装程序偏好（`npm` | `pnpm` | `yarn` | `bun`，默认：npm）。这仅影响 **Skill 安装**；Gateway 运行时仍应为 Node（不推荐 Bun 用于 WhatsApp/Telegram）。
  - `openclaw setup --node-manager` 范围更窄，目前接受 `npm`、`pnpm` 或 `bun`。如果你想要 Yarn 支持的 Skill 安装，请手动设置 `skills.install.nodeManager: "yarn"`。
- `install.allowUploadedArchives`：允许受信任的 `operator.admin` Gateway 客户端安装通过 `skills.upload.*` 暂存的私有 zip 归档（默认：false）。这仅启用已上传归档路径；普通 ClawHub 安装不需要它。
- `entries.<skillKey>`：每个 Skill 的覆盖。
- `agents.defaults.skills`：被省略 `agents.list[].skills` 的 Agent 继承的可选默认 Skill 允许列表。
- `agents.list[].skills`：可选的每 Agent 最终 Skill 允许列表；显式列表替换继承的默认值而非合并。

## 符号链接兄弟仓库

默认情况下，工作区、项目 Agent、extra-dir 和捆绑 Skill 根都是隔离边界。如果 `<workspace>/skills` 下的 Skill 文件夹是一个解析到 `<workspace>/skills` 之外的符号链接，OpenClaw 会跳过它并记录 `Skipping escaped skill path outside its configured root`。

保持符号链接布局并仅允许受信任的目标根：

```json5
{
  skills: {
    load: {
      extraDirs: ["~/Projects/manager/skills"],
      allowSymlinkTargets: ["~/Projects/manager/skills"],
    },
  },
}
```

有了此配置，像 `<workspace>/skills/manager -> ~/Projects/manager/skills` 这样的符号链接在 realpath 解析后被接受。`extraDirs` 也直接扫描兄弟仓库，而 `allowSymlinkTargets` 为现有的工作区 Skill 布局保留了符号链接路径。托管 `~/.openclaw/skills` 和个人 `~/.agents/skills` 目录已默认允许 Skill 目录符号链接，因为这些根目录是用户自有的本地 Skill 管理器表面；每个 Skill 的 `SKILL.md` 隔离仍然适用。保持目标条目范围较窄；不要指向像 `~` 或 `~/Projects` 这样的宽泛根目录，除非该根下的每个 Skill 树都是受信任的。

每个 Skill 字段：

- `enabled`：设置 `false` 以禁用 Skill，即使它是捆绑的/已安装的。
- `env`：为 Agent 运行注入的环境变量（仅当尚未设置时）。
- `apiKey`：声明主要环境变量的 Skill 的可选便利功能。支持纯文本字符串或 SecretRef 对象（`{ source, provider, id }`）。

## 注意事项

- `entries` 下的键默认映射到 Skill 名称。如果 Skill 定义了 `metadata.openclaw.skillKey`，请改用该键。
- 加载优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 捆绑 Skill → `skills.load.extraDirs`。
- 当启用监视器时，在下一个 Agent 转换时会获取对 Skill 的更改。

### 沙箱 Skill + 环境变量

当 Session **被沙箱化**时，Skill 进程在已配置的沙箱后端内运行。沙箱**不**继承主机 `process.env`。

<Warning>
  全局 `env` 和 `skills.entries.<skill>.env`/`apiKey` 仅适用于**主机**运行。在沙箱内它们不起作用，因此依赖 `GEMINI_API_KEY` 的 Skill 将以 `apiKey not configured` 失败，除非沙箱单独获得该变量。
</Warning>

使用以下之一：

- `agents.defaults.sandbox.docker.env` 用于 Docker 后端（或每个 Agent 的 `agents.list[].sandbox.docker.env`）。
- 将环境烘焙到你的自定义沙箱镜像或远程沙箱环境中。

对于 Docker 沙箱，配置的 `sandbox.docker.env` 值会成为显式的容器环境变量。拥有 Docker 守护进程访问权限的用户可以通过 Docker 元数据检查这些变量，因此如果该暴露不可接受，请使用挂载的 secret 文件、自定义镜像或其他投递路径。

## 相关

<CardGroup cols={2}>
  <Card title="技能" href="/tools/skills" icon="puzzle-piece">
    技能的定义及其加载方式。
  </Card>
  <Card title="创建技能" href="/tools/creating-skills" icon="hammer">
    编写自定义 Skill 包。
  </Card>
  <Card title="Slash 命令" href="/tools/slash-commands" icon="terminal">
    原生命令目录和聊天指令。
  </Card>
  <Card title="配置参考" href="/gateway/configuration-reference" icon="gear">
    完整的 `skills` 和 `agents.skills` Schema。
  </Card>
</CardGroup>
