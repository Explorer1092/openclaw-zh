---
mmh3_hash: "479fbd087bada8f38432189e6cc740ed"
summary: "`openclaw dns` 的 CLI 参考(广域发现助手)"
read_when:
  - 您想要通过 Tailscale + CoreDNS 进行广域发现(DNS-SD)
  - 您正在为自定义发现域设置拆分 DNS(示例:openclaw.internal)
---

# `openclaw dns`

广域发现(Tailscale + CoreDNS)的 DNS 助手。目前专注于 macOS + Homebrew CoreDNS。

相关:
- 网关发现:[发现](/gateway/discovery)
- 广域发现配置:[配置](/gateway/configuration)

## 设置

```bash
openclaw dns setup
openclaw dns setup --apply
```
