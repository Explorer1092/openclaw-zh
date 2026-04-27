---
mmh3_hash: "6c22efe0fa731d50e563c25a70ab4f8a"
title: "`openclaw dns`"
sidebarTitle: "openclaw dns"
summary: "`openclaw dns` 的 CLI 参考(广域发现助手)"
read_when:
  - 您想要通过 Tailscale + CoreDNS 进行广域发现(DNS-SD)
  - 您正在为自定义发现域设置拆分 DNS(示例:openclaw.internal)
---

# `openclaw dns`

广域发现(Tailscale + CoreDNS)的 DNS 助手。目前专注于 macOS + Homebrew CoreDNS。

相关:

- Gateway 发现:[Discovery](/gateway/discovery)
- 广域发现配置:[Configuration](/gateway/configuration)

## 设置

```bash
openclaw dns setup
openclaw dns setup --domain openclaw.internal
openclaw dns setup --apply
```

## `dns setup`

规划或应用 CoreDNS 单播 DNS-SD 发现设置。

选项:

- `--domain <domain>`:广域发现域(例如 `openclaw.internal`)
- `--apply`:安装或更新 CoreDNS 配置并重启服务(需要 sudo;仅限 macOS)

显示内容:

- 已解析的发现域
- 区域文件路径
- 当前 tailnet IP
- 推荐的 `openclaw.json` 发现配置
- 要设置的 Tailscale 拆分 DNS 名称服务器/域值

说明:

- 不带 `--apply` 时,该命令仅作为规划助手并打印推荐的设置。
- 如果省略 `--domain`,OpenClaw 使用配置中的 `discovery.wideArea.domain`。
- `--apply` 目前仅支持 macOS 且需要 Homebrew CoreDNS。
- `--apply` 在需要时引导区域文件,确保 CoreDNS 导入节存在,并重启 `coredns` brew 服务。

## 相关

- [CLI 参考](/cli)
- [Discovery](/gateway/discovery)
