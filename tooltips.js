/*
 * tooltips.js — Conteúdo canônico dos tooltips contextuais (pt-BR).
 *
 * Arquivo de DADOS (sem lógica), estrutura plana `chave: texto`. Pode ser
 * editado sem tocar em app.js.
 *
 * Por que .js e não .json? Mesmo motivo de regua.js: o protótipo precisa
 * funcionar abrindo index.html direto no navegador (file://), onde fetch de
 * JSON e import de módulo são bloqueados por CORS. Um <script> clássico que
 * expõe um objeto global funciona tanto em file:// quanto servido por HTTP.
 * O conteúdo abaixo é dados puros — equivale a um JSON com uma linha de
 * invólucro. É carregado dinamicamente por app.js, como a régua.
 *
 * Diretrizes de redação (ver README): 1–3 frases; pt-BR sem jargão; opções
 * do ato vinculado trazem 1–2 exemplos; camadas indicam o piso de complexidade
 * que estabelecem; o texto acrescenta contexto, não duplica o descritor da nota.
 */

window.TOOLTIPS = {
  natureza_problema:
    'Demanda que entra como dor sem solução fechada. A solução nasce no fluxo '
    + '(curadoria, deliberação, eventualmente GT). Evidência é recomendada '
    + 'quando houver dado disponível, mas não é obrigatória.',
  natureza_pratica:
    'Demanda que entra como solução já rodando em algum órgão. O pedido é '
    + 'difundir a prática para uma camada superior (por exemplo, de uso local para '
    + 'grupo, ou de grupo para vitrine). Evidência é obrigatória — métricas ou '
    + 'relato estruturado da área que opera a prática.',
  dependencias:
    'Liste o que pode atrasar, bloquear ou ser destravado por esta demanda. '
    + 'Pode ser técnico (outra solução, integração com sistema externo, '
    + 'infraestrutura) ou normativo (norma a publicar, decisão jurídica, '
    + 'parecer aguardando). Se não houver, deixe em branco.',
  evidencia:
    'O que comprova que a demanda merece atenção. Pode ser quantitativo (tempo '
    + 'gasto na tarefa hoje, taxa de erro, número de execuções, volume de '
    + 'processos, quantidade de órgãos com o mesmo problema) ou qualitativo '
    + '(relato estruturado de quem opera a prática que se quer difundir, ou de '
    + 'quem vive o problema).',

  piso_obrigacao_legal:
    'A demanda decorre de exigência prevista em lei, decreto ou regulamento de '
    + 'hierarquia equivalente — o cumprimento não comporta juízo de '
    + 'conveniência. Exemplos: implementar o que a LGPD exige, atender '
    + 'exigência do Marco Civil, cumprir disposição direta do Decreto 8.539/15.',
  piso_determinacao_controle:
    'TCU, CGU ou Ministério Público determinaram (não apenas recomendaram) que '
    + 'a ação seja tomada. Determinação tem peso vinculante; recomendação não — '
    + 'recomendação fica no critério Impacto institucional, não aqui.',
  piso_falha_seguranca:
    'Vulnerabilidade que expõe dados, autenticação ou integridade do SEI a '
    + 'risco direto. Exemplos: vulnerabilidade reportada por CVE, falha em '
    + 'controle de acesso, brecha em assinatura eletrônica, exposição de dados '
    + 'pessoais.',
  piso_sustentacao_tecnologica:
    'Manter o produto tecnologicamente viável — atualizar versões de runtime, '
    + 'bibliotecas ou dependências que entraram em fim de vida ou perderam '
    + 'suporte do mantenedor. Exemplos: migrar versão de banco em EOL, trocar '
    + 'biblioteca de criptografia obsoleta, atualizar runtime que parou de '
    + 'receber patches de segurança.',
  piso_continuidade_operacional:
    'Manter o serviço em funcionamento para quem usa. Não é manutenção técnica '
    + 'preventiva (essa é Sustentação) — é resposta a ameaça concreta à '
    + 'disponibilidade ou capacidade do SEI em produção. Exemplos: conter queda '
    + 'recorrente de servidor, restaurar backup quebrado, ampliar capacidade '
    + 'saturada, corrigir falha que causa indisponibilidade intermitente.',

  camada_uso_local:
    'Solução vive dentro de um único órgão, sem precisar ser compartilhada. '
    + 'Configuração, template ou automação isolada. Mantida pelo próprio órgão, '
    + 'sem envolvimento do PEN. Estabelece piso 1 (complexidade mínima) para o '
    + 'critério Complexidade.',
  camada_grupo:
    'Solução compartilhada entre alguns órgãos do mesmo segmento ou interesse '
    + 'comum, sem virar produto formal do PEN. Mantida pelo desenvolvedor '
    + 'original; o PEN monitora crescimento e media conflitos eventuais. '
    + 'Estabelece piso 2 para Complexidade.',
  camada_vitrine:
    'Solução já difundida, com versionamento e documentação, instalável por '
    + 'quem quiser. Mantida pelo desenvolvedor, com PEN supervisionando suporte '
    + 'e oferecendo apoio ocasional em escala. Não modifica o SEI nem o PEN. '
    + 'Estabelece piso 2 para Complexidade.',
  camada_modulo_pen:
    'Solução vira módulo oficial do ProcessoEletrônicoNacional, integrado ao '
    + 'SEI por interfaces oficiais. Mantida pelo PEN, ou homologada e mantida '
    + 'externamente pelo desenvolvedor original com SLA acordado. Estabelece '
    + 'piso 3 para Complexidade.',
  camada_core_sei:
    'Solução modifica o código-fonte do próprio SEI. Exige revisão da DTGES, '
    + 'atenção ao Art. 24 do Decreto 8.539/15 (exclusividade do código-fonte) e '
    + 'testes amplos de regressão. Trava a Complexidade em 4 (altíssima), sem '
    + 'possibilidade de override.',

  criterio_complexidade:
    'Esforço de entrega da solução (0 = trivial, 4 = altíssima). A camada '
    + 'validada estabelece o piso: por ser daquela camada, espera-se uma '
    + 'complexidade mínima. Notas abaixo desse piso exigem justificativa '
    + '(override) — é implausível, por exemplo, virar Módulo PEN com '
    + 'complexidade baixa.',
  criterio_risco_de_entrega:
    'Risco de execução da própria demanda (0 = desprezível, 4 = crítico): '
    + 'probabilidade de o desenvolvimento derrapar, de dependências externas '
    + 'travarem, de incerteza técnica ou de quebrar algo que já funciona. É '
    + 'diferente do risco do ato vinculado (falha de segurança, '
    + 'indisponibilidade), que fica na triagem (Passo 2).',
};
