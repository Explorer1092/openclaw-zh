---
mmh3_hash: "c6a754cc48024e24dec62ca1f53fb7a8"
summary: "使用 Nix 声明式安装 OpenClaw"
read_when:
  - 你想要可重现、可回滚的安装
  - 你已经在使用 Nix/NixOS/Home Manager
  - 你想要所有内容都被固定和声明式管理
title: "Nix"
---

使用 **[nix-openclaw](https://github.com/openclaw/nix-openclaw)** 声明式安装 OpenClaw — 这是官方的、开箱即用的 Home Manager 模块。

<Info>
[nix-openclaw](https://github.com/openclaw/nix-openclaw) 仓库是 Nix 安装的事实来源。本页是快速概览。
</Info>

## 你会得到什么

- Gateway + macOS 应用 + 工具（whisper、spotify、cameras）— 全部固定版本
- 在重启后仍然存活的 Launchd 服务
- 具有声明式配置的 Plugin 系统
- 即时回滚：`home-manager switch --rollback`

## 快速开始

<Steps>
  <Step title="安装 Determinate Nix">
    如果 Nix 尚未安装，请遵循 [Determinate Nix 安装程序](https://github.com/DeterminateSystems/nix-installer)说明。
  </Step>
  <Step title="创建本地 flake">
    使用 nix-openclaw 仓库中的 agent-first 模板：
    ```bash
    mkdir -p ~/code/openclaw-local
    # 从 nix-openclaw 仓库复制 templates/agent-first/flake.nix
    ```
  </Step>
  <Step title="配置 secret">
    设置你的消息 bot 令牌和模型 provider API 密钥。`~/.secrets/` 下的普通文件即可。
  </Step>
  <Step title="填写模板占位符并切换">
    ```bash
    home-manager switch
    ```
  </Step>
  <Step title="验证">
    确认 launchd 服务正在运行，你的 bot 正在响应消息。
  </Step>
</Steps>

完整的模块选项和示例请参阅 [nix-openclaw README](https://github.com/openclaw/nix-openclaw)。

## Nix 模式运行时行为

当 `OPENCLAW_NIX_MODE=1` 设置时（使用 nix-openclaw 时自动设置），OpenClaw 进入 Nix 管理安装的确定性模式。其他 Nix 包也可以设置相同的模式；nix-openclaw 是官方参考实现。

你也可以手动设置：

```bash
export OPENCLAW_NIX_MODE=1
```

在 macOS 上，GUI 应用不会自动继承 shell 环境变量。改为通过 defaults 启用 Nix 模式：

```bash
defaults write ai.openclaw.mac openclaw.nixMode -bool true
```

### Nix 模式下的变化

- 自动安装和自我修改流程被禁用
- `openclaw.json` 被视为不可变。启动时派生的默认值仅保留为运行时，配置写入者（如设置、引导、修改性 `openclaw update`、plugin 安装/更新/卸载/启用、`doctor --fix`、`doctor --generate-gateway-token` 和 `openclaw config set`）拒绝编辑该文件。
- Agent 应该编辑 Nix 源。对于 nix-openclaw，使用 agent-first [快速开始](https://github.com/openclaw/nix-openclaw#quick-start)并在 `programs.openclaw.config` 或 `instances.<name>.config` 下设置配置。
- 缺失的依赖项显示 Nix 特定的修复消息
- UI 显示只读 Nix 模式横幅

### 配置和状态路径

OpenClaw 从 `OPENCLAW_CONFIG_PATH` 读取 JSON5 配置，并将可变数据存储在 `OPENCLAW_STATE_DIR` 中。在 Nix 下运行时，请明确设置这些为 Nix 管理的位置，以使运行时状态和配置保持在不可变存储之外。

| 变量                   | 默认值                                  |
| ---------------------- | --------------------------------------- |
| `OPENCLAW_HOME`        | `HOME` / `USERPROFILE` / `os.homedir()` |
| `OPENCLAW_STATE_DIR`   | `~/.openclaw`                           |
| `OPENCLAW_CONFIG_PATH` | `$OPENCLAW_STATE_DIR/openclaw.json`     |

### 服务 PATH 发现

launchd/systemd gateway 服务自动发现 Nix profile 二进制文件，以使调用 `nix` 安装的可执行文件的 plugin 和工具无需手动设置 PATH 即可工作：

- 当 `NIX_PROFILES` 设置时，每个条目按从右到左的优先级添加到服务 PATH（匹配 Nix shell 优先级 — 最右边优先）。
- 当 `NIX_PROFILES` 未设置时，`~/.nix-profile/bin` 作为回退添加。

这适用于 macOS launchd 和 Linux systemd 服务环境。

## 相关

<CardGroup cols={2}>
  <Card title="nix-openclaw" href="https://github.com/openclaw/nix-openclaw" icon="arrow-up-right-from-square">
    事实来源 Home Manager 模块和完整设置指南。
  </Card>
  <Card title="设置向导" href="/start/wizard" icon="wand-magic-sparkles">
    非 Nix CLI 设置演练。
  </Card>
  <Card title="Docker" href="/install/docker" icon="docker">
    作为非 Nix 替代方案的容器化设置。
  </Card>
  <Card title="更新" href="/install/updating" icon="arrow-up-right-from-square">
    更新 Home Manager 管理的安装以及包。
  </Card>
</CardGroup>
