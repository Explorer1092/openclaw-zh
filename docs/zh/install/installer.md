---
summary: "安装脚本 (install.sh + install-cli.sh) 如何工作，标志和自动化"
read_when:
  - 你想要了解 `openclaw.bot/install.sh`
  - 你想要自动化安装 (CI / headless)
  - 你想要从 GitHub checkout 安装
---

# 安装程序内部

OpenClaw 发布两个安装脚本（由 `openclaw.ai` 提供）：

- `https://openclaw.bot/install.sh` — “推荐”安装程序（默认全局 npm 安装；也可以从 GitHub checkout 安装）
- `https://openclaw.bot/install-cli.sh` — 非 root 友好的 CLI 安装程序（安装到带有自己的 Node 的前缀中）
 - `https://openclaw.ai/install.ps1` — Windows PowerShell 安装程序（默认 npm；可选 git 安装）

要查看当前标志/行为，运行：

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --help
```

Windows (PowerShell) 帮助：

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -?
```

如果安装程序完成但在新终端中找不到 `openclaw`，通常是 Node/npm PATH 问题。参见：[安装](/install#nodejs--npm-path-sanity)。

## install.sh (推荐)

它做什么 (高层)：

- 检测 OS (macOS / Linux / WSL)。
- 确保 Node.js **22+** (macOS 通过 Homebrew; Linux 通过 NodeSource)。
- 选择安装方法：
  - `npm` (默认): `npm install -g openclaw@latest`
  - `git`: 克隆/构建源码 checkout 并安装包装脚本
- 在 Linux 上：需要时通过将 npm 的前缀切换到 `~/.npm-global` 来避免全局 npm 权限错误。
- 如果升级现有安装：运行 `openclaw doctor --non-interactive` (尽力而为)。
- 对于 git 安装：在安装/更新后运行 `openclaw doctor --non-interactive` (尽力而为)。
- 通过默认 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` (避免针对系统 libvips 构建) 缓解 `sharp` 本地安装问题。

如果你 *想要* `sharp` 链接到全局安装的 libvips（或者你在调试），设置：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL https://openclaw.bot/install.sh | bash
```

### 可发现性 / “git 安装” 提示

如果你在 **已经位于 OpenClaw 源码 checkout 内部** (通过 `package.json` + `pnpm-workspace.yaml` 检测) 时运行安装程序，它会提示：

- 更新并使用此 checkout (`git`)
- 或迁移到全局 npm 安装 (`npm`)

在非交互式上下文 (无 TTY / `--no-prompt`) 中，你必须传递 `--install-method git|npm` (或设置 `OPENCLAW_INSTALL_METHOD`)，否则脚本以代码 `2` 退出。

### 为什么需要 Git

Git 对于 `--install-method git` 路径 (clone / pull) 是必需的。

对于 `npm` 安装，Git *通常* 不需要，但某些环境最终仍需要它（例如，当通过 git URL 获取包或依赖项时）。安装程序目前确保 Git 存在，以避免在新的发行版上出现 `spawn git ENOENT` 意外。

### 为什么 npm 在新的 Linux 上遇到 `EACCES`

在某些 Linux 设置上（特别是在通过系统包管理器或 NodeSource 安装 Node 后），npm 的全局前缀指向 root 拥有的位置。然后 `npm install -g ...` 失败并出现 `EACCES` / `mkdir` 权限错误。

`install.sh` 通过将前缀切换到以下位置来缓解此问题：

- `~/.npm-global` (并在存在时将其添加到 `~/.bashrc` / `~/.zshrc` 中的 `PATH`)

## install-cli.sh (非 root CLI 安装程序)

此脚本将 `openclaw` 安装到前缀 (默认: `~/.openclaw`) 中，并在该前缀下安装专用的 Node 运行时，因此它可以在不想触及系统 Node/npm 的机器上工作。

帮助：

```bash
curl -fsSL https://openclaw.bot/install-cli.sh | bash -s -- --help
```

## install.ps1 (Windows PowerShell)

它做什么 (高层)：

- 确保 Node.js **22+** (winget/Chocolatey/Scoop 或手动)。
- 选择安装方法：
  - `npm` (默认): `npm install -g openclaw@latest`
  - `git`: 克隆/构建源码 checkout 并安装包装脚本
- 在升级和 git 安装时运行 `openclaw doctor --non-interactive` (尽力而为)。

示例：

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex -InstallMethod git
```

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex -InstallMethod git -GitDir "C:\openclaw"
```

环境变量：

- `OPENCLAW_INSTALL_METHOD=git|npm`
- `OPENCLAW_GIT_DIR=...`

Git 要求：

如果你选择 `-InstallMethod git` 且 Git 丢失，安装程序将打印
Git for Windows 链接 (`https://git-scm.com/download/win`) 并退出。

常见的 Windows 问题：

- **npm error spawn git / ENOENT**: 安装 Git for Windows 并重新打开 PowerShell，然后重新运行安装程序。
- **"openclaw" is not recognized**: 你的 npm 全局 bin 文件夹不在 PATH 上。大多数系统使用
  `%AppData%\npm`。你也可以运行 `npm config get prefix` 并将 `\bin` 添加到 PATH，然后重新打开 PowerShell。
