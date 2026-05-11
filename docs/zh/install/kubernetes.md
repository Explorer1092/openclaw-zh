---
mmh3_hash: "245235a7837ad6643c847efed8da9f29"
summary: "使用 Kustomize 将 OpenClaw Gateway 部署到 Kubernetes 集群"
read_when:
  - 你想在 Kubernetes 集群上运行 OpenClaw
  - 你想在 Kubernetes 环境中测试 OpenClaw
title: "Kubernetes"
---

在 Kubernetes 上运行 OpenClaw 的最小起点 — 并非生产就绪的部署。它涵盖了核心资源，旨在适应你的环境。

## 为什么不使用 Helm？

OpenClaw 是一个有一些配置文件的单个容器。有趣的自定义在于 agent 内容（markdown 文件、skill、配置覆盖），而不是基础设施模板。Kustomize 处理 overlay，无需 Helm chart 的开销。如果你的部署变得更复杂，可以在这些 manifest 之上叠加 Helm chart。

## 你需要什么

- 正在运行的 Kubernetes 集群（AKS、EKS、GKE、k3s、kind、OpenShift 等）
- `kubectl` 已连接到你的集群
- 至少一个模型 provider 的 API 密钥

## 快速开始

```bash
# 替换为你的 provider：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh

kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

获取控制界面配置的共享密钥。此部署脚本默认创建令牌认证：

```bash
kubectl get secret openclaw-secrets -n openclaw -o jsonpath='{.data.OPENCLAW_GATEWAY_TOKEN}' | base64 -d
```

用于本地调试时，`./scripts/k8s/deploy.sh --show-token` 会在部署后打印令牌。

## 使用 Kind 进行本地测试

如果你没有集群，可以使用 [Kind](https://kind.sigs.k8s.io/) 在本地创建一个：

```bash
./scripts/k8s/create-kind.sh           # 自动检测 docker 或 podman
./scripts/k8s/create-kind.sh --delete  # 拆除
```

然后照常使用 `./scripts/k8s/deploy.sh` 进行部署。

## 分步说明

### 1) 部署

**选项 A** — 在环境中设置 API 密钥（一步完成）：

```bash
# 替换为你的 provider：ANTHROPIC、GEMINI、OPENAI 或 OPENROUTER
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh
```

脚本创建包含 API 密钥和自动生成的 gateway 令牌的 Kubernetes Secret，然后部署。如果 Secret 已存在，它将保留当前的 gateway 令牌以及未被更改的 provider 密钥。

**选项 B** — 单独创建 secret：

```bash
export <PROVIDER>_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

如果你想要令牌打印到 stdout 用于本地测试，请在任一命令中使用 `--show-token`。

### 2) 访问 gateway

```bash
kubectl port-forward svc/openclaw 18789:18789 -n openclaw
open http://localhost:18789
```

## 部署内容

```
Namespace: openclaw（可通过 OPENCLAW_NAMESPACE 配置）
├── Deployment/openclaw        # 单个 pod，init 容器 + gateway
├── Service/openclaw           # 端口 18789 上的 ClusterIP
├── PersistentVolumeClaim      # 10Gi 用于 agent 状态和配置
├── ConfigMap/openclaw-config  # openclaw.json + AGENTS.md
└── Secret/openclaw-secrets    # Gateway 令牌 + API 密钥
```

## 自定义

### Agent 指令

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `AGENTS.md` 并重新部署：

```bash
./scripts/k8s/deploy.sh
```

### Gateway 配置

编辑 `scripts/k8s/manifests/configmap.yaml` 中的 `openclaw.json`。有关完整参考，请参阅 [Gateway 配置](/gateway/configuration)。

### 添加 provider

导出额外密钥后重新运行：

```bash
export ANTHROPIC_API_KEY="..."
export OPENAI_API_KEY="..."
./scripts/k8s/deploy.sh --create-secret
./scripts/k8s/deploy.sh
```

现有 provider 密钥保留在 Secret 中，除非你覆盖它们。

或直接修改 Secret：

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
image: ghcr.io/openclaw/openclaw:latest # 或固定到 https://github.com/openclaw/openclaw/releases 中的特定版本
```

### 在端口转发之外暴露

默认 manifest 将 gateway 绑定到 pod 内部的 loopback。这适用于 `kubectl port-forward`，但不适用于需要访问 pod IP 的 Kubernetes `Service` 或 Ingress 路径。

如果你想通过 Ingress 或负载均衡器暴露 gateway：

- 将 `scripts/k8s/manifests/configmap.yaml` 中的 gateway 绑定从 `loopback` 更改为与你的部署模型匹配的非 loopback 绑定
- 保持 gateway 认证启用，并使用正确的 TLS 终止入口点
- 使用支持的 Web 安全模型为远程访问配置控制界面（例如 HTTPS/Tailscale Serve，以及在需要时配置明确允许的 origin）

## 重新部署

```bash
./scripts/k8s/deploy.sh
```

这将应用所有 manifest 并重启 pod 以获取任何配置或 secret 更改。

## 拆除

```bash
./scripts/k8s/deploy.sh --delete
```

这将删除命名空间及其中的所有资源，包括 PVC。

## 架构说明

- gateway 默认绑定到 pod 内部的 loopback，因此包含的设置适用于 `kubectl port-forward`
- 没有集群范围的资源 — 所有内容都在单个命名空间中
- 安全：`readOnlyRootFilesystem`，`drop: ALL` 权能，非 root 用户（UID 1000）
- 默认配置将控制界面保持在更安全的本地访问路径上：loopback 绑定加上 `kubectl port-forward` 到 `http://127.0.0.1:18789`
- 如果你超出 localhost 访问，请使用支持的远程模型：HTTPS/Tailscale 加上适当的 gateway 绑定和控制界面 origin 设置
- Secret 在临时目录中生成并直接应用到集群 — 不会将任何 secret 材料写入仓库 checkout

## 文件结构

```
scripts/k8s/
├── deploy.sh                   # 创建命名空间 + secret，通过 kustomize 部署
├── create-kind.sh              # 本地 Kind 集群（自动检测 docker/podman）
└── manifests/
    ├── kustomization.yaml      # Kustomize 基础
    ├── configmap.yaml          # openclaw.json + AGENTS.md
    ├── deployment.yaml         # 具有安全加固的 Pod 规范
    ├── pvc.yaml                # 10Gi 持久化存储
    └── service.yaml            # 端口 18789 上的 ClusterIP
```

## 相关

- [Docker](/install/docker)
- [Docker VM 运行时](/install/docker-vm-runtime)
- [安装概览](/install)
