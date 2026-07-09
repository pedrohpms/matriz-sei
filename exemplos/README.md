# Exemplos

Casos preenchidos no formato JSON da memória de cálculo. Para carregar um deles, [abra a calculadora](https://pedrohpms.github.io/matriz-sei) e, no Passo 1, use **"Carregar exemplo ou memória salva (JSON)"** e selecione o arquivo. O fluxo inteiro é atualizado e você pode navegar pelos seis passos, modificando qualquer parâmetro conforme necessário.

Cada caso na matriz discricionária produz um par **Valor** (0–12, ordena a fila) × **Esforço de entrega** (0–8, orienta o tratamento e desempata) e cai num **quadrante**. Atos vinculados ficam fora da matriz.

| Arquivo | O que demonstra | Desfecho | Valor × Esforço → Quadrante |
|---|---|---|---|
| [`caso-1-uso-local.json`](caso-1-uso-local.json) | Fluxo típico: melhoria local, barata e segura, sem filtros nem override. | Avaliação completa | V 3/12 · E 2/8 → Preenchimento de capacidade |
| [`caso-2-evolutiva-transversal.json`](caso-2-evolutiva-transversal.json) | Alta prioridade transversal (toda a APF); camada **Core SEI** trava a complexidade em 4. | Avaliação completa | V 12/12 · E 7/8 → Aposta estratégica |
| [`caso-3-preenchimento.json`](caso-3-preenchimento.json) | Baixo valor e baixo esforço → quadrante **Preenchimento de capacidade** (mudança cosmética, local e barata). | Avaliação completa | V 0/12 · E 1/8 → Preenchimento de capacidade |
| [`caso-4-via-url.json`](caso-4-via-url.json) | Memória gerada a partir de um **tópico do ParticiPEN** (`origemDosDados` = tópico Discourse). Camada **Módulo PEN**. | Avaliação completa | V 10/12 · E 3/8 → Janela de oportunidade |
| [`caso-5-piso-obrigatorio.json`](caso-5-piso-obrigatorio.json) | **Ato vinculado** por falha de segurança: fora da matriz, pula a pontuação (`pisoAcionado: true`, `piso_obrigatorio: "seguranca"`). | Ato vinculado | fora da matriz discricionária |
| [`caso-6-piso-determinacao-controle.json`](caso-6-piso-determinacao-controle.json) | **Ato vinculado** por determinação de órgão de controle (vinculante, distinta de recomendação): `piso_obrigatorio: "determinacaoControle"`. | Ato vinculado | fora da matriz discricionária |

Cada arquivo tem um campo `_comentario` no topo explicando por que foi
escolhido e o que estressa. (O `_comentario` é ignorado ao carregar.)

## Referência do Topic Template

[`topico-discourse-exemplo.md`](topico-discourse-exemplo.md) documenta o
esquema canônico que o parser da Iteração 5 espera, com um exemplo preenchido.
Use-o como referência para configurar o *user-form* no Discourse. O
`caso-4-via-url.json` é a memória que resulta de carregar aquele tópico.
