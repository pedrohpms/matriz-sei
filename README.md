# Calculadora da matriz de priorização do SEI

## O que é

Protótipo navegável da **matriz de priorização de demandas do SEI** (Sistema
Eletrônico de Informações), parte de um modelo de governança para o SEI no
Governo Federal. A calculadora conduz o avaliador (GPSEI) por um fluxo de seis
passos, aplica as regras do modelo, calcula um score e gera uma **memória de
cálculo pública e auditável**.

Cada demanda é pontuada em **cinco critérios** (escala 0–4), com soma simples
de 0 a 20:

1. **Impacto institucional** — aspecto **discricionário** (prioridade de
   governo, recomendação de controle não vinculante, compromisso firmado,
   visibilidade externa). Obrigação legal e determinação de controle são
   vinculantes — não entram aqui, vão para o piso (Passo 2).
2. **Quantidade de órgãos afetados** — quantos entes da esfera federal se
   beneficiam.
3. **Ganho operacional** — ganho típico para um órgão que adota a solução.
4. **Complexidade** *(escala invertida: 4 = baixa, 0 = altíssima)* — custo de
   entrega; a camada validada estabelece o teto da nota.
5. **Risco** *(escala invertida: 4 = baixo, 0 = crítico)* — chance de quebrar
   algo que já funciona ou gerar dívida técnica.

Três regras estruturam o fluxo:

- **Teto de complexidade pela camada** — a camada validada (uso local →
  grupo → vitrine → módulo PEN → core SEI) limita a nota de Complexidade.
  Nota acima do teto exige justificativa (*override*); Core SEI fixa a nota
  em 0.
- **Piso obrigatório, *ato vinculado* (Passo 2)** — obrigação legal,
  determinação de órgão de controle, falha de segurança, sustentação ou
  continuidade fazem a demanda receber **score fixo de 20** (prioridade
  absoluta), pular a pontuação e entrar na fila já no topo do ranking. É um
  ato vinculado: a norma manda, sem juízo discricionário (em contraste com o
  Impacto institucional, que é discricionário).
- **Filtro 0+0 (Passo 5)** — nota 0 em impacto **e** em ganho encerra a
  demanda como conveniência estritamente local.

## Como usar

Não há servidor nem build. **Abra o `index.html` no navegador** (duplo clique
ou arraste para uma janela do Chrome, Edge ou Firefox). Os arquivos
`index.html`, `app.js`, `regua.js` e `styles.css` precisam ficar na mesma
pasta.

> Por que sem servidor? O protótipo é todo vanilla (HTML + CSS + JS, sem
> dependências e sem build) para ser embarcado no ParticiPEN com o menor
> atrito possível. A régua é carregada como `regua.js` (e não `regua.json` +
> `fetch`) justamente porque `fetch`/`import` são bloqueados por CORS quando
> se abre o arquivo direto (`file://`).

No Passo 1 você pode:

- **Preencher manualmente** os campos da demanda;
- **Carregar do ParticiPEN** colando a URL de um tópico (ver
  [Integração](#integração-com-o-participen));
- **Carregar exemplo ou memória salva (JSON)** — selecione um arquivo de
  `exemplos/` (ou qualquer memória que você exportou) e o fluxo é reidratado.

Ao final (Passo 6), **Copiar markdown** (para colar no fórum) ou **Baixar
JSON** (para arquivar/processar).

### Exemplos prontos

A pasta [`exemplos/`](exemplos/) traz quatro casos verossímeis (uso local,
evolutiva transversal em Core SEI, filtro 0+0, e carga via tópico). Veja
[`exemplos/README.md`](exemplos/README.md).

## Modelo de dados

O **Baixar JSON** produz um arquivo `memoria-{slug-do-título}-{timestamp}.json`
(UTF-8) com a estrutura abaixo. O Markdown copiado contém a mesma informação
(paridade total) — ambos derivam do mesmo objeto interno (`montarMemoria`).

| Campo | Descrição |
|---|---|
| `versaoRegua` | Versão semver da régua, lida de `regua.js` (`REGUA.versao`). |
| `timestamp` | Data/hora de geração, ISO 8601 no fuso local, precisão de segundos (ex.: `2026-06-23T09:55:26-03:00`). |
| `avaliador` | Nome informado no Passo 1 (ou `"não informado"`). |
| `origemDosDados` | `"tópico Discourse"`, `"preenchimento manual"` ou `"tópico Discourse + ajuste manual"`. |
| `urlTopico` | URL do tópico de origem, ou `null`. |
| `camposAjustadosManualmente` | Rótulos dos campos editados após carregar de um tópico. |
| `pisoAcionado` | `true` quando o piso obrigatório foi acionado (score fixo de 20). |
| `pisoJustificativa` | Gatilho de piso que enquadrou a demanda: `"obrigacaoLegal"`, `"determinacaoControle"`, `"seguranca"`, `"sustentacao"`, `"continuidade"` (ou `null`). |
| `desfecho` | `{ codigo, rotulo, mensagem }` — `normal`, `piso` ou `conveniencia-local`. |
| `identificacao` | `titulo`, `descricao`, `linkPublico`, `natureza {valor,rotulo}`, `trilha`, `camadaProposta {valor,rotulo}`, `dependencias`, `evidencia`. |
| `triagem` | `pisoAcionado` e `gatilhos[]` (`chave`, `rotulo`, `marcado`). |
| `curadoria` | `camadaValidada {valor,rotulo}` e `tetoComplexidade`. |
| `criterios[]` | Por critério: `chave`, `rotulo`, `invertido`, `nota`, `descritor`, `observacao`. Sob piso, `nota`/`descritor` ficam `null` (sem pontuação). |
| `filtros` | `pisoObrigatorio {acionado,passo,gatilhos}` e `convenienciaLocal {acionado,passo}`. |
| `overrides[]` | Overrides de teto: `criterio`, `rotulo`, `nota`, `teto`, `camada`, `justificativa`. |
| `score` | `{ total, maximo: 20, texto }`. Sob piso, `total` é `20`. |

Esse mesmo JSON pode ser recarregado pela UI ("Carregar exemplo ou memória
salva"), reidratando o fluxo inteiro (`aplicarMemoria`).

## Régua canônica

O texto integral dos cinco critérios (descrição de cada critério + os cinco
descritores de cada nota) vive em **`regua.js`**, um arquivo de **dados**
(sem lógica). Para editar: abra `regua.js`, altere `rotulo`, `descricao`,
`invertido` ou o array `descritores` (índice 0..4 = nota 0..4), salve e
recarregue. Não é preciso tocar em `app.js` — o fluxo apenas consome o objeto.

A `chave` de cada critério é o identificador estável (algumas regras a
referenciam, como `impacto`/`ganho` no filtro 0+0 e `complexidade` no teto);
**não renomeie sem alinhar com `app.js`**.

`REGUA.versao` segue **semver** (começa em `1.0.0`). Suba a versão ao alterar
descritores — ela é gravada na memória de cálculo como `versaoRegua`, para
rastrear sob qual régua cada avaliação foi feita.

## Integração com o ParticiPEN

No Passo 1, **"Carregar do ParticiPEN"** aceita a URL de um tópico
(`{base}/t/{slug}/{id}`). A calculadora chama a API pública do Discourse
(`{base}/t/{id}.json`) e popula o Passo 1 com o que extrair. Um botão
**Re-extrair** reaplica o parsing a partir do JSON em cache de sessão (sem
nova chamada de rede).

> **Nota arquitetural.** Na versão final, embarcada como *theme component*, o
> acesso aos dados do tópico será direto pela API interna do Discourse. Neste
> protótipo standalone, simulamos via `fetch` à API pública.

### Esquema canônico do Topic Template

O parser assume este esquema — o mesmo deve ser usado ao configurar o
*user-form* / Topic Template no Discourse. A extração é tolerante
(*case-insensitive*, aceita `**negrito**`/`*itálico*`/espaços, ignora linhas
vazias). Referência completa e exemplo:
[`exemplos/topico-discourse-exemplo.md`](exemplos/topico-discourse-exemplo.md).

| Origem no tópico | Campo |
|---|---|
| Título do tópico | Título |
| Primeiro parágrafo do 1º post | Descrição curta |
| Linha `Natureza:` | Natureza (`problema` / `prática`) |
| Linha `Trilha:` | Trilha (Melhoria / Evolutiva / Normativa) |
| Linha `Camada proposta:` | Camada (uso local / grupo / vitrine / módulo PEN / core SEI) |
| Linha `Dependências:` | Dependências |
| Linhas `Evidência:` / `Métrica:` | Evidência |

Campos ausentes ficam em branco para preenchimento manual; URL inválida ou
*fetch* com falha mostram um aviso e o fluxo manual continua (**nunca
bloqueia**). A procedência (origem, URL, campos ajustados) entra na memória.

> **Trilha Corretiva.** A trilha Corretiva existe no modelo de governança,
> mas é tratada via Central de Atendimento, **fora desta calculadora**. Por
> isso o Passo 1 oferece apenas Melhoria, Evolutiva e Normativa.

### Configuração e CORS

A base do ParticiPEN fica em **`CONFIG.discourseBaseUrl`**, no início de
`app.js` (valor placeholder — ajuste no deploy; no protótipo a base de fato é
derivada da própria URL colada).

Rodando de um host diferente do Discourse, a chamada `fetch` está sujeita a
**CORS**. Para a carga ao vivo funcionar é preciso **(a)** o Discourse liberar
o *origin* da calculadora (`Access-Control-Allow-Origin`), **(b)** servir a
calculadora na mesma origem do Discourse, ou **(c)** usar uma instância dev.
Quando embarcada como *theme component*, não há CORS (acesso interno).

## Como embarcar no Discourse

Esboço das opções (não implementado nesta fase):

- **Theme component (recomendado).** Empacotar `index.html`/`app.js`/
  `regua.js`/`styles.css` como um componente de tema, renderizando a
  calculadora dentro de um tópico ou página. Vantagem: acesso à **API interna**
  do Discourse (sem CORS), à sessão do usuário e ao tema (as variáveis CSS
  `--cor-*` podem herdar do tema). É o caminho onde "Carregar do ParticiPEN"
  passa a funcionar sem configuração extra.
- **Iframe.** Hospedar a calculadora separadamente e embutir via `<iframe>`.
  Mais simples de publicar, mas mantém a barreira de CORS para a carga de
  tópicos e não herda o tema; comunicação com a página hospedeira exigiria
  `postMessage`.

Em ambos os casos, a paleta em variáveis CSS (`:root { --cor-* }`) foi pensada
para que o tema do Discourse sobrescreva as cores facilmente.

## Próximos passos

Em ordem sugerida de prioridade:

1. **Validar a régua e os tetos** com o GPSEI em casos reais (calibragem dos
   descritores e dos limites de camada).
2. **Embarcar como theme component** e trocar o `fetch` público pela API
   interna do Discourse (resolve CORS e autenticação de tópicos restritos).
3. **Integração de mão dupla** — publicar a memória de cálculo de volta como
   *reply* no tópico de origem.
4. **Persistência/fila** — registrar as avaliações em algum backend (hoje a
   memória é gerada e baixada, mas não armazenada).
5. **Suporte a variações de Topic Template** (hoje assume o esquema canônico).
6. **Mobile completo** e **internacionalização** (a interface é pt-BR).

Pontos frágeis, edge cases e candidatos a refactor estão em
[`REVISAO.md`](REVISAO.md).

## Estrutura dos arquivos

| Arquivo | Papel |
|---|---|
| `index.html` | Marcação dos seis passos, stepper e navegação. |
| `app.js` | Estado, fluxo, regras, parser do Discourse, memória, acessibilidade. |
| `regua.js` | Dados da régua canônica dos cinco critérios (sem lógica). |
| `styles.css` | Estilo, paleta em variáveis CSS, responsivo, foco/contraste. |
| `exemplos/` | Casos prontos (JSON) + referência do Topic Template. |
| `REVISAO.md` | Revisão crítica para o próximo ciclo. |
| `.claude/` | Servidor estático em PowerShell **apenas para preview local** (não faz parte do produto). |
