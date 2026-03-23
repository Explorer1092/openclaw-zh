---
mmh3_hash: "1ed10974149e7167e53eb9edb7f0da56"
title: "构建 Channel Plugin"
sidebarTitle: "Channel Plugin"
summary: "构建 OpenClaw 消息 Channel Plugin 的分步指南"
read_when:
  - 您正在构建新的消息 Channel Plugin
  - 您想将 OpenClaw 连接到消息平台
  - 您需要了解 ChannelPlugin 适配器接口
---

# 构建 Channel Plugin

本指南演示如何构建将 OpenClaw 连接到消息平台的 Channel Plugin。完成后，您将拥有一个具有 DM 安全性、配对、回复线程和出站消息功能的工作 Channel。

<Info>
  如果您之前没有构建过任何 OpenClaw Plugin，请先阅读
  [入门指南](/plugins/building-plugins) 了解基本包结构和清单设置。
</Info>

## Channel Plugin 工作原理

Channel Plugin 不需要自己的发送/编辑/反应 Tool。OpenClaw 在核心保留一个共享 `message` Tool。您的 Plugin 拥有：

- **配置** — 账户解析和设置向导
- **安全性** — DM 策略和允许列表
- **配对** — DM 审批流程
- **出站** — 向平台发送文本、媒体和投票
- **线程** — 如何处理回复线程

核心拥有共享消息 Tool、Prompt 连接、会话记录和分发。

## 演练

<Steps>
  <Step title="包和清单">
    创建标准 Plugin 文件。`package.json` 中的 `channel` 字段使其成为 Channel Plugin：

    <CodeGroup>
    ```json package.json
    {
      "name": "@myorg/openclaw-acme-chat",
      "version": "1.0.0",
      "type": "module",
      "openclaw": {
        "extensions": ["./index.ts"],
        "setupEntry": "./setup-entry.ts",
        "channel": {
          "id": "acme-chat",
          "label": "Acme Chat",
          "blurb": "Connect OpenClaw to Acme Chat."
        }
      }
    }
    ```

    ```json openclaw.plugin.json
    {
      "id": "acme-chat",
      "kind": "channel",
      "channels": ["acme-chat"],
      "name": "Acme Chat",
      "description": "Acme Chat channel plugin",
      "configSchema": {
        "type": "object",
        "additionalProperties": false,
        "properties": {
          "acme-chat": {
            "type": "object",
            "properties": {
              "token": { "type": "string" },
              "allowFrom": {
                "type": "array",
                "items": { "type": "string" }
              }
            }
          }
        }
      }
    }
    ```
    </CodeGroup>

  </Step>

  <Step title="构建 Channel Plugin 对象">
    `ChannelPlugin` 接口有许多可选适配器接口。从最小值开始 — `id` 和 `setup` — 按需添加适配器。

    创建 `src/channel.ts`：

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
    import { acmeChatApi } from "./client.js"; // 您的平台 API 客户端

    type ResolvedAccount = {
      accountId: string | null;
      token: string;
      allowFrom: string[];
      dmPolicy: string | undefined;
    };

    function resolveAccount(
      cfg: OpenClawConfig,
      accountId?: string | null,
    ): ResolvedAccount {
      const section = (cfg.channels as Record<string, any>)?.["acme-chat"];
      const token = section?.token;
      if (!token) throw new Error("acme-chat: token is required");
      return {
        accountId: accountId ?? null,
        token,
        allowFrom: section?.allowFrom ?? [],
        dmPolicy: section?.dmSecurity,
      };
    }

    export const acmeChatPlugin = createChatChannelPlugin<ResolvedAccount>({
      base: createChannelPluginBase({
        id: "acme-chat",
        setup: {
          resolveAccount,
          inspectAccount(cfg, accountId) {
            const section =
              (cfg.channels as Record<string, any>)?.["acme-chat"];
            return {
              enabled: Boolean(section?.token),
              configured: Boolean(section?.token),
              tokenStatus: section?.token ? "available" : "missing",
            };
          },
        },
      }),

      // DM 安全性：谁可以向机器人发消息
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // 配对：新 DM 联系人的审批流程
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // 线程：如何传递回复
      threading: { topLevelReplyToMode: "reply" },

      // 出站：向平台发送消息
      outbound: {
        attachedResults: {
          sendText: async (params) => {
            const result = await acmeChatApi.sendMessage(
              params.to,
              params.text,
            );
            return { messageId: result.id };
          },
        },
        base: {
          sendMedia: async (params) => {
            await acmeChatApi.sendFile(params.to, params.filePath);
          },
        },
      },
    });
    ```

  </Step>

  <Step title="连接入口点">
    创建 `index.ts`：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerFull(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          { commands: ["acme-chat"] },
        );
      },
    });
    ```

    `defineChannelPluginEntry` 自动处理设置/完整注册的分割。所有选项请参见 [入口点](/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts` 用于入门期间的轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当 Channel 被禁用或未配置时，OpenClaw 加载此文件而不是完整入口。它避免在设置流程中引入重量级运行时代码。详见 [设置和配置](/plugins/sdk-setup#setup-entry)。

  </Step>

  <Step title="处理入站消息">
    您的 Plugin 需要接收来自平台的消息并将其转发给 OpenClaw。典型模式是一个 Webhook，它验证请求并通过 Channel 的入站处理程序分发它：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // 由 Plugin 管理身份验证（自行验证签名）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 您的入站处理程序将消息分发给 OpenClaw
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      入站消息处理是 Channel 特定的。每个 Channel Plugin 拥有自己的入站管道。请查看打包的 Channel Plugin（例如 `extensions/msteams`、`extensions/googlechat`）获取真实模式。
    </Note>

  </Step>

  <Step title="测试">
    在 `src/channel.test.ts` 中编写并列测试：

    ```typescript src/channel.test.ts
    import { describe, it, expect } from "vitest";
    import { acmeChatPlugin } from "./channel.js";

    describe("acme-chat plugin", () => {
      it("resolves account from config", () => {
        const cfg = {
          channels: {
            "acme-chat": { token: "test-token", allowFrom: ["user1"] },
          },
        } as any;
        const account = acmeChatPlugin.setup!.resolveAccount(cfg, undefined);
        expect(account.token).toBe("test-token");
      });
    });
    ```

    ```bash
    pnpm test -- extensions/acme-chat/
    ```

  </Step>
</Steps>

## 文件结构

```
extensions/acme-chat/
├── package.json              # openclaw.channel 元数据
├── openclaw.plugin.json      # 带配置模式的清单
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公共导出（可选）
├── runtime-api.ts            # 内部运行时导出（可选）
└── src/
    ├── channel.ts            # 通过 createChatChannelPlugin 的 ChannelPlugin
    ├── channel.test.ts       # 测试
    ├── client.ts             # 平台 API 客户端
    └── runtime.ts            # 运行时存储（如需）
```

## 后续步骤

- [Provider Plugin](/plugins/sdk-provider-plugins) — 如果您的 Plugin 还提供模型
- [SDK 概览](/plugins/sdk-overview) — 完整子路径导入参考
- [SDK 测试](/plugins/sdk-testing) — 测试工具和契约测试
- [Plugin 清单](/plugins/manifest) — 完整清单模式
