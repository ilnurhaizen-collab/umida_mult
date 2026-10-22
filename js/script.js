/* ===== Первый экран для пришедших со сказок (22.10.2026) =====
   Шапка аккаунта сказок ведёт в бот курса (start=cp_skazki), бот — сюда с ?cp=skazki (метку ставит lib/pay-label.ts
   бота); ссылка может вести на сайт и сразу с этой меткой. Тогда заголовок и подзаголовок — из <template id="heroSkazki">,
   остальная страница как у всех. Не ждём DOMContentLoaded: первый экран ещё невидим (.reveal), подмены глазом не видно. */
try {
  if ((new URLSearchParams(location.search).get('cp') || '').toLowerCase() === 'skazki') {
    const tpl = document.getElementById('heroSkazki');
    const h1 = document.querySelector('.hero-copy h1');
    const lead = document.querySelector('.hero-copy .lead');
    const skH1 = tpl && tpl.content && tpl.content.querySelector('h1');
    const skLead = tpl && tpl.content && tpl.content.querySelector('.lead');
    if (h1 && lead && skH1 && skLead) {
      h1.replaceWith(skH1.cloneNode(true));
      lead.replaceWith(skLead.cloneNode(true));
    }
  }
} catch (e) { /* старый браузер без URLSearchParams или <template> — первый экран как у всех */ }

document.addEventListener('DOMContentLoaded', () => {

  /* ===== Продающее видео над тарифами (22.10.2026) =====
     Плеер Kinescope встаёт, только когда у #video в data-kinescope есть id видео (или ссылка kinescope.io/<id>):
     пустой плеер не показываем. */
  const video = document.getElementById('video');
  const videoId = video && (video.dataset.kinescope || '').trim().match(/^(?:https?:\/\/kinescope\.io\/(?:embed\/)?)?([A-Za-z0-9_-]{3,64})\/?$/);
  if (video && videoId) {
    const frame = document.createElement('iframe');
    frame.src = 'https://kinescope.io/embed/' + videoId[1];
    frame.title = 'Видео Умиды о курсе';
    frame.allow = 'autoplay; fullscreen; picture-in-picture; encrypted-media; gyroscope; accelerometer; clipboard-write; screen-wake-lock';
    frame.allowFullscreen = true;
    frame.loading = 'lazy';
    video.appendChild(frame);
    video.hidden = false;
  }

  /* ===== Мобильное меню ===== */
  const burger = document.getElementById('burger');
  const navLinks = document.getElementById('navLinks');

  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('is-open');
      burger.classList.toggle('is-active', isOpen);
      burger.setAttribute('aria-expanded', String(isOpen));
    });

    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('is-open');
        burger.classList.remove('is-active');
        burger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ===== Аккордеоны (программа курса и FAQ) ===== */
  document.querySelectorAll('.prog .acc, .faq .acc').forEach((item) => {
    const head = item.querySelector('.acc-head');
    const body = item.querySelector('.acc-body');

    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('active');
      const group = item.closest('.prog, .faq');

      group.querySelectorAll('.acc.active').forEach((openItem) => {
        if (openItem !== item) {
          openItem.classList.remove('active');
          openItem.querySelector('.acc-body').style.maxHeight = null;
        }
      });

      if (isOpen) {
        item.classList.remove('active');
        body.style.maxHeight = null;
      } else {
        item.classList.add('active');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* ===== Анимация появления при скролле ===== */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const revealEls = document.querySelectorAll('.reveal');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach((el) => el.classList.add('is-visible'));
  } else {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach((el) => observer.observe(el));
  }

});
