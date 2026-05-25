---
mmh3_hash: "9c086a088f45fef127621161cfdb1a33"
summary: "安装、配置和管理 OpenClaw Plugin"
read_when:
  - 安装或配置 Plugin
  - 了解 Plugin 发现和加载规则
  - 使用与 Codex/Claude 兼容的 Plugin 包
title: "Plugin"
sidebarTitle: "安装和配置"
doc-schema-version: 1
---

Plugin 为 OpenClaw 扩展 Channel、模型 Provider、Agent 运行时、工具、技能、语音、实时转录、实时语音、媒体理解、图像生成、视频生成、Web 抓取、Web 搜索等运行时能力。

当你需要安装 Plugin、重启 Gateway、验证运行时已加载它，以及排查常见设置失败时，请参考本页。仅需命令示例时，参见[管理 Plugin](/plugins/manage-plugins)。完整的捆绑、官方外部和仅限源码的 Plugin 清单，参见 [Plugin 清单](/plugins/plugin-inventory)。

## 要求

安装 Plugin 之前，请确保你具备：

- 可用的 OpenClaw 安装或检出，带有 `openclaw` CLI
- 所选来源（如 ClawHub、npm 或 git 主机）的网络访问
- 该 Plugin 设置文档要求的任何 Plugin 专属凭据、配置键或操作系统工具
- 为服务你的 Channel 的 Gateway 执行重载或重启的权限

## 快速入门

<Steps>
  <Step title="查找 Plugin">
    在 [ClawHub](/clawhub) 搜索公开 Plugin 包：

    ```bash
    openclaw plugins search "calendar"
    ```

    ClawHub 是社区 Plugin 的主要发现平台。在启动切换期间，普通裸包规格仍从 npm 安装。需要特定来源时使用显式前缀。

  </Step>

  <Step title="安装 Plugin">
    ```bash
    # 从 ClawHub
    openclaw plugins install clawhub:<package>

    # 从 npm
    openclaw plugins install npm:<package>

    # 从 git
    openclaw plugins install git:github.com/<owner>/<repo>@<ref>

    # 从本地开发检出
    openclaw plugins install ./my-plugin
    openclaw plugins install --link ./my-plugin
    ```

    将 Plugin 安装视同运行代码。需要可重现的生产环境安装时，优先使用固定版本。

  </Step>

  <Step title="配置并启用">
    在 `plugins.entries.<id>.config` 下配置 Plugin 专属设置。当 Plugin 尚未启用时，启用它：

    ```bash
    openclaw plugins enable <plugin-id>
    ```

    如果配置使用了限制性的 `plugins.allow` 列表，已安装的 Plugin id 必须在该列表中，Plugin 才能加载。`openclaw plugins install` 会将已安装的 id 添加到现有的 `plugins.allow` 列表，并从 `plugins.deny` 中移除相同的 id，以便显式安装在重启后可以加载。

  </Step>

  <Step title="让 Gateway 重载">
    安装、更新或卸载 Plugin 代码需要 Gateway 重启。当托管 Gateway 正在运行且配置重载已启用时，OpenClaw 会检测到已更改的 Plugin 安装记录并自动重启 Gateway。如果 Gateway 非托管或重载已禁用，请手动重启：

    ```bash
    openclaw gateway restart
    ```

    启用和禁用操作会更新配置并刷新冷注册表。运行时 inspect 仍然是实时运行时表面的最清晰验证路径。

  </Step>

  <Step title="验证运行时注册">
    ```bash
    openclaw plugins inspect <plugin-id> --runtime --json
    ```

    当需要证明已注册的工具、Hook、服务、Gateway 方法或 Plugin 自有 CLI 命令时，使用 `--runtime`。不带 `--runtime` 的 `inspect` 是冷 Manifest 和注册表检查。

  </Step>
</Steps>

## 配置

### 选择安装来源

| 来源        | 使用场景                                                                         | 示例                                                               |
| ----------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ClawHub     | 需要 OpenClaw 原生发现、扫描、版本元数据和安装提示                               | `openclaw plugins install clawhub:<package>`                       |
| npm         | 需要直接 npm 注册表或 dist-tag 工作流                                             | `openclaw plugins install npm:<package>`                           |
| git         | 需要仓库的某个分支、tag 或 commit                                                 | `openclaw plugins install git:github.com/<owner>/<repo>@<ref>`     |
| 本地路径    | 在同一台机器上开发或测试 Plugin                                                   | `openclaw plugins install --link ./my-plugin`                      |
| marketplace | 安装与 Claude 兼容的 marketplace Plugin                                           | `openclaw plugins install <plugin> --marketplace <source>`         |

裸包规格有特殊的兼容行为。如果裸名称匹配某个捆绑 Plugin id，OpenClaw 使用该捆绑来源。如果匹配官方外部 Plugin id，OpenClaw 使用官方包目录。其他普通裸包规格在启动切换期间通过 npm 安装。需要确定性来源选择时，使用 `clawhub:`、`npm:`、`git:` 或 `npm-pack:`。完整的命令契约参见 [`openclaw plugins`](/cli/plugins#install)。

### 配置 Plugin 策略

常用的 Plugin 配置格式：

```json5
{
  plugins: {
    enabled: true,
    allow: ["voice-call"],
    deny: ["untrusted-plugin"],
    load: { paths: ["~/Projects/oss/voice-call-plugin"] },
    slots: { memory: "memory-core" },
    entries: {
      "voice-call": { enabled: true, config: { provider: "twilio" } },
    },
  },
}
```

关键策略规则：

- `plugins.enabled: false` 禁用所有 Plugin 并跳过 Plugin 发现/加载工作。此项激活时过时的 Plugin 引用保持不变；需要删除过时 id 时，在运行 doctor 清理之前重新启用 Plugin。
- `plugins.deny` 优先于 allow 和每个 Plugin 的启用设置。
- `plugins.allow` 是独占允许列表。允许列表之外的 Plugin 自有工具即使 `tools.allow` 包含 `"*"` 也不可用。
- `plugins.entries.<id>.enabled: false` 禁用单个 Plugin 同时保留其配置。
- `plugins.load.paths` 添加显式的本地 Plugin 文件或目录。
- 工作区来源的 Plugin 默认禁用；在使用本地工作区代码之前显式启用或添加到允许列表。
- 捆绑 Plugin 遵循其内置的默认启用/默认禁用元数据，除非配置显式覆盖。
- `plugins.slots.<slot>` 为内存和上下文引擎等独占类别选择一个 Plugin。槽位选择会强制启用所选 Plugin；`plugins.deny` 和 `plugins.entries.<id>.enabled: false` 仍然可以阻止它。
- 捆绑的可选加入 Plugin 可在配置命名其自有表面（如 Provider/模型引用、Channel 配置、CLI 后端或 Agent 运行时）时自动激活。
- OpenAI 系列 Codex 路由保持独立的 Provider 和运行时 Plugin 边界：`openai-codex/*` 是旧版 OpenAI Provider 配置，而捆绑 `codex` Plugin 拥有规范 `openai/*` Agent 引用、显式 `agentRuntime.id: "codex"` 和旧版 `codex/*` 引用的 Codex 应用服务器运行时。

当配置验证报告过时的 Plugin id、允许列表/工具不匹配或旧版捆绑 Plugin 路径时，运行 `openclaw doctor` 或 `openclaw doctor --fix`。

## 了解 Plugin 格式

OpenClaw 识别两种 Plugin 格式：

| 格式                  | 加载方式                                                                       | 使用场景                                                           |
| --------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| 原生 OpenClaw Plugin  | `openclaw.plugin.json` 加进程内加载的运行时模块                                | 安装或构建 OpenClaw 专属运行时能力                                 |
| 兼容包                | Codex、Claude 或 Cursor Plugin 布局映射到 OpenClaw Plugin 清单                 | 复用兼容的技能、命令、Hook 或包元数据                              |

两种格式都出现在 `openclaw plugins list`、`openclaw plugins inspect`、`openclaw plugins enable` 和 `openclaw plugins disable` 中。包兼容边界参见 [Plugin 包](/plugins/bundles)，原生 Plugin 创作参见[构建 Plugin](/plugins/building-plugins)。

## Plugin hooks

Plugin 可以在运行时注册 Hook，但有两种不同的 API 各有不同的用途。

- 使用 `api.on(...)` 的类型化 Hook 用于运行时生命周期 Hook。这是中间件、策略、消息重写、Prompt 整形和工具控制的首选接口。
- 仅当你想参与 [Hook](/automation/hooks) 中描述的内部 Hook 系统时，才使用 `api.registerHook(...)`。这主要用于粗粒度命令/生命周期副作用，以及与现有 HOOK 风格自动化的兼容。

快速规则：

- 如果处理程序需要优先级、合并语义或阻止/取消行为，使用类型化 Plugin Hook。
- 如果处理程序只是对 `command:new`、`command:reset`、`message:sent` 或类似粗粒度事件作出响应，`api.registerHook(...)` 即可。

Plugin 管理的内部 Hook 会以 `plugin:<id>` 出现在 `openclaw hooks list` 中。你无法通过 `openclaw hooks` 启用或禁用它们；应改为启用或禁用该 Plugin。

## 验证活跃 Gateway

`openclaw plugins list` 和不带参数的 `openclaw plugins inspect` 读取冷配置、Manifest 和注册表状态，不能证明已运行的 Gateway 已导入相同的 Plugin 代码。

当 Plugin 显示为已安装但实时聊天流量未使用它时：

```bash
openclaw gateway status --deep --require-rpc
openclaw plugins inspect <plugin-id> --runtime --json
openclaw gateway restart
```

托管 Gateway 在改变 Plugin 来源的安装、更新和卸载变更后会自动重启。在 VPS 或容器安装中，确保手动重启针对实际为你的 Channel 提供服务的 `openclaw gateway run` 子进程，而非仅针对包装器或监督进程。

## 故障排除

| 症状                                                           | 检查                                                                                                                                               | 修复                                                                                                                |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Plugin 出现在 `plugins list` 中但运行时 Hook 不运行            | 使用 `openclaw plugins inspect <id> --runtime --json`，并用 `gateway status --deep --require-rpc` 确认活跃 Gateway                                  | 在安装、更新、配置或源代码变更后重启实时 Gateway                                                                    |
| 出现重复 Channel 或工具所有权诊断                              | 运行 `openclaw plugins list --enabled --verbose`，用 `--runtime --json` 检查每个可疑 Plugin 并比较 Channel/工具所有权                               | 禁用一个所有者，移除过时安装，或对有意替换的情况使用 Manifest 的 `preferOver`                                       |
| 配置显示 Plugin 缺失                                           | 在 [Plugin 清单](/plugins/plugin-inventory) 中检查该 Plugin 是捆绑的、官方外部的还是仅限源码的                                                     | 安装外部包、启用捆绑 Plugin 或删除过时配置                                                                          |
| 安装期间配置无效                                               | 阅读验证消息，当其指向过时 Plugin 状态时运行 `openclaw doctor --fix`                                                                               | Doctor 可以通过禁用条目并移除无效负载来隔离无效 Plugin 配置                                                         |
| Plugin 路径因可疑所有权或权限被阻止                            | 在配置错误之前检查诊断信息                                                                                                                         | 修复文件系统所有权/权限，然后运行 `openclaw plugins registry --refresh`                                             |
| `OPENCLAW_NIX_MODE=1` 阻止生命周期命令                         | 确认安装由 Nix 管理                                                                                                                                | 在 Nix 源中更改 Plugin 选择，而不是使用 Plugin 变更命令                                                             |
| 运行时依赖导入失败                                             | 检查 Plugin 是通过 npm/git/ClawHub 安装还是从本地路径加载                                                                                          | 运行 `openclaw plugins update <id>`、重新安装来源，或自行安装本地 Plugin 依赖                                       |

当过时的 Plugin 配置仍引用不再可发现的 Channel Plugin 时，Gateway 启动会跳过该 Plugin 支持的 Channel 而不是阻止其他所有 Channel。运行 `openclaw doctor --fix` 删除过时的 Plugin 和 Channel 条目。没有过时 Plugin 证据的未知 Channel 键仍会导致验证失败，以便拼写错误保持可见。

对于有意的 Channel 替换，首选 Plugin 应在 `channelConfigs.<channel-id>.preferOver` 中声明旧版或低优先级的 Plugin id。如果两个 Plugin 都被显式启用，OpenClaw 会保留该请求并报告重复 Channel 或工具诊断，而不是静默选择一个所有者。

如果已安装的包报告 `requires compiled runtime output for TypeScript entry ...`，说明包发布时没有附带 OpenClaw 运行时需要的 JavaScript 文件。等待发布者发布编译后的 JavaScript 后更新或重新安装，或在此之前禁用/卸载该 Plugin。

### 被阻止的 Plugin 路径所有权

如果 Plugin 诊断显示 `blocked plugin candidate: suspicious ownership (... uid=1000, expected uid=0 or root)` 且配置验证随后显示 `plugin present but blocked`，说明 OpenClaw 发现的 Plugin 文件由与加载它们的进程不同的 Unix 用户拥有。保持 Plugin 配置不变；修复文件系统所有权，或以拥有状态目录的相同用户运行 OpenClaw。

对于 Docker 安装，官方镜像以 `node`（uid `1000`）运行，因此主机绑定挂载的 OpenClaw 配置和工作区目录通常应由 uid `1000` 拥有：

```bash
sudo chown -R 1000:1000 /path/to/openclaw-config /path/to/openclaw-workspace
```

如果你故意以 root 运行 OpenClaw，则将托管 Plugin 根目录修复为 root 所有权：

```bash
sudo chown -R root:root /path/to/openclaw-config/npm
```

修复所有权后，重新运行 `openclaw doctor --fix` 或 `openclaw plugins registry --refresh`，使持久化 Plugin 注册表与修复后的文件匹配。

### Plugin 工具设置缓慢

如果 Agent 轮次在准备工具时似乎停滞，启用 Trace 日志并检查 Plugin 工具工厂计时行：

```bash
openclaw config set logging.level trace
openclaw logs --follow
```

查找：

```text
[trace:plugin-tools] factory timings ...
```

摘要列出总工厂时间和最慢的 Plugin 工具工厂，包括 Plugin id、声明的工具名称、结果形状以及工具是否为可选。当单个工厂至少花费 1 秒或总 Plugin 工具工厂准备时间至少 5 秒时，慢行会被提升为警告。

OpenClaw 为具有相同有效请求上下文的重复解析缓存成功的 Plugin 工具工厂结果。缓存键包括有效运行时配置、工作区、Agent/Session id、沙盒策略、浏览器设置、投递上下文、请求者身份和所有权状态，因此依赖这些受信任字段的工厂在上下文变更时会重新运行。如果计时持续偏高，Plugin 可能在返回工具定义之前做了昂贵的工作。

如果某个 Plugin 主导了计时，检查其运行时注册：

```bash
openclaw plugins inspect <plugin-id> --runtime --json
```

然后更新、重新安装或禁用该 Plugin。Plugin 作者应将昂贵的依赖加载移到工具执行路径，而不是在工具工厂内部完成。

有关依赖根目录、包元数据验证、注册表记录、启动重载行为和旧版清理，参见 [Plugin 依赖解析](/plugins/dependency-resolution)。

## 相关

- [管理 Plugin](/plugins/manage-plugins) — list、install、update、uninstall 和 publish 的命令示例
- [`openclaw plugins`](/cli/plugins) — 完整 CLI 参考
- [Plugin 清单](/plugins/plugin-inventory) — 生成的捆绑和外部 Plugin 列表
- [Plugin 参考](/plugins/reference) — 生成的每个 Plugin 参考页
- [社区 Plugin](/plugins/community) — ClawHub 发现和文档 PR 策略
- [Plugin 依赖解析](/plugins/dependency-resolution) — 安装根目录、注册表记录和运行时边界
- [构建 Plugin](/plugins/building-plugins) — 原生 Plugin 创作指南
- [Plugin SDK 概览](/plugins/sdk-overview) — 运行时注册、Hook 和 API 字段
- [Plugin Manifest](/plugins/manifest) — Manifest 和包元数据
