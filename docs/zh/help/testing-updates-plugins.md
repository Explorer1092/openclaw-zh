---
mmh3_hash: "175f5c99415c77e3ed7fd042cdc4ab00"
summary: "OpenClaw 如何验证更新路径、包迁移和 Plugin 安装/更新行为"
read_when:
  - 更改 OpenClaw 更新、doctor、包验收或 Plugin 安装行为
  - 准备或审批发布候选版本
  - 调试包更新、Plugin 依赖清理或 Plugin 安装回归
title: "测试：更新与 Plugin"
sidebarTitle: "更新与 Plugin 测试"
---

这是更新和 Plugin 验证的专用检查清单。目标很简单：证明可安装包能够更新真实用户状态，通过 `doctor` 修复陈旧的历史状态，并且仍然能够从受支持的来源安装、加载、更新和卸载 Plugin。

更广泛的测试运行器说明，参见 [测试](/help/testing)。实时 Provider 密钥和需要网络的测试套件，参见 [实时测试](/help/testing-live)。

## 我们保护的内容

更新和 Plugin 测试保护以下合约：

- 包 tarball 完整，具有有效的 `dist/postinstall-inventory.json`，且不依赖解压后的仓库文件。
- 用户可以从旧发布包迁移到候选包，而不会丢失配置、Agent、Session、工作区、Plugin 白名单或 Channel 配置。
- `openclaw doctor --fix --non-interactive` 负责历史清理和修复路径。启动时不应增加隐式兼容性迁移来处理陈旧的 Plugin 状态。
- Plugin 安装支持本地目录、git 仓库、npm 包和 ClawHub 注册表路径。
- Plugin npm 依赖在受管理的 npm 根目录中安装，在信任前扫描，并在卸载期间通过 npm 删除，以免提升的依赖滞留。
- Plugin 更新在无变化时是稳定的：安装记录、已解析来源、已安装的依赖布局和启用状态保持不变。

## 开发期间的本地验证

从最小范围开始：

```bash
pnpm changed:lanes --json
pnpm check:changed
pnpm test:changed
```

对于 Plugin 安装、卸载、依赖或包清单变更，还需运行覆盖已编辑接缝的专项测试：

```bash
pnpm test src/plugins/uninstall.test.ts src/infra/package-dist-inventory.test.ts test/scripts/package-acceptance-workflow.test.ts
```

在任何包 Docker 通道使用 tarball 之前，先验证包制品：

```bash
pnpm release:check
```

`release:check` 运行配置/文档/API 漂移检查，写入包分发清单，运行 `npm pack --dry-run`，拒绝禁止的打包文件，将 tarball 安装到临时前缀，运行 postinstall，并对捆绑的 Channel 入口点进行冒烟测试。

## Docker 通道

Docker 通道是产品级验证。它们在 Linux 容器内安装或更新真实包，并通过 CLI 命令、Gateway 启动、HTTP 探测、RPC 状态和文件系统状态来断言行为。

迭代时使用专项通道：

```bash
pnpm test:docker:plugins
pnpm test:docker:plugin-lifecycle-matrix
pnpm test:docker:plugin-update
pnpm test:docker:upgrade-survivor
pnpm test:docker:published-upgrade-survivor
pnpm test:docker:update-restart-auth
pnpm test:docker:update-migration
```

重要通道说明：

- `test:docker:plugins` 验证 Plugin 安装冒烟、本地文件夹安装、本地文件夹更新跳过行为、预安装依赖的本地文件夹、`file:` 包安装、带 CLI 执行的 git 安装、git 移动引用更新、带提升传递依赖的 npm 注册表安装、npm 更新无操作、畸形 npm 包元数据拒绝、本地 ClawHub 固件安装和更新无操作、市场更新行为，以及 Claude 捆绑启用/检查。设置 `OPENCLAW_PLUGINS_E2E_CLAWHUB=0` 可使 ClawHub 块保持封闭/离线。
- `test:docker:plugin-lifecycle-matrix` 在空白容器中安装候选包，运行 npm Plugin 经历安装、检查、禁用、启用、显式升级、显式降级，以及删除 Plugin 代码后的卸载。每个阶段记录 RSS 和 CPU 指标。
- `test:docker:plugin-update` 验证未更改的已安装 Plugin 在 `openclaw plugins update` 期间不会重新安装或丢失安装元数据。
- `test:docker:upgrade-survivor` 在脏旧用户固件上安装候选 tarball，运行包更新加非交互式 doctor，然后启动回环 Gateway 并检查状态保持。
- `test:docker:published-upgrade-survivor` 首先安装已发布的基准，通过烘焙的 `openclaw config set` 配方进行配置，更新到候选 tarball，运行 doctor，检查历史清理，启动 Gateway，并探测 `/healthz`、`/readyz` 和 RPC 状态。
- `test:docker:update-restart-auth` 安装候选包，启动受管理的令牌认证 Gateway，取消 `openclaw update --yes --json` 的调用者 gateway auth 环境，并要求候选更新命令在正常探测之前重启 Gateway。
- `test:docker:update-migration` 是重度清理的已发布更新通道。它从配置好的 Discord/Telegram 风格用户状态开始，运行基准 doctor 以使配置的 Plugin 依赖有机会实体化，为配置的打包 Plugin 植入历史 Plugin 依赖遗留物，更新到候选 tarball，并要求更新后的 doctor 删除历史依赖根。

已发布升级存活者的实用变体：

```bash
OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@2026.4.23 \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=versioned-runtime-deps \
pnpm test:docker:published-upgrade-survivor

OPENCLAW_UPGRADE_SURVIVOR_BASELINE_SPEC=openclaw@latest \
OPENCLAW_UPGRADE_SURVIVOR_SCENARIO=bootstrap-persona \
pnpm test:docker:published-upgrade-survivor
```

可用场景：`base`、`feishu-channel`、`bootstrap-persona`、`plugin-deps-cleanup`、`configured-plugin-installs`、`stale-source-plugin-shadow`、`tilde-log-path` 和 `versioned-runtime-deps`。在聚合运行中，`OPENCLAW_UPGRADE_SURVIVOR_SCENARIOS=reported-issues` 扩展为所有已报告问题形状的场景，包括配置的 Plugin 安装迁移。

完整更新迁移有意与完整发布 CI 分开。当发布问题是"从 2026.4.23 起的所有已发布稳定版本是否都能更新到此候选版本并清理 Plugin 依赖遗留物？"时，使用手动 `Update Migration` 工作流：

```bash
gh workflow run update-migration.yml \
  --ref main \
  -f workflow_ref=main \
  -f package_ref=main \
  -f baselines=all-since-2026.4.23 \
  -f scenarios=plugin-deps-cleanup
```

## 包验收

包验收是 GitHub 原生包门控。它将一个候选包解析为 `package-under-test` tarball，记录版本和 SHA-256，然后针对该确切 tarball 运行可重用的 Docker E2E 通道。工作流测试套件引用与包来源引用分开，因此当前测试逻辑可以验证旧的可信发布版本。

候选来源：

- `source=npm`：验证 `openclaw@beta`、`openclaw@latest` 或精确的已发布版本。
- `source=ref`：使用选定的当前测试套件从受信任的分支、标签或提交打包。
- `source=url`：使用必需的 `package_sha256` 验证 HTTPS tarball。
- `source=artifact`：重用由另一个 Actions 运行上传的 tarball。

完整发布验证默认使用 `source=artifact`，从解析的发布 SHA 构建。对于发布后验证，传递 `package_acceptance_package_spec=openclaw@YYYY.M.D`，以便相同的升级矩阵针对已发布的 npm 包。

发布检查使用包/更新/重启/Plugin 集调用包验收：

```text
doctor-switch update-channel-switch update-corrupt-plugin upgrade-survivor published-upgrade-survivor update-restart-auth plugins-offline plugin-update
```

启用发布浸泡时，还会传递：

```text
published_upgrade_survivor_baselines=last-stable-4 2026.4.23 2026.5.2 2026.4.15
published_upgrade_survivor_scenarios=reported-issues
telegram_mode=mock-openai
```

这使包迁移、更新 Channel 切换、损坏托管 Plugin 容忍、陈旧 Plugin 依赖清理、离线 Plugin 覆盖、Plugin 更新行为和 Telegram 包 QA 针对同一解析制品，而不使默认发布包门控遍历每个已发布版本。

`last-stable-4` 解析为最新的四个稳定 npm 发布的 OpenClaw 版本。发布包验收将 `2026.4.23` 固定为第一个 Plugin 更新兼容性边界，将 `2026.5.2` 固定为 Plugin 架构变更边界，将 `2026.4.15` 固定为旧版 2026.4.1x 已发布更新基准；解析器会去重已在最新四个中的固定版本。对于详尽的已发布更新迁移覆盖，请在单独的更新迁移工作流中使用 `all-since-2026.4.23`，而不是完整发布 CI。`release-history` 在您还需要旧版预日期锚点的手动更广泛采样时仍然可用。

当选择多个已发布升级存活者基准时，可重用 Docker 工作流将每个基准分片到其自己的目标运行器作业。每个基准分片仍然运行选定的场景集，但日志和制品按基准保留，总时间受最慢分片限制，而不是一个大的串行作业。

在发布前验证候选版本时手动运行包配置：

```bash
gh workflow run package-acceptance.yml \
  --ref main \
  -f workflow_ref=main \
  -f source=npm \
  -f package_spec=openclaw@beta \
  -f suite_profile=package \
  -f published_upgrade_survivor_baselines="last-stable-4 2026.4.23 2026.5.2 2026.4.15" \
  -f published_upgrade_survivor_scenarios=reported-issues \
  -f telegram_mode=mock-openai
```

当发布问题包括 MCP Channel、cron/子 Agent 清理、OpenAI 网络搜索或 OpenWebUI 时，使用 `suite_profile=product`。仅在需要完整 Docker 发布路径覆盖时使用 `suite_profile=full`。

## 发布默认值

对于发布候选版本，默认验证堆栈为：

1. `pnpm check:changed` 和 `pnpm test:changed` 用于源级回归。
2. `pnpm release:check` 用于包制品完整性。
3. 包验收 `package` 配置文件或发布检查自定义包通道，用于安装/更新/重启/Plugin 合约。
4. 跨 OS 发布检查，用于 OS 特定的安装程序、引导和平台行为。
5. 仅当更改面涉及 Provider 或托管服务行为时，才运行实时测试套件。

在维护者机器上，广泛门控和 Docker/包产品验证应在 Testbox 中运行，除非明确进行本地验证。

## 历史兼容性

兼容性容差范围很窄且有时间限制：

- 通过 `2026.4.25` 的包（包括 `2026.4.25-beta.*`）在包验收中可能容忍已发布的包元数据缺口。
- 已发布的 `2026.4.26` 包可能对已发布的本地构建元数据戳文件发出警告。
- 后续包必须满足现代合约。相同的缺口将会失败，而不是警告或跳过。

不要为这些旧形状添加新的启动迁移。添加或扩展 doctor 修复，然后在更新命令拥有重启时，使用 `upgrade-survivor`、`published-upgrade-survivor` 或 `update-restart-auth` 来验证它。

## 添加覆盖

更改更新或 Plugin 行为时，在能以正确原因失败的最低层添加覆盖：

- 纯路径或元数据逻辑：源代码旁边的单元测试。
- 包清单或打包文件行为：`package-dist-inventory` 或 tarball 检查测试。
- CLI 安装/更新行为：Docker 通道断言或固件。
- 已发布版本迁移行为：`published-upgrade-survivor` 场景。
- 更新拥有的重启行为：`update-restart-auth`。
- 注册表/包来源行为：`test:docker:plugins` 固件或 ClawHub 固件服务器。
- 依赖布局或清理行为：同时断言运行时执行和文件系统边界。npm 依赖可能在受管理的 npm 根下提升，因此测试应证明根被扫描/清理，而不是假设包本地的 `node_modules` 树。

默认情况下保持新的 Docker 固件封闭。使用本地固件注册表和假包，除非测试的目的是实时注册表行为。

## 失败分类

从制品标识开始：

- 包验收 `resolve_package` 摘要：来源、版本、SHA-256 和制品名称。
- Docker 制品：`.artifacts/docker-tests/**/summary.json`、`failures.json`、通道日志和重运行命令。
- 升级存活者摘要：`.artifacts/upgrade-survivor/summary.json`，包括基准版本、候选版本、场景、阶段计时和配方步骤。

优先使用相同包制品重新运行失败的精确通道，而不是重新运行整个发布伞。
