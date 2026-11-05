// Formulário da etapa de Boas-vindas (mapa.html): nome, time e papel de quem faz o onboarding.
// As respostas vão para um Google Forms ligado a uma planilha, que registra a data e a hora de cada envio.
// Uma cópia fica no navegador da pessoa (localStorage), para o formulário reabrir preenchido.
const CHAVE = 'onboarding-apresentacao';
const FORMULARIO = 'https://docs.google.com/forms/d/e/1FAIpQLSdZslcCiiwkYf9iMJFJ8gbpk_q793D4S3RLG0xDFCqmlxajnQ/formResponse';
const ENTRADAS = { nome: 'entry.1927680381', time: 'entry.1160882069', papel: 'entry.1914617661' };
const CAMPOS = Object.keys(ENTRADAS);

// localStorage pode lançar exceção (navegação privada, cota cheia): o formulário segue funcionando.
function ler() {
  try { return JSON.parse(localStorage.getItem(CHAVE)) || {}; } catch { return {}; }
}
function gravar(dados) {
  try { localStorage.setItem(CHAVE, JSON.stringify(dados)); } catch { /* o envio já foi feito */ }
}

// O Google Forms não libera CORS: com no-cors a resposta é opaca, então só uma falha de rede é detectável.
function enviar(dados) {
  const corpo = new URLSearchParams(CAMPOS.map((c) => [ENTRADAS[c], dados[c]]));
  return fetch(FORMULARIO, { method: 'POST', mode: 'no-cors', body: corpo });
}

export function montarApresentacao() {
  const form = document.getElementById('apresentacao-form');
  const aviso = document.getElementById('apresentacao-aviso');
  const botao = form.querySelector('button[type="submit"]');
  let salvos = ler();
  CAMPOS.forEach((c) => { form.elements[c].value = typeof salvos[c] === 'string' ? salvos[c] : ''; });

  const mostrar = (texto) => { aviso.textContent = texto; aviso.hidden = false; };

  form.addEventListener('input', () => { aviso.hidden = true; });
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = Object.fromEntries(CAMPOS.map((c) => [c, form.elements[c].value.trim()]));
    // Reabrir a página e clicar de novo não deve criar outra linha na planilha.
    if (salvos.enviado && CAMPOS.every((c) => salvos[c] === dados[c])) {
      mostrar(`${dados.nome}, seus dados já foram enviados.`);
      return;
    }
    botao.disabled = true;
    try {
      await enviar(dados);
      salvos = { ...dados, enviado: true };
      gravar(salvos);
      mostrar(`Tudo certo, ${dados.nome}! Seus dados foram enviados para a equipe.`);
    } catch {
      mostrar('Não foi possível enviar. Verifique sua conexão e tente de novo.');
    } finally {
      botao.disabled = false;
    }
  });
}
