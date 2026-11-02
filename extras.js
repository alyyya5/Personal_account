/* extras.js — улучшения внешнего вида и удобства. Подключается в index.html перед </body> */
(function () {
  const css = `
  :root{--text-muted:#6f7a90}body.dark-mode{--text-muted:#9aa5bd}
  .math-symbol{zoom:.7;color:rgba(53,103,201,.09)!important}body.dark-mode .math-symbol{color:rgba(130,160,255,.09)!important}
  .weekday{font-size:.85rem;color:var(--text-secondary)}.stat-sublabel{font-size:.92rem}.card-status{font-size:.85rem}
  #passwordInput{padding-right:46px}
  #hero{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:24px 28px;margin-bottom:22px;border-radius:28px;color:#fff;background:linear-gradient(135deg,var(--accent-blue),var(--accent-purple));box-shadow:var(--shadow-md)}
  #hero small{opacity:.85;font-weight:700}#hero h2{font-size:1.6rem;margin:4px 0}#hero p{opacity:.92}
  #hero .hb{display:flex;gap:10px;flex-wrap:wrap}
  #hero a{padding:14px 26px;border-radius:16px;font-weight:800;text-decoration:none;background:#fff;color:var(--accent-blue)}
  #hero a.s{background:rgba(255,255,255,.22);color:#fff}#hero a.off{opacity:.45;pointer-events:none}
  .dl{margin-top:10px;font-size:.85rem;font-weight:750;color:var(--accent-orange)}.dl.late{color:var(--accent-red)}
  #allBtn.on{background:var(--accent-blue);color:#fff}#allBtn{width:auto!important;padding:0 14px}
  @media(max-width:950px){
   .sidebar{transform:none!important;top:auto!important;left:0!important;right:0!important;bottom:0!important;width:100%;height:auto;flex-direction:row;padding:6px 8px;border-radius:22px 22px 0 0}
   .sidebar-logo,.sidebar-bottom,.sidebar-toggle{display:none!important}
   .nav-list{flex-direction:row;width:100%;gap:4px}
   .nav-item{flex:1;flex-direction:column;gap:3px;justify-content:center;align-items:center;text-align:center;font-size:.72rem;padding:8px 2px}
   .main-wrapper{padding-top:20px!important;padding-bottom:96px!important}
  }`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // тёмная тема по настройке телефона, пока не выбрана вручную
  if (localStorage.getItem('darkMode') === null && matchMedia('(prefers-color-scheme: dark)').matches)
    document.body.classList.add('dark-mode');

  // «показать пароль»
  const pw = document.getElementById('passwordInput'), eye = document.createElement('button');
  eye.type = 'button'; eye.textContent = '👁';
  eye.style.cssText = 'position:absolute;right:10px;bottom:9px;border:0;background:none;font-size:1.2rem;cursor:pointer';
  pw.parentElement.style.position = 'relative'; pw.parentElement.appendChild(eye);
  eye.onclick = () => { pw.type = pw.type === 'password' ? 'text' : 'password'; };

  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

  // блок «Ближайший урок»
  function hero() {
    const pg = document.getElementById('page-schedule');
    if (!pg || typeof lessonsData === 'undefined' || !lessonsData.length) return;
    let h = document.getElementById('hero');
    if (!h) { h = document.createElement('div'); h.id = 'hero'; pg.insertBefore(h, pg.firstChild); }
    const now = new Date();
    const L = lessonsData.map(l => ({ l, s: new Date(l.date + 'T' + l.start), e: new Date(l.date + 'T' + l.end) }))
      .filter(x => x.e > now).sort((a, b) => a.s - b.s)[0];
    if (!L) { h.style.display = 'none'; return; }
    h.style.display = '';
    const ms = L.s - now, m = Math.floor(ms / 6e4), d = Math.floor(m / 1440), hh = Math.floor(m % 1440 / 60);
    const left = ms <= 0 ? 'Урок идёт прямо сейчас' : 'Через ' + (d ? d + ' д ' : '') + (d || hh ? hh + ' ч ' : '') + (m % 60) + ' мин';
    const day = L.s.toDateString() === now.toDateString() ? 'Сегодня' : L.s.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    const l = L.l;
    const html = `<div><small>Ближайший урок</small><h2>${esc(day)}, ${esc(l.start)}–${esc(l.end)}</h2><p>${left}${l.topic ? ' · ' + esc(l.topic) : ''}</p></div>
      <div class="hb"><a class="${l.zoomLink ? '' : 'off'}" href="${esc(l.zoomLink || '#')}" target="_blank">📞 Войти в урок</a>
      <a class="s ${l.boardLink ? '' : 'off'}" href="${esc(l.boardLink || '#')}" target="_blank">📝 Доска</a></div>`;
    if (h.dataset.k !== html) { h.innerHTML = html; h.dataset.k = html; }
  }
  setInterval(hero, 1000);

  // домашки: непроверенные сверху + срок сдачи (до следующего урока)
  const grid = document.getElementById('homeworkCards');
  const obs = new MutationObserver(enhance);
  function enhance() {
    obs.disconnect();
    const today = iso(new Date());
    const cards = [...grid.querySelectorAll('.hw-card')];
    cards.forEach(c => {
      if (c.dataset.dl) return; c.dataset.dl = 1;
      const t = (c.querySelector('.card-date') || {}).textContent;
      const l = lessonsData.filter(x => x.homework && x.date.slice(8) + '.' + x.date.slice(5, 7) === t).pop();
      const nx = l && lessonsData.filter(x => x.date > l.date).sort((a, b) => a.date.localeCompare(b.date))[0];
      if (!nx || !c.querySelector('.card-status.pending')) return;
      const late = nx.date < today, dd = nx.date.slice(8) + '.' + nx.date.slice(5, 7);
      const b = document.createElement('div');
      b.className = 'dl' + (late ? ' late' : '');
      b.textContent = late ? '⚠ просрочено (было до ' + dd + ')' : nx.date === today ? '⏰ сдать сегодня' : 'сдать до ' + dd;
      c.querySelector('.card-topic').before(b);
    });
    const rank = c => c.querySelector('.pending') ? 0 : c.querySelector('.done') ? 1 : 2;
    cards.sort((a, b) => rank(a) - rank(b)).forEach(c => grid.appendChild(c));
    obs.observe(grid, { childList: true });
  }
  obs.observe(grid, { childList: true });

  // прогресс: переключатель «Всё время»
  const nb = document.querySelector('.progress-month-bar .nav-buttons'), ab = document.createElement('button');
  ab.id = 'allBtn'; ab.textContent = 'Всё время'; nb.prepend(ab);
  const sync = () => ab.classList.toggle('on', !!window.allTime);
  ab.onclick = () => { window.allTime = !window.allTime; sync(); renderProgressPage().then(() => { if (window.allTime) progressMonthLabel.textContent = 'всё время'; }); };
  ['progressPrevMonth', 'progressNextMonth'].forEach(id =>
    document.getElementById(id).addEventListener('click', () => { window.allTime = false; sync(); }, true));
})();
