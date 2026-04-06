---
title: "Skill 配置"
sidebarTitle: "Skill 配置"
mmh3_hash: "d4be38695739c98fdebf69fdc05f02b1"
summary: "Skill 配置架构和示例"
read_when:
  - 添加或修改 Skill 配置
  - 调整捆绑允许列表或安装行为
---

# Skill 配置

大多数 Skill 加载器/安装配置位于 `~/.openclaw/openclaw.json` 中的 `skills` 下。每个 Agent 的 Skill 可见性位于 `agents.defaults.skills` 和 `agents.list[].skills` 下。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: ["~/Projects/agent-scripts/skills", "~/Projects/oss/some-skill-pack/skills"],
      watch: true,
      watchDebounceMs: 250,
    },
    install: {
      preferBrew: true,
      nodeManager: "npm", // npm | pnpm | yarn | bun (Gateway 运行时仍然是 Node;不推荐 bun)
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

- 原生 Nano Banana 风格设置：`agents.defaults.imageGenerationModel.primary: "google/gemini-3.1-flash-image-preview"`
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
- `load.watch`：监视 Skill 文件夹并刷新 Skill 快照（默认：true）。
- `load.watchDebounceMs`：Skill 监视器事件的去抖动（毫秒）（默认：250）。
- `install.preferBrew`：在可用时优先使用 brew 安装程序（默认：true）。
- `install.nodeManager`：节点安装程序偏好（`npm` | `pnpm` | `yarn` | `bun`，默认：npm）。这仅影响 **Skill 安装**；Gateway 运行时仍应为 Node（不推荐 Bun 用于 WhatsApp/Telegram）。
  - `openclaw setup --node-manager` 范围更窄，目前接受 `npm`、`pnpm` 或 `bun`。如果你想要 Yarn 支持的 Skill 安装，请手动设置 `skills.install.nodeManager: "yarn"`。
- `entries.<skillKey>`：每个 Skill 的覆盖。
- `agents.defaults.skills`：被省略 `agents.list[].skills` 的 Agent 继承的可选默认 Skill 允许列表。
- `agents.list[].skills`：可选的每 Agent 最终 Skill 允许列表；显式列表替换继承的默认值而非合并。

每个 Skill 字段：

- `enabled`：设置 `false` 以禁用 Skill，即使它是捆绑的/已安装的。
- `env`：为 Agent 运行注入的环境变量（仅当尚未设置时）。
- `apiKey`：声明主要环境变量的 Skill 的可选便利功能。支持纯文本字符串或 SecretRef 对象（`{ source, provider, id }`）。

## 注意事项

- `entries` 下的键默认映射到 Skill 名称。如果 Skill 定义了 `metadata.openclaw.skillKey`，请改用该键。
- 加载优先级为 `<workspace>/skills` → `<workspace>/.agents/skills` → `~/.agents/skills` → `~/.openclaw/skills` → 捆绑 Skill → `skills.load.extraDirs`。
- 当启用监视器时，在下一个 Agent 转换时会获取对 Skill 的更改。

### 沙箱 Skill + 环境变量

当 Session **被沙箱化**时,Skill 进程在 Docker 内部运行。沙箱**不**继承主机 `process.env`。

使用以下之一:

- `agents.defaults.sandbox.docker.env`(或每个 agent 的 `agents.list[].sandbox.docker.env`)
- 将环境烘焙到您的自定义沙箱镜像中

全局 `env` 和 `skills.entries.<skill>.env/apiKey` 仅适用于**主机**运行。
