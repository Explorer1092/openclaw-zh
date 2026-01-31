---
title: "远程访问 (SSH、隧道与 Tailnet)"
sidebarTitle: "远程访问"
mmh3_hash: "06d02a24e1a693fb7c1a74d7113dd434"
summary: "Remote access using SSH tunnels (Gateway WS) and tailnets"
read_when:
  - Running or troubleshooting remote gateway setups
---
# 远程访问 (SSH、隧道与 Tailnet)

This repo supports “remote over SSH” by keeping a single Gateway (the master) running on a dedicated host (desktop/server) and connecting clients to it.

- For **operators (you / the macOS app)**: SSH tunneling is the universal fallback.
