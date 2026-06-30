# Exemplos

Casos preenchidos no formato JSON da memória de cálculo (Iteração 4). Para carregar um deles, [abra a calculadora](https://pedrohpms.github.io/matriz-sei) e, e no Passo 1 use **"Carregar exemplo ou memória salva (JSON)"** e selecione o arquivo. O fluxo inteiro é atualizado e você pode navegar pelos seis passos, modificando qualquer parâmetro conforme necessário.

| Arquivo | O que demonstra | Desfecho | Score |
|---|---|---|---|
| [`caso-1-uso-local.json`](caso-1-uso-local.json) | Fluxo típico: melhoria local, barata e segura, sem filtros nem override. | Avaliação completa | 10/20 |
| [`caso-2-evolutiva-transversal.json`](caso-2-evolutiva-transversal.json) | Alta prioridade transversal (toda a APF); camada **Core SEI** fixa a complexidade em 0. | Avaliação completa | 13/20 |
| [`caso-3-filtro-0-0.json`](caso-3-filtro-0-0.json) | Filtro automático **0+0** (impacto 0 e ganho 0) encerra como conveniência local. | Conveniência local | 8/20 |
| [`caso-4-via-url.json`](caso-4-via-url.json) | Memória gerada a partir de um **tópico do ParticiPEN** (`origemDosDados` = tópico Discourse). Camada **Grupo**. | Avaliação completa | 13/20 |
| [`caso-5-piso-obrigatorio.json`](caso-5-piso-obrigatorio.json) | **Ato vinculado** por falha de segurança: score fixo de 20, pula a pontuação (`pisoAcionado: true`, `pisoJustificativa: "seguranca"`). | Ato vinculado | 20/20 |
| [`caso-6-piso-determinacao-controle.json`](caso-6-piso-determinacao-controle.json) | **Ato vinculado** por determinação de órgão de controle (vinculante, distinta de recomendação): `pisoJustificativa: "determinacaoControle"`. | Ato vinculado | 20/20 |

Cada arquivo tem um campo `_comentario` no topo explicando por que foi
escolhido e o que estressa. (O `_comentario` é ignorado ao carregar.)

## Referência do Topic Template

[`topico-discourse-exemplo.md`](topico-discourse-exemplo.md) documenta o
esquema canônico que o parser da Iteração 5 espera, com um exemplo preenchido.
Use-o como referência para configurar o *user-form* no Discourse. O
`caso-4-via-url.json` é a memória que resulta de carregar aquele tópico.
