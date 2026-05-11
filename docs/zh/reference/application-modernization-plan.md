---
mmh3_hash: "8a4d2af8f5e6c861eb9aaa05505c453f"
summary: "全面的应用程序现代化计划，包含前端交付 Skill 更新"
title: "应用程序现代化计划"
read_when:
  - 规划广泛的 OpenClaw 应用程序现代化工作
  - 更新应用或 Control UI 工作的前端实施标准
  - 将广泛的产品质量审查转化为分阶段工程工作
---

# 应用程序现代化计划

## 目标

在不破坏当前工作流或在广泛重构中隐藏风险的情况下，将应用程序推向更简洁、更快速、更易于维护的产品状态。工作应以小型、可审查的切片落地，并对每个涉及的界面提供验证。

## 原则

- 除非某个边界明确导致了混乱、性能开销或用户可见的缺陷，否则保留当前架构。
- 对每个问题优先采用最小的正确修补方案，然后重复。
- 将必需的修复与可选的完善分开，以便维护人员可以落地高价值工作，而无需等待主观判断。
- 保持面向 Plugin 的行为的文档化和向后兼容性。
- 在声明回归已修复之前，验证已发布的行为、依赖契约和测试。
- 首先改善主要用户路径：引导、认证、聊天、Provider 设置、Plugin 管理和诊断。

## 阶段 1：基线审计

在更改应用程序之前对其进行盘点。

- 确定顶部用户工作流和拥有它们的代码界面。
- 列出无效功能、重复设置、不清晰的错误状态和昂贵的渲染路径。
- 捕获每个界面的当前验证命令。
- 将问题标记为必需、推荐或可选。
- 记录需要所有者审查的已知阻塞项，尤其是 API、安全、发布和 Plugin 契约变更。

完成定义：

- 一个带有仓库根文件引用的问题列表。
- 每个问题有严重性、所有者界面、预期用户影响和建议的验证路径。
- 没有推测性的清理项与必需的修复混在一起。

## 阶段 2：产品和用户体验清理

优先处理可见工作流并消除混乱。

- 围绕模型认证、Gateway 状态和 Plugin 设置收紧引导文案和空状态。
- 在无法执行任何操作的情况下删除或禁用无效功能。
- 在支持的响应式宽度中保持重要操作可见，而不是将其隐藏在脆弱的布局假设后面。
- 整合重复的状态语言，使错误有唯一的真实来源。
- 为高级设置添加渐进式披露，同时保持核心设置快速。

推荐验证：

- 首次运行设置和现有用户启动的手动正常路径。
- 任何路由、配置持久化或状态派生逻辑的专项测试。
- 更改的响应式界面的浏览器截图。

## 阶段 3：前端架构收紧

提高可维护性，而无需进行广泛重写。

- 将重复的 UI 状态转换移入狭窄的类型化助手。
- 保持数据获取、持久化和展示责任分离。
- 优先使用现有的 Hook、存储和组件模式，而非新抽象。
- 仅在减少耦合或澄清测试时才拆分过大的组件。
- 避免为局部面板交互引入广泛的全局状态。

必需的防护措施：

- 不要将公共行为的改变作为文件拆分的副作用。
- 保持菜单、对话框、选项卡和键盘导航的无障碍行为完整。
- 验证加载、空、错误和乐观状态仍然渲染。

## 阶段 4：性能和可靠性

针对可测量的痛点，而不是广泛的理论优化。

- 测量启动、路由过渡、大型列表和聊天记录的开销。
- 在分析证明有价值的情况下，用记忆化选择器或缓存助手替换重复的昂贵派生数据。
- 减少热路径上可避免的网络或文件系统扫描。
- 在模型有效负载构建之前，保持提示、注册表、文件、Plugin 和网络输入的确定性顺序。
- 为热助手和契约边界添加轻量级回归测试。

完成定义：

- 每个性能更改记录基线、预期影响、实际影响和剩余差距。
- 当便宜的测量可用时，没有性能补丁仅凭直觉落地。

## 阶段 5：类型、契约和测试加固

在用户和 Plugin 作者依赖的边界点提高正确性。

- 用有区别的联合类型或封闭代码列表替换宽松的运行时字符串。
- 使用现有的 Schema 助手或 zod 验证外部输入。
- 围绕 Plugin Manifest、Provider 目录、Gateway 协议消息和配置迁移行为添加契约测试。
- 将兼容性路径保留在 doctor 或修复流中，而不是启动时的隐藏迁移。
- 避免测试专用的对 Plugin 内部的耦合；使用 SDK 外观和已记录的导出桶。

推荐验证：

- `pnpm check:changed`
- 对每个更改边界进行目标测试。
- 当懒惰边界、打包或已发布界面更改时运行 `pnpm build`。

## 阶段 6：文档和发布就绪

保持面向用户的文档与行为一致。

- 通过行为、API、配置、引导或 Plugin 更改来更新文档。
- 仅为用户可见的更改添加变更日志条目。
- 保持 Plugin 术语面向用户；仅在贡献者需要时使用内部包名称。
- 确认发布和安装说明仍与当前命令界面匹配。

完成定义：

- 相关文档在与行为更改相同的分支中更新。
- 在涉及时，生成的文档或 API 漂移检查通过。
- 交接命名任何跳过的验证及其原因。

## 推荐的第一个切片

从有范围的 Control UI 和引导通过开始：

- 审计首次运行设置、Provider 认证就绪性、Gateway 状态和 Plugin 设置界面。
- 删除无效操作并澄清失败状态。
- 为状态派生和配置持久化添加或更新专项测试。
- 运行 `pnpm check:changed`。

这以有限的架构风险提供了高用户价值。

## 前端 Skill 更新

使用本节更新现代化任务提供的以前端为重点的 `SKILL.md`。如果将此指导作为仓库本地的 OpenClaw Skill 采用，请首先创建 `.agents/skills/openclaw-frontend/SKILL.md`，保留属于该目标 Skill 的 frontmatter，然后使用以下内容添加或替换正文指导。

```markdown
# Frontend Delivery Standards

Use this skill when implementing or reviewing user-facing React, Next.js,
desktop webview, or app UI work.

## Operating rules

- Start from the existing product workflow and code conventions.
- Prefer the smallest correct patch that improves the current user path.
- Separate required fixes from optional polish in the handoff.
- Do not build marketing pages when the request is for an application surface.
- Keep actions visible and usable across supported viewport sizes.
- Remove dead affordances instead of leaving controls that cannot act.
- Preserve loading, empty, error, success, and permission states.
- Use existing design-system components, hooks, stores, and icons before adding
  new primitives.

## Implementation checklist

1. Identify the primary user task and the component or route that owns it.
2. Read the local component patterns before editing.
3. Patch the narrowest surface that solves the issue.
4. Add responsive constraints for fixed-format controls, toolbars, grids, and
   counters so text and hover states cannot resize the layout unexpectedly.
5. Keep data loading, state derivation, and rendering responsibilities clear.
6. Add tests when logic, persistence, routing, permissions, or shared helpers
   change.
7. Verify the main happy path and the most relevant edge case.

## Visual quality gates

- Text must fit inside its container on mobile and desktop.
- Toolbars may wrap, but controls must remain reachable.
- Buttons should use familiar icons when the icon is clearer than text.
- Cards should be used for repeated items, modals, and framed tools, not for
  every page section.
- Avoid one-note color palettes and decorative backgrounds that compete with
  operational content.
- Dense product surfaces should optimize for scanning, comparison, and repeated
  use.

## Handoff format

Report:

- What changed.
- What user behavior changed.
- Required validation that passed.
- Any validation skipped and the concrete reason.
- Optional follow-up work, clearly separated from required fixes.
```
