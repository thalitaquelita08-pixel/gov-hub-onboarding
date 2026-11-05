// Modal "Você concluiu a trilha" (mapa e aula): abre uma vez quando a última aula da trilha é
// marcada, com o link para o quiz de revisão.
import { el, svg, ICONES } from './dom.js';
import { todosFeitos } from './progresso-nucleo.js';

const chave = (slug) => 'govhub-celebrada-' + slug;
const ler = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const gravar = (k, v) => { try { if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* sem armazenamento */ } };

export function montarCelebracao(progresso, slug, trilha, { temQuiz }) {
  const ids = trilha.niveis.flatMap((n) => n.itens.map((i) => i.id));
  const fechar = el('button', { class: 'modal-close', type: 'button', 'aria-label': 'Fechar', onclick: () => esconder() }, '×');
  const caixa = el('div', { class: 'modal-box celebration-box', role: 'dialog', 'aria-modal': 'true',
    'aria-labelledby': 'celebracao-titulo', 'aria-describedby': 'celebracao-texto' },
    fechar,
    el('span', { class: 'celebration-badge' }, svg(ICONES.check)),
    el('h2', { id: 'celebracao-titulo' }, 'Você concluiu a trilha ' + trilha.titulo),
    el('p', { id: 'celebracao-texto' }, `As ${ids.length} tarefas foram concluídas. Você pode voltar aqui como referência sempre que precisar.`),
    el('div', { class: 'modal-actions' },
      el('button', { class: 'btn-secundario', type: 'button', onclick: () => esconder() }, 'Fechar'),
      temQuiz ? el('a', { class: 'btn-primario', href: 'quiz.html?trilha=' + encodeURIComponent(slug) }, 'Fazer o quiz de revisão →') : null));
  const fundo = el('div', { class: 'modal-overlay', hidden: true, onclick: (ev) => { if (ev.target === fundo) esconder(); } }, caixa);
  document.body.append(fundo);
  let antes = null;

  function focaveis() { return [...caixa.querySelectorAll('button:not(:disabled),a[href]')].filter((n) => n.offsetParent !== null || n === fechar); }
  function mostrar() {
    antes = document.activeElement;
    fundo.hidden = false;
    fechar.focus();
  }
  function esconder() {
    if (fundo.hidden) return;
    fundo.hidden = true;
    if (antes && antes.isConnected) antes.focus();
  }
  document.addEventListener('keydown', (ev) => {
    if (fundo.hidden || !caixa.contains(document.activeElement)) return;   // o modal de login está por cima
    if (ev.key === 'Escape') { esconder(); return; }
    if (ev.key !== 'Tab') return;
    const lista = focaveis();
    const i = lista.indexOf(document.activeElement);
    if (ev.shiftKey && i <= 0) { ev.preventDefault(); lista[lista.length - 1].focus(); }
    else if (!ev.shiftKey && i === lista.length - 1) { ev.preventDefault(); lista[0].focus(); }
  });

  return {
    // Chamada a cada mudança do progresso: abre na primeira vez que a trilha fica completa.
    verificar() {
      const completa = todosFeitos(progresso.feitos(), ids);
      const ja = ler(chave(slug)) === '1';
      if (completa && !ja) { gravar(chave(slug), '1'); mostrar(); }
      else if (!completa && ja) gravar(chave(slug), null);
    },
    completa: () => todosFeitos(progresso.feitos(), ids),
  };
}
