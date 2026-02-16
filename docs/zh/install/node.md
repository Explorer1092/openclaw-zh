---
title: "Node.js"
summary: "安装和配置 Node.js 以供 OpenClaw 使用 — 版本要求、安装选项和 PATH 故障排除"
read_when:
  - 您需要在安装 OpenClaw 之前安装 Node.js
  - 您安装了 OpenClaw 但 `openclaw` 命令未找到
  - npm install -g 因权限或 PATH 问题失败
---

# Node.js

OpenClaw 需要 **Node 22 或更高版本**。[安装程序脚本](/install#install-methods) 将自动检测和安装 Node — 本页适用于您想自行设置 Node 并确保一切正确连接 (版本、PATH、全局安装) 的情况。

## 检查您的版本

```bash
node -v
```

如果打印 `v22.x.x` 或更高版本, 您就可以了。如果未安装 Node 或版本太旧, 请选择下面的安装方法。

## 安装 Node

<Tabs>
  <Tab title="macOS">
    **Homebrew** (推荐):

    ```bash
    brew install node
    ```

    或从 [nodejs.org](https://nodejs.org/) 下载 macOS 安装程序。

  </Tab>
  <Tab title="Linux">
    **Ubuntu / Debian:**

    ```bash
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    ```

    **Fedora / RHEL:**

    ```bash
    sudo dnf install nodejs
    ```

    或使用版本管理器 (见下文)。

  </Tab>
  <Tab title="Windows">
    **winget** (推荐):

    ```powershell
    winget install OpenJS.NodeJS.LTS
    ```

    **Chocolatey:**

    ```powershell
    choco install nodejs-lts
    ```

    或从 [nodejs.org](https://nodejs.org/) 下载 Windows 安装程序。

  </Tab>
</Tabs>

<Accordion title="使用版本管理器 (nvm, fnm, mise, asdf)">
  版本管理器让您可以轻松切换 Node 版本。流行选项:

- [**fnm**](https://github.com/Schniz/fnm) — 快速、跨平台
- [**nvm**](https://github.com/nvm-sh/nvm) — 在 macOS/Linux 上广泛使用
- [**mise**](https://mise.jdx.dev/) — 多语言 (Node, Python, Ruby 等)

使用 fnm 的示例:

```bash
fnm install 22
fnm use 22
```

  <Warning>
  确保您的版本管理器在您的 shell 启动文件 (`~/.zshrc` 或 `~/.bashrc`) 中初始化。如果没有, `openclaw` 可能在新终端会话中找不到, 因为 PATH 不会包含 Node 的 bin 目录。
  </Warning>
</Accordion>

## 故障排除

### `openclaw: command not found`

这几乎总是意味着 npm 的全局 bin 目录不在您的 PATH 上。

<Steps>
  <Step title="找到您的全局 npm 前缀">
    ```bash
    npm prefix -g
    ```
  </Step>
  <Step title="检查它是否在您的 PATH 上">
    ```bash
    echo "$PATH"
    ```

    在输出中查找 `<npm-prefix>/bin` (macOS/Linux) 或 `<npm-prefix>` (Windows)。

  </Step>
  <Step title="将其添加到您的 shell 启动文件">
    <Tabs>
      <Tab title="macOS / Linux">
        添加到 `~/.zshrc` 或 `~/.bashrc`:

        ```bash
        export PATH="$(npm prefix -g)/bin:$PATH"
        ```

        然后打开一个新终端 (或在 zsh 中运行 `rehash` / 在 bash 中运行 `hash -r`)。
      </Tab>
      <Tab title="Windows">
        通过设置 → 系统 → 环境变量将 `npm prefix -g` 的输出添加到您的系统 PATH。
      </Tab>
    </Tabs>

  </Step>
</Steps>

### `npm install -g` 上的权限错误 (Linux)

如果您看到 `EACCES` 错误, 请将 npm 的全局前缀切换到用户可写目录:

```bash
mkdir -p "$HOME/.npm-global"
npm config set prefix "$HOME/.npm-global"
export PATH="$HOME/.npm-global/bin:$PATH"
```

将 `export PATH=...` 行添加到您的 `~/.bashrc` 或 `~/.zshrc` 以使其永久生效。
