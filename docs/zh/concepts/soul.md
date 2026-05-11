---
mmh3_hash: "ab116f19153e50fddf5f3e69898c0261"
title: "SOUL.md personality guide"
sidebarTitle: "SOUL.md personality guide"
summary: "使用 SOUL.md 为你的 OpenClaw agent 赋予真正的声音，而非千篇一律的 assistant 腔调"
read_when:
  - 希望你的 agent 听起来不那么千篇一律
  - 正在编辑 SOUL.md
  - 希望增强个性而不破坏安全性或简洁性
---

`SOUL.md` 是你的 agent 声音所在之处。

OpenClaw 在普通 session 中注入它，因此它具有真正的分量。如果你的 agent 听起来平淡、畏首畏尾或奇怪地像企业腔，通常需要修改的就是这个文件。

## SOUL.md 应该放什么

放那些能改变与 agent 交谈感受的内容：

- 语调
- 观点
- 简洁度
- 幽默感
- 边界
- 默认的直率程度

**不要**把它变成：

- 人生故事
- 变更日志
- 安全政策转储
- 没有行为效果的巨大氛围墙

简短胜过冗长。清晰胜过模糊。

## 为什么这有效

这与 OpenAI 的提示指南一致：

- 提示工程指南说高层行为、语调、目标和示例属于高优先级指令层，而不是埋在用户轮次中。
- 同一指南建议将提示视为你迭代、固定和评估的东西，而不是写一次就忘记的神奇散文。

对于 OpenClaw，`SOUL.md` 就是那个层次。

如果想要更好的个性，写出更强的指令。如果想要稳定的个性，保持简洁并进行版本管理。

OpenAI 参考：

- [Prompt engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Message roles and instruction following](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Molty 提示

将此粘贴到你的 agent 并让它重写 `SOUL.md`。

路径已针对 OpenClaw workspace 固定：使用 `SOUL.md`，而非 `http://SOUL.md`。

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

- 有立场
- 跳过填充词
- 在合适时幽默
- 尽早指出坏想法
- 保持简洁，除非深度真的有用

坏的 `SOUL.md` 规则听起来像这样：

- 始终保持专业
- 提供全面而周到的帮助
- 确保积极和支持性的体验

第二个列表就是如何得到一团糟。

## 一个警告

个性不是草率的许可。

把 `AGENTS.md` 保留给操作规则。把 `SOUL.md` 保留给声音、立场和风格。如果你的 agent 在共享 channel、公开回复或面向客户的界面工作，确保语调仍然适合场合。

锐利是好的。令人烦恼则不是。

## 相关

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/concepts/agent-workspace" icon="folder-open">
    OpenClaw 注入系统提示的 workspace 文件。
  </Card>
  <Card title="System prompt" href="/concepts/system-prompt" icon="message-lines">
    `SOUL.md` 如何被组合到每轮系统提示中。
  </Card>
  <Card title="SOUL.md template" href="/reference/templates/SOUL" icon="file-lines">
    个性文件的入门模板。
  </Card>
</CardGroup>
