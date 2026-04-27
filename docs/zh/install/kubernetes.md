---
mmh3_hash: "0f864d7d98d38c7cfc46cf054fe5cb56"
summary: "使用 Kustomize 将 OpenClaw Gateway 部署到 Kubernetes 集群"
read_when:
  - 你想在 Kubernetes 集群上运行 OpenClaw
  - 你想在 Kubernetes 环境中测试 OpenClaw
title: "Kubernetes"
---

# OpenClaw on Kubernetes

在 Kubernetes 上运行 OpenClaw 的最小起点 — 不是生产就绪的部署。它涵盖了核心资源，旨在适应你的环境。

## 为什么不用 Helm？

OpenClaw 是一个带有一些配置文件的单个容器。有趣的自定义在于 agent 内容（markdown 文件、技能、配置覆盖），而不是基础设施模板化。Kustomize 无需 Helm chart 的开销就可以处理覆盖。如果你的部署变得更加复杂，可以在这些 manifest 上面叠加一个 Helm chart。

## 你需要什么

- 正在运行的 Kubernetes 集群（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- 连接到你集群的 `kubectl`
- 至少一个模型 provider 的 API 密钥

## 快速入门

```bash
# 替换为你的 provider：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

检索控制 UI 的配置共享密钥。此部署脚本默认创建 token 认证：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

对于本地调试，`./scripts/k8s/deploy.sh --show-token` 在部署后打印 token。

## 使用 Kind 进行本地测试

如果你没有集群，请用 [Kind](https://kind.sigs.k8s.io/) 在本地创建一个：

```bash
./scripts/k8s/create-kind.sh           # 自动检测 docker 或 podman
./scripts/k8s/create-kind.sh --delete  # 拆除
```

然后像平常一样用 `./scripts/k8s/deploy.sh` 部署。

## 逐步操作

### 1) 部署

**选项 A** — 环境中的 API 密钥（一步完成）：

```bash
# 替换为你的 provider：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

脚本创建包含 API 密钥和自动生成的 gateway token 的 Kubernetes Secret，然后部署。如果 Secret 已存在，它会保留当前的 gateway token 和任何未被更改的 provider 密钥。

**选项 B** — 单独创建 Secret：

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

如果你想将 token 打印到 stdout 进行本地测试，在任一命令中使用 `--show-token`。

### 2) 访问 gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 部署了什么

```
Namespace: openclaw（可通过 OPENCLAW_NAMESPACE 配置）
├── Deployment/openclaw        # 单个 pod，init 容器 + gateway
├── Service/openclaw           # 端口 18789 上的 ClusterIP
├── PersistentVolumeClaim      # 10Gi 用于 agent 状态和配置
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway token + API 密钥
```

## 自定义

### Agent 指令

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md` 并重新部署：

```bash
./scripts/k8s/deploy.sh
```

### Gateway 配置

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。完整参考请参见 [Gateway 配置](/gateway/configuration)。

### 添加 providers

重新运行并导出额外的密钥：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

现有的 provider 密钥保留在 Secret 中，除非你覆盖它们。

或者直接修补 Secret：

```bash
kubectl patch secret openclaw-secrets -n openclaw \
  -p '{"stringData":{"<PROVIDER>_API_KEY":"..."}}'
kubectl rollout restart deployment/openclaw -n openclaw
```

### 自定义命名空间

```bash
OPENCLAW_NAMESPACE=my-namespace ./scripts/k8s/deploy.sh
```

### 自定义镜像

编辑 `scripts/k8s/manifests/deployment.yaml` 中的 `image` 字段：

```yaml
image: ghcr.io/openclaw/openclaw:latest # 或固定到来自 https://github.com/openclaw/openclaw/releases 的特定版本
```

### 暴露到端口转发之外

默认 manifest 将 gateway 绑定到 pod 内的 loopback。这与 `kubectl port-forward` 一起工作，但不适用于需要到达 pod IP 的 Kubernetes `Service` 或 Ingress 路径。

如果你想通过 Ingress 或负载均衡器暴露 gateway：

- 将 `scripts/k8s/manifests/configmap.yaml` 中的 gateway 绑定从 `loopback` 更改为与你的部署模型匹配的非 loopback 绑定
- 保持 gateway 认证启用并使用正确的 TLS 终止入口点
- 使用支持的 Web 安全模型配置控制 UI 以进行远程访问（例如 HTTPS/Tailscale Serve 和在需要时的明确允许来源）

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

这会应用所有 manifest 并重启 pod 以获取任何配置或 Secret 更改。

## 拆除

```bash
./scripts/k8s/deploy.sh --delete
```

这会删除命名空间及其中的所有资源，包括 PVC。

## 架构说明

- Gateway 默认绑定到 pod 内的 loopback，因此包含的设置用于 `kubectl port-forward`
- 没有集群范围的资源 — 一切都在单个命名空间中
- 安全：`readOnlyRootFilesystem`、`drop: ALL` 能力、非 root 用户（UID 1000）
- 默认配置使控制 UI 保持在更安全的本地访问路径上：loopback 绑定加上 `kubectl port-forward` 到 `http://127.0.0.1:18789`
- 如果你移出 localhost 访问，请使用支持的远程模型：HTTPS/Tailscale 加上适当的 gateway 绑定和控制 UI 来源设置
- Secret 在临时目录中生成并直接应用到集群 — 没有 Secret 材料写入仓库检出

## 文件结构

```
scripts/k8s/
├── deploy.sh                   # 创建命名空间 + Secret，通过 kustomize 部署
├── create-kind.sh              # 本地 Kind 集群（自动检测 docker/podman）
└── manifests/
    ├── kustomization.yaml      # Kustomize 基础
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # 带安全加固的 Pod 规格
    ├── pvc.yaml                # 10Gi 持久存储
    └── service.yaml            # 18789 上的 ClusterIP
```

## 相关

- [Docker](/install/docker)
- [Docker VM 运行时](/install/docker-vm-runtime)
- [安装概览](/install)
