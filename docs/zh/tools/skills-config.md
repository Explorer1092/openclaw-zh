---
title: "技能配置"
sidebarTitle: "技能配置"
mmh3_hash: "b39c449d78a459cb63b752ebd0774efa"
summary: "技能配置架构和示例"
read_when: ["添加或修改技能配置","调整捆绑允许列表或安装行为"]
---
# 技能配置

所有与技能相关的配置都位于 `~/.openclaw/openclaw.json` 中的 `skills` 下。

```json5
{
  skills: {
    allowBundled: ["gemini", "peekaboo"],
    load: {
      extraDirs: [
        "~/Projects/agent-scripts/skills",
        "~/Projects/oss/some-skill-pack/skills"
      ],
      watch: true,
      watchDebounceMs: 250
    },
    install: {
      preferBrew: true,
      nodeManager: "npm" // npm | pnpm | yarn | bun (网关运行时仍然是 Node;不推荐 bun)
    },
    entries: {
      "nano-banana-pro": {
        enabled: true,
        apiKey: "GEMINI_KEY_HERE",
        env: {
          GEMINI_API_KEY: "GEMINI_KEY_HERE"
        }
      },
      peekaboo: { enabled: true },
      sag: { enabled: false }
    }
  }
}
```

## 字段

- `allowBundled`: **仅捆绑**技能的可选允许列表。设置时,仅列表中的捆绑技能符合条件(管理/工作区技能不受影响)。
- `load.extraDirs`: 要扫描的其他技能目录(最低优先级)。
- `load.watch`: 监视技能文件夹并刷新技能快照(默认: true)。
- `load.watchDebounceMs`: 技能监视器事件的去抖动(以毫秒为单位)(默认: 250)。
- `install.preferBrew`: 在可用时优先使用 brew 安装程序(默认: true)。
- `install.nodeManager`: 节点安装程序偏好(`npm` | `pnpm` | `yarn` | `bun`,默认: npm)。这仅影响**技能安装**;网关运行时仍应为 Node(不推荐 Bun 用于 WhatsApp/Telegram)。
- `entries.<skillKey>`: 每个技能的覆盖。

每个技能字段:
- `enabled`: 设置 `false` 以禁用技能,即使它是捆绑的/已安装的。
- `env`: 为 agent 运行注入的环境变量(仅当尚未设置时)。
- `apiKey`: 声明主要环境变量的技能的可选便利功能。

## 注意事项

- `entries` 下的键默认映射到技能名称。如果技能定义了 `metadata.openclaw.skillKey`,请改用该键。
- 当启用监视器时,在下一个 agent 转换时会获取对技能的更改。

### 沙箱技能 + 环境变量

当会话**被沙箱化**时,技能进程在 Docker 内部运行。沙箱**不**继承主机 `process.env`。

使用以下之一:
- `agents.defaults.sandbox.docker.env`(或每个 agent 的 `agents.list[].sandbox.docker.env`)
- 将环境烘焙到您的自定义沙箱镜像中

全局 `env` 和 `skills.entries.<skill>.env/apiKey` 仅适用于**主机**运行。

