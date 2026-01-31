---
mmh3_hash: "519cc75f91eb943d242d4ec7def57839"
summary: "加强 cron.add 输入处理,对齐架构,改进 cron UI/代理工具"
owner: "openclaw"
status: "完成"
last_updated: "2026-01-05"
---

# Cron Add 加强与架构对齐

## 背景
最近的网关日志显示重复的 `cron.add` 失败,参数无效(缺少 `sessionTarget`、`wakeMode`、`payload`,以及格式错误的 `schedule`)。这表明至少一个客户端(可能是代理工具调用路径)正在发送包装的或部分指定的作业负载。另外,TypeScript 中的 cron 提供程序枚举、网关架构、CLI 标志和 UI 表单类型之间存在偏差,加上 `cron.status` 的 UI 不匹配(期望 `jobCount` 而网关返回 `jobs`)。

## 目标
- 通过规范化常见包装负载并推断缺失的 `kind` 字段来停止 `cron.add` INVALID_REQUEST 垃圾信息。
- 在网关架构、cron 类型、CLI 文档和 UI 表单之间对齐 cron 提供程序列表。
- 使代理 cron 工具架构明确,以便 LLM 生成正确的作业负载。
- 修复控制 UI cron 状态作业计数显示。
- 添加测试以涵盖规范化和工具行为。

## 非目标
- 更改 cron 调度语义或作业执行行为。
- 添加新的调度类型或 cron 表达式解析。
- 彻底改革 cron 的 UI/UX,超出必要的字段修复。

## 发现(当前差距)
- 网关中的 `CronPayloadSchema` 排除了 `signal` + `imessage`,而 TS 类型包括它们。
- 控制 UI CronStatus 期望 `jobCount`,但网关返回 `jobs`。
- 代理 cron 工具架构允许任意 `job` 对象,导致格式错误的输入。
- 网关严格验证 `cron.add`,没有规范化,因此包装的负载会失败。

## 更改内容

- `cron.add` 和 `cron.update` 现在规范化常见包装形状并推断缺失的 `kind` 字段。
- 代理 cron 工具架构与网关架构匹配,从而减少无效负载。
- 提供程序枚举在网关、CLI、UI 和 macOS 选择器之间对齐。
- 控制 UI 使用网关的 `jobs` 计数字段作为状态。

## 当前行为

- **规范化:** 包装的 `data`/`job` 负载被解包;在安全时推断 `schedule.kind` 和 `payload.kind`。
- **默认值:** 缺少时为 `wakeMode` 和 `sessionTarget` 应用安全默认值。
- **提供程序:** Discord/Slack/Signal/iMessage 现在在 CLI/UI 上一致呈现。

有关规范化形状和示例,请参见 [Cron 作业](/automation/cron-jobs)。

## 验证

- 监视网关日志以减少 `cron.add` INVALID_REQUEST 错误。
- 确认控制 UI cron 状态在刷新后显示作业计数。

## 可选后续步骤

- 手动控制 UI 冒烟测试: 为每个提供程序添加 cron 作业 + 验证状态作业计数。

## 待解决的问题
- `cron.add` 是否应该接受来自客户端的显式 `state`(目前架构不允许)?
- 我们是否应该允许 `webchat` 作为显式交付提供程序(目前在交付解析中过滤)?
