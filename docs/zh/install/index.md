---
mmh3_hash: "d3143668002f8d2994c2689a5c5d63cd"
summary: "安装 OpenClaw — 安装程序脚本、npm/pnpm、从源码、Docker 等"
read_when:
  - 你需要入门快速入门之外的安装方法
  - 你想要部署到云平台
  - 你需要更新、迁移或卸载
title: "安装"
---

# 安装

## 推荐：安装程序脚本

最快的安装方式。它检测你的操作系统，如有需要安装 Node，安装 OpenClaw 并启动引导向导。

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    iwr -useb https://openclaw.ai/install.ps1 | iex
    ```
  </Tab>
</Tabs>

不运行引导向导仅安装：

<Tabs>
  <Tab title="macOS / Linux / WSL2">
    ```bash
    curl -fsSL https://openclaw.ai/install.sh | bash -s -- --no-onboard
    ```
  </Tab>
  <Tab title="Windows (PowerShell)">
    ```powershell
    & ([scriptblock]::Create((iwr -useb https://openclaw.ai/install.ps1))) -NoOnboard
    ```
  </Tab>
</Tabs>

有关所有标志和 CI/自动化选项，请参阅[安装程序内部](/install/installer)。

## 系统要求

- **Node 24**（推荐）或 Node 22.14+ — 安装程序脚本会自动处理
- **macOS、Linux 或 Windows** — 支持原生 Windows 和 WSL2；WSL2 更稳定。请参阅 [Windows](/platforms/windows)。
- 仅在从源码构建时需要 `pnpm`

## 其他安装方法

### 本地前缀安装程序（`install-cli.sh`）

当你希望将 OpenClaw 和 Node 保留在本地前缀（如 `~/.openclaw`）下而不依赖系统级 Node 安装时使用：

```bash
curl -fsSL https://openclaw.ai/install-cli.sh | bash
```

它默认支持 npm 安装，以及在相同前缀流程下的 git checkout 安装。完整参考：[安装程序内部](/install/installer#install-clish)。

### npm、pnpm 或 bun

如果你已经自己管理 Node：

<Tabs>
  <Tab title="npm">
    ```bash
    npm install -g openclaw@latest
    openclaw onboard --install-daemon
    ```
  </Tab>
  <Tab title="pnpm">
    ```bash
    pnpm add -g openclaw@latest
    pnpm approve-builds -g
    openclaw onboard --install-daemon
    ```

    <Note>
    pnpm 需要对具有构建脚本的包进行显式批准。在第一次安装后运行 `pnpm approve-builds -g`。
    </Note>

  </Tab>
  <Tab title="bun">
    ```bash
    bun add -g openclaw@latest
    openclaw onboard --install-daemon
    ```

    <Note>
    Bun 支持全局 CLI 安装路径。对于 Gateway 运行时，Node 仍是推荐的守护进程运行时。
    </Note>

  </Tab>
</Tabs>

<Accordion title="故障排除：sharp 构建错误（npm）">
  如果因全局安装的 libvips 导致 `sharp` 失败：

```bash
SHARP_IGNORE_GLOBAL_LIBVIPS=1 npm install -g openclaw@latest
```

</Accordion>

### 从源码

适用于贡献者或任何想要从本地 checkout 运行的人：

```bash
git clone https://github.com/openclaw/openclaw.git
cd openclaw
pnpm install && pnpm ui:build && pnpm build
pnpm link --global
openclaw onboard --install-daemon
```

或者跳过链接，在仓库内使用 `pnpm openclaw ...`。完整开发工作流请参阅[设置](/start/setup)。

### 从 GitHub main 安装

```bash
npm install -g github:openclaw/openclaw#main
```

### 容器和包管理器

<CardGroup cols={2}>
  <Card title="Docker" href="/install/docker" icon="container">
    容器化或无头部署。
  </Card>
  <Card title="Podman" href="/install/podman" icon="container">
    Docker 的无根容器替代方案。
  </Card>
  <Card title="Nix" href="/install/nix" icon="snowflake">
    通过 Nix flake 声明式安装。
  </Card>
  <Card title="Ansible" href="/install/ansible" icon="server">
    自动化集群配置。
  </Card>
  <Card title="Bun" href="/install/bun" icon="zap">
    通过 Bun 运行时使用 CLI。
  </Card>
</CardGroup>

## 验证安装

```bash
openclaw --version      # 确认 CLI 可用
openclaw doctor         # 检查配置问题
openclaw gateway status # 验证 Gateway 是否运行
```

如果你想在安装后进行托管启动：

- macOS：通过 `openclaw onboard --install-daemon` 或 `openclaw gateway install` 安装 LaunchAgent
- Linux/WSL2：通过相同命令安装 systemd 用户服务
- 原生 Windows：首先尝试计划任务，如果任务创建被拒绝则回退到每用户启动文件夹登录项

## 托管和部署

在云服务器或 VPS 上部署 OpenClaw：

<CardGroup cols={3}>
  <Card title="VPS" href="/vps">任意 Linux VPS</Card>
  <Card title="Docker VM" href="/install/docker-vm-runtime">共享 Docker 步骤</Card>
  <Card title="Kubernetes" href="/install/kubernetes">K8s</Card>
  <Card title="Fly.io" href="/install/fly">Fly.io</Card>
  <Card title="Hetzner" href="/install/hetzner">Hetzner</Card>
  <Card title="GCP" href="/install/gcp">Google Cloud</Card>
  <Card title="Azure" href="/install/azure">Azure</Card>
  <Card title="Railway" href="/install/railway">Railway</Card>
  <Card title="Render" href="/install/render">Render</Card>
  <Card title="Northflank" href="/install/northflank">Northflank</Card>
</CardGroup>

## 更新、迁移或卸载

<CardGroup cols={3}>
  <Card title="更新" href="/install/updating" icon="refresh-cw">
    保持 OpenClaw 最新。
  </Card>
  <Card title="迁移" href="/install/migrating" icon="arrow-right">
    移动到新机器。
  </Card>
  <Card title="卸载" href="/install/uninstall" icon="trash-2">
    完全删除 OpenClaw。
  </Card>
</CardGroup>

## 故障排除：找不到 `openclaw`

如果安装成功但终端中找不到 `openclaw`：

```bash
node -v           # Node 已安装？
npm prefix -g     # 全局包在哪里？
echo "$PATH"      # 全局 bin 目录是否在 PATH 中？
```

如果 `$(npm prefix -g)/bin` 不在你的 `$PATH` 中，将其添加到 shell 启动文件（`~/.zshrc` 或 `~/.bashrc`）：

```bash
export PATH="$(npm prefix -g)/bin:$PATH"
```

然后打开新终端。详情请参阅 [Node 设置](/install/node)。
