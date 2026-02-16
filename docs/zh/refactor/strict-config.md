---
mmh3_hash: "bdbb2f7cb00dafb97864c75ecc5005e3"
summary: "严格配置验证 + 仅 doctor 迁移"
read_when: ["设计或实现配置验证行为","处理配置迁移或 doctor 工作流","处理插件配置架构或插件加载门控"]
---
# 严格配置验证(仅 doctor 迁移)

## 目标
- **在任何地方拒绝未知配置键**(根 + 嵌套)。
- **拒绝没有架构的插件配置**;不要加载该插件。
- **删除加载时的遗留自动迁移**;迁移仅通过 doctor 运行。
- **启动时自动运行 doctor(dry-run)**;如果无效,阻止非诊断命令。

## 非目标
- 加载时的向后兼容性(遗留键不会自动迁移)。
- 无声丢弃未识别的键。

## 严格验证规则
- 配置必须在每个级别与架构完全匹配。
- 未知键是验证错误(根或嵌套没有传递)。
- `plugins.entries.<id>.config` 必须由插件的架构验证。
  - 如果插件缺少架构,**拒绝插件加载**并显示清晰的错误。
- 未知 `channels.<id>` 键是错误,除非插件清单声明通道 id。
- 所有插件都需要插件清单(`openclaw.plugin.json`)。

## 插件架构执行
- 每个插件为其配置提供严格的 JSON Schema(在清单中内联)。
- 插件加载流程:
  1) 解析插件清单 + 架构(`openclaw.plugin.json`)。
  2) 针对架构验证配置。
  3) 如果缺少架构或配置无效: 阻止插件加载,记录错误。
- 错误消息包括:
  - 插件 id
  - 原因(缺少架构 / 配置无效)
  - 验证失败的路径
- 禁用的插件保留其配置,但 Doctor + 日志显示警告。

## Doctor 流程
- Doctor **每次**加载配置时运行(默认 dry-run)。
- 如果配置无效:
  - 打印摘要 + 可操作的错误。
  - 指示: `openclaw doctor --fix`。
- `openclaw doctor --fix`:
  - 应用迁移。
  - 删除未知键。
  - 写入更新的配置。

## 命令门控(当配置无效时)
允许(仅诊断):
- `openclaw doctor`
- `openclaw logs`
- `openclaw health`
- `openclaw help`
- `openclaw status`
- `openclaw gateway status`

其他所有内容都必须以"配置无效。运行 `openclaw doctor --fix`"硬失败。

## 错误 UX 格式
- 单个摘要标题。
- 分组部分:
  - 未知键(完整路径)
  - 遗留键 / 需要迁移
  - 插件加载失败(插件 id + 原因 + 路径)

## 实施接触点
- `src/config/zod-schema.ts`: 删除根传递;到处都是严格对象。
- `src/config/zod-schema.providers.ts`: 确保严格的通道架构。
- `src/config/validation.ts`: 未知键时失败;不要应用遗留迁移。
- `src/config/io.ts`: 删除遗留自动迁移;始终运行 doctor dry-run。
- `src/config/legacy*.ts`: 仅将使用移至 doctor。
- `src/plugins/*`: 添加架构注册表 + 门控。
- `src/cli` 中的 CLI 命令门控。

## 测试
- 未知键拒绝(根 + 嵌套)。
- 插件缺少架构 → 插件加载被阻止,并显示清晰的错误。
- 配置无效 → 网关启动被阻止,除诊断命令外。
- Doctor dry-run 自动;`doctor --fix` 写入更正的配置。
