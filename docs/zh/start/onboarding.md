---
mmh3_hash: "3cc1d171c6b4f79d5412a855c22573d5"
summary: "OpenClaw 的首次运行入门流程（macOS 应用）"
read_when:
  - 设计 macOS 入门助手
  - 实现认证或身份设置
title: "入门（macOS 应用）"
sidebarTitle: "入门：macOS 应用"
---

本文档描述了**当前**的首次运行入门流程。目标是流畅的"第 0 天"体验：选择 Gateway 运行位置，连接认证，运行向导，并让 Agent 自我引导。
有关引导路径的一般概述，请参阅[引导概述](/start/onboarding-overview)。

<Steps>
<Step title="批准 macOS 警告">
<Frame>
<img src="/assets/macos-onboarding/01-macos-warning.jpeg" alt="" />
</Frame>
</Step>
<Step title="批准查找本地网络">
<Frame>
<img src="/assets/macos-onboarding/02-local-networks.jpeg" alt="" />
</Frame>
</Step>
<Step title="欢迎和安全通知">
<Frame caption="阅读显示的安全通知并做出相应决定">
<img src="/assets/macos-onboarding/03-security-notice.png" alt="" />
</Frame>

安全信任模型：

- 默认情况下，OpenClaw 是个人 Agent：一个受信任的操作员边界。
- 共享/多用户设置需要锁定（分离信任边界，保持工具访问最小化，并遵循[安全](/gateway/security)）。
- 本地引导现在将新配置默认为 `tools.profile: "coding"`，使全新的本地设置在不强制使用不受限的 `full` 配置文件的情况下保留文件系统/运行时工具。
- 如果启用了 Hook/Webhook 或其他不受信任的内容源，请使用强大的现代模型层，并保持严格的工具策略/沙箱。

</Step>
<Step title="本地 vs 远程">
<Frame>
<img src="/assets/macos-onboarding/04-choose-gateway.png" alt="" />
</Frame>

**Gateway** 在哪里运行？

- **本地 Mac（仅本地）：** 引导可以在本地配置认证并写入凭据。
- **远程（通过 SSH/Tailnet）：** 引导**不**在本地配置认证；凭据必须存在于 Gateway 主机上。
- **稍后配置：** 跳过设置并保持应用程序未配置状态。

<Tip>
**Gateway 认证提示：**

- 向导现在甚至为回环地址生成一个 **token**，因此本地 WS 客户端必须进行身份验证。
- 如果禁用认证，任何本地进程都可以连接；仅在完全信任的机器上使用此选项。
- 对于多机器访问或非回环绑定，请使用 **token**。

</Tip>
</Step>
<Step title="权限">
<Frame caption="选择您想授予 OpenClaw 的权限">
<img src="/assets/macos-onboarding/05-permissions.png" alt="" />
</Frame>

引导请求以下所需的 TCC 权限：

- 自动化（AppleScript）
- 通知
- 辅助功能
- 屏幕录制
- 麦克风
- 语音识别
- 相机
- 位置

</Step>
<Step title="CLI">
  <Info>此步骤是可选的</Info>
  该应用程序可以通过 npm、pnpm 或 bun 安装全局 `openclaw` CLI。
  优先选择 npm，其次是 pnpm，如果只检测到 bun 则使用 bun。
  对于 Gateway 运行时，Node 仍是推荐路径。
</Step>
<Step title="入门聊天（专用 Session）">
  设置完成后，应用程序会打开一个专用的入门聊天 Session，以便 Agent 可以自我介绍并指导后续步骤。这使得首次运行指导与您的正常对话分开。有关 Gateway 主机上首次 Agent 运行期间发生的事情，请参阅[引导](/start/bootstrapping)。
</Step>
</Steps>

## 相关

- [引导概述](/start/onboarding-overview)
- [入门指南](/start/getting-started)
