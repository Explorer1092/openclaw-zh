---
mmh3_hash: "25d450aaee56b9ee0bf9471fc0b3f8ac"
summary: "ClawHub 发布的工作原理：Skill、Plugin、所有者、范围、发布和审核。"
read_when:
  - 发布 Skill 或 Plugin
  - 调试所有者或包范围错误
  - 添加发布 UI、CLI 或后端行为
---

# 在 ClawHub 上发布

ClawHub 发布是以所有者为范围的：每次发布都针对一个发布者，服务器决定已登录用户是否有权在该发布者下发布。

## 所有者

所有者是 ClawHub 发布者句柄，例如 `@alice` 或 `@openclaw`。个人所有者为用户创建。组织所有者可以有多个成员。

发布时，您可以使用个人所有者，或选择您拥有发布者访问权限的组织所有者。

## Skill

Skill 从 Skill 文件夹发布。公开页面为：

```text
https://clawhub.ai/<owner>/<slug>
```

示例：

```text
https://clawhub.ai/alice/review-helper
```

发布请求包括所选所有者、slug、版本、更新日志和文件。服务器在创建发布之前验证操作者是否可以以该所有者身份发布。

## Plugin

Plugin 使用 npm 风格的包名。带范围的包名在名称的第一部分包含所有者：

```text
@owner/package-name
```

范围必须与所选发布所有者匹配。如果您的包名为 `@openclaw/dronzer`，则只能以 `@openclaw` 身份发布。如果您以 `@vintageayu` 身份发布，请将包重命名为 `@vintageayu/dronzer`。

这可以防止包声明发布者不控制的组织命名空间。

## 发布流程

1. UI、CLI 或 GitHub 工作流收集包元数据和文件。
2. 发布请求连同所选所有者一起发送到 ClawHub。
3. 服务器验证所有者权限、包范围、包名、版本、文件限制和来源元数据。
4. ClawHub 存储发布并启动自动安全检查。
5. 新发布在审核和验证完成之前对正常安装/下载界面隐藏。

如果验证失败，则不会创建发布。

## 常见问题

### 包范围必须与所选所有者匹配

如果包范围和所选所有者不匹配，ClawHub 会拒绝发布：

```text
Package scope "@openclaw" must match selected owner "@vintageayu".
Publish as "@openclaw" or rename this package to "@vintageayu/dronzer".
```

要修复此问题，请选择包范围指定的所有者，或重命名包使范围与您可以发布的所有者匹配。

如果包名已具有正确的范围但包由错误的发布者拥有，请改为转移所有权：

```sh
clawhub package transfer @opik/opik-openclaw --to opik
```

仅当您对当前包所有者和目标发布者都具有管理员访问权限时才使用包转移。它不允许您发布到您无法管理的范围。

这保护了组织命名空间。名为 `@openclaw/dronzer` 的包声明了 `@openclaw` 命名空间，因此只有对 `@openclaw` 所有者具有访问权限的发布者才能发布它。
