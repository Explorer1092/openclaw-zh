---
title: "技能 (macOS)"
sidebarTitle: "技能"
mmh3_hash: "5f40ab859ff3641478c879db4be2cafd"
summary: "macOS Skills 设置 UI 和 gateway 支持的状态"
read_when:
  - 更新 macOS Skills 设置 UI
  - 更改技能门控或安装行为
---

# 技能 (macOS)

macOS 应用通过 gateway 显示 OpenClaw 技能；它不在本地解析技能。

## 数据源

- `skills.status`（gateway）返回所有技能加上资格和缺失的要求（包括捆绑技能的允许列表阻止）。
- 要求从每个 `SKILL.md` 中的 `metadata.openclaw.requires` 派生。

## 安装操作

- `metadata.openclaw.install` 定义安装选项（brew/node/go/uv）。
- 应用调用 `skills.install` 在 gateway 主机上运行安装程序。
- 内置的危险代码 `critical` 发现默认阻止 `skills.install`；可疑发现仍然只会发出警告。危险覆盖存在于 gateway 请求中，但默认应用流程保持失败关闭。
- 如果每个安装选项都是 `download`，gateway 会显示所有下载选择。
- 否则，gateway 使用当前安装偏好和主机二进制文件选择一个首选安装程序：当 `skills.install.preferBrew` 启用且 `brew` 存在时优先选择 Homebrew，然后是 `uv`，然后是 `skills.install.nodeManager` 中配置的 node 管理器，然后是后续回退如 `go` 或 `download`。
- Node 安装标签反映配置的 node 管理器，包括 `yarn`。

## Env/API 密钥

- 应用将密钥存储在 `skills.entries.<skillKey>` 下的 `~/.openclaw/openclaw.json` 中。
- `skills.update` 修补 `enabled`、`apiKey` 和 `env`。

## 远程模式

- 安装 + 配置更新发生在 gateway 主机上（而不是本地 Mac）。

## 相关文档

- [技能](/tools/skills)
- [macOS 应用](/platforms/macos)
