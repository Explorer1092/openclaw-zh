---
mmh3_hash: "7d7e92ed11374979fee335d8293e8987"
title: 构建 Channel 插件
sidebarTitle: Channel 插件
summary: 为 OpenClaw 构建消息 Channel 插件的分步指南
read_when:
  - 你正在构建新的消息 Channel 插件
  - 你想将 OpenClaw 连接到某个消息平台
  - 你需要了解 ChannelPlugin 适配器接口
x-i18n:
  generated_at: "2026-03-30T00:00:00Z"
  model: claude-sonnet-4-6
  provider: pi
  source_hash: ""
  source_path: plugins/sdk-channel-plugins.md
  workflow: 15
---

# 构建 Channel 插件

本指南演示如何构建一个将 OpenClaw 连接到消息平台的 Channel 插件。完成后你将拥有一个具备 DM 安全、Pairing、回复线程和消息发送功能的可用 Channel。

<Info>
  如果你从未构建过任何 OpenClaw 插件，请先阅读 [入门指南](/plugins/building-plugins) 了解基本的包结构和 Manifest 设置。
</Info>

## Channel 插件的工作原理

Channel 插件不需要自己的发送/编辑/反应工具。OpenClaw 在核心中保留了一个共享的 `message` 工具。你的插件负责：

- **Config** — 账号解析和设置向导
- **Security** — DM 策略和允许列表
- **Pairing** — DM 审批流程
- **Outbound** — 向平台发送文本、媒体和投票
- **Threading** — 回复的线程方式

核心负责共享消息工具、Prompt 接入、Session 记账和分发。

## 审批和 Channel 能力

大多数 Channel 插件不需要审批专属代码。

- 核心负责同聊天 `/approve`、共享审批按钮载荷和通用回退投递。
- 仅当审批认证与普通聊天认证不同时，才使用 `auth.authorizeActorAction` 或 `auth.getActionAvailabilityState`。
- 对于 Channel 特定的载荷生命周期行为（如隐藏重复的本地审批提示或在投递前发送正在输入指示），使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload`。
- 仅对原生审批路由或回退抑制使用 `approvals.delivery`。
- 仅当 Channel 真正需要自定义审批载荷而非共享渲染器时，才使用 `approvals.render`。
- 如果 Channel 可以从现有配置推断出稳定的类所有者 DM 身份，使用 `openclaw/plugin-sdk/approval-runtime` 中的 `createResolvedApproverActionAuthAdapter` 来限制同聊天 `/approve`，而无需添加审批专属的核心逻辑。

对于 Slack、Matrix、Microsoft Teams 和类似的聊天 Channel，默认路径通常就足够了：核心处理审批，插件只需暴露普通的 outbound 和 auth 能力。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和 Manifest">
    创建标准插件文件。`package.json` 中的 `channel` 字段是使其成为 Channel 插件的关键：

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

  <Step title="构建 Channel 插件对象">
    `ChannelPlugin` 接口有许多可选适配器接口。从最小配置开始——`id` 和 `setup`——然后按需添加适配器。

    创建 `src/channel.ts`：

    ```typescript src/channel.ts
    import {
      createChatChannelPlugin,
      createChannelPluginBase,
    } from "openclaw/plugin-sdk/core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/core";
    import { acmeChatApi } from "./client.js"; // 你的平台 API 客户端

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

      // DM security: 谁可以给机器人发消息
      security: {
        dm: {
          channelKey: "acme-chat",
          resolvePolicy: (account) => account.dmPolicy,
          resolveAllowFrom: (account) => account.allowFrom,
          defaultPolicy: "allowlist",
        },
      },

      // Pairing: 新 DM 联系人的审批流程
      pairing: {
        text: {
          idLabel: "Acme Chat username",
          message: "Send this code to verify your identity:",
          notify: async ({ target, code }) => {
            await acmeChatApi.sendDm(target, `Pairing code: ${code}`);
          },
        },
      },

      // Threading: 回复的投递方式
      threading: { topLevelReplyToMode: "reply" },

      // Outbound: 向平台发送消息
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

    <Accordion title="createChatChannelPlugin 为你做了什么">
      你无需手动实现低级适配器接口，而是传入声明式选项，构建器会将其组合起来：

      | 选项 | 接入内容 |
      | --- | --- |
      | `security.dm` | 从配置字段派生的作用域 DM 安全解析器 |
      | `pairing.text` | 基于文本的 DM Pairing 流程，包含代码交换 |
      | `threading` | 回复模式解析器（固定、账号范围或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果需要完全控制，也可以传入原始适配器对象代替声明式选项。
    </Accordion>

  </Step>

  <Step title="接入入口点">
    创建 `index.ts`：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineChannelPluginEntry({
      id: "acme-chat",
      name: "Acme Chat",
      description: "Acme Chat channel plugin",
      plugin: acmeChatPlugin,
      registerCliMetadata(api) {
        api.registerCli(
          ({ program }) => {
            program
              .command("acme-chat")
              .description("Acme Chat management");
          },
          {
            descriptors: [
              {
                name: "acme-chat",
                description: "Acme Chat management",
                hasSubcommands: false,
              },
            ],
          },
        );
      },
      registerFull(api) {
        api.registerGatewayMethod(/* ... */);
      },
    });
    ```

    将 Channel 拥有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw 可以在根帮助中展示它们而无需激活完整的 Channel 运行时，同时正常的完整加载仍会使用相同的描述符进行真实命令注册。将 `registerFull(...)` 保留给仅运行时的工作。`defineChannelPluginEntry` 自动处理注册模式分离。所有选项请参阅 [Entry Points](/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加 Setup Entry">
    创建 `setup-entry.ts` 用于引导时的轻量级加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当 Channel 被禁用或未配置时，OpenClaw 加载此文件而非完整 Entry。这样可以避免在设置流程中引入重量级运行时代码。详情请参阅 [设置和配置](/plugins/sdk-setup#setup-entry)。

  </Step>

  <Step title="处理入站消息">
    你的插件需要从平台接收消息并转发给 OpenClaw。典型模式是通过 Webhook 验证请求并通过 Channel 的入站处理程序分发：

    ```typescript
    registerFull(api) {
      api.registerHttpRoute({
        path: "/acme-chat/webhook",
        auth: "plugin", // 插件管理的认证（自行验证签名）
        handler: async (req, res) => {
          const event = parseWebhookPayload(req);

          // 你的入站处理程序将消息分发到 OpenClaw。
          // 具体接入方式取决于你的平台 SDK——
          // 请参阅捆绑的 Microsoft Teams 或 Google Chat 插件包中的真实示例。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      入站消息处理是 Channel 专属的。每个 Channel 插件拥有自己的入站流水线。请查看捆绑的 Channel 插件（如 Microsoft Teams 或 Google Chat 插件包）了解真实模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
<Step title="测试">
在 `src/channel.test.ts` 中编写同目录测试：

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

      it("inspects account without materializing secrets", () => {
        const cfg = {
          channels: { "acme-chat": { token: "test-token" } },
        } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(true);
        expect(result.tokenStatus).toBe("available");
      });

      it("reports missing config", () => {
        const cfg = { channels: {} } as any;
        const result = acmeChatPlugin.setup!.inspectAccount!(cfg, undefined);
        expect(result.configured).toBe(false);
      });
    });
    ```

    ```bash
    pnpm test -- <bundled-plugin-root>/acme-chat/
    ```

    共享测试辅助工具请参阅 [测试](/plugins/sdk-testing)。

  </Step>
</Steps>

## 文件结构

```
<bundled-plugin-root>/acme-chat/
├── package.json              # openclaw.channel 元数据
├── openclaw.plugin.json      # 包含配置 Schema 的 Manifest
├── index.ts                  # defineChannelPluginEntry
├── setup-entry.ts            # defineSetupPluginEntry
├── api.ts                    # 公共导出（可选）
├── runtime-api.ts            # 内部运行时导出（可选）
└── src/
    ├── channel.ts            # 通过 createChatChannelPlugin 实现的 ChannelPlugin
    ├── channel.test.ts       # 测试
    ├── client.ts             # 平台 API 客户端
    └── runtime.ts            # 运行时存储（如需要）
```

## 进阶主题

<CardGroup cols={2}>
  <Card title="Threading 选项" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    固定、账号范围或自定义回复模式
  </Card>
  <Card title="消息工具集成" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和 action 发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、子 Agent
  </Card>
</CardGroup>

## 下一步

- [Provider 插件](/plugins/sdk-provider-plugins) — 如果你的插件同时提供模型
- [SDK Overview](/plugins/sdk-overview) — 完整子路径导入参考
- [SDK 测试](/plugins/sdk-testing) — 测试工具和契约测试
- [Plugin Manifest](/plugins/manifest) — 完整 Manifest Schema
