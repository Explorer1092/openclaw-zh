---
summary: Node + tsx "__name is not a function" 崩溃说明和解决方法
read_when:
  - 调试仅 Node 的开发脚本或监视模式故障
  - 调查 OpenClaw 中的 tsx/esbuild 加载器崩溃
---

# Node + tsx "__name is not a function" 崩溃

## 摘要
通过 Node 与 `tsx` 运行 OpenClaw 在启动时失败,错误如下:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

这在将开发脚本从 Bun 切换到 `tsx` 后开始(提交 `2871657e`,2026-01-06)。相同的运行时路径在 Bun 下正常工作。

## 环境
- Node: v25.x (在 v25.3.0 上观察到)
- tsx: 4.21.0
- 操作系统: macOS (也可能在运行 Node 25 的其他平台上复现)

## 复现(仅 Node)
```bash
# 在仓库根目录
node --version
pnpm install
node --import tsx src/entry.ts status
```

## 仓库中的最小复现
```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Node 版本检查
- Node 25.3.0: 失败
- Node 22.22.0 (Homebrew `node@22`): 失败
- Node 24: 此处尚未安装;需要验证

## 注意事项 / 假设
- `tsx` 使用 esbuild 转换 TS/ESM。esbuild 的 `keepNames` 发出一个 `__name` 辅助函数并用 `__name(...)` 包装函数定义。
- 崩溃表明 `__name` 存在但在运行时不是函数,这意味着该辅助函数在 Node 25 加载器路径中对于此模块丢失或被覆盖。
- 当辅助函数丢失或重写时,其他 esbuild 使用者中也报告了类似的 `__name` 辅助函数问题。

## 回归历史
- `2871657e` (2026-01-06): 脚本从 Bun 更改为 tsx 以使 Bun 可选。
- 在此之前(Bun 路径),`openclaw status` 和 `gateway:watch` 正常工作。

## 解决方法
- 对开发脚本使用 Bun(当前临时回退)。
- 使用 Node + tsc watch,然后运行编译输出:
  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```
- 本地确认: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` 在 Node 25 上正常工作。
- 如果可能,在 TS 加载器中禁用 esbuild keepNames(防止插入 `__name` 辅助函数);tsx 目前不公开此选项。
- 使用 `tsx` 测试 Node LTS (22/24) 以查看问题是否特定于 Node 25。

## 参考
- https://opennext.js.org/cloudflare/howtos/keep_names
- https://esbuild.github.io/api/#keep-names
- https://github.com/evanw/esbuild/issues/1031

## 后续步骤
- 在 Node 22/24 上复现以确认 Node 25 回归。
- 如果存在已知回归,测试 `tsx` nightly 或固定到早期版本。
- 如果在 Node LTS 上复现,向上游提交包含 `__name` 堆栈跟踪的最小复现。
