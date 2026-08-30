# Infraestrutura como Código (Terraform + Kind)

Este diretório provisiona, com Terraform, um cluster Kubernetes local usando
[Kind](https://kind.sigs.k8s.io/) (Kubernetes IN Docker). É a base sobre a qual
os manifestos da aplicação (em [`../k8s`](../k8s)) são aplicados.

## Recursos criados

| Recurso | Provider | Descrição |
|---------|----------|-----------|
| `kind_cluster.this` | `tehcyx/kind` | Cluster Kubernetes local em Docker (control-plane com port mappings 80/443) |
| `kubernetes_namespace.app` | `hashicorp/kubernetes` | Namespace `tech-challenge-namespace` da aplicação |
| `kubectl_manifest.metrics_server` | `alekc/kubectl` | metrics-server (necessário para o Horizontal Pod Autoscaler) |

> MongoDB, Job de migrations e API **só** rodam como workloads no cluster
> Kubernetes (`kubectl apply` em [`../k8s`](../k8s)). Este módulo Terraform cria
> o Kind, o namespace e o metrics-server — não sobe Compose nem processos da
> aplicação no host.

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) em execução
- [Terraform](https://developer.hashicorp.com/terraform/downloads) >= 1.5
- [kubectl](https://kubernetes.io/docs/tasks/tools/)
- [Kind](https://kind.sigs.k8s.io/docs/user/quick-start/#installation)

## Variáveis

| Variável | Padrão | Descrição |
|----------|--------|-----------|
| `cluster_name` | `tech-challenge` | Nome do cluster Kind |
| `namespace` | `tech-challenge-namespace` | Namespace da aplicação |
| `node_image` | `kindest/node:v1.32.2` | Imagem dos nós Kind |
| `kubeconfig_path` | `~/.kube/kind-tech-challenge` | Caminho do kubeconfig gerado |
| `enable_metrics_server` | `true` | Instala o metrics-server (HPA) |

Copie `terraform.tfvars.example` para `terraform.tfvars` e ajuste se necessário.

## Como aplicar

```sh
cd infra

terraform init      # baixa os providers
terraform fmt       # formata os arquivos
terraform validate  # valida a sintaxe/config
terraform plan      # mostra o que será criado
terraform apply     # cria o cluster + namespace + metrics-server
```

## Como validar

```sh
kubectl cluster-info --context kind-tech-challenge
kubectl get nodes
kubectl get ns tech-challenge-namespace
kubectl get pods -n kube-system | grep metrics-server
kubectl top nodes                 # requer metrics-server pronto (~30s)
```

## Saídas (outputs)

- `cluster_name` — nome do cluster
- `cluster_endpoint` — endpoint da API
- `kubeconfig_path` — caminho do kubeconfig
- `kubectl_context` — contexto kubectl (`kind-tech-challenge`)
- `namespace` — namespace da aplicação

## Como destruir

```sh
terraform destroy
```

Isso remove o cluster Kind e todos os recursos criados por este módulo.
