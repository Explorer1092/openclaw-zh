---
title: "安装"
mmh3_hash: "c4733660f987a4d70e37a0dfe82d6f62"
summary: "安装 OpenClaw (推荐安装程序，全局安装，或从源码)"
read_when:
  - 安装 OpenClaw
  - 你想要从 GitHub 安装
---

# 安装

除非你有不使用的理由，否则请使用安装程序。它会设置 CLI 并运行入门引导。

## 快速安装 (推荐)

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

Windows (PowerShell):

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

下一步 (如果你跳过了入门引导):

```bash
openclaw onboard --install-daemon
```

## 系统要求

- **Node >=22**
- macOS, Linux, 或 Windows via WSL2
- `pnpm` 仅当你从源码构建时

## 选择你的安装路径

### 1) 安装脚本 (推荐)

通过 npm 全局安装 `openclaw` 并运行入门引导。

```bash
curl -fsSL https://openclaw.bot/install.sh | bash
```

安装程序标志：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --help
```

详情：[安装程序内部](/install/installer)。

非交互式 (跳过入门引导):

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --no-onboard
```

### 2) 全局安装 (手动)

如果你已经有了 Node：

```bash
npm install -g openclaw@latest
```

如果你全局安装了 libvips（macOS 上通过 Homebrew 很常见）并且 `sharp` 安装失败，强制使用预构建的二进制文件：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

如果你看到 `sharp: Please add node-gyp to your dependencies`，要么安装构建工具（macOS: Xcode CLT + `npm install -g node-gyp`），要么使用上面的 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` 变通方法跳过本地构建。

或者：

```bash
pnpm add -g openclaw@latest
```

然后：

```bash
openclaw onboard --install-daemon
```

### 3) 从源码 (贡献者/开发)

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install
pnpm ui:build # 首次运行时自动安装 UI 依赖
pnpm build
openclaw onboard --install-daemon
```

提示：如果你还没有全局安装，请通过 `pnpm openclaw ...` 运行仓库命令。

### 4) 其他安装选项

- Docker: [Docker](/install/docker)
- Nix: [Nix](/install/nix)
- Ansible: [Ansible](/install/ansible)
- Bun (仅 CLI): [Bun](/install/bun)

## 安装后

- 运行入门引导: `openclaw onboard --install-daemon`
- 快速检查: `openclaw doctor`
- 检查网关健康: `openclaw status` + `openclaw health`
- 打开仪表盘: `openclaw dashboard`

## 安装方法：npm vs git (安装程序)

安装程序支持两种方法：

- `npm` (默认): `npm install -g openclaw@latest`
- `git`: 从 GitHub 克隆/构建并从源码 checkout 运行

### CLI 标志

```bash
# 显式 npm
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method npm

# 从 GitHub 安装 (源码 checkout)
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --install-method git
```

常用标志：

- `--install-method npm|git`
- `--git-dir <path>` (默认: `~/openclaw`)
- `--no-git-update` (当使用现有 checkout 时跳过 `git pull`)
- `--no-prompt` (禁用提示；CI/自动化所需)
- `--dry-run` (打印将发生什么；不进行更改)
- `--no-onboard` (跳过入门引导)

### 环境变量

等效环境变量（用于自动化）：

- `OPENCLAW_INSTALL_METHOD=git|npm`
- `OPENCLAW_GIT_DIR=...`
- `OPENCLAW_GIT_UPDATE=0|1`
- `OPENCLAW_NO_PROMPT=1`
- `OPENCLAW_DRY_RUN=1`
- `OPENCLAW_NO_ONBOARD=1`
- `SHARP_IGNORE_GLOBAL_LIBVIPS=0|1` (默认: `1`; 避免 `sharp` 针对系统 libvips 构建)

## 故障排除：找不到 `openclaw` (PATH)

快速诊断：

```bash
node -v
npm -v
npm prefix -g
echo "$PATH"
```

如果 `$(npm prefix -g)/bin` (macOS/Linux) 或 `$(npm prefix -g)` (Windows) **不** 在 `echo "$PATH"` 中，你的 shell 找不到全局 npm 二进制文件（包括 `openclaw`）。

修复：将其添加到你的 shell 启动文件 (zsh: `~/.zshrc`, bash: `~/.bashrc`):

```bash
# macOS / Linux
export PATH="$(npm prefix -g)/bin:$PATH"
```

在 Windows 上，将 `npm prefix -g` 的输出添加到你的 PATH。

然后打开一个新终端（或在 zsh 中运行 `rehash` / 在 bash 中运行 `hash -r`）。

## 更新 / 卸载

- 更新: [更新](/install/updating)
- 迁移到新机器: [迁移](/install/migrating)
- 卸载: [卸载](/install/uninstall)
