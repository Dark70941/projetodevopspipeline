# Gerador de Frases

Projeto desenvolvido para demonstrar uma pipeline CI/CD completa utilizando **GitHub Actions** e três Actions do **GitHub Marketplace**.

## Sobre o projeto

Aplicação web que gera frases aleatórias com histórico persistente, categorias e contador de uso. As frases são configuradas externamente via arquivo YAML, validado automaticamente na pipeline.

### Funcionalidades

- Geração de frases aleatórias com categorias (motivação, aprendizado, etc.)
- **Histórico completo** de todas as frases já geradas (salvo no `localStorage`)
- Contador de frases geradas na sessão
- Botão para copiar a frase atual
- Botão para limpar o histórico
- Configuração externa via `config/app.yml` / `config/app.json`

### Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | HTML, CSS, JavaScript |
| Testes | Jest |
| Qualidade | ESLint |
| Validação | Go (`tools/validator`) |
| CI/CD | GitHub Actions |

---

## GitHub Actions do Marketplace

Este projeto utiliza **3 Actions** escolhidas no GitHub Marketplace, cada uma em uma etapa adequada do processo:

### 1. yq — Portable YAML Processor

| Item | Detalhe |
|------|---------|
| **Action** | [`mikefarah/yq@master`](https://github.com/marketplace/actions/yq-portable-yaml-processor) |
| **Etapa** | Build e Package |
| **Função** | Processar e validar o arquivo `config/app.yml` |

**O que faz na pipeline:**

- Valida se o YAML contém os campos obrigatórios (`app.nome`, `app.versao`, `frases`)
- Extrai a versão da aplicação para uso nos logs de build
- Converte `config/app.yml` para `config/app.json` usado pelo frontend

**Contribuição para a automação:** Garante que toda alteração na configuração seja validada antes do build, evitando deploys com configuração inválida. A conversão YAML → JSON elimina a necessidade de manter dois arquivos manualmente sincronizados.

```yaml
- name: Validar configuração YAML com yq
  uses: mikefarah/yq@master
  with:
    cmd: yq -e '.app.nome and .app.versao and (.frases | length > 0)' config/app.yml
```

---

### 2. Gosec Security Checker

| Item | Detalhe |
|------|---------|
| **Action** | [`securego/gosec@master`](https://github.com/marketplace/actions/gosec-security-checker) |
| **Etapa** | Security |
| **Função** | Análise estática de segurança no código Go |

**O que faz na pipeline:**

- Escaneia o validador Go em `tools/validator/` em busca de vulnerabilidades
- Gera relatório no formato SARIF
- Envia o relatório para a aba **Security** do GitHub via `upload-sarif`

**Contribuição para a automação:** Adiciona uma camada de segurança automatizada que detecta problemas como hardcoded credentials, SQL injection e uso de criptografia fraca no código Go, antes que chegue à produção.

```yaml
- name: Executar Gosec Security Checker
  uses: securego/gosec@master
  with:
    args: "-fmt sarif -out results.sarif ./tools/..."
```

---

### 3. GitHub Push

| Item | Detalhe |
|------|---------|
| **Action** | [`ad-m/github-push-action@master`](https://github.com/marketplace/actions/github-push-action) |
| **Etapa** | Deploy e Release |
| **Função** | Enviar alterações de volta ao repositório |

**O que faz na pipeline:**

- **Deploy:** Publica o pacote `dist/` na branch `gh-pages` para GitHub Pages
- **Release:** Atualiza o arquivo `build-info.json` no repositório com dados do build (versão, commit, data)

**Contribuição para a automação:** Permite que a pipeline não apenas valide e empacote o código, mas também publique automaticamente a aplicação e registre metadados de cada build sem intervenção manual.

```yaml
- name: Publicar no GitHub Pages com GitHub Push
  uses: ad-m/github-push-action@master
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    branch: gh-pages
    force: true
```

---

## Pipeline — Fluxo completo

```text
Build (yq valida YAML)
  ↓
Test (Jest)
  ↓
Quality (ESLint)
  ↓
Security (Gosec + npm audit)
  ↓
Package (yq gera JSON + artefato)
  ↓
Deploy (GitHub Push → gh-pages)
  ↓
Smoke Test (validador Go)
  ↓
Release (GitHub Push → build-info.json)
```

### Jobs da pipeline

| # | Job | Descrição | Action do Marketplace |
|---|-----|-----------|----------------------|
| 1 | Build | Valida config YAML e verifica arquivos | **yq** |
| 2 | Test | Executa testes unitários com Jest | — |
| 3 | Quality | Análise de código com ESLint | — |
| 4 | Security | Scan de segurança Go + npm audit | **Gosec** |
| 5 | Package | Empacota aplicação para distribuição | **yq** |
| 6 | Deploy | Publica no GitHub Pages | **GitHub Push** |
| 7 | Smoke Test | Valida pacote e estrutura | — |
| 8 | Release | Atualiza build-info no repositório | **GitHub Push** |

---

## Como executar localmente

```bash
# Instalar dependências
npm install

# Executar testes
npm test

# Executar lint
npm run lint

# Abrir a aplicação (servidor local)
npx serve .
```

Para validar a configuração com Go (requer Go 1.22+):

```bash
go run ./tools/validator config/app.json
```

---

## Estrutura do projeto

```text
projeto-pipelines-devops-main/
├── .github/workflows/pipeline.yml   # Pipeline CI/CD
├── config/
│   ├── app.yml                      # Configuração (fonte)
│   └── app.json                     # Configuração (gerada pelo yq)
├── tools/validator/main.go          # Validador Go (scan pelo Gosec)
├── tests/
│   ├── setup.js                     # Mock do localStorage
│   └── script.test.js               # Testes unitários
├── index.html
├── script.js
├── style.css
├── go.mod
└── package.json
```

---

## Como executar a pipeline no GitHub

1. Crie um repositório no GitHub e envie o código:

```bash
git init
git add .
git commit -m "feat: gerador de frases com pipeline CI/CD"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
git push -u origin main
```

2. A pipeline será executada automaticamente no push para `main`
3. Verifique os resultados em **Actions** no GitHub
4. Para GitHub Pages, configure em **Settings → Pages → Branch: gh-pages**

---

## Verificação de cada etapa

| Etapa | Como verificar |
|-------|---------------|
| yq (Build) | Job "Build" deve exibir a versão extraída do YAML |
| Gosec (Security) | Job "Security" deve gerar SARIF; verificar aba Security |
| GitHub Push (Deploy) | Branch `gh-pages` criada com os arquivos do `dist/` |
| GitHub Push (Release) | Arquivo `build-info.json` atualizado no repositório |
| Histórico (App) | Abrir `index.html`, gerar frases e verificar lista |
