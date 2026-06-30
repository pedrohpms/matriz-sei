/*
 * regua.js - Régua canônica dos cinco critérios da matriz de priorização do SEI.
 *
 * ESTE É UM ARQUIVO DE DADOS. Não contém lógica de fluxo.
 * Pode ser editado livremente (textos, ordem, descrições) sem tocar em app.js.
 *
 * Por que .js e não .json?
 *   O protótipo precisa funcionar abrindo index.html direto no navegador
 *   (file://). Nesse contexto, `fetch('regua.json')` e `import` de módulo são
 *   bloqueados por CORS. Um <script> clássico que expõe um objeto global
 *   funciona tanto em file:// quanto servido por HTTP (Discourse). O conteúdo
 *   abaixo é dados puros - equivale a um JSON com uma linha de invólucro.
 *
 * Contrato com app.js:
 *   - `criterios` é um array; o app monta o estado e a interface a partir dele.
 *   - `chave` é o identificador estável de cada critério (não traduzir/renomear
 *     sem alinhar com app.js - algumas regras futuras referenciam essas chaves).
 *   - `invertido: true` indica escala invertida (nota 4 = melhor cenário).
 *   - `descritores[n]` é o texto canônico da nota n (índice 0..4 = nota 0..4),
 *     SEMPRE indexado pela nota, independentemente da ordem de redação.
 */

window.REGUA = {
  // Versão semver da régua (texto dos critérios). Começa em 1.0.0; suba ao
  // alterar descritores. Exposta na memória de cálculo como `versaoRegua`.
  // 1.1.0: camadas renomeadas (cluster→grupo, marketplace→vitrine) nos
  // descritores e remoção do exemplo MCTI da nota 2 de Impacto institucional.
  // 1.2.0: introdutório do Impacto institucional reformulado (aspectos em
  // lista + observações sobre piso vinculado) e nota 4 ajustada (sem "prestes
  // a virar determinação").
  versao: '1.2.0',
  atualizadoEm: '2026-06-23',

  criterios: [
    {
      chave: 'impacto',
      rotulo: 'Impacto institucional',
      invertido: false,
      // descricao estruturada: o app renderiza `aspectos` como bullets e
      // `observacoes` como avisos destacados (os demais critérios usam string).
      descricao: {
        intro: 'Este critério avalia o aspecto discricionário da demanda - se há '
          + 'conveniência e oportunidade de atendimento.',
        aspectosIntro: 'Avalie a demanda quanto a qualquer um destes aspectos:',
        aspectos: [
          'alinhamento com prioridade de governo (explícita, declarada);',
          'recomendação de órgão de controle (não vinculante);',
          'compromisso firmado (ACTs, MoUs, pactos, convênios);',
          'visibilidade externa do SEI (imprensa, reputação);',
          'diretriz setorial de ministério ou autarquia de cúpula (mesmo vindas '
          + 'de fora da SEGES/MGI).',
        ],
        regra: 'Se mais de um aspecto estiver presente, considere a dimensão mais '
          + 'marcante - não some várias; atribua a nota pela que pesar mais forte. '
          + 'Em seguida, escolha o nível na escala abaixo.',
        observacoes: [
          'Observação 1: aqui não entra exigência legal - Obrigação legal é ato '
          + 'vinculado, tratada na triagem. Se for o caso, volte à etapa de '
          + 'triagem e assinale a opção correspondente.',
          'Observação 2: determinação de órgão de controle '
          + 'também é ato vinculado e não entra aqui. Se a recomendação já se tornou determinação, '
          + 'volte à triagem e assinale.',
        ],
      },
      descritores: [
        // 0
        'Nenhuma das dimensões aparece. Demanda de conveniência local.',
        // 1
        'Uma dimensão aparece de forma marginal: diretriz informal local, tema '
        + 'lateral em reunião com controle sem recomendação formal, ou '
        + 'visibilidade restrita a um grupo pequeno.',
        // 2
        'Uma dimensão aparece com peso médio: normativa setorial que afeta um '
        + 'grupo de órgãos; diretriz formal da SEGES/MGI; recomendação '
        + 'não-vinculante em relatório de auditoria; visibilidade entre usuários '
        + 'do SEI sem repercussão externa.',
        // 3
        'Uma dimensão aparece forte: programa ou compromisso formal de governo '
        + 'transversal; diretriz setorial muito ampla e cobrada; recomendação '
        + 'reiterada de órgão de controle; citação na imprensa ou exposição a '
        + 'usuário externo de forma sensível.',
        // 4
        'Dimensão crítica dentro do discricionário: programa prioritário de '
        + 'governo com prazo e cobrança; recomendação reiterada de controle sob '
        + 'forte pressão (sem ainda configurar determinação); compromisso público '
        + 'com sociedade civil cobrado em conselho; risco reputacional concreto.',
      ],
    },

    {
      chave: 'orgaos',
      rotulo: 'Quantidade de órgãos afetados',
      invertido: false,
      descricao:
        'Quantos entes da esfera federal se beneficiam. Em ambiguidade entre '
        + 'número e segmento, prevalece o segmento.',
      descritores: [
        // 0
        '1 órgão, em uso estritamente local, sem reuso possível.',
        // 1
        '2 a 5 órgãos pontuais.',
        // 2
        'Um grupo temático ou subconjunto de um segmento (6 a 30 órgãos - por '
        + 'exemplo, agências reguladoras de infraestrutura).',
        // 3
        'Um segmento inteiro (toda a Direta, toda a Indireta, todas as Agências, '
        + 'ou todas as Estatais), ou múltiplos grupos (31 a 150 órgãos).',
        // 4
        'Múltiplos segmentos, ou transversal à esfera federal (>150 órgãos).',
      ],
    },

    {
      chave: 'ganho',
      rotulo: 'Ganho operacional',
      invertido: false,
      descricao:
        'Ganho típico para um órgão que adota a solução, desacoplado do '
        + 'solicitante. Quando houver evidência (métricas ou relato '
        + 'estruturado), ela ancora a nota; sem evidência, é estimativa.',
      descritores: [
        // 0
        'Nenhum ganho prático. Mudança cosmética.',
        // 1
        'Ganho pequeno em tarefa pouco frequente.',
        // 2
        'Ganho perceptível em tarefa regular: reduz tempo ou erro de forma '
        + 'mensurável em uso semanal a diário, mantendo a forma de trabalhar.',
        // 3
        'Ganho alto em tarefa frequente: elimina gargalo, contorno manual ou '
        + 'retrabalho recorrente em atividade diária.',
        // 4
        'Ganho estrutural: remove uma etapa inteira, um contorno manual '
        + 'obrigatório, ou uma fonte sistemática de erro.',
      ],
    },

    {
      chave: 'complexidade',
      rotulo: 'Complexidade',
      invertido: true, // 4 = baixa, 0 = altíssima
      descricao:
        'A camada validada na curadoria estabelece o teto da nota; outros '
        + 'fatores (áreas envolvidas, dependências, integrações externas, revisão '
        + 'jurídica ou normativa) puxam a nota para baixo.',
      descritores: [
        // 0
        'Altíssima. Core SEI ou mudança estrutural; revisão jurídica/normativa '
        + 'formal; prazo e escopo incertos.',
        // 1
        'Alta. Módulo PEN ou mudança coordenada em várias frentes; dependências '
        + 'relevantes; entrega em vários meses.',
        // 2
        'Média. Vitrine exigente ou extensão do PEN; duas a três áreas; '
        + 'dependências geríveis; possível revisão jurídica leve; entrega em meses.',
        // 3
        'Baixa. Grupo ou vitrine simples; uma a duas áreas; entrega em '
        + 'semanas.',
        // 4
        'Trivial. Camada de uso local; uma área envolvida; sem dependências; '
        + 'entrega em dias.',
      ],
    },

    {
      chave: 'risco',
      rotulo: 'Risco',
      invertido: true, // 4 = baixo, 0 = crítico
      descricao:
        'Chance de a entrega quebrar algo que já funciona, gerar dívida técnica '
        + 'ou criar incompatibilidade.',
      descritores: [
        // 0
        'Crítico. Pode quebrar funcionalidade ampla; criar incompatibilidade; '
        + 'gerar dívida difícil de desfazer.',
        // 1
        'Alto. Mexe em algo crítico ou amplamente usado; reversão custosa.',
        // 2
        'Médio. Regressão plausível em pontos identificáveis; mitigável com teste.',
        // 3
        'Baixo. Efeito colateral improvável; reversão simples.',
        // 4
        'Desprezível. Mudança isolada e reversível.',
      ],
    },
  ],
};
