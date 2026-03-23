---
title: "Skill 配置"
sidebarTitle: "Skill 配置"
mmh3_hash: "3e641f0e27efeac18db20ebcb613164a"
summary: "Skill 配置架构和示例"
read_when:
  - 添加或修改 Skill 配置
  - 调整捆绑允许列表或安装行为
---

# Skill 配置

所有与 Skill 相关的配置都位于 `~/.openclaw/openclaw.json` 中的 `skills` 下。

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

- 原生 Nano Banana 风格设置：`agents.defaults.imageGenerationModel.primary: "google/gemini-3-pro-image-preview"`
- 原生 fal 设置：`agents.defaults.imageGenerationModel.primary: "fal/fal-ai/flux/dev"`

## 字段

- `allowBundled`: **仅捆绑** Skill 的可选允许列表。设置时,仅列表中的捆绑 Skill 符合条件(管理/工作区 Skill 不受影响)。
- `load.extraDirs`: 要扫描的其他 Skill 目录(最低优先级)。
- `load.watch`: 监视 Skill 文件夹并刷新 Skill 快照(默认: true)。
- `load.watchDebounceMs`: Skill 监视器事件的去抖动(以毫秒为单位)(默认: 250)。
- `install.preferBrew`: 在可用时优先使用 brew 安装程序(默认: true)。
- `install.nodeManager`: 节点安装程序偏好(`npm` | `pnpm` | `yarn` | `bun`,默认: npm)。这仅影响 **Skill 安装**;Gateway 运行时仍应为 Node(不推荐 Bun 用于 WhatsApp/Telegram)。
- `entries.<skillKey>`: 每个 Skill 的覆盖。

每个 Skill 字段:

- `enabled`: 设置 `false` 以禁用 Skill,即使它是捆绑的/已安装的。
- `env`: 为 agent 运行注入的环境变量(仅当尚未设置时)。
- `apiKey`: 声明主要环境变量的 Skill 的可选便利功能。支持纯文本字符串或 SecretRef 对象（`{ source, provider, id }`）。

## 注意事项

- `entries` 下的键默认映射到 Skill 名称。如果 Skill 定义了 `metadata.openclaw.skillKey`,请改用该键。
- 当启用监视器时,在下一个 agent 转换时会获取对 Skill 的更改。

### 沙箱 Skill + 环境变量

当 Session **被沙箱化**时,Skill 进程在 Docker 内部运行。沙箱**不**继承主机 `process.env`。

使用以下之一:

- `agents.defaults.sandbox.docker.env`(或每个 agent 的 `agents.list[].sandbox.docker.env`)
- 将环境烘焙到您的自定义沙箱镜像中

全局 `env` 和 `skills.entries.<skill>.env/apiKey` 仅适用于**主机**运行。
