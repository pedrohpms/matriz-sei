# Topic Template canônico do ParticiPEN — referência

Este arquivo documenta o **esquema esperado pelo parser** da calculadora
(implementado na Iteração 5, função `extrairCamposDoTopico` em `app.js`) e
serve de referência para configurar o *user-form* / Topic Template no
Discourse do ParticiPEN.

A demanda é um **tópico** do fórum. O parser lê:

- **Título do tópico** → campo "Título"
- **Primeiro parágrafo do corpo do 1º post** → campo "Descrição curta"
- **Linhas rotuladas** no corpo → demais campos

A extração é tolerante: *case-insensitive*, aceita marcação leve em torno do
rótulo (`**negrito**`, `*itálico*`, espaços) e ignora linhas em branco. Os
rótulos reconhecidos são:

| Rótulo na linha | Campo | Valores aceitos |
|---|---|---|
| `Natureza:` | Natureza | `problema` ou `prática` |
| `Trilha:` | Trilha | Melhoria, Evolutiva, Normativa (Corretiva é tratada via Central de Atendimento, fora desta calculadora) |
| `Camada proposta:` | Camada | uso local, grupo, vitrine, módulo PEN, core SEI |
| `Dependências:` | Dependências | texto livre |
| `Evidência:` / `Métrica:` | Evidência | texto livre (uma ou mais linhas) |

> Campos ausentes ficam em branco para preenchimento manual — o parser nunca
> bloqueia o avaliador.

---

## Exemplo preenchido

O título do tópico (fora do corpo) seria:

> **Padronizar a numeração de processos no grupo de C&T**

E o corpo do primeiro post:

```markdown
Unificar o padrão de numeração de processos administrativos entre os órgãos
do ecossistema de Ciência e Tecnologia, hoje divergente entre as instituições.

**Natureza:** problema
**Trilha:** Evolutiva
**Camada proposta:** Grupo
**Dependências:** Acordo entre os órgãos do grupo e ajuste de configuração compartilhada.
**Evidência:** Divergência relatada por 4 órgãos do grupo.
**Métrica:** Reduz retrabalho de reautuação de processos.
```

Ao carregar a URL desse tópico, a calculadora preenche o Passo 1 com:

- **Título:** Padronizar a numeração de processos no grupo de C&T
- **Descrição:** Unificar o padrão de numeração… (o primeiro parágrafo)
- **Natureza:** Problema a resolver
- **Trilha:** Evolutiva
- **Camada proposta:** Grupo
- **Dependências:** Acordo entre os órgãos do grupo…
- **Evidência:** Divergência relatada por 4 órgãos… / Reduz retrabalho…

A pontuação dos cinco critérios continua sendo do avaliador (o tópico não a
carrega). A memória de cálculo resultante está em
[`caso-4-via-url.json`](caso-4-via-url.json), com `origemDosDados` =
`"tópico Discourse"`.

> **Atenção à descrição.** A regra é "primeiro parágrafo = descrição". Em um
> Topic Template, garanta que o corpo **comece pela descrição** (não por uma
> saudação como "Prezados,"), senão será a saudação que entra no campo.
