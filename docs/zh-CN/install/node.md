---
read_when:
  - 你需要在安装 OpenClaw 之前安装 Node.js
  - 你已安装 OpenClaw 但提示 `openclaw` 命令找不到
  - npm install -g 失败，提示权限或 PATH 问题
summary: 为 OpenClaw 安装和配置 Node.js——版本要求、安装方式与 PATH 排错
title: Node.js
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: c3d11a492661785deb187b544a5334b7c14ef5924afcb5e466c02e46a7e95874
  source_path: install/node.md
  workflow: 15
---

# Node.js

OpenClaw 需要 **Node 22.14 或更新版本**。**Node 24 是安装、CI 和发布工作流的默认推荐运行时**。Node 22 通过活跃 LTS 支持线仍受支持。[安装脚本](/install#alternative-install-methods)会自动检测并安装 Node——本页适用于你想自行设置 Node 并确保一切正确配置（版本、PATH、全局安装）的场景。

## 检查你的版本

```bash
node -v
```

如果输出 `v24.x.x` 或更高，说明你使用的是推荐的默认版本。如果输出 `v22.14.x` 或更高，说明你使用的是支持的 Node 22 LTS 路径，但我们仍建议在方便时升级到 Node 24。如果 Node 未安装或版本过旧，请从下方选择安装方式。

## 安装 Node

<Tabs>
  <Tab title="macOS">
    **Homebrew**（推荐）：

    ```bash
    brew install node
    ```

    或从 [nodejs.org](https://nodejs.org/) 下载 macOS 安装包。

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian：**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL：**

    ```bash
    sudo dnf install nodejs
    ```

    或使用版本管理器（见下文）。

  </Tab>
  <Tab title="Windows">
    **winget**（推荐）：

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey：**

    ```powershell
    choco install nodejs-lts
    ```

    或从 [nodejs.org](https://nodejs.org/) 下载 Windows 安装包。

  </Tab>
</Tabs>

<Accordion title="使用版本管理器（nvm、fnm、mise、asdf）">
  版本管理器让你可以轻松切换 Node 版本。常用选项：

- [**fnm**](https://github.com/Schniz/fnm) — 快速，跨平台
- [**nvm**](https://github.com/nvm-sh/nvm) — macOS/Linux 上广泛使用
- [**mise**](https://mise.jdx.dev/) — 多语言（Node、Python、Ruby 等）

以 fnm 为例：

```bash
fnm install 24
fnm use 24
```

  <Warning>
  确保你的版本管理器在 shell 启动文件（`~/.zshrc` 或 `~/.bashrc`）中已初始化。如果没有，新终端会话中可能找不到 `openclaw`，因为 PATH 不包含 Node 的 bin 目录。
  </Warning>
</Accordion>

## 故障排除

### `openclaw: command not found`

这几乎总是意味着 npm 的全局 bin 目录不在你的 PATH 中。

<Steps>
  <Step title="找到你的全局 npm 前缀">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="检查它是否在你的 PATH 中">
    ```bash
    echo "$PATH"
    ```

    在输出中查找 `<npm-prefix>/bin`（macOS/Linux）或 `<npm-prefix>`（Windows）。

  </Step>
  <Step title="将其添加到 shell 启动文件">
    <Tabs>
      <Tab title="macOS / Linux">
        添加到 `~/.zshrc` 或 `~/.bashrc`：

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        然后打开新终端（或在 zsh 中运行 `rehash` / 在 bash 中运行 `hash -r`）。
      </Tab>
      <Tab title="Windows">
        将 `npm prefix -g` 的输出通过"设置 → 系统 → 环境变量"添加到系统 PATH。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### Linux 上 `npm install -g` 权限错误

如果你看到 `EACCES` 错误，将 npm 的全局前缀切换到用户可写的目录：

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

将 `export PATH=...` 行添加到你的 `~/.bashrc` 或 `~/.zshrc` 以使其永久生效。
