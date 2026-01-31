---
title: "安装程序内部"
sidebarTitle: "安装程序"
mmh3_hash: "ea1992f492d7babac7565da8d4ff2c09"
summary: "安装脚本的工作原理(install.sh + install-cli.sh)、标志和自动化"
read_when:
  - 您想了解 `openclaw.bot/install.sh`
  - 您想自动化安装(CI / 无头)
  - 您想从 GitHub 检出安装
---

# 安装程序内部

OpenClaw 提供两个安装脚本(从 `openclaw.ai` 提供):

- `https://openclaw.bot/install.sh` — "推荐"安装程序(默认全局 npm 安装;也可以从 GitHub 检出安装)
- `https://openclaw.bot/install-cli.sh` — 非 root 友好的 CLI 安装程序(安装到带有自己 Node 的前缀)
 - `https://openclaw.ai/install.ps1` — Windows PowerShell 安装程序(默认 npm;可选 git 安装)

要查看当前标志/行为,请运行:

```bash
curl -fsSL https://openclaw.bot/install.sh | bash -s -- --help
```

Windows(PowerShell)帮助:

```powershell
& ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -?
```

如果安装程序完成但在新终端中找不到 `openclaw`,这通常是 Node/npm PATH 问题。请参阅:[安装](/install#nodejs--npm-path-sanity)。

## install.sh(推荐)

它做什么(高层次):

- 检测操作系统(macOS / Linux / WSL)。
- 确保 Node.js **22+**(macOS 通过 Homebrew;Linux 通过 NodeSource)。
- 选择安装方法:
  - `npm`(默认):`npm install -g openclaw@latest`
  - `git`:克隆/构建源代码检出并安装包装脚本
- 在 Linux 上:通过在需要时将 npm 的前缀切换到 `~/.npm-global` 来避免全局 npm 权限错误。
- 如果升级现有安装:运行 `openclaw doctor --non-interactive`(尽力而为)。
- 对于 git 安装:在安装/更新后运行 `openclaw doctor --non-interactive`(尽力而为)。
- 通过默认 `SHARP_IGNORE_GLOBAL_LIBVIPS=1` 来缓解 `sharp` 原生安装问题(避免针对系统 libvips 构建)。

如果*想要* `sharp` 链接到全局安装的 libvips(或正在调试),请设置:

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=0 curl -fsSL https://openclaw.bot/install.sh | bash
```

### 可发现性 / "git 安装"提示

如果在**已经在 OpenClaw 源代码检出中**运行安装程序(通过 `package.json` + `pnpm-workspace.yaml` 检测),它会提示:

- 更新并使用此检出(`git`)
- 或迁移到全局 npm 安装(`npm`)

在非交互式上下文中(无 TTY / `--no-prompt`),您必须传递 `--install-method git|npm`(或设置 `OPENCLAW_INSTALL_METHOD`),否则脚本以代码 `2` 退出。

### 为什么需要 Git

对于 `--install-method git` 路径(克隆 / 拉取),需要 Git。

对于 `npm` 安装,通常*不*需要 Git,但某些环境仍然需要它(例如,当通过 git URL 获取包或依赖项时)。安装程序当前确保 Git 存在,以避免在新发行版上出现 `spawn git ENOENT` 意外。

### 为什么 npm 在新 Linux 上遇到 `EACCES`

在某些 Linux 设置上(特别是在通过系统包管理器或 NodeSource 安装 Node 之后),npm 的全局前缀指向 root 拥有的位置。然后 `npm install -g ...` 失败,出现 `EACCES` / `mkdir` 权限错误。

`install.sh` 通过将前缀切换到以下位置来缓解这一问题:

- `~/.npm-global`(并在存在时将其添加到 `~/.bashrc` / `~/.zshrc` 中的 `PATH`)

## install-cli.sh(非 root CLI 安装程序)

此脚本将 `openclaw` 安装到前缀(默认:`~/.openclaw`)并在该前缀下安装专用的 Node 运行时,因此它可以在您不想触及系统 Node/npm 的机器上工作。

帮助:

```bash
curl -fsSL https://openclaw.bot/install-cli.sh | bash -s -- --help
```

## install.ps1(Windows PowerShell)

它做什么(高层次):

- 确保 Node.js **22+**(winget/Chocolatey/Scoop 或手动)。
- 选择安装方法:
  - `npm`(默认):`npm install -g openclaw@latest`
  - `git`:克隆/构建源代码检出并安装包装脚本
- 在升级和 git 安装时运行 `openclaw doctor --non-interactive`(尽力而为)。

示例:

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex
```

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex -InstallMethod git
```

```powershell
iwr -useb https://openclaw.ai/install.ps1 | iex -InstallMethod git -GitDir "C:\\openclaw"
```

环境变量:

- `OPENCLAW_INSTALL_METHOD=git|npm`
- `OPENCLAW_GIT_DIR=...`

Git 要求:

如果选择 `-InstallMethod git` 且缺少 Git,安装程序将打印
Git for Windows 链接(`https://git-scm.com/download/win`)并退出。

常见 Windows 问题:

- **npm error spawn git / ENOENT**:安装 Git for Windows 并重新打开 PowerShell,然后重新运行安装程序。
- **"openclaw" is not recognized**:您的 npm 全局 bin 文件夹不在 PATH 上。大多数系统使用
  `%AppData%\\npm`。您也可以运行 `npm config get prefix` 并将 `\\bin` 添加到 PATH,然后重新打开 PowerShell。
