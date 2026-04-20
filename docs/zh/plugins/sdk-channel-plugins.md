---
mmh3_hash: "a4cae684a84fd55d54be7d437871eb46"
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
- **Session 语法** — Provider 特定的会话 id 如何映射到基础聊天、线程 id 和父级回退
- **出站** — 向平台发送文本、媒体和投票
- **线程** — 如何处理回复线程

核心拥有共享消息 Tool、Prompt 连接、外部 Session 键形状、通用 `:thread:` 记录和分发。

如果您的 Channel 添加携带媒体来源的消息工具参数，通过 `describeMessageTool(...).mediaSourceParams` 暴露这些参数名称。核心将该显式列表用于沙盒路径规范化和出站媒体访问策略，因此 Plugin 不需要针对 Provider 特定的头像、附件或封面图片参数进行共享核心特殊处理。优先返回操作键控映射（如 `{ "set-profile": ["avatarUrl", "avatarPath"] }`），以便无关操作不会继承另一个操作的媒体参数。对于有意在每个暴露操作中共享的参数，平面数组仍然有效。

如果您的平台在会话 id 内存储额外的作用域，请在 Plugin 中使用 `messaging.resolveSessionConversation(...)` 保留该解析。这是将 `rawId` 映射到基础会话 id、可选线程 id、显式 `baseConversationId` 以及任何 `parentConversationCandidates` 的规范 Hook。当您返回 `parentConversationCandidates` 时，请从最窄的父级到最宽/基础会话排序。

在 Channel 注册表启动之前需要相同解析的捆绑 Plugin 也可以暴露一个顶级 `session-key-api.ts` 文件，其中包含匹配的 `resolveSessionConversation(...)` 导出。核心仅在运行时 Plugin 注册表尚不可用时才使用该引导安全的界面。

`messaging.resolveParentConversationCandidates(...)` 仍然作为旧版兼容性回退可用，当 Plugin 仅需要在通用/原始 id 之上的父级回退时。如果两个 Hook 都存在，核心首先使用 `resolveSessionConversation(...).parentConversationCandidates`，仅在规范 Hook 省略时才回退到 `resolveParentConversationCandidates(...)`。

## 批准与 Channel 能力

大多数 Channel Plugin 不需要批准特定的代码。

- 核心拥有同聊天 `/approve`、共享批准按钮有效载荷和通用回退交付。
- 当 Channel 需要批准特定行为时，优先在 Channel Plugin 上使用一个 `approvalCapability` 对象。
- `approvalCapability.authorizeActorAction` 和 `approvalCapability.getActionAvailabilityState` 是规范的批准认证接缝。
- 使用 `approvalCapability.getActionAvailabilityState` 实现同聊天批准认证可用性。
- 如果您的 Channel 暴露原生 exec 批准，使用 `approvalCapability.getExecInitiatingSurfaceState` 表示当发起界面/原生客户端状态与同聊天批准认证不同时的情况。核心使用该 exec 特定 Hook 区分 `enabled` 与 `disabled`，决定发起 Channel 是否支持原生 exec 批准，并将 Channel 纳入原生客户端回退指南。`createApproverRestrictedNativeApprovalCapability(...)` 为常见情况填充此值。
- 使用 `outbound.shouldSuppressLocalPayloadPrompt` 或 `outbound.beforeDeliverPayload` 处理 Channel 特定的有效载荷生命周期行为，如隐藏重复的本地批准提示或在交付前发送输入指示器。
- 仅对原生批准路由或回退抑制使用 `approvalCapability.delivery`。
- 仅当 Channel 真正需要自定义批准有效载荷而不是共享渲染器时，才使用 `approvalCapability.render`。
- 当 Channel 希望禁用路径回复解释启用原生 exec 批准所需的确切配置项时，使用 `approvalCapability.describeExecApprovalSetup`。该 Hook 接收 `{ channel, channelLabel, accountId }`；命名账户的 Channel 应渲染账户范围的路径，如 `channels.<channel>.accounts.<id>.execApprovals.*` 而不是顶级默认值。
- 如果 Channel 可以从现有配置推断出稳定的所有者类 DM 身份，使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createResolvedApproverActionAuthAdapter` 限制同聊天 `/approve`，而无需添加批准特定的核心逻辑。
- 如果 Channel 需要原生批准交付，让 Channel 代码专注于目标规范化以及传输/呈现事实。使用来自 `openclaw/plugin-sdk/approval-runtime` 的 `createChannelExecApprovalProfile`、`createChannelNativeOriginTargetResolver`、`createChannelApproverDmTargetResolver` 和 `createApproverRestrictedNativeApprovalCapability`。将 Channel 特定事实放在 `approvalCapability.nativeRuntime` 后面，最好通过 `createChannelApprovalNativeRuntimeAdapter(...)` 或 `createLazyChannelApprovalNativeRuntimeAdapter(...)` 实现，这样核心就可以组装处理程序并拥有请求过滤、路由、去重、过期、Gateway 订阅和路由到其他地方的通知。`nativeRuntime` 被拆分为几个较小的接缝：
- `availability` — 账户是否已配置以及是否应处理请求
- `presentation` — 将共享批准视图模型映射到待处理/已解决/已过期原生有效载荷或最终操作
- `transport` — 准备目标以及发送/更新/删除原生批准消息
- `interactions` — 原生按钮或反应的可选绑定/解绑/清除操作 Hook
- `observe` — 可选的交付诊断 Hook
- 原生批准 Channel 必须通过这些辅助工具路由 `accountId` 和 `approvalKind`。`accountId` 将多账户批准策略范围限定到正确的机器人账户，`approvalKind` 使 exec 与 Plugin 批准行为对 Channel 可用，而无需在核心中硬编码分支。
- 不同的批准类型可以有意地暴露不同的原生界面。当前捆绑示例：
  - Slack 使 exec 和 Plugin id 都可用原生批准路由。
  - Matrix 为 exec 和 Plugin 批准保留相同的原生 DM/Channel 路由和反应 UX，同时仍允许批准类型的认证有所不同。
- 核心现在也拥有批准重路由通知。Channel Plugin 不应从 `createChannelNativeApprovalRuntime` 发送自己的"批准已转至 DM/另一个 Channel"后续消息；而是通过共享批准能力辅助工具暴露准确的来源 + 批准者 DM 路由，让核心在将任何通知发回发起聊天之前汇总实际的交付情况。
- 端到端保留交付的批准 id 类型。原生客户端不应从 Channel 本地状态猜测或重写 exec 与 Plugin 批准路由。
- 如果 Channel 需要运行时拥有的对象（如客户端、令牌、Bolt 应用或 Webhook 接收器），通过 `openclaw/plugin-sdk/channel-runtime-context` 注册它们。通用运行时上下文注册表让核心可以从 Channel 启动状态引导能力驱动的处理程序，而无需添加批准特定的包装胶水。
- 仅当能力驱动的接缝表达能力不足时，才使用较低级别的 `createChannelApprovalHandler` 或 `createChannelNativeApprovalRuntime`。
- `createApproverRestrictedNativeApprovalAdapter` 仍作为兼容性包装器存在，但新代码应优先使用能力构建器并在 Plugin 上暴露 `approvalCapability`。

对于热路径的 Channel 入口点，当您只需要该家族的一部分时，优先使用窄向运行时子路径：

- `openclaw/plugin-sdk/approval-auth-runtime`
- `openclaw/plugin-sdk/approval-client-runtime`
- `openclaw/plugin-sdk/approval-delivery-runtime`
- `openclaw/plugin-sdk/approval-gateway-runtime`
- `openclaw/plugin-sdk/approval-handler-adapter-runtime`
- `openclaw/plugin-sdk/approval-handler-runtime`
- `openclaw/plugin-sdk/approval-native-runtime`
- `openclaw/plugin-sdk/approval-reply-runtime`
- `openclaw/plugin-sdk/channel-runtime-context`

同样，当您不需要更宽泛的综合界面时，优先使用 `openclaw/plugin-sdk/setup-runtime`、`openclaw/plugin-sdk/setup-adapter-runtime`、`openclaw/plugin-sdk/reply-runtime`、`openclaw/plugin-sdk/reply-dispatch-runtime`、`openclaw/plugin-sdk/reply-reference` 和 `openclaw/plugin-sdk/reply-chunking`。

对于设置具体而言：

- `openclaw/plugin-sdk/setup-runtime` 涵盖运行时安全的设置辅助工具：导入安全的设置补丁适配器（`createPatchedAccountSetupAdapter`、`createEnvPatchedAccountSetupAdapter`、`createSetupInputPresenceValidator`）、查找说明输出、`promptResolvedAllowFrom`、`splitSetupEntries` 和委托设置代理构建器
- `openclaw/plugin-sdk/setup-adapter-runtime` 是 `createEnvPatchedAccountSetupAdapter` 的窄向环境感知适配器接缝
- `openclaw/plugin-sdk/channel-setup` 涵盖可选安装的设置构建器以及一些设置安全的原语：`createOptionalChannelSetupSurface`、`createOptionalChannelSetupAdapter`、`createOptionalChannelSetupWizard`、`DEFAULT_ACCOUNT_ID`、`createTopLevelChannelDmPolicy`、`setSetupChannelEnabled` 和 `splitSetupEntries`
- 仅当您还需要更重量级的共享设置/配置辅助工具（如 `moveSingleAccountChannelSectionToDefaultAccount(...)`）时，才使用更宽泛的 `openclaw/plugin-sdk/setup` 接缝

如果您的 Channel 只想在设置界面中宣传"先安装此 Plugin"，优先使用 `createOptionalChannelSetupSurface(...)`。生成的适配器/向导在配置写入和最终化时会失败关闭，并在验证、最终化和文档链接文案中复用相同的需要安装消息。

对于其他热路径的 Channel 操作，优先使用窄向辅助工具而不是更宽泛的旧版界面：

- `openclaw/plugin-sdk/account-core`、`openclaw/plugin-sdk/account-id`、`openclaw/plugin-sdk/account-resolution` 和 `openclaw/plugin-sdk/account-helpers` 用于多账户配置和默认账户回退
- `openclaw/plugin-sdk/inbound-envelope` 和 `openclaw/plugin-sdk/inbound-reply-dispatch` 用于入站路由/信封和记录-分发连接
- `openclaw/plugin-sdk/messaging-targets` 用于目标解析/匹配
- `openclaw/plugin-sdk/outbound-media` 和 `openclaw/plugin-sdk/outbound-runtime` 用于媒体加载以及出站身份/发送委托
- `openclaw/plugin-sdk/thread-bindings-runtime` 用于线程绑定生命周期和适配器注册
- `openclaw/plugin-sdk/agent-media-payload` 仅当仍需要旧版 Agent/媒体有效载荷字段布局时
- `openclaw/plugin-sdk/telegram-command-config` 用于 Telegram 自定义命令规范化、重复/冲突验证和回退稳定命令配置契约

仅需认证的 Channel 通常可以停留在默认路径：核心处理批准，Plugin 仅暴露出站/认证能力。原生批准 Channel（如 Matrix、Slack、Telegram 和自定义聊天传输）应使用共享的原生辅助工具，而不是自行实现批准生命周期。

## 演练

<Steps>
  <a id="step-1-package-and-manifest"></a>
  <Step title="包和清单">
    创建标准 Plugin 文件。`package.json` 中的 `channel` 字段使其成为 Channel Plugin。完整的包元数据界面请参见 [Plugin 设置和配置](/plugins/sdk-setup#openclawchannel)：

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
    } from "openclaw/plugin-sdk/channel-core";
    import type { OpenClawConfig } from "openclaw/plugin-sdk/channel-core";
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

    <Accordion title="createChatChannelPlugin 为您做了什么">
      您无需手动实现低级适配器接口，而是传递声明式选项，构建器会组合它们：

      | 选项 | 连接内容 |
      | --- | --- |
      | `security.dm` | 来自配置字段的作用域 DM 安全解析器 |
      | `pairing.text` | 带代码交换的基于文本的 DM 配对流程 |
      | `threading` | 回复到模式解析器（固定、账户范围或自定义） |
      | `outbound.attachedResults` | 返回结果元数据（消息 ID）的发送函数 |

      如果您需要完全控制，也可以传递原始适配器对象而不是声明式选项。
    </Accordion>

  </Step>

  <Step title="连接入口点">
    创建 `index.ts`：

    ```typescript index.ts
    import { defineChannelPluginEntry } from "openclaw/plugin-sdk/channel-core";
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

    将 Channel 自有的 CLI 描述符放在 `registerCliMetadata(...)` 中，这样 OpenClaw 就能在根帮助中显示它们，而无需激活完整的 Channel 运行时，同时正常的完整加载仍会为真实命令注册选取相同的描述符。让 `registerFull(...)` 专注于仅运行时的工作。如果 `registerFull(...)` 注册 Gateway RPC 方法，请使用 Plugin 特定的前缀。核心管理员命名空间（`config.*`、`exec.approvals.*`、`wizard.*`、`update.*`）保持保留状态，始终解析为 `operator.admin`。`defineChannelPluginEntry` 自动处理注册模式分割。所有选项请参见 [入口点](/plugins/sdk-entrypoints#definechannelpluginentry)。

  </Step>

  <Step title="添加设置入口">
    创建 `setup-entry.ts` 用于入门期间的轻量加载：

    ```typescript setup-entry.ts
    import { defineSetupPluginEntry } from "openclaw/plugin-sdk/channel-core";
    import { acmeChatPlugin } from "./src/channel.js";

    export default defineSetupPluginEntry(acmeChatPlugin);
    ```

    当 Channel 被禁用或未配置时，OpenClaw 加载此文件而不是完整入口。它避免在设置流程中引入重量级运行时代码。详见 [设置和配置](/plugins/sdk-setup#setup-entry)。

    将设置安全导出拆分到辅助模块的打包工作区 Channel 可以在还需要显式设置时运行时设置器时，使用来自 `openclaw/plugin-sdk/channel-entry-contract` 的 `defineBundledChannelSetupEntry(...)`。

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

          // 您的入站处理程序将消息分发给 OpenClaw。
          // 确切的连接取决于您的平台 SDK —
          // 请参见捆绑的 Microsoft Teams 或 Google Chat Plugin 包中的真实示例。
          await handleAcmeChatInbound(api, event);

          res.statusCode = 200;
          res.end("ok");
          return true;
        },
      });
    }
    ```

    <Note>
      入站消息处理是 Channel 特定的。每个 Channel Plugin 拥有自己的入站管道。请查看捆绑的 Channel Plugin（例如 Microsoft Teams 或 Google Chat Plugin 包）获取真实模式。
    </Note>

  </Step>

<a id="step-6-test"></a>
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

    共享测试辅助工具请参见 [测试](/plugins/sdk-testing)。

  </Step>
</Steps>

## 文件结构

```
<bundled-plugin-root>/acme-chat/
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

## 高级主题

<CardGroup cols={2}>
  <Card title="线程选项" icon="git-branch" href="/plugins/sdk-entrypoints#registration-mode">
    固定、账户范围或自定义回复模式
  </Card>
  <Card title="消息 Tool 集成" icon="puzzle" href="/plugins/architecture#channel-plugins-and-the-shared-message-tool">
    describeMessageTool 和操作发现
  </Card>
  <Card title="目标解析" icon="crosshair" href="/plugins/architecture#channel-target-resolution">
    inferTargetChatType、looksLikeId、resolveTarget
  </Card>
  <Card title="运行时辅助工具" icon="settings" href="/plugins/sdk-runtime">
    通过 api.runtime 使用 TTS、STT、媒体、子 Agent
  </Card>
</CardGroup>

<Note>
一些捆绑辅助工具接缝仍然为捆绑 Plugin 维护和兼容性而存在。它们不是新 Channel Plugin 的推荐模式；除非您直接维护该捆绑 Plugin 家族，否则请优先使用来自公共 SDK 界面的通用 Channel/设置/回复/运行时子路径。
</Note>

## 后续步骤

- [Provider Plugin](/plugins/sdk-provider-plugins) — 如果您的 Plugin 还提供模型
- [SDK 概览](/plugins/sdk-overview) — 完整子路径导入参考
- [SDK 测试](/plugins/sdk-testing) — 测试工具和契约测试
- [Plugin 清单](/plugins/manifest) — 完整清单模式
