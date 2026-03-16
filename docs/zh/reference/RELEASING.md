---
title: "发布策略"
mmh3_hash: "479cdef6caa03237e827206656f04994"
summary: "公开发布渠道、版本命名和发布节奏"
read_when:
  - 查找公开发布渠道定义
  - 查找版本命名和发布节奏
---

# 发布策略

OpenClaw 有三个公开发布通道：

- stable：发布到 npm `latest` 的带标签版本
- beta：发布到 npm `beta` 的预发布标签
- dev：`main` 分支的移动头

## 版本命名

- Stable 发布版本：`YYYY.M.D`
  - Git 标签：`vYYYY.M.D`
- Beta 预发布版本：`YYYY.M.D-beta.N`
  - Git 标签：`vYYYY.M.D-beta.N`
- 月份或日期不要补零
- `latest` 表示当前 stable npm 发布版本
- `beta` 表示当前预发布 npm 发布版本
- Beta 发布可能在 macOS 应用跟进之前发布

## 发布节奏

- 发布先走 beta 通道
- 只有在最新 beta 经过验证后，stable 才会跟进
- 详细的发布流程、审批、凭据和恢复说明仅供维护者使用

## 公开参考

- [`.github/workflows/openclaw-npm-release.yml`](https://github.com/openclaw/openclaw/blob/main/.github/workflows/openclaw-npm-release.yml)
- [`scripts/openclaw-npm-release-check.ts`](https://github.com/openclaw/openclaw/blob/main/scripts/openclaw-npm-release-check.ts)

维护者使用
[`openclaw/maintainers/release/README.md`](https://github.com/openclaw/maintainers/blob/main/release/README.md)
中的私有发布文档进行实际操作手册。
