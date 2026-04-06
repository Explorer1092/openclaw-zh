---
summary: "使用 SOUL.md 为你的 OpenClaw Agent 赋予真正的声音，而非千篇一律的 Assistant 腔调"
read_when:
  - 你希望 Agent 听起来不那么千篇一律
  - 你正在编辑 SOUL.md
  - 你想要更强的个性，同时不破坏安全性或简洁性
title: "SOUL.md 个性指南"
---

# SOUL.md 个性指南

`SOUL.md` 是你 Agent 声音的所在。

OpenClaw 在正常 Session 中注入它，因此它具有真正的影响力。如果你的 Agent 听起来乏味、含糊或奇怪地官方化，通常这就是需要修改的文件。

## SOUL.md 应该包含什么

放入那些改变 Agent 给人感觉的内容：

- 语气
- 观点
- 简洁性
- 幽默感
- 边界
- 默认直接程度

**不要**把它变成：

- 一部人生故事
- 一份变更日志
- 一堆安全政策
- 一大堆没有实际行为效果的氛围描述

简短胜于冗长。锐利胜于模糊。

## 为什么这样有效

这与 OpenAI 的 prompt 指导原则一致：

- prompt 工程指南指出，高层次行为、语气、目标和示例应属于高优先级指令层，而不是埋藏在用户回合中。
- 同一指南建议像迭代、固定和评估的东西一样对待 prompt，而不是写一次就忘记的魔法文字。

对于 OpenClaw，`SOUL.md` 就是那个层。

如果你想要更好的个性，写出更强的指令。如果你想要稳定的个性，保持指令简洁并进行版本控制。

OpenAI 参考资料：

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty prompt

将此粘贴到你的 Agent 并让它重写 `SOUL.md`。

路径已针对 OpenClaw 工作区修正：使用 `SOUL.md`，而非 `http://SOUL.md`。

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## 好的样子

好的 `SOUL.md` 规则听起来像这样：

- 有自己的观点
- 跳过填充语
- 合适时幽默
- 尽早指出坏主意
- 保持简洁，除非深度确实有用

差的 `SOUL.md` 规则听起来像这样：

- 始终保持专业
- 提供全面而周到的帮助
- 确保积极支持的体验

第二个列表正是产生废话的方式。

## 一个警告

个性不是粗心的许可证。

将操作规则放在 `AGENTS.md` 中，将声音、立场和风格放在 `SOUL.md` 中。如果你的 Agent 在共享 Channel、公开回复或面向客户的场合工作，请确保语气仍适合那个场合。

锐利是好的，烦人不是。

## 相关文档

- [Agent workspace](/concepts/agent-workspace)
- [System prompt](/concepts/system-prompt)
- [SOUL.md 模板](/reference/templates/SOUL)
