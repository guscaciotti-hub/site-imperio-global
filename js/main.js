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

/* -------------------------------------------------- Hero: feixes de fibra ótica (canvas) */
(function heroFiber(){
  const heroes = document.querySelectorAll('.hero');
  if (!heroes.length) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Sprites de brilho (bokeh) pré-renderizados — partículas de energia nas cores da marca
  function makeSprite(mid){
    const s = 64, oc = document.createElement('canvas'); oc.width = oc.height = s;
    const g = oc.getContext('2d');
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, 'rgba(255,255,255,0.95)');
    gr.addColorStop(0.28, mid);
    gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(s / 2, s / 2, s / 2, 0, 6.2832); g.fill();
    return oc;
  }
  const SPRITES = [
    makeSprite('rgba(0,114,206,0.55)'), makeSprite('rgba(90,169,236,0.60)'),
    makeSprite('rgba(120,180,240,0.50)'), makeSprite('rgba(175,196,214,0.45)'),
  ];

  heroes.forEach((hero) => {
    const canvas = document.createElement('canvas');
    canvas.className = 'hero__fiber';
    canvas.setAttribute('aria-hidden', 'true');
    hero.insertBefore(canvas, hero.firstChild);
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, dpr = 1, fx = 0, fy = 0, parts = [], raf = 0, running = false;

    function resize(){
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(90, Math.round(w * h / 20000));
      parts = Array.from({ length: n }, () => spawn(true));
    }
    // partícula de energia: nasce em baixo (na zona luminosa da foto) e sobe, dissipando no topo
    function spawn(seed){
      const bright = Math.random() < 0.72;               // maioria na zona de luz (direita/centro)
      const x = bright ? (0.36 + Math.random() * 0.64) * w : Math.random() * w;
      const y = seed ? Math.random() * h : h * (0.60 + Math.random() * 0.45);
      return {
        x, y,
        r: 0.5 + Math.random() * 1.3,                    // raio do ponto (subtil)
        vy: -(0.10 + Math.random() * 0.34),              // sobe (vertical, de baixo para cima)
        swAmp: 4 + Math.random() * 14, swSpd: 0.006 + Math.random() * 0.014, phase: Math.random() * 6.28,
        age: seed ? Math.random() * 260 : 0, dur: 240 + Math.random() * 340,
        s: SPRITES[(Math.random() * SPRITES.length) | 0],
      };
    }
    function step(){
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (const p of parts){
        p.age++;
        p.y += p.vy;                                     // sobe
        const x = p.x + Math.sin(p.phase + p.age * p.swSpd) * p.swAmp;  // leve oscilação horizontal
        const t = p.age / p.dur;                         // 0 → 1 ao longo da vida
        const alpha = Math.sin(Math.max(0, Math.min(1, t)) * Math.PI);  // aparece e dissipa suavemente
        const sz = p.r * 7;
        ctx.globalAlpha = alpha * 0.5;
        ctx.drawImage(p.s, x - sz / 2, p.y - sz / 2, sz, sz);
        if (t >= 1 || p.y < -30) Object.assign(p, spawn(false));       // renasce em baixo
      }
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      if (running) raf = requestAnimationFrame(step);
    }
    function start(){ if (!running){ running = true; raf = requestAnimationFrame(step); } }
    function stop(){ running = false; cancelAnimationFrame(raf); }

    resize();
    if (reduce){ step(); return; }                     // 1 frame estático se o utilizador prefere menos movimento
    // só anima quando o hero está visível (poupa CPU)
    const io = new IntersectionObserver((es) => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0 });
    io.observe(hero);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(resize, 200); });
  });
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
