// Topo comum a todas as páginas: a barra do Gov Hub e, abaixo, a sub-barra do onboarding
// (busca); o rodapé e o aviso de sincronização.
// Cada página tem só <header class="site" id="topo"></header>.
import { el, svg, ICONES } from './dom.js';
import { carregarCatalogo, carregarTrilha } from './trilha.js';
import { buscarAulas } from './hub-nucleo.js';
import { hrefDoItem } from './progresso-nucleo.js';

export const EMAIL_CONTATO = 'govhub@unb.br';

const INICIO = 'mapa.html?trilha=onboarding';
const REDES = [
  ['https://www.instagram.com/govhub.br', 'instagram', 'Instagram'],
  ['https://github.com/GovHub-br/gov-hub', 'github', 'GitHub'],
];

// Barra do Gov Hub: só a marca e as redes. O site é uma página só, a trilha de onboarding.
function montarBarraSite() {
  return el('div', { class: 'gh-nav' }, el('div', { class: 'gh-nav-in' },
    el('a', { class: 'gh-logo', href: INICIO },
      el('img', { src: 'assets/logo/logomarca-horizontal-white.svg', alt: 'Gov Hub', width: 128, height: 30 })),
    el('div', { class: 'gh-social' }, ...REDES.map(([href, icone, nome]) =>
      el('a', { href, target: '_blank', rel: 'noopener', 'aria-label': nome },
        el('img', { src: `assets/logo/redes/${icone}.svg`, alt: '' }))))));
}

export function montarTopo(progresso) {
  const raiz = document.getElementById('topo');
  // Sub-barra do onboarding (busca), abaixo da barra do Gov Hub.
  raiz.replaceChildren(montarBarraSite(), el('div', { class: 'site-nav' }, el('div', { class: 'site-nav-in' },
    el('a', { class: 'marca', href: INICIO }, el('span', {}, 'Onboarding Gov Hub')),
    montarBusca())));
  montarAviso(progresso);
  document.body.append(montarRodape());
}

// ---- Rodapé: quem faz o Gov Hub e o contato ---------------------------------------------------
const PARCEIROS = [
  ['lab-livre-white.svg', 'Lab Livre'], ['unb-light-outlined.svg', 'Universidade de Brasília'],
  ['capibaribe.png', 'Capibaribe'], ['Cidade_Democratica.png', 'Instituto Cidade Democrática'],
];
const APOIO = [
  ['ipea_footer.png', 'Ipea'], ['cidades.png', 'Ministério das Cidades'],
  ['igualdaderacial.png', 'Ministério da Igualdade Racial'], ['MGI_logo.png', 'Ministério da Gestão e da Inovação em Serviços Públicos'],
  ['MINC_logo.png', 'Ministério da Cultura'],
];

function montarRodape() {
  const logos = (lista) => el('div', { class: 'gh-rodape-logos' },
    ...lista.map(([arq, nome]) => el('div', { class: 'gh-rodape-logo' }, el('img', { src: 'assets/logo/parceiros/' + arq, alt: nome }))));
  return el('footer', { class: 'site gh-rodape' }, el('div', { class: 'gh-rodape-in' },
    el('p', { class: 'gh-rodape-rotulo' }, 'Gov Hub é uma iniciativa'), logos(PARCEIROS),
    el('p', { class: 'gh-rodape-rotulo' }, 'Apoio'), logos(APOIO),
    el('div', { class: 'gh-rodape-links' },
      el('div', { class: 'gh-rodape-contato' }, el('h4', {}, 'Contato'), el('ul', {}, el('li', {}, el('a', { href: 'mailto:' + EMAIL_CONTATO }, EMAIL_CONTATO))),
        el('div', { class: 'gh-social' }, ...REDES.map(([href, icone, nome]) =>
          el('a', { href, target: '_blank', rel: 'noopener', 'aria-label': nome },
            el('img', { src: `assets/logo/redes/${icone}.svg`, alt: '' })))))),
    el('p', { class: 'gh-rodape-credito' }, 'Onboarding Gov Hub')));
}

// ---- Busca: títulos das aulas das trilhas abertas --------------------------------------
function montarBusca() {
  const lista = el('ul', { class: 'search-results', id: 'busca-resultados', hidden: true });
  const status = el('span', { class: 'sr-only', role: 'status', 'aria-live': 'polite' });
  const campo = el('input', {
    type: 'search', id: 'busca', placeholder: 'Buscar tarefas…', autocomplete: 'off',
    'aria-label': 'Buscar tarefas', 'aria-controls': 'busca-resultados',
  });
  let trilhas = null;
  async function carregar() {
    if (trilhas) return trilhas;
    const catalogo = await carregarCatalogo();
    const abertas = catalogo.trilhas.filter((t) => !t.status);   // nem em breve nem oculta
    trilhas = await Promise.all(abertas.map((t) => carregarTrilha(t.slug)));
    return trilhas;
  }
  function fechar() { lista.hidden = true; }
  async function buscar() {
    const termo = campo.value;
    if (!termo.trim()) { fechar(); status.textContent = ''; return; }
    let todas;
    try { todas = await carregar(); } catch { return; }
    if (campo.value !== termo) return;   // a pessoa continuou digitando
    const achados = buscarAulas(todas, termo);
    const variasTrilhas = todas.length > 1;
    lista.replaceChildren(...(achados.length ? achados.map((a) => el('li', {},
      el('a', { class: 'search-result-item', href: hrefDoItem(a.trilha, a.item) },
        el('img', { src: a.item.icone, alt: '' }),
        el('span', {},
          el('span', { class: 'search-result-title' }, a.item.titulo),
          el('span', { class: 'search-result-level' },
            (variasTrilhas ? a.trilhaTitulo + ' · ' : '') + `Nível ${a.nivel} · ${a.nivelTitulo}`)))))
      : [el('li', { class: 'search-empty' }, 'Nada encontrado. Tente outro termo.')]));
    lista.hidden = false;
    status.textContent = achados.length ? `${achados.length} resultado${achados.length > 1 ? 's' : ''}` : 'Nada encontrado';
  }
  campo.addEventListener('input', buscar);
  campo.addEventListener('focus', () => { if (campo.value.trim()) buscar(); });
  campo.addEventListener('keydown', (ev) => {
    if (ev.key === 'ArrowDown') { const a = lista.querySelector('a'); if (a && !lista.hidden) { ev.preventDefault(); a.focus(); } }
  });
  lista.addEventListener('keydown', (ev) => {
    const links = [...lista.querySelectorAll('a')];
    const i = links.indexOf(document.activeElement);
    if (ev.key === 'ArrowDown' && i < links.length - 1) { ev.preventDefault(); links[i + 1].focus(); }
    if (ev.key === 'ArrowUp') { ev.preventDefault(); (i > 0 ? links[i - 1] : campo).focus(); }
  });
  const caixa = el('div', { class: 'site-search', role: 'search' },
    el('span', { class: 'search-icon' }, svg(ICONES.busca)), campo, lista, status);
  document.addEventListener('click', (ev) => { if (!caixa.contains(ev.target)) fechar(); });
  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Escape' && !lista.hidden) { fechar(); campo.focus(); }
  });
  return caixa;
}

function montarAviso(progresso) {
  const caixa = el('div', { class: 'aviso', role: 'status', 'aria-live': 'polite' });
  document.body.append(caixa);
  let temporizador = null;
  function mostrar(texto, { fixo = false } = {}) {
    caixa.textContent = texto;
    caixa.classList.add('visivel');
    clearTimeout(temporizador);
    if (!fixo) temporizador = setTimeout(esconder, 6000);
  }
  function esconder() {
    caixa.classList.remove('visivel');
    caixa.textContent = '';
  }
  progresso.aoAviso((texto) => mostrar(texto));
  // O Firestore guarda as marcações feitas sem conexão e as envia quando ela volta.
  window.addEventListener('offline', () => {
    if (progresso.usuario()) mostrar('Sem conexão: suas marcações serão sincronizadas quando a conexão voltar.', { fixo: true });
  });
  window.addEventListener('online', esconder);
}
