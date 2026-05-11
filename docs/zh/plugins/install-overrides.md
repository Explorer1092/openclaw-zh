---
mmh3_hash: "a80b4ce5132117c4e737e327ba8337a7"
summary: "通过设置时安装流程测试打包的 Plugin 覆盖"
read_when:
  - 针对本地打包 Plugin 测试引导或设置流程
  - 在发布 Plugin Package 之前进行验证
  - 用测试制件替换自动 Plugin 安装
title: "Plugin 安装覆盖"
sidebarTitle: "安装覆盖"
---

Plugin 安装覆盖让维护者针对特定 npm Package 或本地 npm-pack 压缩包测试设置时 Plugin 安装。它们仅用于端到端测试和 Package 验证。普通用户应使用 [`openclaw plugins install`](/cli/plugins) 安装 Plugin。

<Warning>
覆盖会执行您提供的来源中的 Plugin 代码。仅在隔离的状态目录或一次性测试机器上使用它们。
</Warning>

## 环境

除非同时设置了这两个变量，否则覆盖被禁用：

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

覆盖映射是以 Plugin id 为键的 JSON。值支持：

- `npm:<registry-spec>` 用于注册表 Package 和精确版本或标签
- `npm-pack:<path.tgz>` 用于由 `npm pack` 生成的本地压缩包

相对的 `npm-pack:` 路径从当前工作目录解析。

## 行为

当设置时流程要求安装 id 出现在映射中的 Plugin 时，OpenClaw 使用覆盖来源而不是目录、Bundle 或默认 npm 来源。这适用于使用共享设置时 Plugin 安装器的引导和其他流程。

覆盖仍然强制执行预期的 Plugin id。映射到 `codex` 的压缩包必须安装 Manifest id 为 `codex` 的 Plugin。

覆盖不继承官方受信任来源状态。即使目录条目通常代表 OpenClaw 拥有的 Package，覆盖也被视为操作员提供的测试输入。

工作区 `.env` 文件无法启用安装覆盖。在启动 OpenClaw 的受信任 Shell、CI 任务或远程测试命令中设置这些变量。

## Package 端到端测试

使用隔离的状态目录，以便 Package 安装和安装记录不会触碰您的正常 OpenClaw 状态：

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

在状态目录下验证已安装的 Package：

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

对于实时 Provider 端到端测试，在启动测试命令之前从受信任的 Shell 或 CI 密钥获取真实的 API 密钥。不要打印密钥；只报告来源以及密钥是否存在。
