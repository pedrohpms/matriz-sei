/*
 * Calculadora da matriz de priorização do SEI
 * Fluxo de seis passos, vanilla JS, sem dependências, sem rede.
 *
 * Regras de validação (teto de complexidade, piso obrigatório, filtro 0+0)
 * estruturam o fluxo. Mensagens de fim-de-fluxo são informativas, não
 * bloqueantes; a única trava é o override de teto sem justificativa.
 *
 * Iteração 4 — memória de cálculo em dois formatos a partir de UM mesmo
 * objeto interno (montarMemoria): Markdown estruturado (copiar) e JSON
 * (baixar). Paridade garantida por construção — ambos derivam do objeto.
 *
 * A régua dos critérios vive em regua.js (dados); o fluxo só a consome.
 * A versão da régua (regua.js → REGUA.versao) entra no JSON como versaoRegua.
 */

'use strict';

/* ------------------------------------------------------------------ *
 * Configuração (ajustar no deploy)
 *
 * `discourseBaseUrl` é a base do ParticiPEN (Discourse). Placeholder —
 * troque pelo host real ao publicar. No protótipo standalone a base de
 * fato é derivada da URL colada pelo avaliador; este valor serve de
 * sugestão (placeholder do campo) e de base padrão.
 *
 * CORS: como a calculadora roda de um host diferente do Discourse na fase
 * de protótipo, a chamada à API pública (`{base}/t/{id}.json`) só funciona
 * se o Discourse permitir o origin da calculadora (ou se ambos rodarem na
 * mesma origem / numa instância dev). Ver README. Quando embarcada como
 * theme component, o acesso será pela API interna, sem CORS.
 * ------------------------------------------------------------------ */

const CONFIG = {
  discourseBaseUrl: 'https://participen.processoeletronico.gov.br',
};

/* ------------------------------------------------------------------ *
 * Dados de domínio (fonte única da verdade)
 * ------------------------------------------------------------------ */

// Opções de listas controladas. Reaproveitadas em mais de um passo.
// `tooltip` aponta para a chave em tooltips.js (conteúdo contextual).
const NATUREZAS = [
  { valor: 'problema', rotulo: 'Problema a resolver', tooltip: 'natureza_problema' },
  { valor: 'pratica', rotulo: 'Prática em curso a difundir', tooltip: 'natureza_pratica' },
];

// Corretiva é tratada via Central de Atendimento, fora desta calculadora.
const TRILHAS = ['Melhoria', 'Evolutiva', 'Normativa'];

// Camadas em ordem crescente de complexidade/abrangência.
const CAMADAS = [
  { valor: 'uso-local', rotulo: 'Uso local', tooltip: 'camada_uso_local' },
  { valor: 'grupo', rotulo: 'Grupo', tooltip: 'camada_grupo' },
  { valor: 'vitrine', rotulo: 'Vitrine', tooltip: 'camada_vitrine' },
  { valor: 'modulo-pen', rotulo: 'Módulo PEN', tooltip: 'camada_modulo_pen' },
  { valor: 'core-sei', rotulo: 'Core SEI', tooltip: 'camada_core_sei' },
];

// Teto da nota de Complexidade (escala invertida) por camada validada.
// O teto é a nota MÁXIMA permitida sem justificativa. Core SEI fixa em 0
// (sem override). Notas acima do teto, nas demais camadas, exigem override.
const TETOS_CAMADA = {
  'uso-local': 4,
  'grupo': 3,
  'vitrine': 3, // nota 2 cabível em vitrine exigente
  'modulo-pen': 1,
  'core-sei': 0, // nota fixa, sem override
};

// Gatilhos do piso obrigatório (Passo 2 — Triagem).
const GATILHOS_PISO = [
  { chave: 'obrigacaoLegal', rotulo: 'Obrigação legal', tooltip: 'piso_obrigacao_legal' },
  { chave: 'determinacaoControle', rotulo: 'Determinação de órgão de controle', tooltip: 'piso_determinacao_controle' },
  { chave: 'seguranca', rotulo: 'Falha de segurança', tooltip: 'piso_falha_seguranca' },
  { chave: 'sustentacao', rotulo: 'Sustentação tecnológica', tooltip: 'piso_sustentacao_tecnologica' },
  { chave: 'continuidade', rotulo: 'Continuidade do serviço', tooltip: 'piso_continuidade_operacional' },
];

// Os cinco critérios da matriz vêm da régua canônica (regua.js), carregada
// dinamicamente em init(). O fluxo só consome este array — não conhece os
// textos dos descritores. Preenchido por carregarRegua().
let CRITERIOS = [];

// Conteúdo dos tooltips (tooltips.js), no formato { chave: texto }.
// Preenchido por carregarTooltips(); vazio se a carga falhar (enhancement).
let TOOLTIPS = {};

const TOTAL_PASSOS = 6;

// Rótulos dos passos (para o indicador visual / stepper).
const PASSOS = ['Identificação', 'Triagem', 'Curadoria', 'Pontuação', 'Filtros', 'Memória'];

/* ------------------------------------------------------------------ *
 * Estado da aplicação
 * ------------------------------------------------------------------ */

const estado = {
  passoAtual: 0, // índice 0..5
  identificacao: {
    avaliador: '',
    titulo: '',
    descricao: '',
    link: '',
    natureza: '',
    trilha: '',
    camada: '',
    dependencias: '',
    evidencia: '',
  },
  // Procedência dos dados do Passo 1 (carga de tópico vs. manual).
  origem: {
    viaTopico: false,    // dados vieram de um tópico do ParticiPEN
    url: '',             // URL do tópico de origem
    jsonBruto: null,     // cache do JSON da API (sessão; não persistido)
    snapshot: {},        // valores logo após a carga, p/ detectar ajustes
    camposAjustados: [], // chaves de campos editados manualmente pós-carga
  },
  triagem: {
    obrigacaoLegal: false,
    determinacaoControle: false,
    seguranca: false,
    sustentacao: false,
    continuidade: false,
  },
  curadoria: {
    camadaValidada: '',
  },
  // pontuacao[chave] = nota 0..4 ou null se não pontuado.
  // As chaves são preenchidas dinamicamente a partir da régua (regua.js).
  pontuacao: {},
  // observacoes[chave] = evidência/observação livre do critério.
  observacoes: {},
  // Override do teto de Complexidade (Passo 4).
  override: {
    ativo: false,       // nota de complexidade acima do teto da camada
    nota: null,         // nota atribuída
    teto: null,         // teto da camada na hora do override
    justificativa: '',  // texto obrigatório enquanto ativo
  },
};

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const $ = (sel, raiz = document) => raiz.querySelector(sel);
const $$ = (sel, raiz = document) => Array.from(raiz.querySelectorAll(sel));

function rotuloPorValor(lista, valor) {
  const item = lista.find((o) => o.valor === valor);
  return item ? item.rotulo : '(não informado)';
}

// Remove acentos/marcas combinantes — base para comparações tolerantes.
function semAcento(s) {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');
}

function piosAcionados() {
  return GATILHOS_PISO.filter((g) => estado.triagem[g.chave]);
}

function pisoAcionado() {
  return piosAcionados().length > 0;
}

// Teto de Complexidade pela camada validada. null se não há camada definida.
function tetoComplexidade() {
  const c = estado.curadoria.camadaValidada;
  return Object.prototype.hasOwnProperty.call(TETOS_CAMADA, c) ? TETOS_CAMADA[c] : null;
}

function camadaCore() {
  return estado.curadoria.camadaValidada === 'core-sei';
}

// Condição do filtro 0+0 (só conta notas efetivamente 0, não null).
function condicaoConvenienciaLocal() {
  return estado.pontuacao.impacto === 0 && estado.pontuacao.ganho === 0;
}

// Desfecho do fluxo. Piso tem precedência sobre o filtro 0+0.
function desfechoAtual() {
  if (pisoAcionado()) return 'piso';
  if (condicaoConvenienciaLocal()) return 'conveniencia-local';
  return 'normal';
}

// Soma simples das cinco notas. Notas não pontuadas contam como 0.
function calcularScore() {
  return CRITERIOS.reduce((soma, c) => {
    const nota = estado.pontuacao[c.chave];
    return soma + (typeof nota === 'number' ? nota : 0);
  }, 0);
}

function todosCriteriosPontuados() {
  return CRITERIOS.every((c) => typeof estado.pontuacao[c.chave] === 'number');
}

/* ------------------------------------------------------------------ *
 * Tooltips contextuais (ícone ⓘ + popover discreto)
 *
 * Gatilhos: hover, foco (Tab) e clique/tap. Fecham com ESC ou clique fora.
 * O conteúdo vem de tooltips.js (TOOLTIPS[chave]); aria-describedby liga o
 * ícone ao texto, lido por leitores de tela quando o ícone recebe foco.
 * ------------------------------------------------------------------ */

let tooltipAberto = null; // só um popover aberto por vez

function mostrarTooltip(wrap) {
  if (tooltipAberto && tooltipAberto !== wrap) esconderTooltip(tooltipAberto, true);
  wrap.querySelector('.tip-popover').hidden = false;
  tooltipAberto = wrap;
}

function esconderTooltip(wrap, forcar) {
  if (!forcar && wrap.dataset.fixado) return; // mantém aberto se foi "fixado" por clique
  if (forcar) delete wrap.dataset.fixado;
  wrap.querySelector('.tip-popover').hidden = true;
  if (tooltipAberto === wrap) tooltipAberto = null;
}

// Cria o ícone ⓘ + popover para uma chave de tooltips.js. Retorna null se
// não houver texto (assim, sem tooltips.js, nenhum ícone vazio é renderizado).
function criarTooltipEl(chave) {
  const texto = TOOLTIPS && TOOLTIPS[chave];
  if (!texto) return null;

  const wrap = document.createElement('span');
  wrap.className = 'tip-wrap';
  const id = `tip-${chave}`;

  const icone = document.createElement('button');
  icone.type = 'button';
  icone.className = 'tip-icon';
  icone.tabIndex = 0;
  icone.setAttribute('aria-describedby', id);
  icone.setAttribute('aria-label', 'Mais informações');
  icone.textContent = 'ⓘ';

  const pop = document.createElement('div');
  pop.className = 'tip-popover';
  pop.id = id;
  pop.setAttribute('role', 'tooltip');
  pop.textContent = texto;
  pop.hidden = true;

  wrap.appendChild(icone);
  wrap.appendChild(pop);

  icone.addEventListener('mouseenter', () => mostrarTooltip(wrap));
  icone.addEventListener('mouseleave', () => esconderTooltip(wrap, false));
  icone.addEventListener('focus', () => mostrarTooltip(wrap));
  icone.addEventListener('blur', () => esconderTooltip(wrap, false));
  icone.addEventListener('click', (e) => {
    // Tap (mobile) e clique alternam um estado "fixado" que ignora mouseleave/blur.
    e.preventDefault();
    e.stopPropagation();
    if (wrap.dataset.fixado) {
      esconderTooltip(wrap, true);
    } else {
      wrap.dataset.fixado = '1';
      mostrarTooltip(wrap);
    }
  });

  return wrap;
}

// Liga ESC e clique-fora para fechar o popover aberto. Chamado uma vez.
function ligarFechamentoGlobalTooltip() {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && tooltipAberto) esconderTooltip(tooltipAberto, true);
  });
  document.addEventListener('click', (e) => {
    if (tooltipAberto && !e.target.closest('.tip-wrap')) esconderTooltip(tooltipAberto, true);
  });
}

// Anexa o ícone de tooltip ao <label for="..."> de um campo.
function tooltipNoLabel(seletorCampo, chave) {
  const campo = $(seletorCampo);
  if (!campo) return;
  const label = document.querySelector(`label[for="${campo.id}"]`);
  const el = criarTooltipEl(chave);
  if (label && el) label.appendChild(el);
}

// Preenche uma lista <ul> com um item por opção (rótulo + ícone de tooltip).
// Usado para campos <select> (natureza, camada), onde cada opção tem tooltip.
function preencherTooltipsOpcoes(seletorLista, lista) {
  const ul = $(seletorLista);
  if (!ul) return;
  ul.innerHTML = '';
  lista.forEach((item) => {
    if (!item.tooltip) return;
    const el = criarTooltipEl(item.tooltip);
    if (!el) return;
    const li = document.createElement('li');
    const nome = document.createElement('span');
    nome.textContent = item.rotulo;
    li.appendChild(nome);
    li.appendChild(el);
    ul.appendChild(li);
  });
}

// Aplica os tooltips dos campos estáticos e das listas de opções (Passos 1 e 3).
// Os gatilhos do Passo 2 recebem tooltip direto em renderTriagem().
function aplicarTooltips() {
  tooltipNoLabel('#id-dependencias', 'dependencias');
  tooltipNoLabel('#id-evidencia', 'evidencia');
  preencherTooltipsOpcoes('#natureza-tips', NATUREZAS);
  preencherTooltipsOpcoes('#camada-tips', CAMADAS);
}

/* ------------------------------------------------------------------ *
 * Construção dinâmica de campos
 * ------------------------------------------------------------------ */

function popularSelect(select, lista, opcoesComoObjeto = true) {
  select.innerHTML = '<option value="">— selecione —</option>';
  lista.forEach((item) => {
    const valor = opcoesComoObjeto ? item.valor : item;
    const rotulo = opcoesComoObjeto ? item.rotulo : item;
    const opt = document.createElement('option');
    opt.value = valor;
    opt.textContent = rotulo;
    select.appendChild(opt);
  });
}

// Renderiza os blocos de gatilhos do piso (Passo 2).
function renderTriagem() {
  const container = $('#triagem-gatilhos');
  container.innerHTML = '';
  GATILHOS_PISO.forEach((g) => {
    const id = `gatilho-${g.chave}`;
    const wrap = document.createElement('label');
    wrap.className = 'checkbox-linha';
    wrap.innerHTML = `
      <input type="checkbox" id="${id}" data-gatilho="${g.chave}" />
      <span>${g.rotulo}</span>`;
    // O ícone ⓘ é conteúdo interativo dentro do label: clicar nele não
    // alterna o checkbox (o handler ainda faz stopPropagation por garantia).
    const tip = g.tooltip && criarTooltipEl(g.tooltip);
    if (tip) wrap.appendChild(tip);
    container.appendChild(wrap);
  });
}

// Renderiza uma descrição estruturada (intro + aspectos em lista + regra +
// observações destacadas). Usada pelo critério Impacto institucional.
function renderDescricaoEstruturada(bloco, d) {
  const paragrafo = (texto) => {
    const p = document.createElement('p');
    p.className = 'criterio-descricao';
    p.textContent = texto;
    bloco.appendChild(p);
  };

  if (d.intro) paragrafo(d.intro);
  if (d.aspectosIntro) paragrafo(d.aspectosIntro);
  if (Array.isArray(d.aspectos) && d.aspectos.length) {
    const ul = document.createElement('ul');
    ul.className = 'criterio-aspectos';
    d.aspectos.forEach((a) => {
      const li = document.createElement('li');
      li.textContent = a;
      ul.appendChild(li);
    });
    bloco.appendChild(ul);
  }
  if (d.regra) paragrafo(d.regra);
  (d.observacoes || []).forEach((obs) => {
    const p = document.createElement('p');
    p.className = 'criterio-observacao';
    p.textContent = obs;
    bloco.appendChild(p);
  });
}

// Renderiza os cinco critérios com cinco descritores cada (Passo 4).
function renderCriterios() {
  const container = $('#criterios');
  container.innerHTML = '';

  CRITERIOS.forEach((c) => {
    const bloco = document.createElement('fieldset');
    bloco.className = 'criterio';
    bloco.dataset.criterio = c.chave;

    const escalaNota = c.invertido
      ? '<span class="tag">escala invertida — 4 = melhor</span>'
      : '';

    const legenda = document.createElement('legend');
    legenda.innerHTML = `${c.rotulo} ${escalaNota}`;
    bloco.appendChild(legenda);

    if (typeof c.descricao === 'string' && c.descricao) {
      const desc = document.createElement('p');
      desc.className = 'criterio-descricao';
      desc.textContent = c.descricao;
      bloco.appendChild(desc);
    } else if (c.descricao && typeof c.descricao === 'object') {
      renderDescricaoEstruturada(bloco, c.descricao);
    }

    c.descritores.forEach((texto, nota) => {
      const id = `crit-${c.chave}-${nota}`;
      const linha = document.createElement('label');
      linha.className = 'descritor-linha';
      linha.setAttribute('for', id);
      linha.innerHTML = `
        <input type="radio" name="crit-${c.chave}" id="${id}"
               data-criterio="${c.chave}" value="${nota}" />
        <span class="nota-badge">${nota}</span>
        <span class="descritor-texto">${texto}</span>`;
      bloco.appendChild(linha);
    });

    // Evidência / observação livre do critério.
    const obs = document.createElement('div');
    obs.className = 'campo observacao-campo';
    obs.innerHTML = `
      <label for="obs-${c.chave}">Evidência / observação (opcional)</label>
      <textarea id="obs-${c.chave}" data-observacao="${c.chave}" rows="2"
        placeholder="Métrica, relato ou justificativa que ancora a nota"></textarea>`;
    bloco.appendChild(obs);

    container.appendChild(bloco);
  });
}

/* ------------------------------------------------------------------ *
 * Navegação entre passos
 * ------------------------------------------------------------------ */

function mostrarPasso(indice) {
  estado.passoAtual = Math.max(0, Math.min(TOTAL_PASSOS - 1, indice));

  $$('.passo').forEach((sec) => {
    const n = Number(sec.dataset.passo);
    sec.hidden = n !== estado.passoAtual;
  });

  // Indicador de progresso
  $('#progresso-atual').textContent = estado.passoAtual + 1;

  // Botões de navegação
  $('#btn-voltar').disabled = estado.passoAtual === 0;
  const ultimo = estado.passoAtual === TOTAL_PASSOS - 1;
  $('#btn-avancar').hidden = ultimo;

  // Atualizações específicas ao entrar em certos passos
  if (estado.passoAtual === 1) atualizarAvisoTriagem();
  if (estado.passoAtual === 2) sincronizarCuradoria();
  if (estado.passoAtual === 3) atualizarTetoComplexidade();
  if (estado.passoAtual === 4) atualizarPainelFiltros();
  if (estado.passoAtual === 5) { gerarMemoria(); atualizarDesfechoMemoria(); }

  renderStepper();
  atualizarScoreVisivel();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Indicador de passos: marca o atual (aria-current) e os concluídos, e
// permite voltar a um passo anterior (os dados ficam preservados).
function renderStepper() {
  const lista = $('#stepper-lista');
  lista.innerHTML = '';
  PASSOS.forEach((rotulo, i) => {
    const li = document.createElement('li');
    const concluido = i < estado.passoAtual;
    const atual = i === estado.passoAtual;
    if (concluido) li.classList.add('completo');
    if (atual) li.classList.add('atual');

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.innerHTML = `<span class="passo-num" aria-hidden="true">${concluido ? '✓' : i + 1}</span>`
      + `<span class="passo-rotulo">${rotulo}</span>`;
    // Só permite navegar para o passo atual ou anteriores (volta sem perder dados).
    btn.disabled = i > estado.passoAtual;
    if (atual) btn.setAttribute('aria-current', 'step');
    btn.setAttribute('aria-label',
      `Passo ${i + 1} de ${TOTAL_PASSOS}: ${rotulo}`
      + (atual ? ' (atual)' : concluido ? ' (concluído)' : ''));
    btn.addEventListener('click', () => { if (i <= estado.passoAtual) mostrarPasso(i); });

    li.appendChild(btn);
    lista.appendChild(li);
  });
}

/* ------------------------------------------------------------------ *
 * Sincronizações de tela
 * ------------------------------------------------------------------ */

// O score fica visível no rodapé e no passo de pontuação. Sob piso
// obrigatório a demanda recebe score fixo de 20 (prioridade absoluta).
function atualizarScoreVisivel() {
  const score = pisoAcionado() ? 20 : calcularScore();
  $('#score-rodape').textContent = `${score} / 20`;
  $('#score-live').textContent = `${score} / 20`;
}

// Passo 2 — aviso de piso obrigatório. Informativo: explica o score fixo de
// 20; o avaliador pode desmarcar para avaliar a demanda pela matriz.
function atualizarAvisoTriagem() {
  const el = $('#triagem-aviso');
  const pisos = piosAcionados();
  if (!pisos.length) {
    el.hidden = true;
    return;
  }
  el.hidden = false;
  el.className = 'aviso alerta';
  el.innerHTML =
    '<strong>Piso obrigatório (ato vinculado) acionado.</strong> Demanda '
    + 'enquadrada como piso obrigatório — score fixo de 20 (prioridade absoluta). '
    + 'A demanda entra na fila já no topo do ranking. Gatilho(s): '
    + pisos.map((p) => p.rotulo).join(', ') + '. Desmarque para avaliar pela matriz.';
}

// Passo 4 — aplica o teto de Complexidade pela camada validada.
//  - Core SEI: nota fixa em 0, radios desabilitados, sem override.
//  - Demais camadas: nota acima do teto marca override e exige justificativa.
function atualizarTetoComplexidade() {
  const bloco = $('.criterio[data-criterio="complexidade"]');
  if (!bloco) return;

  const teto = tetoComplexidade();
  const radios = $$('input[name="crit-complexidade"]', bloco);
  const rotuloCamada = rotuloPorValor(CAMADAS, estado.curadoria.camadaValidada);
  const overlay = $('#override-complexidade');

  // Nota de teto (criada uma única vez, logo após a descrição/legenda).
  let notaEl = bloco.querySelector('.teto-nota');
  if (!notaEl) {
    notaEl = document.createElement('p');
    notaEl.className = 'teto-nota';
    const ancora = bloco.querySelector('.criterio-descricao') || bloco.querySelector('legend');
    ancora.insertAdjacentElement('afterend', notaEl);
  }

  const limparMarca = () => radios.forEach((r) =>
    r.closest('.descritor-linha').classList.remove('acima-teto'));

  // Sem camada definida — sem teto a aplicar.
  if (teto === null) {
    notaEl.className = 'teto-nota';
    notaEl.textContent = 'Defina a camada na curadoria (Passo 3) para aplicar o teto de complexidade.';
    radios.forEach((r) => { r.disabled = false; });
    limparMarca();
    estado.override.ativo = false;
    if (overlay) overlay.hidden = true;
    return;
  }

  // Core SEI — nota fixa em 0, sem override possível.
  if (camadaCore()) {
    estado.pontuacao.complexidade = 0;
    radios.forEach((r) => {
      r.checked = Number(r.value) === 0;
      r.disabled = true;
    });
    limparMarca();
    notaEl.className = 'teto-nota fixa';
    notaEl.textContent = 'Camada Core SEI: Complexidade fixada em 0 (altíssima), sem possibilidade de override.';
    estado.override.ativo = false;
    if (overlay) overlay.hidden = true;
    return;
  }

  // Demais camadas — override possível acima do teto.
  notaEl.className = 'teto-nota';
  notaEl.textContent =
    `Teto pela camada ${rotuloCamada}: nota máxima ${teto}. `
    + 'Notas acima do teto exigem justificativa (override).';
  radios.forEach((r) => {
    r.disabled = false;
    r.closest('.descritor-linha').classList.toggle('acima-teto', Number(r.value) > teto);
  });

  const nota = estado.pontuacao.complexidade;
  const ehOverride = typeof nota === 'number' && nota > teto;
  estado.override.ativo = ehOverride;

  if (ehOverride) {
    estado.override.nota = nota;
    estado.override.teto = teto;
    if (overlay) {
      overlay.hidden = false;
      $('#override-alerta').textContent =
        `Nota ${nota} está acima do teto ${teto} da camada ${rotuloCamada}. `
        + 'Justifique o override para prosseguir.';
      $('#override-justificativa').value = estado.override.justificativa;
    }
  } else if (overlay) {
    overlay.hidden = true;
    const pend = $('#override-pendencia');
    if (pend) pend.hidden = true;
  }
}

// Passo 6 — banner de desfecho. Mostra o que aconteceu, o score e um atalho
// para retomar o passo anterior. Não esconde a memória nem o restante.
function atualizarDesfechoMemoria() {
  const el = $('#memoria-desfecho');
  const score = calcularScore();
  el.hidden = false;

  switch (desfechoAtual()) {
    case 'piso':
      el.className = 'aviso alerta';
      el.innerHTML =
        '<strong>Enquadrada por piso obrigatório (ato vinculado).</strong> Score '
        + 'fixo de 20/20 (prioridade absoluta) — a demanda entra na fila já no topo '
        + 'do ranking. '
        + '<button type="button" class="link" id="retomar-triagem">Voltar à triagem</button>';
      break;
    case 'conveniencia-local':
      el.className = 'aviso alerta';
      el.innerHTML =
        '<strong>Fluxo encerrado por filtro automático.</strong> Demanda '
        + 'tratada como conveniência estritamente local — não disputa fila, e é '
        + 'encaminhada à camada de uso local. Score apurado: ' + score + '/20. '
        + '<button type="button" class="link" id="retomar-pontuacao">Voltar à pontuação</button>';
      break;
    default:
      el.className = 'aviso ok';
      el.innerHTML =
        '<strong>Avaliação completa pela matriz.</strong> Score final: '
        + score + '/20.';
  }
}

// Passo 3 herda a camada proposta no Passo 1 como ponto de partida.
function sincronizarCuradoria() {
  const select = $('#curadoria-camada');
  if (!estado.curadoria.camadaValidada) {
    estado.curadoria.camadaValidada = estado.identificacao.camada;
  }
  select.value = estado.curadoria.camadaValidada || '';
  $('#curadoria-proposta').textContent =
    rotuloPorValor(CAMADAS, estado.identificacao.camada);
}

// Passo 5 — filtro 0+0. Aciona o desfecho "conveniência local" e mostra
// mensagem informativa com o score parcial.
function atualizarPainelFiltros() {
  const impacto = estado.pontuacao.impacto;
  const ganho = estado.pontuacao.ganho;
  $('#filtro-impacto').textContent = impacto === null ? '—' : impacto;
  $('#filtro-ganho').textContent = ganho === null ? '—' : ganho;

  const alvo = $('#filtro-status');
  if (impacto === null || ganho === null) {
    alvo.textContent = 'Pontue impacto institucional e ganho operacional para avaliar o filtro.';
    alvo.className = 'aviso neutro';
  } else if (condicaoConvenienciaLocal()) {
    alvo.textContent =
      'Filtro acionado — Demanda tratada como conveniência estritamente local '
      + '— não disputa fila, e é encaminhada à camada de uso local. Score '
      + 'parcial: ' + calcularScore() + '/20. Volte à pontuação se classificou errado.';
    alvo.className = 'aviso alerta';
  } else {
    alvo.textContent = 'Filtro não acionado — a demanda segue para a memória de cálculo com o score apurado.';
    alvo.className = 'aviso ok';
  }
}

/* ------------------------------------------------------------------ *
 * Integração com o ParticiPEN (Discourse)
 *
 * Protótipo: lê o tópico via API pública ({base}/t/{id}.json) por fetch.
 * Na versão embarcada (theme component), será a API interna do Discourse.
 * O parser (parseDiscourseUrl, extrairCamposDoTopico) é função pura.
 * ------------------------------------------------------------------ */

// Campos do Passo 1 que podem vir do tópico (para snapshot/ajustes).
const CAMPOS_TOPICO = ['titulo', 'descricao', 'natureza', 'trilha', 'camada', 'dependencias', 'evidencia'];

const ROTULOS_CAMPO = {
  titulo: 'Título',
  descricao: 'Descrição',
  natureza: 'Natureza',
  trilha: 'Trilha',
  camada: 'Camada proposta',
  dependencias: 'Dependências',
  evidencia: 'Evidência',
};

// Rótulos do Topic Template (esquema canônico). Tolerantes: case-insensitive,
// aceitam marcação leve (**negrito**, *itálico*, #, >, marcadores) e espaços.
const RX_NATUREZA = /^[\s*_>#·•-]*natureza\s*:\s*(.+)$/i;
const RX_TRILHA = /^[\s*_>#·•-]*trilha\s*:\s*(.+)$/i;
const RX_CAMADA = /^[\s*_>#·•-]*camada\s+proposta\s*:\s*(.+)$/i;
const RX_DEPS = /^[\s*_>#·•-]*depend[êe]ncias\s*:\s*(.+)$/i;
const RX_EVID = /^[\s*_>#·•-]*(?:evid[êe]ncia|m[ée]trica)\s*:\s*(.+)$/i;

// Extrai {baseUrl, slug, topicId} de uma URL de tópico Discourse.
function parseDiscourseUrl(url) {
  let u;
  try {
    u = new URL((url || '').trim());
  } catch (e) {
    return null;
  }
  // /t/{slug}/{id} ou /t/{id}
  const m = u.pathname.match(/\/t\/(?:([^/]+)\/)?(\d+)/);
  if (!m) return null;
  return { baseUrl: u.origin, slug: m[1] || '', topicId: m[2] };
}

// Converte o HTML "cooked" do post em { primeiroParagrafo, linhas }.
function htmlParaConteudo(html) {
  const doc = new DOMParser().parseFromString(html || '', 'text/html');
  const primeiroP = doc.querySelector('p');
  const primeiroParagrafo = primeiroP
    ? primeiroP.textContent.replace(/\s+/g, ' ').trim()
    : '';
  doc.querySelectorAll('br').forEach((br) => br.replaceWith('\n'));
  doc.querySelectorAll('p, div, li, h1, h2, h3, h4, h5, h6, blockquote, tr')
    .forEach((el) => el.append('\n'));
  const linhas = doc.body.textContent.split('\n').map((l) => l.trim()).filter(Boolean);
  return { primeiroParagrafo, linhas };
}

function pareceRotulo(texto) {
  return [RX_NATUREZA, RX_TRILHA, RX_CAMADA, RX_DEPS, RX_EVID].some((rx) => rx.test(texto));
}

// Limpa marcação leve (asteriscos/underscores) ao redor do valor.
function limparValorRotulo(v) {
  return (v || '').trim().replace(/^[*_\s]+/, '').replace(/[*_\s]+$/, '').trim();
}

function valorDoRotulo(linhas, rx) {
  for (const l of linhas) {
    const m = l.match(rx);
    if (m) return limparValorRotulo(m[m.length - 1]);
  }
  return '';
}

function normalizarNatureza(v) {
  const s = semAcento(v).toLowerCase();
  if (s.includes('problema')) return 'problema';
  if (s.includes('pratica')) return 'pratica';
  return '';
}

function normalizarTrilha(v) {
  const s = semAcento(v).toLowerCase().trim();
  const exato = TRILHAS.find((t) => semAcento(t).toLowerCase() === s);
  if (exato) return exato;
  const parcial = TRILHAS.find((t) => s.includes(semAcento(t).toLowerCase()));
  return parcial || '';
}

function normalizarCamada(v) {
  const s = semAcento(v).toLowerCase().trim();
  const porRotulo = CAMADAS.find((c) => semAcento(c.rotulo).toLowerCase() === s)
    || CAMADAS.find((c) => s.includes(semAcento(c.rotulo).toLowerCase()))
    || CAMADAS.find((c) => c.valor === s);
  return porRotulo ? porRotulo.valor : '';
}

// Função pura: do JSON do tópico para os campos do Passo 1.
function extrairCamposDoTopico(json) {
  const r = {
    titulo: '', descricao: '', natureza: '', trilha: '',
    camada: '', dependencias: '', evidencia: '', encontrados: [],
  };
  if (!json) return r;

  if (json.title) { r.titulo = String(json.title).trim(); if (r.titulo) r.encontrados.push('titulo'); }

  const post = json.post_stream && json.post_stream.posts && json.post_stream.posts[0];
  const { primeiroParagrafo, linhas } = htmlParaConteudo(post ? post.cooked : '');

  if (primeiroParagrafo && !pareceRotulo(primeiroParagrafo)) {
    r.descricao = primeiroParagrafo;
    r.encontrados.push('descricao');
  }

  const nat = normalizarNatureza(valorDoRotulo(linhas, RX_NATUREZA));
  if (nat) { r.natureza = nat; r.encontrados.push('natureza'); }

  const tri = normalizarTrilha(valorDoRotulo(linhas, RX_TRILHA));
  if (tri) { r.trilha = tri; r.encontrados.push('trilha'); }

  const cam = normalizarCamada(valorDoRotulo(linhas, RX_CAMADA));
  if (cam) { r.camada = cam; r.encontrados.push('camada'); }

  const dep = valorDoRotulo(linhas, RX_DEPS);
  if (dep) { r.dependencias = dep; r.encontrados.push('dependencias'); }

  const evids = linhas.map((l) => l.match(RX_EVID)).filter(Boolean)
    .map((m) => limparValorRotulo(m[m.length - 1]));
  if (evids.length) { r.evidencia = evids.join('\n'); r.encontrados.push('evidencia'); }

  return r;
}

function mostrarAvisoTopico(tipo, msg) {
  const el = $('#topico-aviso');
  el.hidden = false;
  el.className = 'aviso ' + (tipo === 'ok' ? 'ok' : tipo === 'erro' ? 'alerta' : 'neutro');
  el.textContent = msg;
}

function snapshotIdentificacao() {
  const snap = {};
  CAMPOS_TOPICO.forEach((c) => { snap[c] = estado.identificacao[c] || ''; });
  return snap;
}

// Recalcula quais campos foram editados manualmente após a carga do tópico.
function recomputarAjustes() {
  if (!estado.origem.viaTopico) return;
  estado.origem.camposAjustados = CAMPOS_TOPICO
    .filter((c) => (estado.identificacao[c] || '') !== (estado.origem.snapshot[c] || ''));
}

function origemDosDados() {
  if (!estado.origem.viaTopico) return 'preenchimento manual';
  return estado.origem.camposAjustados.length
    ? 'tópico Discourse + ajuste manual'
    : 'tópico Discourse';
}

// Escreve no estado e na interface os campos extraídos (só os encontrados).
function popularIdentificacao(campos) {
  const aplicar = (chave, sel) => {
    if (!campos[chave]) return;
    estado.identificacao[chave] = campos[chave];
    const el = $(sel);
    if (el) el.value = campos[chave];
  };
  aplicar('titulo', '#id-titulo');
  aplicar('descricao', '#id-descricao');
  aplicar('natureza', '#id-natureza');
  aplicar('trilha', '#id-trilha');
  aplicar('camada', '#id-camada');
  aplicar('dependencias', '#id-dependencias');
  aplicar('evidencia', '#id-evidencia');
  // Sincroniza a curadoria com a camada carregada, se ainda não tocada.
  if (campos.camada && !estado.curadoria.camadaValidada) {
    estado.curadoria.camadaValidada = campos.camada;
  }
}

// Aplica um JSON de tópico (recém-carregado ou do cache) ao Passo 1.
function aplicarTopico(json, url) {
  estado.origem.jsonBruto = json; // cache de sessão (não persistido)
  estado.origem.url = url;

  const campos = extrairCamposDoTopico(json);
  if (!campos.encontrados.length) {
    mostrarAvisoTopico('erro',
      'Não foi possível extrair os campos do tópico — preencha manualmente abaixo.');
    $('#btn-reextrair').hidden = false; // ainda dá para re-tentar do cache
    return;
  }

  popularIdentificacao(campos);
  estado.origem.viaTopico = true;
  estado.origem.snapshot = snapshotIdentificacao();
  estado.origem.camposAjustados = [];
  $('#btn-reextrair').hidden = false;
  atualizarScoreVisivel();

  const faltando = CAMPOS_TOPICO.filter((c) => !campos.encontrados.includes(c));
  const aviso = faltando.length
    ? 'Campos carregados do tópico. Não encontrados (preencha manualmente): '
      + faltando.map((c) => ROTULOS_CAMPO[c]).join(', ') + '.'
    : 'Todos os campos foram carregados do tópico.';
  mostrarAvisoTopico('ok', aviso);
}

// Handler do botão "Carregar": valida URL, busca o JSON e aplica.
async function carregarDoTopico() {
  const url = $('#id-topico-url').value.trim();
  const parsed = parseDiscourseUrl(url);
  if (!parsed) {
    mostrarAvisoTopico('erro',
      'URL de tópico inválida. Use o formato {base}/t/{slug}/{id}.');
    return;
  }
  const apiUrl = `${parsed.baseUrl}/t/${parsed.topicId}.json`;
  mostrarAvisoTopico('neutro', 'Carregando do ParticiPEN…');
  try {
    const resp = await fetch(apiUrl, { headers: { Accept: 'application/json' } });
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    const json = await resp.json();
    aplicarTopico(json, url);
  } catch (e) {
    mostrarAvisoTopico('erro',
      'Não foi possível extrair os campos do tópico — preencha manualmente abaixo. ('
      + e.message + ')');
  }
}

// Re-extrai a partir do JSON em cache (sem nova chamada de rede).
function reextrair() {
  if (estado.origem.jsonBruto) {
    aplicarTopico(estado.origem.jsonBruto, estado.origem.url);
  }
}

/* ------------------------------------------------------------------ *
 * Carregar exemplo / memória salva (JSON)
 *
 * aplicarMemoria() é o inverso de montarMemoria(): recebe um objeto de
 * memória de cálculo (formato da Iteração 4) e reidrata o fluxo inteiro.
 * Usado pelos exemplos de exemplos/ e por qualquer JSON exportado.
 * ------------------------------------------------------------------ */

function mostrarAvisoExemplo(tipo, msg) {
  const el = $('#exemplo-aviso');
  el.hidden = false;
  el.className = 'aviso ' + (tipo === 'ok' ? 'ok' : tipo === 'erro' ? 'alerta' : 'neutro');
  el.textContent = msg;
}

// Empurra o estado para os campos do formulário (DOM).
function sincronizarFormularioComEstado() {
  const setVal = (sel, v) => { const el = $(sel); if (el) el.value = v || ''; };
  setVal('#id-avaliador', estado.identificacao.avaliador);
  setVal('#id-titulo', estado.identificacao.titulo);
  setVal('#id-descricao', estado.identificacao.descricao);
  setVal('#id-link', estado.identificacao.link);
  setVal('#id-natureza', estado.identificacao.natureza);
  setVal('#id-trilha', estado.identificacao.trilha);
  setVal('#id-camada', estado.identificacao.camada);
  setVal('#id-dependencias', estado.identificacao.dependencias);
  setVal('#id-evidencia', estado.identificacao.evidencia);
  setVal('#curadoria-camada', estado.curadoria.camadaValidada);

  GATILHOS_PISO.forEach((g) => {
    const el = $(`#gatilho-${g.chave}`);
    if (el) el.checked = !!estado.triagem[g.chave];
  });

  CRITERIOS.forEach((c) => {
    const nota = estado.pontuacao[c.chave];
    $$(`input[name="crit-${c.chave}"]`).forEach((r) => {
      r.checked = Number(r.value) === nota;
    });
    const obs = $(`#obs-${c.chave}`);
    if (obs) obs.value = estado.observacoes[c.chave] || '';
  });

  const oj = $('#override-justificativa');
  if (oj) oj.value = estado.override.justificativa || '';
}

// Reidrata o estado a partir de um objeto de memória de cálculo.
function aplicarMemoria(m) {
  if (!m || typeof m !== 'object' || !m.identificacao) {
    throw new Error('estrutura de memória de cálculo não reconhecida');
  }
  const id = m.identificacao;

  estado.identificacao.avaliador = (m.avaliador && m.avaliador !== 'não informado') ? m.avaliador : '';
  estado.identificacao.titulo = id.titulo || '';
  estado.identificacao.descricao = id.descricao || '';
  estado.identificacao.link = id.linkPublico || '';
  estado.identificacao.natureza = (id.natureza && id.natureza.valor) || '';
  estado.identificacao.trilha = id.trilha || '';
  estado.identificacao.camada = (id.camadaProposta && id.camadaProposta.valor) || '';
  estado.identificacao.dependencias = id.dependencias || '';
  estado.identificacao.evidencia = id.evidencia || '';

  GATILHOS_PISO.forEach((g) => { estado.triagem[g.chave] = false; });
  ((m.triagem && m.triagem.gatilhos) || []).forEach((g) => {
    if (g && Object.prototype.hasOwnProperty.call(estado.triagem, g.chave)) {
      estado.triagem[g.chave] = !!g.marcado;
    }
  });

  estado.curadoria.camadaValidada =
    (m.curadoria && m.curadoria.camadaValidada && m.curadoria.camadaValidada.valor)
    || estado.identificacao.camada || '';

  CRITERIOS.forEach((c) => { estado.pontuacao[c.chave] = null; estado.observacoes[c.chave] = ''; });
  (m.criterios || []).forEach((cr) => {
    if (cr && Object.prototype.hasOwnProperty.call(estado.pontuacao, cr.chave)) {
      estado.pontuacao[cr.chave] = typeof cr.nota === 'number' ? cr.nota : null;
      estado.observacoes[cr.chave] = cr.observacao || '';
    }
  });

  estado.override = { ativo: false, nota: null, teto: null, justificativa: '' };
  const ov = (m.overrides || []).find((o) => o && o.criterio === 'complexidade');
  if (ov) {
    estado.override = {
      ativo: true, nota: ov.nota, teto: ov.teto, justificativa: ov.justificativa || '',
    };
  }

  // Procedência. camposAjustadosManualmente é salvo como rótulos; remapeia p/ chaves.
  const viaTopico = !!m.origemDosDados && m.origemDosDados !== 'preenchimento manual';
  const chavePorRotulo = Object.fromEntries(
    Object.entries(ROTULOS_CAMPO).map(([k, v]) => [v, k]),
  );
  estado.origem.viaTopico = viaTopico;
  estado.origem.url = m.urlTopico || '';
  estado.origem.jsonBruto = null;
  estado.origem.camposAjustados = viaTopico
    ? (m.camposAjustadosManualmente || []).map((r) => chavePorRotulo[r]).filter(Boolean)
    : [];
  estado.origem.snapshot = snapshotIdentificacao();

  sincronizarFormularioComEstado();
  $('#btn-reextrair').hidden = true; // sem cache de tópico nesta carga
  mostrarPasso(0);
}

// Lê um arquivo JSON selecionado e reidrata o fluxo.
function carregarExemploArquivo(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const m = JSON.parse(reader.result);
      aplicarMemoria(m);
      const titulo = (m.identificacao && m.identificacao.titulo) || '(sem título)';
      mostrarAvisoExemplo('ok', `Exemplo carregado: ${titulo}. Navegue pelos passos para revisar.`);
    } catch (e) {
      mostrarAvisoExemplo('erro', 'JSON inválido ou incompatível: ' + e.message);
    }
  };
  reader.onerror = () => mostrarAvisoExemplo('erro', 'Falha ao ler o arquivo.');
  reader.readAsText(file, 'utf-8');
}

/* ------------------------------------------------------------------ *
 * Memória de cálculo — um objeto interno, dois formatos
 *
 * montarMemoria() devolve o objeto completo. memoriaParaMarkdown() e
 * memoriaParaJSON() derivam dele — a paridade é garantida por construção.
 * ------------------------------------------------------------------ */

let memoriaAtual = null; // último objeto montado, reusado por copiar/baixar

function rotuloDesfecho(codigo) {
  if (codigo === 'piso') return 'Piso obrigatório (ato vinculado)';
  if (codigo === 'conveniencia-local') return 'Conveniência estritamente local';
  return 'Avaliação completa pela matriz';
}

function mensagemDesfecho(codigo) {
  if (codigo === 'piso') {
    return 'Demanda enquadrada como piso obrigatório (ato vinculado) — score fixo '
      + 'de 20 (prioridade absoluta). A demanda entra na fila já no topo do ranking.';
  }
  if (codigo === 'conveniencia-local') {
    return 'Demanda tratada como conveniência estritamente local — não disputa '
      + 'fila, e é encaminhada à camada de uso local.';
  }
  return 'Avaliação completa pela matriz.';
}

// Timestamp ISO 8601 no fuso horário local, com precisão de segundos (sem
// milissegundos). Ex.: 2026-06-23T18:42:58-03:00
function timestampLocal(d = new Date()) {
  const pad = (n) => String(n).padStart(2, '0');
  const offMin = -d.getTimezoneOffset(); // minutos em relação a UTC (+ a leste)
  const sinal = offMin >= 0 ? '+' : '-';
  const abs = Math.abs(offMin);
  const offset = `${sinal}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    + `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${offset}`;
}

// Constrói o objeto-fonte da memória de cálculo. Tudo que aparece no
// Markdown ou no JSON sai daqui.
function montarMemoria() {
  const id = estado.identificacao;
  const desfecho = desfechoAtual();
  const pisos = piosAcionados();
  const teto = tetoComplexidade();
  const overrideAtivo = desfecho !== 'piso' && estado.override.ativo;

  // Sob piso a demanda recebe score fixo de 20 (prioridade absoluta); os
  // cinco critérios não são pontuados.
  const ehPiso = desfecho === 'piso';
  const scoreTotal = ehPiso ? 20 : calcularScore();

  const criterios = CRITERIOS.map((c) => {
    const notaBruta = estado.pontuacao[c.chave];
    const pontuado = desfecho !== 'piso' && typeof notaBruta === 'number';
    return {
      chave: c.chave,
      rotulo: c.rotulo,
      invertido: !!c.invertido,
      nota: pontuado ? notaBruta : null,
      descritor: pontuado ? c.descritores[notaBruta] : null,
      observacao: (estado.observacoes[c.chave] || '').trim(),
    };
  });

  const overrides = [];
  if (overrideAtivo) {
    overrides.push({
      criterio: 'complexidade',
      rotulo: 'Complexidade',
      nota: estado.override.nota,
      teto: estado.override.teto,
      camada: {
        valor: estado.curadoria.camadaValidada,
        rotulo: rotuloPorValor(CAMADAS, estado.curadoria.camadaValidada),
      },
      justificativa: estado.override.justificativa.trim(),
    });
  }

  return {
    versaoRegua: (window.REGUA && window.REGUA.versao) || 'desconhecida',
    timestamp: timestampLocal(), // ISO 8601 (fuso local, precisão de segundos)
    avaliador: id.avaliador.trim() || 'não informado',
    origemDosDados: origemDosDados(),
    urlTopico: estado.origem.viaTopico ? estado.origem.url : null,
    camposAjustadosManualmente: estado.origem.viaTopico
      ? estado.origem.camposAjustados.map((c) => ROTULOS_CAMPO[c] || c)
      : [],
    pisoAcionado: ehPiso,
    pisoJustificativa: ehPiso && pisos.length ? pisos[0].chave : null,
    desfecho: {
      codigo: desfecho,
      rotulo: rotuloDesfecho(desfecho),
      mensagem: mensagemDesfecho(desfecho),
    },
    identificacao: {
      titulo: id.titulo.trim(),
      descricao: id.descricao.trim(),
      linkPublico: id.link.trim(),
      natureza: { valor: id.natureza, rotulo: rotuloPorValor(NATUREZAS, id.natureza) },
      trilha: id.trilha,
      camadaProposta: { valor: id.camada, rotulo: rotuloPorValor(CAMADAS, id.camada) },
      dependencias: id.dependencias.trim(),
      evidencia: id.evidencia.trim(),
    },
    triagem: {
      pisoAcionado: pisos.length > 0,
      gatilhos: GATILHOS_PISO.map((g) => ({
        chave: g.chave,
        rotulo: g.rotulo,
        marcado: !!estado.triagem[g.chave],
      })),
    },
    curadoria: {
      camadaValidada: {
        valor: estado.curadoria.camadaValidada,
        rotulo: rotuloPorValor(CAMADAS, estado.curadoria.camadaValidada),
      },
      tetoComplexidade: teto,
    },
    criterios,
    filtros: {
      pisoObrigatorio: {
        acionado: desfecho === 'piso',
        passo: 2,
        gatilhos: pisos.map((p) => p.rotulo),
      },
      convenienciaLocal: {
        acionado: desfecho === 'conveniencia-local',
        passo: 5,
      },
    },
    overrides,
    score: { total: scoreTotal, maximo: 20, texto: `${scoreTotal}/20` },
  };
}

// Markdown estruturado, para colar no Discourse/ParticiPEN.
function memoriaParaMarkdown(m) {
  const ni = (v) => (v && String(v).trim() ? v : '(não informado)');

  const blocosCriterios = m.criterios.map((c) => {
    const escala = c.invertido ? ' _(escala invertida — 4 = melhor)_' : '';
    const nota = c.nota === null ? 'não pontuado' : String(c.nota);
    const descritor = c.descritor === null ? '—' : c.descritor;
    const obs = c.observacao || '(não informada)';
    const ovr = m.overrides.find((o) => o.criterio === c.chave);
    const linhaOvr = ovr
      ? `\n- **Override de teto:** nota ${ovr.nota} acima do teto ${ovr.teto} (camada ${ovr.camada.rotulo})`
      : '';
    return `### ${c.rotulo}${escala}\n`
      + `- **Nota:** ${nota}\n`
      + `- **Descritor:** ${descritor}\n`
      + `- **Evidência/observação:** ${obs}${linhaOvr}`;
  }).join('\n\n');

  const acionados = [];
  if (m.filtros.pisoObrigatorio.acionado) {
    acionados.push(
      `Piso obrigatório (Passo ${m.filtros.pisoObrigatorio.passo}): `
      + m.filtros.pisoObrigatorio.gatilhos.join(', '),
    );
  }
  if (m.filtros.convenienciaLocal.acionado) {
    acionados.push(`Conveniência estritamente local (Passo ${m.filtros.convenienciaLocal.passo})`);
  }
  const filtrosTexto = acionados.length ? acionados.join('; ') : 'Nenhum';

  const overridesTexto = m.overrides.length
    ? m.overrides.map((o) =>
        `${o.rotulo}: nota ${o.nota} acima do teto ${o.teto} (camada ${o.camada.rotulo}) `
        + `— justificativa: "${o.justificativa}"`).join('; ')
    : 'Nenhum';

  let tetoTxt;
  if (m.curadoria.tetoComplexidade === null) tetoTxt = '(camada não definida)';
  else if (m.curadoria.camadaValidada.valor === 'core-sei') tetoTxt = '0 (fixo, sem override)';
  else tetoTxt = String(m.curadoria.tetoComplexidade);

  const pisoLinha = m.triagem.pisoAcionado
    ? `acionado (${m.filtros.pisoObrigatorio.gatilhos.join(', ')})`
    : 'não acionado';
  const gatilhosLinhas = m.triagem.gatilhos
    .map((g) => `  - ${g.rotulo}: ${g.marcado ? 'sim' : 'não'}`)
    .join('\n');

  const ajustadosTexto = m.camposAjustadosManualmente.length
    ? m.camposAjustadosManualmente.join(', ')
    : '(nenhum)';

  // Sob piso obrigatório não há pontuação: a seção de critérios dá lugar a um
  // bloco de enquadramento com o score fixo.
  const rodapeMeta =
    `- **Timestamp (ISO 8601):** ${m.timestamp}\n`
    + `- **Avaliador:** ${m.avaliador}\n`
    + `- **Versão da régua:** ${m.versaoRegua}`;

  let corpoFinal;
  if (m.pisoAcionado) {
    const gatilhosAcionados = m.triagem.gatilhos.filter((g) => g.marcado).map((g) => g.rotulo);
    corpoFinal = `## Enquadramento por piso obrigatório
- **Gatilho(s) acionado(s):** ${gatilhosAcionados.join(', ') || '—'}
- **Score:** ${m.score.texto} (fixo, prioridade absoluta)
${rodapeMeta}`;
  } else {
    corpoFinal = `## Critérios

${blocosCriterios}

## Resultado
- **Score total:** ${m.score.texto}
- **Filtros acionados:** ${filtrosTexto}
- **Overrides de teto:** ${overridesTexto}
${rodapeMeta}`;
  }

  return `# Memória de cálculo — Matriz de priorização do SEI

## Origem dos dados
- **Origem:** ${m.origemDosDados}
- **URL do tópico:** ${m.urlTopico || '(não aplicável)'}
- **Campos ajustados manualmente:** ${ajustadosTexto}

## Identificação da demanda
- **Título:** ${ni(m.identificacao.titulo)}
- **Descrição:** ${ni(m.identificacao.descricao)}
- **Link público:** ${ni(m.identificacao.linkPublico)}
- **Natureza do input:** ${m.identificacao.natureza.rotulo}
- **Trilha:** ${ni(m.identificacao.trilha)}
- **Camada proposta:** ${m.identificacao.camadaProposta.rotulo}
- **Dependências:** ${ni(m.identificacao.dependencias)}
- **Evidência:** ${ni(m.identificacao.evidencia)}

## Triagem e curadoria
- **Gatilhos de piso:**
${gatilhosLinhas}
- **Piso obrigatório:** ${pisoLinha}
- **Camada validada:** ${m.curadoria.camadaValidada.rotulo}
- **Teto de complexidade pela camada:** ${tetoTxt}

## Desfecho
**${m.desfecho.rotulo}** — ${m.desfecho.mensagem}

${corpoFinal}
`;
}

function memoriaParaJSON(m) {
  return JSON.stringify(m, null, 2);
}

// (Re)monta a memória e exibe o Markdown na textarea.
function gerarMemoria() {
  memoriaAtual = montarMemoria();
  $('#memoria-saida').value = memoriaParaMarkdown(memoriaAtual);
}

/* ------------------------------------------------------------------ *
 * Saídas: copiar Markdown e baixar JSON
 * ------------------------------------------------------------------ */

function slugify(texto) {
  const base = semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return base || 'sem-titulo';
}

function nomeArquivoJSON(m) {
  const slug = slugify(m.identificacao.titulo);
  // Timestamp seguro para nome de arquivo (data e hora locais, sem fuso): 2026-06-23T18-42-58
  const ts = m.timestamp
    .replace(/(?:Z|[+-]\d{2}:\d{2})$/, '') // remove o fuso (offset ou Z)
    .replace(/\.\d+/, '')                  // remove milissegundos, se houver
    .replace(/:/g, '-');
  return `memoria-${slug}-${ts}.json`;
}

function flash(msg, ms = 3000) {
  const feedback = $('#copia-feedback');
  feedback.textContent = msg;
  setTimeout(() => { feedback.textContent = ''; }, ms);
}

async function copiarMarkdown() {
  if (!memoriaAtual) gerarMemoria();
  const texto = $('#memoria-saida').value;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(texto);
    } else {
      // Fallback para contextos sem Clipboard API (ex.: file:// antigo)
      const ta = $('#memoria-saida');
      ta.focus();
      ta.select();
      document.execCommand('copy');
    }
    flash('Markdown copiado!');
  } catch (e) {
    flash('Não foi possível copiar automaticamente — selecione e copie manualmente.');
  }
}

function baixarJSON() {
  if (!memoriaAtual) gerarMemoria();
  const json = memoriaParaJSON(memoriaAtual);
  const nome = nomeArquivoJSON(memoriaAtual);
  // Blob a partir de string JS é codificado em UTF-8 (sem BOM).
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nome;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  flash('JSON baixado: ' + nome, 4000);
}

/* ------------------------------------------------------------------ *
 * Ligações de eventos
 * ------------------------------------------------------------------ */

function ligarEventos() {
  // Passo 1 — carga a partir de tópico do ParticiPEN
  $('#btn-carregar-topico').addEventListener('click', carregarDoTopico);
  $('#btn-reextrair').addEventListener('click', reextrair);
  // Enter no campo de URL dispara o carregamento (acessível por teclado).
  $('#id-topico-url').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); carregarDoTopico(); }
  });
  // Passo 1 — carregar exemplo / memória salva (JSON)
  $('#id-exemplo-file').addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) carregarExemploArquivo(e.target.files[0]);
  });

  // Passo 1 — identificação. Campos derivados do tópico chamam
  // recomputarAjustes() para registrar edições manuais pós-carga.
  $('#id-avaliador').addEventListener('input', (e) => {
    estado.identificacao.avaliador = e.target.value;
  });
  $('#id-titulo').addEventListener('input', (e) => {
    estado.identificacao.titulo = e.target.value;
    recomputarAjustes();
  });
  $('#id-descricao').addEventListener('input', (e) => {
    estado.identificacao.descricao = e.target.value;
    recomputarAjustes();
  });
  $('#id-link').addEventListener('input', (e) => {
    estado.identificacao.link = e.target.value;
  });
  $('#id-natureza').addEventListener('change', (e) => {
    estado.identificacao.natureza = e.target.value;
    recomputarAjustes();
  });
  $('#id-trilha').addEventListener('change', (e) => {
    estado.identificacao.trilha = e.target.value;
    recomputarAjustes();
  });
  $('#id-camada').addEventListener('change', (e) => {
    estado.identificacao.camada = e.target.value;
    // Se a curadoria ainda não foi tocada, mantém em sincronia.
    if (!estado.curadoria.camadaValidada) {
      estado.curadoria.camadaValidada = e.target.value;
    }
    recomputarAjustes();
  });
  $('#id-dependencias').addEventListener('input', (e) => {
    estado.identificacao.dependencias = e.target.value;
    recomputarAjustes();
  });
  $('#id-evidencia').addEventListener('input', (e) => {
    estado.identificacao.evidencia = e.target.value;
    recomputarAjustes();
  });

  // Passo 2 — triagem (delegação de evento)
  $('#triagem-gatilhos').addEventListener('change', (e) => {
    const chave = e.target.dataset.gatilho;
    if (chave) {
      estado.triagem[chave] = e.target.checked;
      atualizarAvisoTriagem();
      atualizarScoreVisivel();
    }
  });

  // Passo 3 — curadoria
  $('#curadoria-camada').addEventListener('change', (e) => {
    estado.curadoria.camadaValidada = e.target.value;
  });

  // Passo 4 — pontuação (delegação de evento)
  $('#criterios').addEventListener('change', (e) => {
    const chave = e.target.dataset.criterio;
    if (!chave) return;
    estado.pontuacao[chave] = Number(e.target.value);
    if (chave === 'complexidade') atualizarTetoComplexidade();
    atualizarScoreVisivel();
  });

  // Passo 4 — evidência/observação por critério (delegação de evento)
  $('#criterios').addEventListener('input', (e) => {
    const chave = e.target.dataset.observacao;
    if (chave) estado.observacoes[chave] = e.target.value;
  });

  // Passo 4 — justificativa do override
  $('#override-justificativa').addEventListener('input', (e) => {
    estado.override.justificativa = e.target.value;
    if (e.target.value.trim()) $('#override-pendencia').hidden = true;
  });

  // Navegação
  $('#btn-avancar').addEventListener('click', avancar);
  $('#btn-voltar').addEventListener('click', voltar);

  // Passo 6 — atalhos de retomada no banner de desfecho (delegação)
  $('#memoria-desfecho').addEventListener('click', (e) => {
    if (e.target.id === 'retomar-triagem') mostrarPasso(1);
    if (e.target.id === 'retomar-pontuacao') mostrarPasso(3);
  });

  // Passo 6 — saídas
  $('#btn-copiar-md').addEventListener('click', copiarMarkdown);
  $('#btn-baixar-json').addEventListener('click', baixarJSON);
  $('#btn-regenerar').addEventListener('click', () => { gerarMemoria(); atualizarDesfechoMemoria(); });
}

/* ------------------------------------------------------------------ *
 * Navegação com regras de fluxo
 * ------------------------------------------------------------------ */

// Avança respeitando: trava do override (Passo 4) e salto do piso (Passo 2).
function avancar() {
  const atual = estado.passoAtual;

  // Passo 4 — override sem justificativa não avança.
  if (atual === 3 && estado.override.ativo && !estado.override.justificativa.trim()) {
    const pend = $('#override-pendencia');
    if (pend) pend.hidden = false;
    return;
  }

  // Passo 2 — piso obrigatório pula a pontuação e vai direto à memória
  // (score fixo de 20, prioridade absoluta).
  if (atual === 1 && pisoAcionado()) {
    mostrarPasso(5);
    return;
  }

  mostrarPasso(atual + 1);
}

// Volta respeitando o bypass: da memória, se chegou por piso, retorna à triagem.
function voltar() {
  const atual = estado.passoAtual;
  if (atual === 5 && pisoAcionado()) {
    mostrarPasso(1);
    return;
  }
  mostrarPasso(atual - 1);
}

/* ------------------------------------------------------------------ *
 * Carregamento da régua (regua.js)
 * ------------------------------------------------------------------ */

// Carrega regua.js injetando um <script> clássico. Escolha deliberada:
// funciona tanto em file:// quanto servido por HTTP, ao contrário de fetch
// e import de módulo, que o navegador bloqueia em file://. O app só consome
// o objeto resultante — não conhece os textos dos descritores.
function carregarRegua() {
  return new Promise((resolve, reject) => {
    if (window.REGUA) {
      resolve(window.REGUA);
      return;
    }
    const s = document.createElement('script');
    s.src = 'regua.js';
    s.onload = () => {
      if (window.REGUA && Array.isArray(window.REGUA.criterios)) {
        resolve(window.REGUA);
      } else {
        reject(new Error('regua.js carregou, mas REGUA.criterios não está definido.'));
      }
    };
    s.onerror = () => reject(new Error('Não foi possível carregar regua.js.'));
    document.head.appendChild(s);
  });
}

// Carrega tooltips.js (mesma estratégia de injeção de <script> da régua).
// Não-fatal: tooltips são um aprimoramento; se falhar, o fluxo segue sem eles.
function carregarTooltips() {
  return new Promise((resolve, reject) => {
    if (window.TOOLTIPS) {
      resolve(window.TOOLTIPS);
      return;
    }
    const s = document.createElement('script');
    s.src = 'tooltips.js';
    s.onload = () => (window.TOOLTIPS
      ? resolve(window.TOOLTIPS)
      : reject(new Error('tooltips.js carregou, mas TOOLTIPS não está definido.')));
    s.onerror = () => reject(new Error('Não foi possível carregar tooltips.js.'));
    document.head.appendChild(s);
  });
}

function mostrarErroRegua(erro) {
  const main = document.querySelector('main');
  const aviso = document.createElement('p');
  aviso.className = 'aviso alerta';
  aviso.textContent =
    'Erro ao carregar a régua de critérios: ' + erro.message
    + ' Verifique se regua.js está na mesma pasta de index.html.';
  main.prepend(aviso);
}

/* ------------------------------------------------------------------ *
 * Inicialização
 * ------------------------------------------------------------------ */

async function init() {
  // A régua é a fonte da verdade dos critérios; sem ela não há Passo 4.
  try {
    const regua = await carregarRegua();
    CRITERIOS = regua.criterios;
  } catch (erro) {
    mostrarErroRegua(erro);
    return;
  }

  // Tooltips são um aprimoramento — se a carga falhar, segue sem eles.
  try {
    TOOLTIPS = await carregarTooltips();
  } catch (erro) {
    TOOLTIPS = {};
  }

  // Estado de pontuação e observações derivado das chaves da régua.
  CRITERIOS.forEach((c) => {
    estado.pontuacao[c.chave] = null;
    estado.observacoes[c.chave] = '';
  });

  // Listas controladas
  popularSelect($('#id-natureza'), NATUREZAS);
  popularSelect($('#id-trilha'), TRILHAS, false);
  popularSelect($('#id-camada'), CAMADAS);
  popularSelect($('#curadoria-camada'), CAMADAS);

  renderTriagem();
  renderCriterios();
  aplicarTooltips();
  ligarEventos();
  ligarFechamentoGlobalTooltip();

  // Placeholder do campo de URL reflete a base configurada do ParticiPEN.
  $('#id-topico-url').placeholder = `${CONFIG.discourseBaseUrl}/t/minha-demanda/123`;

  $('#progresso-total').textContent = TOTAL_PASSOS;
  mostrarPasso(0);
}

document.addEventListener('DOMContentLoaded', init);
