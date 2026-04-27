---
mmh3_hash: "aa474e19a8d2a95a203d1f38d4e1f7e8"
summary: "从零开始安装 OpenClaw，在几分钟内完成第一次聊天。"
read_when:
  - 首次从零开始设置
  - 你想要最快速地完成可用聊天
title: "快速开始"
---

安装 OpenClaw，运行引导向导，与 AI 助手聊天——整个过程约需 5 分钟。完成后你将拥有一个运行中的 Gateway、已配置的认证和可用的聊天 Session。

## 所需条件

- **Node.js** — 推荐 Node 24（也支持 Node 22.14+）
- 来自模型提供商（Anthropic、OpenAI、Google 等）的 **API 密钥** — 引导向导会提示您输入

<Tip>
使用 `node --version` 查看 Node 版本。
**Windows 用户：** 原生 Windows 和 WSL2 均受支持。WSL2 更稳定，建议用于完整体验。参见 [Windows](/platforms/windows)。
需要安装 Node？参见 [Node 设置](/install/node)。
</Tip>

## 快速设置

<Steps>
  <Step title="安装 OpenClaw">
    <Tabs>
      <Tab title="macOS / Linux">
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
    其他安装方式（Docker、Nix、npm）：[安装](/install)。
    </Note>

  </Step>
  <Step title="运行引导向导">
    ```bash
    openclaw onboard --install-daemon
    ```

    向导会引导你选择模型提供商、设置 API 密钥并配置 Gateway，大约需要 2 分钟。

    完整参考参见 [引导向导（CLI）](/start/wizard)。

  </Step>
  <Step title="验证 Gateway 是否运行">
    ```bash
    openclaw gateway status
    ```

    你应该能看到 Gateway 在端口 18789 上监听。

  </Step>
  <Step title="打开 Dashboard">
    ```bash
    openclaw dashboard
    ```

    这会在浏览器中打开 Control UI。如果加载成功，说明一切正常。

  </Step>
  <Step title="发送第一条消息">
    在 Control UI 聊天框中输入一条消息，你应该会收到 AI 回复。

    想要从手机聊天？最快设置的 Channel 是
    [Telegram](/channels/telegram)（只需一个机器人令牌）。所有选项参见 [Channels](/channels)。

  </Step>
</Steps>

<Accordion title="高级：挂载自定义 Control UI 构建版本">
  如果你维护本地化或自定义的 Dashboard 构建版本，将
  `gateway.controlUi.root` 指向包含构建后静态资产和 `index.html` 的目录。

```bash
mkdir -p "$HOME/.openclaw/control-ui-custom"
# 将你构建好的静态文件复制到该目录。
```

然后设置：

```json
{
  "gateway": {
    "controlUi": {
      "enabled": true,
      "root": "$HOME/.openclaw/control-ui-custom"
    }
  }
}
```

重启 Gateway 并重新打开 Dashboard：

```bash
openclaw gateway restart
openclaw dashboard
```

</Accordion>

## 下一步

<Columns>
  <Card title="连接 Channel" href="/channels" icon="message-square">
    Discord、Feishu、iMessage、Matrix、Microsoft Teams、Signal、Slack、Telegram、WhatsApp、Zalo 等。
  </Card>
  <Card title="配对和安全" href="/channels/pairing" icon="shield">
    控制谁可以向你的 Agent 发消息。
  </Card>
  <Card title="配置 Gateway" href="/gateway/configuration" icon="settings">
    模型、工具、沙箱和高级设置。
  </Card>
  <Card title="浏览工具" href="/tools" icon="wrench">
    浏览器、执行、网络搜索、Skills 和插件。
  </Card>
</Columns>

<Accordion title="高级：环境变量">
  如果你以服务账号方式运行 OpenClaw 或需要自定义路径：

- `OPENCLAW_HOME` — 用于内部路径解析的主目录
- `OPENCLAW_STATE_DIR` — 覆盖状态目录
- `OPENCLAW_CONFIG_PATH` — 覆盖配置文件路径

完整参考：[环境变量](/help/environment)。
</Accordion>

## 相关

- [安装概述](/install)
- [Channels 概述](/channels)
- [设置](/start/setup)
