---
mmh3_hash: "bdaecd2e7d9151515a1ac552d1681134"
summary: "OpenClaw 加载环境变量的位置和优先级顺序"
read_when:
  - 您需要知道加载哪些环境变量,以及按什么顺序
  - 您正在调试 Gateway 中缺失的 API 密钥
  - 您正在记录 Provider 身份验证或部署环境
title: "环境变量"
---

# 环境变量

OpenClaw 从多个来源提取环境变量。规则是**永不覆盖现有值**。

## 优先级（从高到低）

1. **进程环境**（Gateway 进程已从父 Shell/守护进程获得的内容）。
2. **当前工作目录中的 `.env`**（dotenv 默认;不覆盖）。
3. **全局 `.env`**，位于 `~/.openclaw/.env`（又名 `$OPENCLAW_STATE_DIR/.env`;不覆盖）。
4. **配置 `env` 块**，位于 `~/.openclaw/openclaw.json`（仅在缺失时应用）。
5. **可选的登录 Shell 导入**（`env.shellEnv.enabled` 或 `OPENCLAW_LOAD_SHELL_ENV=1`）,仅对缺失的预期键应用。

在使用默认状态目录的 Ubuntu 全新安装中，OpenClaw 还会将 `~/.config/openclaw/gateway.env` 作为全局 `.env` 之后的兼容性回退处理。如果两个文件都存在且不一致，OpenClaw 保留 `~/.openclaw/.env` 并打印警告。

如果配置文件完全缺失，则跳过步骤 4；如果启用，Shell 导入仍然运行。

## 配置 `env` 块

设置内联环境变量的两种等效方法（两者都是非覆盖的）:

```json5
{
  env: {
    OPENROUTER_API_KEY: "sk-or-...",
    vars: {
      GROQ_API_KEY: "gsk-...",
    },
  },
}
```

## Shell env 导入

`env.shellEnv` 运行您的登录 Shell 并仅导入**缺失**的预期键:

```json5
{
  env: {
    shellEnv: {
      enabled: true,
      timeoutMs: 15000,
    },
  },
}
```

环境变量等效项:

- `OPENCLAW_LOAD_SHELL_ENV=1`
- `OPENCLAW_SHELL_ENV_TIMEOUT_MS=15000`

## 运行时注入的环境变量

OpenClaw 还会向衍生的子进程注入上下文标记：

- `OPENCLAW_SHELL=exec`：为通过 `exec` 工具运行的命令设置。
- `OPENCLAW_SHELL=acp`：为 ACP 运行时后端进程衍生（例如 `acpx`）设置。
- `OPENCLAW_SHELL=acp-client`：为 `openclaw acp client` 衍生 ACP 桥接进程时设置。
- `OPENCLAW_SHELL=tui-local`：为本地 TUI `!` Shell 命令设置。

这些是运行时标记（不需要用户配置）。可以在 Shell/profile 逻辑中使用它们来应用特定于上下文的规则。

## UI 环境变量

- `OPENCLAW_THEME=light`：当您的终端有浅色背景时，强制使用浅色 TUI 调色板。
- `OPENCLAW_THEME=dark`：强制使用深色 TUI 调色板。
- `COLORFGBG`：如果您的终端导出了此变量，OpenClaw 使用背景颜色提示自动选择 TUI 调色板。

## 配置中的环境变量替换

您可以使用 `${VAR_NAME}` 语法直接在配置字符串值中引用环境变量:

```json5
{
  models: {
    providers: {
      "vercel-gateway": {
        apiKey: "${VERCEL_GATEWAY_API_KEY}",
      },
    },
  },
}
```

有关完整详细信息,请参见 [配置：环境变量替换](/gateway/configuration-reference#env-var-substitution)。

## Secret refs 与 `${ENV}` 字符串

OpenClaw 支持两种环境驱动的模式：

- 配置值中的 `${VAR}` 字符串替换。
- SecretRef 对象（`{ source: "env", provider: "default", id: "VAR" }`），用于支持 Secret 引用的字段。

两者都在激活时从进程环境解析。SecretRef 详细信息记录在 [Secrets 管理](/gateway/secrets) 中。

## 与路径相关的环境变量

| 变量                   | 目的                                                                                                      |
| ---------------------- | --------------------------------------------------------------------------------------------------------- |
| `OPENCLAW_HOME`        | 覆盖用于所有内部路径解析的主目录（`~/.openclaw/`、Agent 目录、会话、凭据）。在将 OpenClaw 作为专用服务用户运行时很有用。 |
| `OPENCLAW_STATE_DIR`   | 覆盖状态目录（默认 `~/.openclaw`）。                                                                      |
| `OPENCLAW_CONFIG_PATH` | 覆盖配置文件路径（默认 `~/.openclaw/openclaw.json`）。                                                   |

## 日志记录

| 变量                   | 目的                                                                                                                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `OPENCLAW_LOG_LEVEL`   | 覆盖文件和控制台的日志级别（例如 `debug`、`trace`）。优先于配置中的 `logging.level` 和 `logging.consoleLevel`。无效值会被忽略并发出警告。 |

### `OPENCLAW_HOME`

设置后,`OPENCLAW_HOME` 替换所有内部路径解析的系统主目录（`$HOME` / `os.homedir()`）。这为无头服务帐户启用完整的文件系统隔离。

**优先级:** `OPENCLAW_HOME` > `$HOME` > `USERPROFILE` > `os.homedir()`

**示例**（macOS LaunchDaemon）:

```xml
<key>EnvironmentVariables</key>
<dict>
  <key>OPENCLAW_HOME</key>
  <string>/Users/user</string>
</dict>
```

`OPENCLAW_HOME` 也可以设置为波浪号路径（例如 `~/svc`）,在使用前使用 `$HOME` 展开。

## nvm 用户：web_fetch TLS 失败

如果 Node.js 是通过 **nvm** 安装的（而非系统包管理器），内置的 `fetch()` 使用 nvm 捆绑的 CA 存储，可能缺少现代根 CA（Let's Encrypt 的 ISRG Root X1/X2、DigiCert Global Root G2 等）。这会导致 `web_fetch` 在大多数 HTTPS 站点上失败，报错 `"fetch failed"`。

在 Linux 上，OpenClaw 会自动检测 nvm 并在实际启动环境中应用修复：

- `openclaw gateway install` 将 `NODE_EXTRA_CA_CERTS` 写入 systemd 服务环境
- `openclaw` CLI 入口点在 Node 启动之前使用 `NODE_EXTRA_CA_CERTS` 重新执行自身

**手动修复（适用于旧版本或直接 `node ...` 启动）：**

在启动 OpenClaw 之前导出该变量：

```bash
export NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt
openclaw gateway run
```

不要依赖于仅将此变量写入 `~/.openclaw/.env`；Node 在进程启动时读取 `NODE_EXTRA_CA_CERTS`。

## 相关

- [Gateway 配置](/gateway/configuration)
- [FAQ：环境变量和 .env 加载](/help/faq#env-vars-and-env-loading)
- [模型概述](/concepts/models)
