# Calculadora da matriz de priorização do SEI

> **Estado: Iteração 7 de 7 — protótipo completo.**

## O que é

Protótipo navegável da **matriz de priorização de demandas do SEI** (Sistema
Eletrônico de Informações), parte de um modelo de governança para o SEI no
Governo Federal. A calculadora conduz o avaliador (GPSEI) por um fluxo de seis
passos, aplica as regras do modelo, calcula um par **valor × esforço** e gera
uma **memória de cálculo pública e auditável**.

Cada demanda é pontuada em **cinco critérios** (escala 0–4, todos crescendo no
sentido natural), agrupados em **dois blocos independentes**:

**Bloco Valor (0–12) — ordena a prioridade na fila:**

1. **Impacto institucional** — aspecto **discricionário** (prioridade de
   governo, recomendação de controle não vinculante, compromisso firmado,
   visibilidade externa). Obrigação legal e determinação de controle são
   vinculantes — não entram aqui, vão para o ato vinculado (Passo 2).
2. **Quantidade de órgãos afetados** — quantos entes da esfera federal se
   beneficiam.
3. **Ganho operacional** — ganho típico para um órgão que adota a solução.

**Bloco Esforço de entrega (0–8) — orienta o tratamento e desempata (menor
esforço primeiro):**

4. **Complexidade** *(0 = trivial, 4 = altíssima)* — custo de entrega; a camada
   validada estabelece o **piso** da nota (complexidade mínima plausível).
5. **Risco de entrega** *(0 = desprezível, 4 = crítico)* — chance de a entrega
   derrapar, quebrar algo que já funciona ou gerar dívida técnica. É distinto do
   risco do ato vinculado (falha de segurança, indisponibilidade), tratado na
   triagem.

O valor e o esforço **não somam** num número único: são dois eixos. A demanda é
plotada num gráfico **valor × esforço** com quatro regiões — *janela de
oportunidade* (valor alto, esforço baixo), *aposta estratégica* (valor alto,
esforço alto), *preenchimento de capacidade* (valor baixo, esforço baixo) e
*revisão e devolutiva* (valor baixo, esforço alto).

Três regras estruturam o fluxo:

- **Piso de complexidade pela camada** — a camada validada (uso local →
  grupo → vitrine → módulo PEN → core SEI) estabelece a nota **mínima** de
  Complexidade. Nota abaixo do piso exige justificativa (*override*); Core SEI
  trava a nota em 4. É implausível, por exemplo, virar Módulo PEN com
  complexidade baixa.
- **Ato vinculado (Passo 2)** — obrigação legal, determinação de órgão de
  controle, falha de segurança, sustentação ou continuidade tiram a demanda
  **da matriz discricionária**: ela pula a pontuação e é encaminhada direto ao
  topo da fila, independentemente do par valor × esforço. É um ato vinculado: a
  norma manda, sem juízo discricionário (em contraste com o Impacto
  institucional, que é discricionário).
- **Filtro 0+0 (Passo 5)** — nota 0 em impacto **e** em ganho encerra a
  demanda como conveniência estritamente local.

## Como usar

A calculadora foi montada em https://pedrohpms.github.io/matriz-sei/ para testes, com os arquivos mais atuais do projeto. Ela é navegável passo a passo, conforme detalhado abaixo.

No Passo 1 você pode:

- **Preencher manualmente** os campos da demanda;
- **Carregar do ParticiPEN** colando a URL de um tópico (ver
  [Integração](#integração-com-o-participen));
- **Carregar exemplo ou memória salva (JSON)** — selecione um arquivo de
  `exemplos/` (ou qualquer memória que você exportou) e o fluxo é atualizado.

Ao final (Passo 6), a calculadora mostra a **plotagem em quadrantes** (SVG) da
demanda e permite **Copiar markdown** (para colar no fórum, já com o SVG
embutido), **Baixar JSON** (para arquivar/processar) ou **Baixar como SVG**.

### Como se lê a fila lexicográfica pública

A calculadora pontua **uma demanda por vez**. A montagem da fila com várias
demandas é uma agregação externa (não implementada aqui), e segue uma ordem
**lexicográfica**:

1. Ordena por **valor decrescente** (0–12) — quem entrega mais valor vem antes.
2. Empates de valor **desempatam por esforço crescente** (0–8) — entre demandas
   de mesmo valor, a de **menor esforço** vem primeiro (entrega mais rápida e
   barata do mesmo valor).
3. Empate residual (mesmo valor **e** mesmo esforço) vai ao **Comitê**, que
   decide com base no contexto (trilha, dependências, oportunidade).

Atos vinculados (Passo 2) não entram nessa ordenação: são encaminhados direto
ao topo da fila, à frente da matriz discricionária.

### Exemplos prontos

A pasta [`exemplos/`](exemplos/) traz seis casos verossímeis, cobrindo três
quadrantes diferentes (preenchimento de capacidade, aposta estratégica, janela
de oportunidade), o filtro 0+0 e dois atos vinculados. Veja
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
| `pisoAcionado` | `true` quando o ato vinculado foi acionado (fora da matriz discricionária). |
| `pisoJustificativa` | Gatilho do ato vinculado que enquadrou a demanda: `"obrigacaoLegal"`, `"determinacaoControle"`, `"seguranca"`, `"sustentacao"`, `"continuidade"` (ou `null`). |
| `piso_obrigatorio` | Subtipo do ato vinculado (mesma chave de `pisoJustificativa`), ou `null`. |
| `desfecho` | `{ codigo, rotulo, mensagem }` — `normal`, `piso` ou `conveniencia-local`. |
| `identificacao` | `titulo`, `descricao`, `linkPublico`, `natureza {valor,rotulo}`, `trilha`, `camadaProposta {valor,rotulo}`, `dependencias`, `evidencia`. |
| `triagem` | `pisoAcionado` e `gatilhos[]` (`chave`, `rotulo`, `marcado`). |
| `curadoria` | `camadaValidada {valor,rotulo}` e `pisoComplexidade`. |
| `criterios[]` | Por critério: `chave`, `rotulo`, `bloco` (`valor`/`esforco`), `invertido`, `nota`, `descritor`, `observacao`. Sob ato vinculado, `nota`/`descritor` ficam `null` (sem pontuação). |
| `filtros` | `pisoObrigatorio {acionado,passo,gatilhos}` e `convenienciaLocal {acionado,passo}`. |
| `overrides[]` | Overrides do piso: `criterio`, `rotulo`, `nota`, `piso`, `camada`, `justificativa`. |
| `override_complexidade` | Justificativa do override do piso de complexidade (texto), ou `null`. |
| `valor` | `{ total, maximo: 12, texto }` — bloco Valor. `null` sob ato vinculado. |
| `esforco` | `{ total, maximo: 8, texto }` — bloco Esforço de entrega. `null` sob ato vinculado. |
| `quadrante` | `{ codigo, rotulo }` — região da plotagem. `null` sob ato vinculado. |

Esse mesmo JSON pode ser recarregado pela UI ("Carregar exemplo ou memória
salva"), atualizando o fluxo inteiro (`aplicarMemoria`).

## Régua canônica

O texto integral dos cinco critérios (descrição de cada critério + os cinco
descritores de cada nota) vive em **`regua.js`**, um arquivo de **dados**
(sem lógica). Para editar: abra `regua.js`, altere `rotulo`, `descricao`,
`invertido` ou o array `descritores` (índice 0..4 = nota 0..4), salve e
recarregue. Não é preciso tocar em `app.js` — o fluxo apenas consome o objeto.

A `chave` de cada critério é o identificador estável (algumas regras a
referenciam, como `impacto`/`ganho` no filtro 0+0 e `complexidade` no piso);
**não renomeie sem alinhar com `app.js`**. O campo `bloco` (`valor`/`esforco`)
define em qual eixo o critério entra. As calibragens `pisosComplexidade` (piso
por camada) e `cortesPlotagem` (linhas de corte da plotagem) também vivem em
`regua.js`, para ajuste fácil sem tocar em `app.js`.

`REGUA.versao` segue **semver** (começa em `1.0.0`). Suba a versão ao alterar
descritores — ela é gravada na memória de cálculo como `versaoRegua`, para
rastrear sob qual régua cada avaliação foi feita.

## Tooltips contextuais

Vários campos têm um ícone **ⓘ** ao lado que abre um *popover* discreto com
contexto: as opções de **Natureza** (Passo 1), os campos **Dependências** e
**Evidência** (Passo 1), as cinco opções de **ato vinculado** (Passo 2), as
cinco **camadas** (Passo 3) e, no Passo 4, os critérios **Complexidade** e
**Risco de entrega** (para distinguir o esforço de entrega do risco do ato
vinculado). O tooltip abre por *hover*, foco via Tab e *tap* (mobile),
e fecha com ESC ou clique fora; o leitor de tela lê o conteúdo via
`aria-describedby`.

O conteúdo vive em **`tooltips.js`** (estrutura plana `chave: texto`), carregado
dinamicamente por `app.js` na inicialização — mesma estratégia da régua
(`<script>` em vez de `fetch`, pelo mesmo motivo de `file://`). É o arquivo que
faz o papel do `tooltips.json` pedido; o carregamento é **não-fatal** (se
falhar, o fluxo segue sem os ícones). O conteúdo é versionado **manualmente** —
não há sincronização automática com a régua.

### Diretrizes de redação de tooltips

Ao criar novos tooltips (quando a régua evoluir):

- Cada tooltip tem entre uma e três frases.
- pt-BR, sem jargão técnico desnecessário.
- Opção de ato vinculado: incluir 1–2 exemplos concretos para ancorar.
- Camada: incluir o piso de complexidade que ela estabelece.
- Não duplicar o que está no descritor da nota — acrescentar contexto,
  exemplo ou contraste.

## Integração com o ParticiPEN

No Passo 1, **"Carregar do ParticiPEN"** aceita a URL de um tópico
(`{base}/t/{slug}/{id}`). A calculadora chama a API pública do Discourse
(`{base}/t/{id}.json`) e popula o Passo 1 com o que extrair. Um botão
**Re-extrair** reaplica o parsing a partir do JSON em cache de sessão (sem
nova chamada de rede).

> **Nota arquitetural.** Na versão final, embarcada como *theme component*, o
> acesso aos dados do tópico será direto pela API interna do Discourse. Neste
> protótipo standalone, simulamos via `fetch` à API pública.

### Estrutura do Form Template do ParticiPEN

O parser reconhece o formato do **Form Template** do Discourse hoje em produção
no ParticiPEN: o corpo do post vem em **cabeçalhos H3** (`### Pergunta`) com o
texto literal de cada pergunta, e a resposta na(s) linha(s) seguinte(s). A
correspondência do cabeçalho é *case-insensitive* e tolerante a espaços.
Referência completa e exemplo:
[`exemplos/topico-discourse-exemplo.md`](exemplos/topico-discourse-exemplo.md).

| Cabeçalho no corpo | Campo |
|---|---|
| `### Título da demanda` | Título (texto livre) |
| `### O que você está trazendo?` | Natureza (traduzida) |
| `### O que você gostaria que mudasse?` | Trilha (traduzida) |
| `### Descreva a demanda apresentada` | Descrição (texto livre) |
| `### Quem se beneficia da sua demanda?` | Camada proposta (traduzida) |
| `### Evidências` | Evidência (texto livre) |
| `### Anexos` | não importado (ver no tópico original) |

As respostas de múltipla escolha vêm em **linguagem natural** e são traduzidas
para os valores canônicos. Por exemplo: "Um problema a resolver" → `problema`;
"Quero acrescentar uma funcionalidade que ainda não existe no SEI" →
`Evolutiva`; "Praticamente todos os órgãos da Administração Pública Federal" →
`Módulo PEN`. A tabela completa de tradução está em
[`exemplos/topico-discourse-exemplo.md`](exemplos/topico-discourse-exemplo.md)
(e nas constantes `TRAD_*` de `app.js`).

Falha graceful: cabeçalho ausente ou resposta não reconhecida deixam o campo em
branco com aviso discreto; um corpo sem cabeçalhos reconhecíveis exibe "este
tópico não está no formato esperado pelo Form Template"; URL inválida ou *fetch*
com falha mostram um aviso. Em todos os casos o fluxo manual continua (**nunca
bloqueia**), e a procedência (origem, URL, campos ajustados) entra na memória.
Dependências saiu do Form Template — a GPSEI coleta na curadoria.

> **Trilha Corretiva.** A trilha Corretiva existe no modelo de governança,
> mas é tratada via Central de Atendimento, **fora desta calculadora**. Por
> isso o Passo 1 oferece apenas Aperfeiçoamento, Evolutiva e Normativa.

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

1. **Validar a régua, os pisos e as linhas de corte** com o GPSEI em casos
   reais (calibragem dos descritores, do piso por camada e dos cortes de
   valor/esforço da plotagem).
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
| `tooltips.js` | Conteúdo dos tooltips contextuais (`chave: texto`, sem lógica). |
| `styles.css` | Estilo, paleta em variáveis CSS, responsivo, foco/contraste. |
| `exemplos/` | Casos prontos (JSON) + referência do Topic Template. |
| `REVISAO.md` | Revisão crítica para o próximo ciclo. |
| `.claude/` | Servidor estático em PowerShell **apenas para preview local** (não faz parte do produto). |
