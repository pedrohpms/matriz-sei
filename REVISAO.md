# Revisão crítica — onde olhar primeiro

Trilha para o próximo ciclo (ou para você mesmo daqui a um tempo). Nada aqui
está quebrado a ponto de impedir a entrega; são pontos de atenção, dívidas
conscientes e decisões que merecem um segundo olhar.

## 1. Pontos frágeis, edge cases e dependências implícitas

1. **"Carregar do ParticiPEN" não funciona contra o ParticiPEN real no modo
   standalone.** A chamada `fetch` é bloqueada por CORS (confirmado: a API
   pública não envia `Access-Control-Allow-Origin` para o origin da
   calculadora). O *fallback* manual cobre isso e a UX está correta, mas o
   recurso só fica realmente útil quando a calculadora for embarcada (API
   interna) ou servida na mesma origem. **Não é bug — é a natureza da fase de
   protótipo —, mas é a primeira coisa que confunde quem testa.**

2. **Descrição = "primeiro parágrafo" captura saudações.** Em tópicos
   orgânicos (não no Topic Template canônico), o primeiro `<p>` costuma ser
   "Prezados," e é isso que entra no campo Descrição. Verificado com um tópico
   real do ParticiPEN. Para o template canônico, que começa pela descrição,
   funciona. Uma heurística de "pular linha muito curta / saudação" resolveria,
   mas foi deixada de fora para não desviar da regra canônica especificada.

3. **Clipboard em `file://`.** `navigator.clipboard.writeText` pode ser negado
   fora de contexto seguro (há `execCommand('copy')` como *fallback*). Em
   automação sem foco de documento, o `writeText` também falha
   (`NotAllowedError`). Em uso real (aba focada, https/localhost) funciona.

4. **`origemDosDados` ao recarregar uma memória é parcialmente reconstruída.**
   `aplicarMemoria` remapeia `camposAjustadosManualmente` (rótulos → chaves) e
   refaz o `snapshot` com os valores carregados. Consequência: ao **editar**
   um campo depois de carregar, `recomputarAjustes()` recomeça a contagem a
   partir do estado carregado — os ajustes "históricos" do arquivo são
   substituídos pelos novos. Aceitável para o uso atual, mas a semântica de
   "ajuste manual" pós-carga de arquivo é ligeiramente diferente da pós-carga
   de tópico.

5. **Descritores e score dos exemplos são *snapshots*.** Os arquivos em
   `exemplos/*.json` carregam o texto do `descritor` e o `score` congelados.
   Se a régua mudar (novo `versaoRegua`), o formulário mostrará o descritor
   **atual** para aquela nota (vem de `regua.js`), mas o campo `descritor` do
   arquivo continuará o antigo. É o comportamento esperado de uma memória
   (instantâneo), só convém ter em mente ao revisar exemplos.

6. **Stepper no salto do piso.** Quando o piso obrigatório salta da triagem
   direto para a memória, o stepper marca os passos 3–5 como "concluídos"
   mesmo sem terem sido visitados. É impreciso visualmente (a navegação em si
   está correta). Edge cosmético.

7. **Dependência de `:has()` no CSS.** O destaque de descritor selecionado/
   focado e de checkbox marcado usa `:has()`. Suportado em todos os
   navegadores atuais, mas em navegadores antigos esses realces somem (o foco
   nativo do `<input>` permanece). Dependência implícita a registrar.

8. **`piso` (ato vinculado) ignora notas e fixa o score em 20.** Sob piso
   obrigatório a demanda recebe score fixo de **20** (prioridade absoluta) e os
   cinco critérios não são pontuados. Se o avaliador tiver pontuado antes de
   marcar o gatilho, essas notas não são preservadas. `pisoJustificativa`
   registra só o **primeiro** gatilho marcado (entre os cinco:
   `obrigacaoLegal`, `determinacaoControle`, `seguranca`, `sustentacao`,
   `continuidade`); se mais de um for marcado, os demais ficam apenas em
   `triagem.gatilhos[]`/`filtros.pisoObrigatorio.gatilhos`.

9. **`descricao` do critério tem dois formatos.** O Impacto institucional usa
   `descricao` como **objeto** estruturado (`intro`, `aspectosIntro`,
   `aspectos[]`, `regra`, `observacoes[]`), renderizado por
   `renderDescricaoEstruturada`; os outros quatro critérios usam `descricao`
   como **string**. `renderCriterios` aceita ambos. É uma assimetria
   consciente (Patch 2) — se mais critérios precisarem de estrutura, vale
   padronizar todos para objeto. O `descricao` não entra na memória de cálculo
   (só os `descritores[nota]` entram), então a mudança não afetou o JSON.

10. **Tooltips (Patch 3): posicionamento fixo e versionamento manual.** O
    popover (`.tip-popover`) abre sempre abaixo-à-esquerda (`top: 100%; left: 0`)
    e tem `max-width: 280px`. Hoje todos os ícones ⓘ ficam à esquerda nas linhas,
    então não há *overflow* à direita; se algum ⓘ for parar perto da borda
    direita no futuro, o popover pode vazar (não há reposicionamento dinâmico —
    seria um próximo passo). O conteúdo vive em `tooltips.js` (faz o papel do
    `tooltips.json` pedido — `.js`+`<script>` pelo mesmo motivo de `file://` da
    régua) e é **versionado manualmente**: ao mudar a régua (camadas, tetos,
    piso), lembrar de revisar `tooltips.js`, pois não há sincronização em runtime
    (fora de escopo do MVP). A carga é não-fatal: se `tooltips.js` falhar, os
    ícones simplesmente não aparecem e o fluxo segue.

## 2. Trechos que cabem refactor (não feito agora — só apontando)

1. **Índices de passo "mágicos".** `avancar()`, `voltar()` e `mostrarPasso()`
   usam números crus (`atual === 1`, `mostrarPasso(5)`, `=== 3`...). Vale um
   mapa nomeado de passos (ex.: `PASSO.TRIAGEM = 1`) para legibilidade e para
   reduzir risco ao inserir/reordenar passos.

2. **Override modelado como genérico, mas só vale para Complexidade.**
   `estado.override`, `atualizarTetoComplexidade()` e a montagem de
   `overrides[]` assumem o critério `complexidade`. Se outro critério ganhar
   teto no futuro, será preciso generalizar (hoje o array de overrides sugere
   uma generalidade que o código não tem).

3. **`app.js` está grande (~1k linhas) e multifunção.** Faz fluxo, regras,
   parser de Discourse, geração de memória, import e acessibilidade. Sem build,
   dá para quebrar em vários `<script>` por responsabilidade (ex.:
   `discourse.js`, `memoria.js`) carregados como os clássicos — mantendo o
   `file://`.

4. **`sincronizarFormularioComEstado` e `popularIdentificacao` se sobrepõem.**
   Ambos empurram estado→DOM; poderiam convergir numa função única de "render
   do formulário a partir do estado".

5. **Strings de mensagem repetidas.** As mensagens de desfecho aparecem em
   `mensagemDesfecho()`, no banner (`atualizarDesfechoMemoria`) e nos avisos de
   passo. Já há centralização parcial (`mensagemDesfecho`), mas o banner ainda
   repete texto — poderia consumir o helper.

## 3. Decisões a revisitar no próximo ciclo

1. **`CONFIG.discourseBaseUrl` é hoje quase decorativo.** Só alimenta o
   *placeholder* do campo de URL; a base real é derivada da URL colada. Quando
   embarcar, decidir se a base passa a ser fixa (config) ou continua derivada.

2. **Filtro 0+0 reporta o score cheio** (ex.: 8/20), não 0. Foi uma decisão
   consciente (mostrar o "score parcial até onde o fluxo parou") e o usuário
   pediu para manter. Revisitar se a leitura desejada for "demanda barrada =
   score 0".

3. **`regua.js` faz o papel de `regua.json`.** A escolha por `.js`+`<script>`
   (em vez de `.json`+`fetch`) é por causa do `file://`. Se o produto final
   **sempre** rodar servido por HTTP (embarcado), dá para voltar a `.json`.

4. **Sem persistência.** A memória é gerada e baixada, mas nada é armazenado.
   Definir cedo onde as avaliações vão morar (backend, planilha, tópico).

5. **Carregar exemplo = `<input type="file">`.** Cobre o critério ("aceita
   seleção do JSON") e funciona em `file://`. Um *dropdown* dos exemplos
   embutidos seria mais conveniente, mas exigiria embutir os JSON em JS
   (duplicando os arquivos de `exemplos/`). Revisitar quando houver build/HTTP.

## 4. Divergências entre o pedido e o entregue (e por quê)

1. **`regua.json` → `regua.js`.** O enunciado falava em `regua.json`/`fetch`;
   entregue como `regua.js` exposto via `<script>`. Motivo: `fetch` e `import`
   de módulo são bloqueados por CORS em `file://`, e abrir o arquivo direto é
   requisito do projeto. O conteúdo é dados puros (JSON com uma linha de
   invólucro) e o `versaoRegua` é lido dele.

2. **`config.js` → `CONFIG` no topo do `app.js`.** O enunciado permitia ambos;
   optou-se por `app.js` para não introduzir outro arquivo com a mesma dança de
   carregamento via `<script>`.

3. **"Botão carregar exemplo que aceita seleção do JSON" → `input type=file`.**
   Mesma razão de `file://`: não dá para `fetch` dos exemplos embutidos ao
   abrir o arquivo direto. O `input file` lê qualquer memória exportada e os
   arquivos de `exemplos/`.

4. **Base do Discourse derivada da URL colada**, além do `CONFIG`. O enunciado
   sugeria `{base}/t/{id}.json` com `base` configurada; preferiu-se derivar da
   própria URL para o protótipo funcionar contra qualquer host de teste sem
   reconfigurar.

Nenhuma dessas divergências muda o comportamento pedido — todas preservam os
critérios de pronto. São adaptações ao ambiente `file://` e ao fluxo de teste.
