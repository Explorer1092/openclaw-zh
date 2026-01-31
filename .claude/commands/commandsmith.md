---
description: 生成或优化 Claude Code Slash Commands（.claude/commands/*.md）：Spec-Kit 风格的输入明确、步骤化、门禁、输出契约、可验证
argument-hint: create|new [name?] <需求> | improve|optimize <path|paste> | audit <path|paste>
---

# /commandsmith — Claude Code Commands 生成器 & 优化器

你的任务是将用户给出的**需求**或**现有命令**，产出/改造为高质量、可复用、低歧义、可验证的 Claude Code slash command（一个或多个 `.md` 文件）。

> 重要背景（Claude Code 规则提醒）：
> - 自定义命令是 Markdown 文件；项目级命令放在 `.claude/commands/`，个人级命令放在 `~/.claude/commands/`；命令名来自文件名（去掉 `.md`）。:contentReference[oaicite:2]{index=2}  
> - 子目录用于分组/命名空间展示（会出现在 `/help` 描述里），但**不会改变命令名**。:contentReference[oaicite:3]{index=3}  
> - 若命令需要自动执行 bash ，必须在 frontmatter 里声明 `allowed-tools` 并尽量最小化授权范围。:contentReference[oaicite:4]{index=4}

---

## 必须先读的输入（不可跳过）
The user input to you can be provided directly by the agent or as a command argument — you MUST consider it before proceeding (if not empty).

User input:
$ARGUMENTS

---

## 空参数行为（必须遵守）
如果 `$ARGUMENTS` 为空：
1) 输出一段**极短 Usage**（包含 create / improve / audit 三种调用例子）
2) 然后 **STOP**（不要生成文件、不要猜测、不要改任何东西）

---

## 全局硬规则（两种模式都必须遵守）
1) **用规范性措辞**：对不可妥协项用 MUST / MUST NOT；建议用 SHOULD。  
2) **不猜关键事实**：如果缺失的信息会导致命令不可正确执行，使用 `TODO(<FIELD>): ...` 占位，而不是臆测。  
3) **绝不输出/传播秘密**：若用户粘贴了 token/密钥/私钥等，必须在输出里用 `<REDACTED>` 替换，并提醒用户轮换/撤销。  
4) **最小权限**：不要随便加 `allowed-tools`；只有确实需要 bash 执行时才添加，并把允许的命令限定到最小集合。:contentReference[oaicite:5]{index=5}  
5) **单一主目标**：一个 command 只做一件“主事”。想扩展就拆成多个 command 或引导做 Skill。:contentReference[oaicite:6]{index=6}  
6) **输出必须可验证**：强制给出固定 Output Contract + Validation Checklist。  
7) **安全合规**：如果用户请求的命令用于未授权入侵、隐私窃取、作弊、恶意破坏等，必须拒绝并给出安全替代方案。
8) **禁止拟人化/角色身份**：在本命令及其产出物中，MUST NOT 使用“你是…设计师/审稿人/专家/顾问”等身份描述；改用“目标/范围/约束/步骤/输出”的任务式表达。

---

## Step 0 — 加载本地约束（Local Constitution）
在生成/优化之前，你必须先尝试读取并总结（存在则读，不存在就跳过）：
- `.claude/command-conventions.md`（推荐：放“团队命令规范”的位置）

把读到的约束提炼为一个 **Local Rules 摘要**（5~12 条），后续生成内容必须遵守。

---

## Step 1 — 模式判定与参数解析（不要无谓追问）
你必须从 `$ARGUMENTS` 推断模式：

### 1) IMPROVE / OPTIMIZE 模式（优化现有命令）
满足任意条件则进入该模式：
- `$ARGUMENTS` 以 `improve|optimize|refine|fix|polish|优化|改进` 开头
- 或包含看起来像命令文件路径：`.claude/commands/... .md` 或 `~/.claude/commands/... .md`
- 或用户粘贴了一个命令文件（含 frontmatter `---` 且出现 `description:`）


### 2) CREATE / NEW 模式（创建新命令）
满足任意条件则进入该模式：
- `$ARGUMENTS` 以 `create|new|生成|创建` 开头
- 或无法判定为 improve，则默认 create（安全默认）

可选参数：
- `name=<command-name>`：指定命令名
- `scope=project|user`：默认 project（写到 `.claude/commands/`）；user 则写到 `~/.claude/commands/`。:contentReference[oaicite:7]{index=7}

### 3) AUDIT 模式（只诊断，不改写）
若 `$ARGUMENTS` 以 `audit|review|检查` 开头：
- 只输出诊断报告 + 改进建议
- 不输出改造后的完整文件（除非用户明确要求）

---

## Step 2A — IMPROVE / OPTIMIZE 执行流（先诊断再改）
输入：路径或粘贴内容（建议优先路径）。

### A1. 读取事实源
- 若给了路径：读取该文件内容作为事实源
- 若给了粘贴：以粘贴内容为事实源
- 若两者都有：以“路径文件内容”为准，粘贴作为参考

### A2. 诊断（必须先输出问题清单，再给改造稿）
输出 5~12 条“最重要问题”，按严重度排序（Critical / Major / Minor），覆盖但不限于：
- frontmatter 缺失或 description 含糊
- 未显式消费 `$ARGUMENTS` 或参数格式不清
- 无门禁/前置检查（缺文件/依赖时怎么办）
- 执行步骤不具体（缺路径/缺动作/缺顺序）
- 输出不固定（无法验证是否完成）
- 权限过大（allowed-tools 太宽）
- 文件改动边界不清（可能误改大量文件）
- 过长、重复、散文式表述（token 浪费）
- 缺少示例与验证清单
- 缺少“非目标/不做什么”（容易 scope creep）

### A3. 生成“完整改造版文件”
- 保持命令意图不变（除非用户明确要求重构功能）
- 结构升级为可执行模板（见下方“生成命令的必备结构”）
- 关键缺失信息用 `TODO(...)` 占位，不要猜

### A4. 是否写回（默认写回）
- 如果输入是“文件路径”：MUST 覆盖写回到同一路径（in-place）
- 只有当 `$ARGUMENTS` 包含类似“预览”意图时：不得写回，只输出改造后的完整文件内容

同时输出：
- Change Summary（3~10 条）
- Quality Report（对照 Rubric 打勾/警告）

---

## Step 2B — CREATE / NEW 执行流（生成新命令）
输入：自然语言流程描述 +（可选）name/scope。

### B1. 命令命名与冲突处理
- 若提供 `name=`：清洗为 `kebab-case`
- 否则：从描述推断“动词开头、短且明确”的名字（kebab-case）
- 若与现有命令同名：
  - 优先建议放到子目录做展示分组（例如 `.claude/commands/quality/<name>.md`），或
  - 追加后缀 `-v2` / `-alt`（二选一），避免覆盖

### B2. 生成命令文件（必须包含“生成命令的必备结构”）
- 默认写到 `.claude/commands/<name>.md`
- 若 `scope=user` 则写到 `~/.claude/commands/<name>.md`:contentReference[oaicite:8]{index=8}

### B3. 若命令需要 Bash 自动上下文
只有当命令确实需要在运行前执行 bash（例如收集 git 状态、生成摘要、检查依赖）时：
- 在 frontmatter 添加 `allowed-tools: Bash(<cmd>:*)...`（只允许必要命令）
- 使用 英文叹号 前缀执行 bash，并把输出当作事实输入（例如 git status/diff/log）:contentReference[oaicite:9]{index=9}

---

## 生成命令的必备结构（不论 create 还是 improve 产物都要符合）
生成/改造后的命令文件必须包含：

1) YAML frontmatter（至少包含）：
   - `description:` 1 句清晰人话（必须有；否则 SlashCommand tool 可能无法调用该命令元数据）:contentReference[oaicite:10]{index=10}
   - `argument-hint:`（若需要参数；写成可自动补全的格式提示）:contentReference[oaicite:11]{index=11}
   - `allowed-tools:`（仅当需要 bash；并最小化授权）:contentReference[oaicite:12]{index=12}

2) 正文固定板式（标题可微调，但语义必须都有）：
   - **Goal**：主目标（单一）
   - **Scope / Constraints**：范围与约束（用任务式表述，不写身份/头衔）
   - **User input**：明确写出 `User input: $ARGUMENTS`
   - **Non-goals**：明确不做什么（防 scope creep）
   - **Prerequisites / Gates**：缺什么就停，并告诉用户补什么
   - **Execution Flow**：编号步骤（可复现）
   - **Output Contract**：固定输出模板（字段/表头/结构必须固定）
   - **Validation Checklist**：如何判断成功（可执行/可人工核对）
   - **Safety / Boundaries**：文件改动边界、权限边界、禁止项
   - **Examples**：2–4 个最短可用例子（含参数示例）

---

## Rubric（写出 Quality Report 时必须逐条对照）
✅/⚠️/❌
1) 单一主目标（Single primary goal）
2) 明确消费 `$ARGUMENTS` / `$1..$n`（参数为空才追问，否则不重复问）
3) 有门禁：前置条件 + 失败处理（缺文件/缺权限/缺依赖）
4) 执行流可复现：编号步骤、路径明确、顺序明确
5) 输出可验证：固定 Output Contract + Validation Checklist
6) 副作用可控：只读/可写边界明确；避免大范围误改
7) 最小权限：只在必要时添加 allowed-tools，并限制到最小 bash 命令集:contentReference[oaicite:13]{index=13}
8) 不猜关键事实：缺信息用 `TODO(...)`；或只问 1–3 个关键问题
9) 不泄露秘密：检测到敏感信息则 `<REDACTED>` 并提醒轮换/撤销
10) 简洁可维护：避免散文与重复；示例够用；和 Local Rules 一致

---

## 最终输出格式（必须严格遵守）
### CREATE / IMPROVE 输出顺序：
1) 【File 1】建议保存路径
2) 一个代码块（代码块里 ONLY 放文件内容）
3) （如有更多文件）重复 1~2
4) （仅 improve）Change Summary
5) Quality Report（对照 Rubric）

### AUDIT 输出顺序：
1) Findings（按严重度）
2) Recommendations（对应到 Findings）
3) Quick Fix Plan（3~7 步）
