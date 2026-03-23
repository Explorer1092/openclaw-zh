---
mmh3_hash: "7d2878423eb09ac351a09fc4da57223d"
summary: "使用 Kustomize 将 OpenClaw Gateway 部署到 Kubernetes 集群"
read_when:
  - 您想在 Kubernetes 集群上运行 OpenClaw
  - 您想在 Kubernetes 环境中测试 OpenClaw
title: "Kubernetes"
---

# OpenClaw 在 Kubernetes 上

在 Kubernetes 上运行 OpenClaw 的最小起点 — 不是生产就绪的部署。它涵盖核心资源，旨在适应您的环境。

## 为什么不用 Helm？

OpenClaw 是一个带有一些配置文件的单容器。有趣的自定义在于智能体内容（markdown 文件、Skills、配置覆盖），而不是基础设施模板。Kustomize 无需 Helm chart 的开销即可处理叠加层。如果您的部署变得更复杂，可以在这些 manifest 之上添加 Helm chart。

## 您需要什么

- 运行中的 Kubernetes 集群（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- `kubectl` 已连接到您的集群
- 至少一个模型提供者的 API 密钥

## 快速开始

```bash
# 替换为您的提供者：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

获取 Gateway 令牌并将其粘贴到控制 UI：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

对于本地调试，`./scripts/k8s/deploy.sh --show-token` 会在部署后打印令牌。

## 使用 Kind 进行本地测试

如果您没有集群，可以使用 [Kind](https://kind.sigs.k8s.io/) 在本地创建一个：

```bash
./scripts/k8s/create-kind.sh           # 自动检测 docker 或 podman
./scripts/k8s/create-kind.sh --delete  # 拆除
```

然后像往常一样使用 `./scripts/k8s/deploy.sh` 部署。

## 逐步操作

### 1) 部署

**选项 A** — 环境中的 API 密钥（一步完成）：

```bash
# 替换为您的提供者：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

该脚本创建一个包含 API 密钥和自动生成的 Gateway 令牌的 Kubernetes Secret，然后进行部署。如果 Secret 已存在，它会保留当前的 Gateway 令牌和未被更改的任何提供者密钥。

**选项 B** — 单独创建 Secret：

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

如果需要将令牌打印到 stdout 进行本地测试，可以对任一命令使用 `--show-token`。

### 2) 访问 Gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 部署了什么

```
Namespace: openclaw（可通过 OPENCLAW_NAMESPACE 配置）
├── Deployment/openclaw        # 单 Pod，init 容器 + Gateway
├── Service/openclaw           # 端口 18789 上的 ClusterIP
├── PersistentVolumeClaim      # 用于智能体状态和配置的 10Gi
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway 令牌 + API 密钥
```

## 自定义

### 智能体指令

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md` 并重新部署：

```bash
./scripts/k8s/deploy.sh
```

### Gateway 配置

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。有关完整参考，请参阅 [Gateway 配置](/gateway/configuration)。

### 添加提供者

导出其他密钥后重新运行：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

现有的提供者密钥会保留在 Secret 中，除非您覆盖它们。

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
image: ghcr.io/openclaw/openclaw:2026.3.1
```

### 超出端口转发的暴露

默认 manifest 将 Gateway 绑定到 Pod 内的回环。这与 `kubectl port-forward` 配合使用，但不适用于需要访问 Pod IP 的 Kubernetes `Service` 或 Ingress 路径。

如果要通过 Ingress 或负载均衡器暴露 Gateway：

- 将 `scripts/k8s/manifests/configmap.yaml` 中的 Gateway 绑定从 `loopback` 更改为与您的部署模型匹配的非回环绑定
- 保持 Gateway 身份验证启用，并使用正确的 TLS 终止入口点
- 使用支持的 Web 安全模型为远程访问配置控制 UI（例如 HTTPS/Tailscale Serve 和在需要时的显式允许来源）

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

这会应用所有 manifest 并重启 Pod 以获取任何配置或 Secret 更改。

## 拆除

```bash
./scripts/k8s/deploy.sh --delete
```

这会删除命名空间及其中的所有资源，包括 PVC。

## 架构说明

- Gateway 默认绑定到 Pod 内的回环，因此包含的设置适用于 `kubectl port-forward`
- 无集群范围资源 — 所有内容都在单个命名空间中
- 安全性：`readOnlyRootFilesystem`、`drop: ALL` 能力、非 root 用户（UID 1000）
- 默认配置将控制 UI 保持在更安全的本地访问路径：回环绑定加上 `kubectl port-forward` 到 `http://127.0.0.1:18789`
- 如果移出 localhost 访问，使用支持的远程模型：HTTPS/Tailscale 加上适当的 Gateway 绑定和控制 UI 来源设置
- Secret 在临时目录中生成并直接应用到集群 — 没有 Secret 材料写入仓库检出

## 文件结构

```
scripts/k8s/
├── deploy.sh                   # 创建命名空间 + Secret，通过 kustomize 部署
├── create-kind.sh              # 本地 Kind 集群（自动检测 docker/podman）
└── manifests/
    ├── kustomization.yaml      # Kustomize 基础
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # 带有安全加固的 Pod 规范
    ├── pvc.yaml                # 10Gi 持久存储
    └── service.yaml            # 端口 18789 上的 ClusterIP
```
