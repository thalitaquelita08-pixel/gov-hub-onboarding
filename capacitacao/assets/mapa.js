// Mapa da trilha (mapa.html?trilha=<slug>), montado a partir de docs/trilhas/<slug>.json em duas telas.
// Na tela, cada nível do JSON é uma etapa e cada aula é uma tarefa:
// - visão geral (sem hash): progresso, botão Começar/Continuar, a trilha vertical com o andamento de
//   cada etapa e todas as tarefas para marcar;
// - uma etapa (#nivel-N): as tarefas da etapa e a navegação anterior/próxima.
// A ordem é sugerida, não obrigatória: qualquer etapa abre a qualquer momento.
import { progresso } from './progresso.js';
import { montarTopo } from './topo.js';
import { carregarCatalogo, carregarTrilha, escolherTrilha } from './trilha.js';
import { contar, hrefDoItem } from './progresso-nucleo.js';
import { niveisConcluidos, emBreve, statusDoNivel, chamadaDaTrilha } from './hub-nucleo.js';
import { montarCelebracao } from './celebracao.js';
import { montarApresentacao } from './apresentacao.js';
import { el, svg, ICONES } from './dom.js';

const $ = (id) => document.getElementById(id);
const ROTULO_STATUS = { concluido: 'Concluído', andamento: 'Em andamento', 'nao-iniciado': 'Não iniciado', 'em-breve': 'Em breve' };
const ARCO = 326.73;   // 2πr do anel (r = 52)

montarTopo(progresso);

const pedido = new URLSearchParams(location.search).get('trilha');
let catalogo = null;
try { catalogo = await carregarCatalogo(); } catch { catalogo = null; }
// mapa.html sem ?trilha= (ou com uma que não existe): a trilha da última tarefa, senão onboarding, senão a primeira.
const ultima = progresso.ultimaAula();
const slug = [pedido, ultima && ultima.trilha, 'onboarding']
  .find((s) => s && escolherTrilha(catalogo, s) === s) || escolherTrilha(catalogo, null);
let trilha = null;
if (slug) { try { trilha = await carregarTrilha(slug); } catch { trilha = null; } }

const rotuloNivel = (n) => `Etapa ${n.numero} · ${n.titulo}`;

// Uma tarefa: marcar como feita e abrir a página dela. Usada na visão geral e na tela da etapa.
function cartaoAula(item) {
  return el('li', {}, el('div', { class: 'item-card', 'data-id': item.id },
    el('button', {
      class: 'item-check', type: 'button', 'aria-pressed': 'false', 'aria-label': 'Marcar como concluída: ' + item.titulo,
      onclick: () => progresso.alternar([item.id]),
    }, el('span', { class: 'ring' }, svg(ICONES.check))),
    el('div', { class: 'item-body' },
      el('a', { class: 'item-title-link', href: hrefDoItem(slug, item) }, item.titulo))));
}

const listaDeAulas = (nivel) => el('ul', { class: 'item-grid', 'aria-label': 'Tarefas da etapa ' + nivel.numero }, ...nivel.itens.map(cartaoAula));

// ---- Visão geral ----------------------------------------------------------------------
function montarTrilhaVertical() {
  $('trilha-niveis').replaceChildren(...trilha.niveis.map((n) => el('li', { 'data-nivel': n.numero },
    el('a', { class: 'tstep', href: '#nivel-' + n.numero },
      el('span', { class: 'node' }, String(n.numero)),
      el('span', { class: 'tbody' },
        el('h3', {}, rotuloNivel(n)),
        n.descricao ? el('p', {}, n.descricao) : null,
        el('span', { class: 'tmeta' },
          emBreve(n) ? null : el('span', { class: 'mbar', 'aria-hidden': 'true' }, el('i')),
          emBreve(n) ? null : el('span', { class: 'mcount' }),
          el('span', { class: 'chip' }))),
      el('span', { class: 'tgo' }, svg(ICONES.avancar))))));
}

function montarChecklist() {
  $('checklist').replaceChildren(...trilha.niveis.filter((n) => !emBreve(n)).map((n) => el('section', { class: 'grp', 'aria-labelledby': 'grp-' + n.numero },
    el('h3', { id: 'grp-' + n.numero }, el('span', { class: 'gn' }, String(n.numero)), el('a', { href: '#nivel-' + n.numero }, n.titulo)),
    listaDeAulas(n))));
}

// ---- Tela de uma etapa -----------------------------------------------------------------
let nivelAtual = null;
function montarNivel(numero) {
  nivelAtual = numero;
  const i = trilha.niveis.findIndex((n) => n.numero === numero);
  const nivel = trilha.niveis[i];
  const anterior = trilha.niveis[i - 1];
  const proximo = trilha.niveis[i + 1];
  document.title = rotuloNivel(nivel) + ' · ' + trilha.titulo + ' · Gov Hub';
  $('migalhas').replaceChildren(...trilha.niveis.map((n) => el('a', {
    href: '#nivel-' + n.numero, 'data-c': n.numero, title: rotuloNivel(n),
    'aria-current': n.numero === numero ? 'step' : null,
  }, el('span', { class: 'sr-only' }, 'Etapa '), String(n.numero))));
  $('nivel-kicker').textContent = `Etapa ${i + 1} de ${trilha.niveis.length}`;
  $('nivel-titulo').textContent = nivel.titulo;
  $('nivel-icone').hidden = !nivel.icone;
  $('nivel-icone').replaceChildren(...(nivel.icone ? [el('img', { src: nivel.icone, alt: '' })] : []));
  $('nivel-desc').textContent = nivel.descricao || '';
  $('nivel-desc').hidden = !nivel.descricao;
  $('sobre-trilha').hidden = nivel.titulo !== 'Boas-vindas';
  $('apresentacao').hidden = nivel.titulo !== 'Boas-vindas';
  $('tarefas').replaceChildren(
    el('h2', {}, emBreve(nivel) ? 'Em breve' : 'Tarefas desta etapa'),
    el('p', { class: 'tbsub', id: 'tarefas-sub' }),
    ...(emBreve(nivel) ? [] : [listaDeAulas(nivel)]));
  $('paginador').replaceChildren(
    anterior
      ? el('a', { class: 'btn-fantasma', href: '#nivel-' + anterior.numero }, svg(ICONES.voltar), el('span', {}, rotuloNivel(anterior)))
      : el('a', { class: 'btn-fantasma', href: '#' }, svg(ICONES.voltar), el('span', {}, 'Visão geral da trilha')),
    proximo
      ? el('a', { class: 'btn-primario btn-grande nxt', href: '#nivel-' + proximo.numero }, el('span', {}, 'Próximo: ' + rotuloNivel(proximo)), svg(ICONES.avancar))
      : el('a', { class: 'btn-primario btn-grande nxt', href: '#' }, el('span', {}, 'Voltar para a visão geral'), svg(ICONES.avancar)));
  pintar();
}

// ---- Rotas: sem hash é a visão geral; #nivel-N é a tela da etapa ------------------------
function nivelDaUrl() {
  const m = location.hash.match(/^#nivel-(\d+)$/);
  if (!m) return null;
  const n = Number(m[1]);
  return trilha.niveis.some((x) => x.numero === n) ? n : null;
}

function rota({ foco = false } = {}) {
  const n = nivelDaUrl();
  $('visao-geral').hidden = n !== null;
  $('tela-nivel').hidden = n === null;
  if (n === null) {
    nivelAtual = null;
    document.title = trilha.titulo + ' · Gov Hub';
    pintar();
  } else {
    montarNivel(n);
  }
  window.scrollTo(0, 0);
  if (foco) (n === null ? $('principal') : $('nivel-titulo')).focus({ preventScroll: true });
}

// ---- Progresso: pinta as duas telas a partir de progresso.feitos() ----------------------
function pintar() {
  const feitos = progresso.feitos();
  const c = contar(feitos, trilha.niveis);
  const nv = niveisConcluidos(feitos, trilha.niveis);

  $('anel').hidden = false;
  $('anel-arco').style.strokeDashoffset = ARCO * (1 - (c.total ? c.feitas / c.total : 0));
  $('anel-pct').textContent = c.percentual + '%';
  $('anel-aulas').textContent = `${c.feitas} de ${c.total} tarefas`;
  $('anel-niveis').textContent = `${nv.feitos} de ${nv.total} etapas concluídas`;

  const chamada = chamadaDaTrilha(feitos, trilha.niveis);
  const alvo = trilha.niveis.find((n) => n.numero === chamada.numero);
  $('cta').hidden = !alvo;
  if (alvo) {
    $('cta').href = '#nivel-' + alvo.numero;
    $('cta-texto').textContent = chamada.acao === 'comecar' ? 'Começar a trilha'
      : chamada.acao === 'continuar' ? 'Continuar: ' + rotuloNivel(alvo) : 'Rever a trilha';
  }

  document.querySelectorAll('#trilha-niveis li').forEach((li) => {
    const nivel = trilha.niveis.find((n) => n.numero === Number(li.dataset.nivel));
    const st = statusDoNivel(feitos, nivel);
    const n = c.porNivel[nivel.numero];
    li.className = 'is-' + st;
    li.querySelector('.node').replaceChildren(st === 'concluido' ? svg(ICONES.check) : String(nivel.numero));
    const barra = li.querySelector('.mbar i');
    if (barra) barra.style.width = (n.total ? (n.feitas / n.total) * 100 : 0) + '%';
    const conta = li.querySelector('.mcount');
    if (conta) conta.textContent = `${n.feitas} de ${n.total} tarefas`;
    const chip = li.querySelector('.chip');
    chip.className = 'chip ' + st;
    chip.textContent = ROTULO_STATUS[st];
  });

  document.querySelectorAll('.item-card').forEach((card) => {
    const feito = !!feitos[card.dataset.id];
    card.classList.toggle('done', feito);
    card.querySelector('.item-check').setAttribute('aria-pressed', String(feito));
  });

  const tudo = c.total > 0 && c.feitas === c.total;
  $('concluida-msg').hidden = !tudo;
  $('limpar').disabled = c.feitas === 0;

  if (nivelAtual !== null) {
    const nivel = trilha.niveis.find((n) => n.numero === nivelAtual);
    const n = c.porNivel[nivelAtual];
    $('tarefas-sub').textContent = emBreve(nivel)
      ? 'Esta etapa ainda está em produção. As tarefas aparecem aqui assim que forem publicadas.'
      : n.feitas === n.total ? 'Etapa concluída. Siga para a próxima.'
        : `${n.feitas} de ${n.total} concluídas. Marque cada tarefa quando terminar.`;
    document.querySelectorAll('#migalhas a').forEach((a) => {
      const nv2 = trilha.niveis.find((x) => x.numero === Number(a.dataset.c));
      a.classList.toggle('is-done', statusDoNivel(feitos, nv2) === 'concluido');
    });
  }
  if (celebracao) celebracao.verificar();
}

// ---- Limpar o progresso desta trilha ---------------------------------------------------
function montarLimpar() {
  const fundo = $('confirmar');
  let antes = null;
  const fechar = () => { fundo.hidden = true; if (antes) antes.focus(); };
  const feitasDaTrilha = () => trilha.niveis.flatMap((n) => n.itens.map((i) => i.id)).filter((id) => progresso.feitos()[id]);
  $('limpar').addEventListener('click', () => {
    const ids = feitasDaTrilha();
    $('confirmar-texto').textContent = (ids.length === 1 ? 'Isso desmarca a tarefa concluída desta trilha. ' : `Isso desmarca as ${ids.length} tarefas concluídas desta trilha. `) +
      'Não dá para desfazer.';
    antes = document.activeElement;
    fundo.hidden = false;
    $('confirmar-nao').focus();
  });
  $('confirmar-nao').addEventListener('click', fechar);
  $('confirmar-sim').addEventListener('click', () => {
    const ids = feitasDaTrilha();
    if (ids.length) progresso.alternar(ids);   // todas feitas: alternar desmarca
    fechar();
  });
  fundo.addEventListener('click', (ev) => { if (ev.target === fundo) fechar(); });
  document.addEventListener('keydown', (ev) => {
    if (fundo.hidden) return;
    if (ev.key === 'Escape') fechar();
    if (ev.key === 'Tab') {
      const lista = [$('confirmar-nao'), $('confirmar-sim')];
      const i = lista.indexOf(document.activeElement);
      if (ev.shiftKey && i <= 0) { ev.preventDefault(); lista[1].focus(); }
      else if (!ev.shiftKey && i === lista.length - 1) { ev.preventDefault(); lista[0].focus(); }
    }
  });
}

let celebracao = null;
if (!trilha) {
  $('trilha-titulo').textContent = 'Trilha não encontrada';
  $('trilha-chamada').replaceChildren('Não foi possível carregar esta trilha. ',
    el('a', { href: 'index.html#trilhas', class: 'btn-link' }, 'Ver todas as trilhas'));
  document.querySelectorAll('#visao-geral .bloco').forEach((b) => { b.hidden = true; });
} else {
  if (pedido !== slug) history.replaceState(null, '', 'mapa.html?trilha=' + encodeURIComponent(slug) + location.hash);
  $('trilha-titulo').textContent = trilha.titulo;
  $('trilha-chamada').textContent = trilha.chamada || trilha.descricao;
  $('voltar-geral').replaceChildren(svg(ICONES.voltar), 'Visão geral da trilha');
  celebracao = montarCelebracao(progresso, slug, trilha, { temQuiz: false });
  montarTrilhaVertical();
  montarChecklist();
  montarLimpar();
  montarApresentacao();
  rota();
  window.addEventListener('hashchange', () => rota({ foco: true }));
  progresso.aoMudar(pintar);
}
