---
mmh3_hash: "ac70ef518578c0383a90cf5dd03ab977"
summary: "从零开始安装 OpenClaw，在几分钟内完成第一次聊天。"
read_when:
  - 首次从零开始设置
  - 你想要最快速地完成可用聊天
title: "快速开始"
---

# 快速开始

目标：以最少的设置从零开始完成第一次可用聊天。

<Info>
最快聊天方式：打开 Control UI（无需设置 Channel）。运行 `openclaw dashboard`
并在浏览器中聊天，或者在
<Tooltip headline="Gateway 主机" tip="运行 OpenClaw gateway 服务的机器。">Gateway 主机</Tooltip>上打开 `http://127.0.0.1:18789/`。
文档：[Dashboard](/web/dashboard) 和 [Control UI](/web/control-ui)。
</Info>

## 前提条件

- 推荐 Node 24（Node 22 LTS，当前为 `22.16+`，仍受支持以兼容）

<Tip>
如果不确定，可以用 `node --version` 查看 Node 版本。
</Tip>

## 快速设置（CLI）

<Steps>
  <Step title="安装 OpenClaw（推荐）">
    <Tabs>
      <Tab title="macOS/Linux">
        ```bash
        curl -fsSL https://openclaw.ai/install.sh | bash
        ```
        <img
  src="/assets/install-script.svg"
  alt="Install Script Process"
  className="rounded-lg"
/>
      </Tab>
      <Tab title="Windows (PowerShell)">
        ```powershell
        iwr -useb https://openclaw.ai/install.ps1 | iex
        ```
      </Tab>
    </Tabs>

    <Note>
    其他安装方式和要求：[安装](/install)。
    </Note>

  </Step>
  <Step title="运行设置向导">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导会配置认证、Gateway 设置和可选 Channel。
    详情参见 [设置向导](/start/wizard)。

  </Step>
  <Step title="检查 Gateway">
    如果已安装服务，Gateway 应该已经在运行：

    ```bash
    openclaw gateway status
    ```

  </Step>
  <Step title="打开 Control UI">
    ```bash
    openclaw dashboard
    ```
  </Step>
</Steps>

<Check>
如果 Control UI 成功加载，你的 Gateway 已就绪。
</Check>

## 可选检查和扩展

<AccordionGroup>
  <Accordion title="在前台运行 Gateway">
    适合快速测试或故障排查。

    ```bash
    openclaw gateway --port 18789
    ```

  </Accordion>
  <Accordion title="发送测试消息">
    需要已配置 Channel。

    ```bash
    openclaw message send --target +15555550123 --message "Hello from OpenClaw"
    ```

  </Accordion>
</AccordionGroup>

## 常用环境变量

如果你以服务账号方式运行 OpenClaw，或需要自定义配置/状态位置：

- `OPENCLAW_HOME` 设置用于内部路径解析的主目录。
- `OPENCLAW_STATE_DIR` 覆盖状态目录。
- `OPENCLAW_CONFIG_PATH` 覆盖配置文件路径。

完整环境变量参考：[环境变量](/help/environment)。

## 深入了解

<Columns>
  <Card title="设置向导（详细）" href="/start/wizard">
    完整的 CLI 向导参考和高级选项。
  </Card>
  <Card title="macOS 应用初次引导" href="/start/onboarding">
    macOS 应用的首次运行流程。
  </Card>
</Columns>

## 完成后你将拥有

- 一个运行中的 Gateway
- 已配置的认证
- Control UI 访问权限或已连接的 Channel

## 下一步

- 私信安全与审批：[配对](/channels/pairing)
- 连接更多 Channel：[Channels](/channels)
- 高级工作流和从源码运行：[设置](/start/setup)
