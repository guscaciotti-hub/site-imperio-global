/* =====================================================================
   IMPÉRIO GLOBAL — main.js
   Vanilla JS, sem dependências. Partilhado pelos três idiomas.
   Blocos: menu móvel · reveal · contadores · banner de cookies ·
           validação de formulários (Formspree) · WhatsApp (flag).
   ===================================================================== */

/* --------------------------------------------------------------------
   CONFIGURAÇÃO — editar aqui
   -------------------------------------------------------------------- */
// WhatsApp flutuante: manter false até o cliente confirmar o número.
const ENABLE_WHATSAPP = false;
const WHATSAPP_NUMBER  = '351000000000';      // TODO: número real (formato internacional, sem +)
const WHATSAPP_MESSAGE = 'Olá, gostaria de mais informações.';

// Endpoint Formspree — substituir FORMSPREE_ID pelo id real da conta.
// Alternativa: se a hospedagem final for Netlify, ver nota no README (Netlify Forms).
const FORMSPREE_ID = 'FORMSPREE_ID'; // TODO
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/' + FORMSPREE_ID;

/* --------------------------------------------------------------------
   Textos de estado dos formulários por idioma (detetado via <html lang>)
   -------------------------------------------------------------------- */
const LANG = (document.documentElement.lang || 'pt').slice(0, 2);
const I18N = {
  pt: { sending:'A enviar…', ok:'Mensagem enviada com sucesso. Entraremos em contacto brevemente.',
        err:'Ocorreu um erro ao enviar. Tente novamente ou contacte-nos por email.',
        fileBig:'O ficheiro excede o limite de 5 MB.', fileType:'Formato inválido. Use PDF ou DOC.',
        consent:'É necessário aceitar a política de privacidade.' },
  en: { sending:'Sending…', ok:'Message sent successfully. We will get back to you shortly.',
        err:'An error occurred while sending. Please try again or email us.',
        fileBig:'The file exceeds the 5 MB limit.', fileType:'Invalid format. Use PDF or DOC.',
        consent:'You must accept the privacy policy.' },
  fr: { sending:'Envoi…', ok:'Message envoyé avec succès. Nous vous répondrons sous peu.',
        err:"Une erreur s'est produite lors de l'envoi. Réessayez ou contactez-nous par email.",
        fileBig:'Le fichier dépasse la limite de 5 Mo.', fileType:'Format invalide. Utilisez PDF ou DOC.',
        consent:'Vous devez accepter la politique de confidentialité.' },
};
const T = I18N[LANG] || I18N.pt;

/* -------------------------------------------------- Menu móvel */
(function menu(){
  const toggle = document.querySelector('.nav__toggle');
  const nav = document.querySelector('.nav__menu');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
  // fecha ao clicar num link
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
})();

/* -------------------------------------------------- Reveal ao scroll */
(function reveal(){
  const els = document.querySelectorAll('.rv');
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('on')); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ e.target.classList.add('on'); io.unobserve(e.target); } });
  }, { threshold:.14 });
  els.forEach(e => io.observe(e));
})();

/* -------------------------------------------------- Contadores (números) */
(function counters(){
  const nums = document.querySelectorAll('[data-count]');
  if (!nums.length) return;
  const run = (el) => {
    const target = parseInt(el.dataset.count, 10);
    const prefix = el.dataset.prefix || '';
    const suffix = el.dataset.suffix || '';
    const dur = 1400; const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const val = Math.floor((1 - Math.pow(1 - p, 3)) * target); // ease-out
      el.textContent = prefix + val + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting){ run(e.target); io.unobserve(e.target); } });
  }, { threshold:.5 });
  nums.forEach(n => io.observe(n));
})();

/* -------------------------------------------------- Ano corrente no rodapé */
document.querySelectorAll('[data-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

/* -------------------------------------------------- Banner de cookies (RGPD) */
(function cookies(){
  const banner = document.querySelector('.cookies');
  if (!banner) return;
  const KEY = 'ig_cookie_consent';
  const saved = localStorage.getItem(KEY);
  if (!saved) banner.classList.add('is-visible');
  else if (saved === 'accept') loadAnalytics();

  banner.querySelector('[data-cookie="accept"]')?.addEventListener('click', () => {
    localStorage.setItem(KEY, 'accept'); banner.classList.remove('is-visible'); loadAnalytics();
  });
  banner.querySelector('[data-cookie="reject"]')?.addEventListener('click', () => {
    localStorage.setItem(KEY, 'reject'); banner.classList.remove('is-visible');
  });

  function loadAnalytics(){
    // TODO: carregar aqui GA/GTM só APÓS consentimento. Placeholder intencional.
    // Ex.: injetar o script do Google Tag Manager quando o cliente fornecer o ID.
  }
})();

/* -------------------------------------------------- WhatsApp flutuante (flag) */
(function whatsapp(){
  const el = document.querySelector('.whatsapp-float');
  if (!el || !ENABLE_WHATSAPP) return;
  el.href = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodeURIComponent(WHATSAPP_MESSAGE);
  el.classList.add('is-enabled');
})();

/* -------------------------------------------------- Formulários (Formspree + validação) */
(function forms(){
  const forms = document.querySelectorAll('form[data-formspree]');
  forms.forEach((form) => {
    const status = form.querySelector('.form__status');
    const fileInput = form.querySelector('input[type=file]');

    form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      clearErrors(form);
      if (!validate(form, fileInput)) return;

      if (status){ status.textContent = T.sending; status.style.color = 'var(--cinza-texto)'; }
      const submitBtn = form.querySelector('[type=submit]');
      submitBtn && (submitBtn.disabled = true);

      try {
        const res = await fetch(FORMSPREE_ENDPOINT, {
          method:'POST', body:new FormData(form), headers:{ Accept:'application/json' },
        });
        if (res.ok){
          form.reset();
          if (status){ status.textContent = T.ok; status.style.color = 'var(--azul-sinal)'; }
        } else { throw new Error('bad response'); }
      } catch {
        if (status){ status.textContent = T.err; status.style.color = '#b3261e'; }
      } finally {
        submitBtn && (submitBtn.disabled = false);
      }
    });
  });

  function validate(form, fileInput){
    let ok = true;
    // consentimento RGPD obrigatório
    const consent = form.querySelector('input[name="consentimento"]');
    if (consent && !consent.checked){ setError(consent, T.consent); ok = false; }
    // validação de ficheiro (CV)
    if (fileInput && fileInput.files.length){
      const f = fileInput.files[0];
      const okType = /\.(pdf|docx?|)$/i.test(f.name) && /(pdf|word|officedocument|msword|octet-stream)/i.test(f.type || 'application/pdf');
      const byExt = /\.(pdf|doc|docx)$/i.test(f.name);
      if (!byExt){ setError(fileInput, T.fileType); ok = false; }
      else if (f.size > 5 * 1024 * 1024){ setError(fileInput, T.fileBig); ok = false; }
    }
    return ok;
  }
  function setError(field, msg){
    const holder = field.closest('.field') || field.closest('.consent');
    let box = holder && holder.querySelector('.form__error');
    if (!box && holder){ box = document.createElement('div'); box.className = 'form__error'; holder.appendChild(box); }
    if (box) box.textContent = msg;
    field.setAttribute('aria-invalid', 'true');
  }
  function clearErrors(form){
    form.querySelectorAll('.form__error').forEach(b => b.textContent = '');
    form.querySelectorAll('[aria-invalid]').forEach(f => f.removeAttribute('aria-invalid'));
  }
})();
