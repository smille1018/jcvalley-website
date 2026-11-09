/* JC VALLEY — shared behaviour */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const page = document.body.dataset.page;

  /* 현재 페이지 메뉴 표시 */
  $$('[data-nav="' + page + '"]').forEach((a) => {
    a.classList.add('is-current');
    a.setAttribute('aria-current', 'page');
  });

  /* 헤더 스크롤 상태 */
  const nav = $('#nav');
  const onScroll = () => nav && nav.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* 모바일 메뉴 */
  const menuBtn = $('#menuBtn');
  const mobileMenu = $('#mobileMenu');
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      const open = mobileMenu.classList.toggle('hidden') === false;
      menuBtn.setAttribute('aria-expanded', String(open));
    });
  }

  /* KR / EN 전환: data-en 속성의 영문으로 교체, 원문은 data-ko에 보관 */
  const LANG_KEY = 'jcv-lang';
  function applyLang(lang) {
    $$('[data-en]').forEach((el) => {
      if (el.dataset.ko === undefined) el.dataset.ko = el.innerHTML;
      el.innerHTML = lang === 'en' ? el.dataset.en : el.dataset.ko;
    });
    $$('[data-en-placeholder]').forEach((el) => {
      if (el.dataset.koPlaceholder === undefined) el.dataset.koPlaceholder = el.placeholder;
      el.placeholder = lang === 'en' ? el.dataset.enPlaceholder : el.dataset.koPlaceholder;
    });
    document.documentElement.lang = lang;
    $$('.lang-opt').forEach((b) => {
      const on = b.dataset.lang === lang;
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    try { localStorage.setItem(LANG_KEY, lang); } catch (e) {}
    document.dispatchEvent(new Event('langchange'));
  }
  $$('.lang-opt').forEach((b) => b.addEventListener('click', () => applyLang(b.dataset.lang)));
  let saved = 'ko';
  try { saved = localStorage.getItem(LANG_KEY) || 'ko'; } catch (e) {}
  if (saved === 'en') applyLang('en');

  /* 스크롤 등장 */
  const io = 'IntersectionObserver' in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    : null;
  $$('.reveal').forEach((el) => (io ? io.observe(el) : el.classList.add('in')));

  /* 숫자 카운터 */
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function runCounter(el) {
    const target = parseFloat(el.dataset.target);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    if (reduce) { el.textContent = target.toFixed(dec); return; }
    const dur = 1400; const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (target * eased).toFixed(dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  const counters = $$('.counter');
  if (counters.length) {
    const cio = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.4 });
    counters.forEach((c) => cio.observe(c));
  }

  /* 실적 필터 */
  const grid = $('#cardGrid');
  if (grid) {
    const btns = $$('.filter-btn');
    const count = $('#resultCount');
    btns.forEach((btn) => btn.addEventListener('click', () => {
      const f = btn.dataset.filter;
      btns.forEach((b) => { b.classList.toggle('is-active', b === btn); b.setAttribute('aria-pressed', String(b === btn)); });
      let n = 0;
      $$('.op-card', grid).forEach((c) => {
        const show = f === 'all' || c.dataset.cat === f;
        c.classList.toggle('is-hidden', !show);
        if (show) n++;
      });
      if (count) count.textContent = n;
    }));
  }

  /* 문의 폼 — TODO: 백엔드(Formspree / Netlify Forms / Cloudflare Worker 등) 연결 전까지 안내만 표시 */
  const form = $('#proposalForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const note = $('#formNote');
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      note.classList.remove('hidden');
      note.textContent = document.documentElement.lang === 'en'
        ? 'Thank you. (Draft: the form is not connected to a backend yet.)'
        : '문의가 접수되었습니다. (초안: 아직 백엔드가 연결되지 않았습니다.)';
    });
  }

  /* ============ HOME 모션 ============ */
  if (reduce) document.documentElement.classList.add('no-motion');

  /* 히어로 SVG: 모션 줄이기 설정이면 SMIL 정지 */
  const heroArt = $('#heroArt');
  if (heroArt && reduce && heroArt.pauseAnimations) heroArt.pauseAnimations();

  /* 헤드라인 단어 교체 (Blur Crossfade) */
  const rot = $('.rotator');
  if (rot && !reduce) {
    let i = 0;
    setInterval(() => {
      if (document.hidden) return;
      const words = $$('.rotator-word', rot);
      const cur = words[i % words.length];
      const next = words[(i + 1) % words.length];
      words.forEach((w) => w.classList.remove('is-off'));
      cur.classList.remove('is-on');
      cur.classList.add('is-off');
      next.classList.add('is-on');
      i++;
    }, 2600);
  }

  /* 선언문: 단어 단위로 쪼개 스크롤 진행만큼 채움 */
  const scrubs = $$('.scrub');
  function splitWords(el) {
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.innerHTML = text.split(' ').map((w) => '<span class="w">' + w + '</span>').join(' ');
  }

  /* 여정 · 점 그리드 */
  const journey = $('.journey-list');
  const steps = journey ? $$('.step', journey) : [];
  const dotgrid = $('.dotgrid');
  if (dotgrid) dotgrid.innerHTML = '<i></i>'.repeat(parseInt(dotgrid.dataset.count || '0', 10));
  const dots = dotgrid ? $$('i', dotgrid) : [];
  let lastLit = -1;

  // 요소 top이 화면 높이의 start 지점에 오면 0, end 지점에 오면 1
  function progressOf(el, start, end) {
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const p = (vh * start - r.top) / (vh * (start - end) + r.height * 0.5);
    return Math.max(0, Math.min(1, p));
  }

  function onScrollFx() {
    if (reduce) {
      scrubs.forEach((el) => $$('.w', el).forEach((w) => w.classList.add('on')));
      steps.forEach((s) => s.classList.add('on'));
      if (journey) journey.style.setProperty('--p', 1);
      dots.forEach((d) => d.classList.add('on'));
      return;
    }
    scrubs.forEach((el) => {
      const words = $$('.w', el);
      const k = Math.round(progressOf(el, 0.85, 0.35) * words.length);
      words.forEach((w, idx) => w.classList.toggle('on', idx < k));
    });
    if (journey) {
      const p = progressOf(journey, 0.8, 0.4);
      journey.style.setProperty('--p', p.toFixed(3));
      steps.forEach((s, idx) => s.classList.toggle('on', p >= idx / (steps.length - 1) - 0.02));
    }
    if (dots.length) {
      const k = Math.round(progressOf(dotgrid, 0.9, 0.3) * dots.length);
      if (k !== lastLit) {
        dots.forEach((d, idx) => { d.classList.toggle('on', idx < k); d.classList.remove('hl'); });
        if (k > 0 && k < dots.length) dots[k - 1].classList.add('hl');
        lastLit = k;
      }
    }
  }
  function prepScrubs() { scrubs.forEach(splitWords); onScrollFx(); }

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { onScrollFx(); ticking = false; });
  }, { passive: true });
  window.addEventListener('resize', onScrollFx);
  document.addEventListener('langchange', prepScrubs);
  prepScrubs();

  /* 파트너 그리드: 가운데부터 퍼져나가며 등장 */
  const igrid = $('.igrid');
  if (igrid) {
    const gio = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { igrid.classList.add('in'); gio.disconnect(); }
    }), { threshold: 0.2 });
    gio.observe(igrid);
  }

  /* 문의 페이지: ?type=partner 이면 파트너십 항목 미리 선택 */
  const typeSel = $('#type');
  if (typeSel && new URLSearchParams(location.search).get('type') === 'partner') typeSel.value = 'partner';
})();
