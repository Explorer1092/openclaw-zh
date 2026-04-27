---
mmh3_hash: "49d7d30c0c97660452b3659b96fdcd4a"
title: "completion"
summary: "`openclaw completion` 的 CLI 参考（生成/安装 Shell 补全脚本）"
read_when:
  - 需要为 zsh/bash/fish/PowerShell 启用 Shell 补全
  - 需要将补全脚本缓存到 OpenClaw 状态目录
---

# `openclaw completion`

生成 Shell 补全脚本，并可选择将其安装到 Shell 配置文件中。

## 用法

```bash
openclaw completion
openclaw completion --shell zsh
openclaw completion --install
openclaw completion --shell fish --install
openclaw completion --write-state
openclaw completion --shell bash --write-state
```

## 选项

- `-s, --shell <shell>`：目标 Shell（`zsh`、`bash`、`powershell`、`fish`；默认：`zsh`）
- `-i, --install`：通过在 Shell 配置文件中添加 source 行来安装补全
- `--write-state`：将补全脚本写入 `$OPENCLAW_STATE_DIR/completions`，不打印到 stdout
- `-y, --yes`：跳过安装确认提示

## 说明

- `--install` 会在你的 Shell 配置文件中写入一个小型 "OpenClaw Completion" 代码块，并将其指向缓存的脚本。
- 不使用 `--install` 或 `--write-state` 时，命令会将脚本打印到 stdout。
- 补全生成会提前加载命令树，以便包含嵌套子命令。

## 相关

- [CLI 参考](/cli)
