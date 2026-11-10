/* GymTrack — application vanilla JS
 * Données : data/seed.json chargé une fois dans localStorage, puis tout vit dans localStorage.
 * Programme : data/programme.json (lecture seule).
 */
(() => {
  'use strict';

  const STORAGE_KEY = 'gymtrack:data:v1';
  const SESSION_KEY = 'gymtrack:session';
  const THEME_KEY = 'gymtrack:theme';
  const SEED_URL = 'data/seed.json';
  const PROG_URL = 'data/programme.json';

  /** Profil par défaut (un export ancien, sans `profil`, est complété avec ces valeurs). */
  const PROFIL_DEFAULT = { taille_cm: null, naissance: '', fc_max: null, objectif: '' };

  /** @type {{muscu: any[], cardio: any[], gainage: any[], poids: any[], profil: typeof PROFIL_DEFAULT}} */
  let data = { muscu: [], cardio: [], gainage: [], poids: [], profil: { ...PROFIL_DEFAULT } };
  let programme = null;
  let aliasMap = new Map(); // nom historique -> nom canonique

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Utilitaires ----------
  const todayISO = () => {
    const d = new Date();
    const off = d.getTimezoneOffset();
    return new Date(d.getTime() - off * 60000).toISOString().slice(0, 10);
  };
  const fmtDate = (iso) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y.slice(2)}`;
  };
  const fmtNum = (n) => (n == null || n === '' ? '' : String(n).replace('.', ','));
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const canon = (name) => aliasMap.get(name) || name;
  const toNum = (v) => (v === '' || v == null ? null : Number(String(v).replace(',', '.')));

  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => (t.hidden = true), 1800);
  }

  // ---------- Stockage ----------
  function withIds(list) {
    return list.map((e) => (e.id ? e : { ...e, id: uid() }));
  }
  function normalize(raw) {
    return {
      muscu: withIds((raw.muscu || []).map((e) => ({
        ...e,
        chauffe: e.chauffe ?? /chauffe/i.test(e.note || ''),
      }))),
      cardio: withIds(raw.cardio || []),
      gainage: withIds(raw.gainage || []),
      poids: withIds(raw.poids || []),
      profil: normalizeProfil(raw.profil),
      seed_stamp: typeof raw.seed_stamp === 'string' ? raw.seed_stamp : '',
    };
  }
  function normalizeProfil(p) {
    const src = p && typeof p === 'object' ? p : {};
    return {
      taille_cm: toNum(src.taille_cm),
      naissance: typeof src.naissance === 'string' ? src.naissance : '',
      fc_max: toNum(src.fc_max),
      objectif: typeof src.objectif === 'string' ? src.objectif : '',
    };
  }
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { console.warn('localStorage illisible', e); }
    return null;
  }
  async function fetchJSON(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(`${url} : HTTP ${r.status}`);
    return r.json();
  }
  async function loadSeed() {
    const seed = await fetchJSON(SEED_URL);
    data = normalize(seed);
    data.seed_stamp = seed.exported_at || '';
    save();
  }
  /** Fusionne dans les données locales les lignes d'un seed plus récent que le dernier intégré
   *  (sans toucher aux lignes saisies sur l'appareil). Retourne le nombre de lignes ajoutées. */
  async function mergeNewerSeed() {
    const seed = await fetchJSON(SEED_URL);
    const stamp = seed.exported_at || '';
    if (!stamp || stamp <= (data.seed_stamp || '')) return 0;
    const keys = {
      muscu: (e) => [e.date, e.exercice, e.serie].join('|'),
      cardio: (e) => [e.date, e.type, e.duree_min].join('|'),
      gainage: (e) => [e.date, e.exercice].join('|'),
      poids: (e) => e.date,
    };
    let added = 0;
    for (const coll of Object.keys(keys)) {
      const have = new Set((data[coll] || []).map(keys[coll]));
      for (const row of withIds(seed[coll] || [])) {
        if (!have.has(keys[coll](row))) { data[coll].push(row); added++; }
      }
    }
    data.seed_stamp = stamp;
    save();
    return added;
  }
  function exportJSON() {
    const strip = (list) => list.map(({ id, ...rest }) => rest);
    const sortByDate = (a, b) => a.date.localeCompare(b.date) || (a.serie ?? 0) - (b.serie ?? 0);
    return {
      version: 2,
      seed_stamp: data.seed_stamp || '',
      exported_at: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      profil: { ...data.profil },
      muscu: strip([...data.muscu].sort(sortByDate)),
      cardio: strip([...data.cardio].sort(sortByDate)),
      gainage: strip([...data.gainage].sort(sortByDate)),
      poids: strip([...data.poids].sort(sortByDate)),
    };
  }

  // ---------- Programme ----------
  function buildAliasMap() {
    aliasMap = new Map();
    for (const s of programme.seances) {
      for (const ex of s.exercices || []) {
        for (const a of ex.alias || []) aliasMap.set(a, ex.nom);
      }
    }
  }
  function sessionById(id) {
    return programme.seances.find((s) => s.id === id);
  }
  function defaultSessionId(dateISO) {
    const day = new Date(dateISO + 'T12:00:00').getDay();
    return programme.par_jour[String(day)] || programme.seances[0].id;
  }

  // ---------- Requêtes sur les données ----------
  function setsFor(exName) {
    const c = canon(exName);
    return data.muscu.filter((e) => canon(e.exercice) === c);
  }
  /** Dernière séance (date) pour un exercice, hors date exclue. */
  function lastPerformance(exName, excludeDate) {
    const sets = setsFor(exName).filter((e) => e.date !== excludeDate);
    if (!sets.length) return null;
    const date = sets.reduce((m, e) => (e.date > m ? e.date : m), '');
    const daySets = sets.filter((e) => e.date === date).sort((a, b) => (a.serie ?? 0) - (b.serie ?? 0));
    return { date, sets: daySets };
  }
  function maxLoadPerSession(exName) {
    const byDate = new Map();
    for (const e of setsFor(exName)) {
      if (e.chauffe || e.charge_kg == null) continue;
      const v = Number(e.charge_kg);
      if (!byDate.has(e.date) || byDate.get(e.date) < v) byDate.set(e.date, v);
    }
    return [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }
  /** Exercice à contrepoids (traction, dips assistés) : progresser = baisser la charge. */
  function isCounterweight(exName) {
    const c = canon(exName);
    return programme.seances.some((s) => (s.exercices || []).some((ex) => ex.nom === c && ex.contrepoids));
  }
  /** Charge de référence (hors échauffement) d'un exercice à une date donnée, comparée à la séance précédente.
   *  Référence : charge max, ou contrepoids min pour les exercices assistés. `better` = progression. */
  function loadVsPrevious(exName, date) {
    const cw = isCounterweight(exName);
    const byDate = new Map();
    for (const e of setsFor(exName)) {
      if (e.chauffe || e.charge_kg == null) continue;
      const v = Number(e.charge_kg);
      const cur = byDate.get(e.date);
      if (cur == null || (cw ? v < cur : v > cur)) byDate.set(e.date, v);
    }
    const pts = [...byDate.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const i = pts.findIndex((p) => p[0] === date);
    if (i < 0) return null;
    const top = pts[i][1], prev = i > 0 ? pts[i - 1][1] : null;
    const better = prev != null && (cw ? top < prev : top > prev);
    return { top, prev, better, delta: prev != null ? Math.abs(top - prev) : 0, counterweight: cw };
  }
  /** Dernière pesée (par date puis ordre de saisie). */
  function lastWeight() {
    if (!data.poids.length) return null;
    return [...data.poids].sort((a, b) => a.date.localeCompare(b.date)).pop();
  }
  /** Contrepoids courant : dernière série (hors échauffement) de traction assistée. */
  function currentCounterweight() {
    const sets = setsFor('Traction assistée').filter((e) => !e.chauffe && e.charge_kg != null)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.serie ?? 0) - (b.serie ?? 0));
    return sets.length ? { date: sets[sets.length - 1].date, kg: Number(sets[sets.length - 1].charge_kg) } : null;
  }
  /** Charge max (hors échauffement) de la dernière séance de chest press. */
  function lastChestPress() {
    const pts = maxLoadPerSession('Chest press incliné');
    return pts.length ? { date: pts[pts.length - 1][0], kg: pts[pts.length - 1][1] } : null;
  }
  function ageFrom(naissance, atISO = todayISO()) {
    if (!naissance) return null;
    const [y, m, d] = naissance.split('-').map(Number);
    const [cy, cm, cd] = atISO.split('-').map(Number);
    if (!y || !m || !d) return null;
    let age = cy - y;
    if (cm < m || (cm === m && cd < d)) age -= 1;
    return age >= 0 ? age : null;
  }
  function allExerciseNames() {
    const names = new Set();
    for (const e of data.muscu) names.add(canon(e.exercice));
    // ordre : programme d'abord, puis le reste par ordre alphabétique
    const ordered = [];
    for (const s of programme.seances) for (const ex of s.exercices || []) if (names.has(ex.nom)) { ordered.push(ex.nom); names.delete(ex.nom); }
    return ordered.concat([...names].sort((a, b) => a.localeCompare(b, 'fr')));
  }

  // ---------- Thème (moderne / rétro 16 bits) ----------
  // L'attribut est posé avant le premier rendu par le script inline de index.html.
  const isRetro = () => document.documentElement.getAttribute('data-theme') === 'retro';
  function applyTheme(name, { rerender = true } = {}) {
    const retro = name === 'retro';
    if (retro) document.documentElement.setAttribute('data-theme', 'retro');
    else document.documentElement.removeAttribute('data-theme');
    try { retro ? localStorage.setItem(THEME_KEY, 'retro') : localStorage.removeItem(THEME_KEY); } catch (_) { /* ignore */ }
    const meta = $('meta[name=theme-color]');
    if (meta) meta.content = retro ? '#0f0f23' : '#141a2b';
    $$('#theme-select button').forEach((b) => b.classList.toggle('active', (b.dataset.themeChoice === 'retro') === retro));
    if (rerender) { renderHpBar(); const cur = $$('.screen').find((sc) => !sc.hidden); if (cur) render[cur.dataset.screen]?.(); }
  }
  /** Libellés ludiques du thème rétro (le reste du texte ne change pas). */
  const labels = () => (isRetro()
    ? { progress: 'LEVEL UP', volume: 'EXP' }
    : { progress: 'Progression', volume: 'volume' });

  // ---------- Navigation ----------
  function showScreen(name) {
    $$('.screen').forEach((s) => (s.hidden = s.dataset.screen !== name));
    $$('#tabbar button').forEach((b) => b.classList.toggle('active', b.dataset.target === name));
    try { sessionStorage.setItem(SESSION_KEY, name); } catch (_) { /* ignore */ }
    render[name]?.();
    window.scrollTo(0, 0);
  }

  // ---------- Rendu : Aujourd'hui ----------
  const todayState = { date: todayISO(), sessionId: null, extraRows: {} };

  function renderToday() {
    const sel = $('#session-select');
    if (!sel.options.length) {
      sel.innerHTML = programme.seances.map((s) => `<option value="${s.id}">${esc(s.jour)} — ${esc(s.nom)}</option>`).join('');
    }
    if (!todayState.sessionId) todayState.sessionId = defaultSessionId(todayState.date);
    sel.value = todayState.sessionId;
    $('#session-date').value = todayState.date;

    const s = sessionById(todayState.sessionId);
    const root = $('#today-content');
    if (!s) { root.innerHTML = '<p class="empty">Séance inconnue</p>'; return; }

    let html = `<div class="session-head"><h2>${esc(s.nom)}</h2><span class="jour">${esc(s.jour)}</span></div>`;

    if (s.type === 'cardio') {
      html += `<div class="card"><h3>Tapis</h3><ul class="plain">${s.blocs.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        <p class="small muted" style="margin:10px 0 0">Enregistre la séance dans l'onglet <b>Cardio</b> une fois terminée.</p>
        <button class="btn small" style="margin-top:8px" data-go="cardio">Ouvrir le formulaire cardio</button></div>`;
    } else {
      s.exercices.forEach((ex, i) => { html += renderExercise(ex, s, i + 1); });
      html += renderFreeExercise(s);
    }

    html += `<div class="card"><h3>Fin de séance</h3><ul class="plain">${(programme.fin_de_seance[s.type] || []).map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
      <h3 style="margin-top:10px">Gainage du jour</h3><ul class="gainage-list">${(s.gainage || []).map((g) => `<li>${esc(g.nom)}${demoBlock(g.gif, g.nom)}</li>`).join('')}</ul></div>`;

    root.innerHTML = html;
    updateChrono();
  }

  /** Bloc repliable avec le GIF de démonstration (chargé seulement à l'ouverture). */
  function demoBlock(gif, name) {
    if (!gif) return '';
    return `<details class="demo"><summary>Voir la démo</summary>
      <img data-src="${esc(gif)}" alt="Démonstration : ${esc(name)}" loading="lazy" width="320" height="320">
      <div class="credit">Images : free-exercise-db (domaine public)</div></details>`;
  }

  function renderExercise(ex, session, index) {
    const done = data.muscu
      .filter((e) => e.date === todayState.date && canon(e.exercice) === ex.nom)
      .sort((a, b) => (a.serie ?? 0) - (b.serie ?? 0));
    const last = lastPerformance(ex.nom, todayState.date);
    const extra = todayState.extraRows[ex.nom] || 0;
    const pending = Math.max(0, ex.series - done.length) + extra;
    const unit = ex.contrepoids ? 'contrepoids' : 'kg';

    let lastHtml = '<div class="exo-last">Première fois sur cet exercice.</div>';
    if (last) {
      const work = last.sets.filter((e) => !e.chauffe);
      const warm = last.sets.length - work.length;
      const summary = work.map((e) => `${fmtNum(e.reps)}×${fmtNum(e.charge_kg)}`).join(', ');
      lastHtml = `<div class="exo-last">Dernière fois, le ${fmtDate(last.date)} <strong>${esc(summary) || '—'}</strong>${warm ? ` <span class="muted">+${warm} chauffe</span>` : ''}</div>`;
    }

    let rows = '';
    for (let i = 0; i < pending; i++) {
      const n = done.length + i + 1;
      rows += `<div class="set-row" data-ex="${esc(ex.nom)}" data-n="${n}">
        <span class="n">${n}</span>
        <label class="num"><input type="number" inputmode="numeric" class="reps" value="${ex.reps}" min="0" step="1"><span class="unit">reps</span></label>
        <label class="num"><input type="number" inputmode="decimal" class="kg" value="${ex.charge_kg}" min="0" step="0.5"><span class="unit">${unit}</span></label>
        <label class="chk" title="Série d'échauffement"><input type="checkbox" class="warm"> chauffe</label>
        <button class="set-ok" type="button" aria-label="Valider la série">✓</button>
      </div>`;
    }

    const doneHtml = done.length
      ? `<div class="done-list">${done.map((e) => `<span class="pill ${e.chauffe ? 'warm' : ''}"><b>${e.serie}</b>${fmtNum(e.reps)} × ${fmtNum(e.charge_kg)}${e.chauffe ? '<i>chauffe</i>' : ''}<button type="button" data-del="${e.id}" aria-label="Supprimer la série ${e.serie}">×</button></span>`).join('')}</div>`
      : '';

    return `<article class="exo" data-rest="${ex.repos_s}">
      <div class="exo-head"><h3><span class="exo-n">${index}</span>${esc(ex.nom)}</h3></div>
      <div class="exo-target"><span class="t-load">${fmtNum(ex.charge_kg)}<small>${unit === 'kg' ? 'kg' : 'cp'}</small></span><span class="t-sets">${ex.series} × ${ex.reps}</span><span class="t-rest">repos ${ex.repos_s} s</span></div>
      <div class="exo-detail">${esc(ex.detail)}, ${esc(ex.progression)}</div>
      ${lastHtml}${doneHtml}
      <div class="sets">${rows}</div>
      <div class="exo-foot"><button class="btn small ghost add-set" type="button" data-add="${esc(ex.nom)}">+ série</button>${demoBlock(ex.gif, ex.nom)}</div>
    </article>`;
  }

  function renderFreeExercise(session) {
    const names = allExerciseNames().filter((n) => !session.exercices.some((e) => e.nom === n));
    return `<article class="exo exo-free" data-rest="60">
      <div class="exo-head"><h3>Autre exercice</h3></div>
      <label class="field" style="margin-top:8px"><span>Nom</span><input type="text" id="free-name" list="free-names" placeholder="Presse à cuisses…"></label>
      <datalist id="free-names">${names.map((n) => `<option value="${esc(n)}">`).join('')}</datalist>
      <div class="sets"><div class="set-row" data-ex="" data-n="0">
        <span class="n">+</span>
        <label class="num"><input type="number" inputmode="numeric" class="reps" value="10" min="0"><span class="unit">reps</span></label>
        <label class="num"><input type="number" inputmode="decimal" class="kg" value="20" min="0" step="0.5"><span class="unit">kg</span></label>
        <label class="chk"><input type="checkbox" class="warm"> chauffe</label>
        <button class="set-ok" type="button" aria-label="Valider la série">✓</button>
      </div></div>
    </article>`;
  }

  function logSet(row) {
    const card = row.closest('.exo');
    let exName = row.dataset.ex;
    if (!exName) {
      exName = ($('#free-name')?.value || '').trim();
      if (!exName) { toast('Indique le nom de l\'exercice'); return; }
    }
    const reps = toNum($('.reps', row).value);
    const kg = toNum($('.kg', row).value);
    const chauffe = $('.warm', row).checked;
    if (reps == null || kg == null) { toast('Reps et charge requis'); return; }
    const session = sessionById(todayState.sessionId);
    const existing = data.muscu.filter((e) => e.date === todayState.date && canon(e.exercice) === canon(exName));
    const serie = existing.length ? Math.max(...existing.map((e) => e.serie || 0)) + 1 : 1;
    data.muscu.push({
      id: uid(),
      date: todayState.date,
      seance: session.seance_csv || session.nom,
      exercice: exName,
      serie,
      reps,
      charge_kg: kg,
      chauffe,
      note: chauffe ? 'chauffe' : '',
    });
    save();
    const extra = todayState.extraRows[row.dataset.ex];
    if (extra) todayState.extraRows[row.dataset.ex] = extra - 1;
    if (todayState.date === todayISO()) ensureChronoStarted();
    renderToday();
    startRest(Number(card.dataset.rest) || 60, `${exName}, série ${serie}`);
    toast(`Série ${serie} enregistrée`);
  }

  // ---------- Timer de repos (basé sur des timestamps : survit à l'écran éteint) ----------
  const REST_KEY = 'gymtrack:rest';
  const rest = { endAt: 0, total: 0, label: '', timer: null, fired: false };

  function persistRest() {
    try {
      if (rest.endAt) sessionStorage.setItem(REST_KEY, JSON.stringify({ endAt: rest.endAt, total: rest.total, label: rest.label }));
      else sessionStorage.removeItem(REST_KEY);
    } catch (_) { /* ignore */ }
  }
  function startRest(seconds, label) {
    unlockAudio();
    rest.endAt = Date.now() + seconds * 1000;
    rest.total = seconds;
    rest.label = label || '';
    rest.fired = false;
    persistRest();
    $('#rest-timer').hidden = false;
    $('#rest-timer').classList.remove('over');
    $('#rest-sub').textContent = rest.label;
    if (!rest.timer) rest.timer = setInterval(tickRest, 250);
    tickRest();
  }
  function tickRest() {
    if (!rest.endAt) return;
    const remainingMs = rest.endAt - Date.now();
    const remaining = Math.max(0, Math.ceil(remainingMs / 1000));
    $('#rest-time').textContent = String(remaining);
    $('#rest-fill').style.width = `${Math.max(0, Math.min(100, (remainingMs / (rest.total * 1000)) * 100))}%`;
    renderHpBar(remaining);
    if (remaining <= 0 && !rest.fired) {
      rest.fired = true;
      $('#rest-timer').classList.add('over');
      $('#rest-sub').textContent = 'C\'est reparti !';
      try { navigator.vibrate?.([300, 120, 300, 120, 500]); } catch (_) { /* ignore */ }
      beep();
      setTimeout(() => { if (rest.fired) stopRest(); }, 6000);
    }
  }
  /** Thème rétro : barre de PV, un segment par tranche de 5 s, qui se vide. */
  function renderHpBar(remaining = Math.max(0, Math.ceil((rest.endAt - Date.now()) / 1000))) {
    const bar = $('#rest-hp');
    if (!bar || !isRetro() || !rest.endAt) return;
    const total = Math.max(1, Math.ceil(rest.total / 5));
    if (bar.childElementCount !== total) bar.innerHTML = '<span></span>'.repeat(total);
    const on = Math.ceil(remaining / 5);
    Array.from(bar.children).forEach((seg, i) => seg.classList.toggle('off', i >= on));
  }
  function stopRest() {
    rest.endAt = 0;
    rest.fired = false;
    if (rest.timer) clearInterval(rest.timer);
    rest.timer = null;
    persistRest();
    $('#rest-timer').hidden = true;
  }
  function restoreRest() {
    try {
      const saved = JSON.parse(sessionStorage.getItem(REST_KEY) || 'null');
      if (saved && saved.endAt > Date.now()) {
        rest.endAt = saved.endAt; rest.total = saved.total; rest.label = saved.label; rest.fired = false;
        $('#rest-timer').hidden = false;
        $('#rest-sub').textContent = rest.label;
        rest.timer = setInterval(tickRest, 250);
        tickRest();
      } else sessionStorage.removeItem(REST_KEY);
    } catch (_) { /* ignore */ }
  }

  // Bip court via Web Audio (aucun fichier audio). Le contexte est créé lors d'un geste utilisateur.
  let audioCtx = null;
  function unlockAudio() {
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) { /* ignore */ }
  }
  function beep() {
    if (!audioCtx) return;
    try {
      const t0 = audioCtx.currentTime;
      [0, 0.22, 0.44].forEach((dt, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.value = i === 2 ? 1174 : 880;
        gain.gain.setValueAtTime(0.0001, t0 + dt);
        gain.gain.exponentialRampToValueAtTime(0.4, t0 + dt + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.18);
        osc.connect(gain).connect(audioCtx.destination);
        osc.start(t0 + dt);
        osc.stop(t0 + dt + 0.2);
      });
    } catch (_) { /* ignore */ }
  }

  // ---------- Chrono de séance (démarre à la première série du jour) ----------
  const CHRONO_KEY = 'gymtrack:chrono';
  let chronoTimer = null;
  function readChrono() {
    try { return JSON.parse(localStorage.getItem(CHRONO_KEY) || 'null'); } catch (_) { return null; }
  }
  function writeChrono(c) {
    try { c ? localStorage.setItem(CHRONO_KEY, JSON.stringify(c)) : localStorage.removeItem(CHRONO_KEY); } catch (_) { /* ignore */ }
  }
  function ensureChronoStarted() {
    const c = readChrono();
    if (!c || c.date !== todayState.date) writeChrono({ date: todayState.date, start: Date.now(), end: null });
    updateChrono();
  }
  function fmtElapsed(ms) {
    const s = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const mm = String(m).padStart(2, '0'), ss = String(sec).padStart(2, '0');
    return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  }
  function updateChrono() {
    const el = $('#chrono');
    const c = readChrono();
    if (!c || c.date !== todayISO()) {
      el.hidden = true;
      if (chronoTimer) { clearInterval(chronoTimer); chronoTimer = null; }
      return;
    }
    el.hidden = false;
    el.classList.toggle('stopped', !!c.end);
    const elapsed = (c.end || Date.now()) - c.start;
    el.textContent = fmtElapsed(elapsed);
    el.style.setProperty('--chrono-p', Math.min(1, elapsed / (90 * 60000)).toFixed(4));
    if (!c.end && !chronoTimer) chronoTimer = setInterval(updateChrono, 1000);
    if (c.end && chronoTimer) { clearInterval(chronoTimer); chronoTimer = null; }
  }
  function toggleChrono() {
    const c = readChrono();
    if (!c) return;
    if (!c.end) {
      if (confirm(`Terminer la séance ? Durée : ${fmtElapsed(Date.now() - c.start)}`)) { c.end = Date.now(); writeChrono(c); }
    } else if (confirm('Relancer le chrono (reprise de la séance) ?')) {
      c.end = null; writeChrono(c);
    }
    updateChrono();
  }

  // ---------- Rendu : Historique ----------
  const HISTORY_VIEW_KEY = 'gymtrack:history-view';
  const historyState = { view: 'sessions', open: new Set() };
  try { historyState.view = sessionStorage.getItem(HISTORY_VIEW_KEY) === 'sets' ? 'sets' : 'sessions'; } catch (_) { /* ignore */ }

  /** Ligne de série, partagée entre le tableau à plat et les cartes par séance. */
  function setRowHtml(e, { withDate = true, withExercise = true } = {}) {
    return `<tr class="${e.chauffe ? 'warm' : ''}">
      ${withDate ? `<td>${fmtDate(e.date)}</td>` : ''}${withExercise ? `<td>${esc(e.exercice)}</td>` : ''}<td class="num">${fmtNum(e.serie)}</td>
      <td class="num">${fmtNum(e.reps)}</td><td class="num">${fmtNum(e.charge_kg)}</td>
      <td class="note">${esc(e.note)}</td><td><button class="del" data-del="${e.id}" aria-label="Supprimer">×</button></td></tr>`;
  }

  function renderHistory() {
    const sel = $('#history-exercise');
    const current = sel.value;
    sel.innerHTML = '<option value="">Tous les exercices</option>' + allExerciseNames().map((n) => `<option value="${esc(n)}">${esc(n)}</option>`).join('');
    sel.value = current;
    const date = $('#history-date').value;
    let rows = [...data.muscu];
    if (sel.value) rows = rows.filter((e) => canon(e.exercice) === sel.value);
    if (date) rows = rows.filter((e) => e.date === date);

    $$('#history-view button').forEach((b) => b.classList.toggle('active', b.dataset.view === historyState.view));
    const bySession = historyState.view === 'sessions';
    $('#history-sessions').hidden = !bySession;
    $('#history-table-wrap').hidden = bySession;
    if (bySession) renderHistorySessions(rows);
    else renderHistoryTable(rows);
  }

  function renderHistoryTable(rows) {
    rows.sort((a, b) => b.date.localeCompare(a.date) || a.exercice.localeCompare(b.exercice, 'fr') || (b.serie ?? 0) - (a.serie ?? 0));
    $('#history-count').textContent = `${rows.length} série${rows.length > 1 ? 's' : ''}`;
    $('#history-table tbody').innerHTML = rows.length
      ? rows.map((e) => setRowHtml(e)).join('')
      : '<tr><td colspan="7" class="empty">Aucune série</td></tr>';
  }

  function renderHistorySessions(rows) {
    // Regroupement par (date, séance), plus récent en premier.
    const groups = new Map();
    for (const e of rows) {
      const key = `${e.date}|${e.seance || ''}`;
      if (!groups.has(key)) groups.set(key, { date: e.date, seance: e.seance || '', sets: [] });
      groups.get(key).sets.push(e);
    }
    const sessions = [...groups.values()].sort((a, b) => b.date.localeCompare(a.date) || a.seance.localeCompare(b.seance, 'fr'));
    const L = labels();
    $('#history-count').textContent = `${sessions.length} séance${sessions.length > 1 ? 's' : ''}, ${rows.length} série${rows.length > 1 ? 's' : ''}`;
    const root = $('#history-sessions');
    if (!sessions.length) { root.innerHTML = '<p class="empty">Aucune séance</p>'; return; }

    root.innerHTML = sessions.map((s) => {
      const key = `${s.date}|${s.seance}`;
      // Exercices dans l'ordre de première apparition (ordre de la séance), séries par numéro.
      const byEx = new Map();
      for (const e of s.sets) {
        const n = canon(e.exercice);
        if (!byEx.has(n)) byEx.set(n, []);
        byEx.get(n).push(e);
      }
      const work = s.sets.filter((e) => !e.chauffe);
      const volume = work.reduce((sum, e) => sum + (Number(e.reps) || 0) * (Number(e.charge_kg) || 0), 0);
      let progressions = 0;

      const exHtml = [...byEx.entries()].map(([name, sets]) => {
        sets.sort((a, b) => (a.serie ?? 0) - (b.serie ?? 0));
        const cmp = loadVsPrevious(name, s.date);
        const better = !!(cmp && cmp.better);
        if (better) progressions += 1;
        const badge = better ? `<span class="badge-progress" title="${cmp.counterweight ? 'Contrepoids' : 'Charge max'} ${fmtNum(cmp.top)} contre ${fmtNum(cmp.prev)} la fois précédente">${L.progress} ${cmp.counterweight ? '−' : '+'}${fmtNum(cmp.delta)}</span>` : '';
        const top = cmp ? `<span class="ex-top">${fmtNum(cmp.top)}${cmp.counterweight ? ' cp' : ' kg'}</span>` : '';
        return `<tr class="ex-line"><td colspan="5"><span class="ex-name">${esc(name)}</span> <span class="muted">${sets.length} série${sets.length > 1 ? 's' : ''}</span> ${top}${badge}</td></tr>`
          + sets.map((e) => setRowHtml(e, { withDate: false, withExercise: false })).join('');
      }).join('');

      const cardio = data.cardio.filter((c) => c.date === s.date);
      const cardioHtml = cardio.map((c) => {
        const meta = [
          c.duree_min != null ? `${fmtNum(c.duree_min)} min` : null,
          c.distance_km != null ? `${fmtNum(c.distance_km)} km` : null,
          c.fc_moy != null ? `FC moy ${fmtNum(c.fc_moy)}` : null,
        ].filter(Boolean).join(', ');
        return `<div class="session-cardio"><span class="k">${esc(c.type)}</span> ${esc(meta) || '—'}</div>`;
      }).join('');

      return `<details class="card session-card" data-key="${esc(key)}"${historyState.open.has(key) ? ' open' : ''}>
        <summary>
          <div class="session-sum">
            <div class="session-sum-head"><span class="session-date">${fmtDate(s.date)}</span><span class="session-type">${esc(s.seance) || 'Séance'}</span>${progressions ? `<span class="badge-progress">${progressions} ↑</span>` : ''}</div>
            <div class="session-sum-meta"><span>${byEx.size} exercice${byEx.size > 1 ? 's' : ''}</span><span>${s.sets.length} série${s.sets.length > 1 ? 's' : ''}</span><span>${L.volume} <b>${fmtNum(Math.round(volume))} kg</b></span></div>
            ${cardioHtml}
          </div>
        </summary>
        <div class="table-wrap"><table class="table session-table">
          <thead><tr><th>Série</th><th>Reps</th><th>kg</th><th>Note</th><th></th></tr></thead>
          <tbody>${exHtml}</tbody>
        </table></div>
      </details>`;
    }).join('');
  }

  // ---------- Rendu : Progression ----------
  function renderProgress() {
    const root = $('#progress-charts');
    const names = allExerciseNames();
    if (!names.length) { root.innerHTML = '<p class="empty">Pas encore de données</p>'; return; }
    root.innerHTML = names.map((n) => {
      const pts = maxLoadPerSession(n);
      if (!pts.length) return '';
      const last = pts[pts.length - 1][1];
      const first = pts[0][1];
      const delta = last - first;
      return `<article class="chart-card"><h3>${esc(n)}<span>${fmtNum(last)}<small> kg</small>${delta ? `<em>${delta > 0 ? '+' : ''}${fmtNum(delta)}</em>` : ''}</span></h3>${svgChart(pts)}</article>`;
    }).join('');
  }

  function svgChart(points, { label = 'Évolution de la charge' } = {}) {
    const W = 340, H = 130, padL = 30, padR = 12, padT = 14, padB = 24;
    const vals = points.map((p) => p[1]);
    let min = Math.min(...vals), max = Math.max(...vals);
    if (min === max) { min = Math.max(0, min - 5); max = max + 5; }
    const span = max - min;
    min = Math.max(0, min - span * 0.15);
    max = max + span * 0.15;
    const x = (i) => points.length === 1 ? (padL + (W - padL - padR) / 2) : padL + (i * (W - padL - padR)) / (points.length - 1);
    const y = (v) => padT + (H - padT - padB) * (1 - (v - min) / (max - min));
    const ticks = [min, (min + max) / 2, max];
    // Graduations entières, sauf quand l'amplitude est faible (poids de corps) : une décimale.
    const fmtTick = (t) => (max - min < 5 ? fmtNum(t.toFixed(1)) : String(Math.round(t)));
    let svg = `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`;
    for (const t of ticks) svg += `<line class="grid" x1="${padL}" x2="${W - padR}" y1="${y(t).toFixed(1)}" y2="${y(t).toFixed(1)}"/><text x="${padL - 4}" y="${(y(t) + 3).toFixed(1)}" text-anchor="end">${fmtTick(t)}</text>`;
    const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(p[1]).toFixed(1)}`).join(' ');
    svg += `<path class="line" d="${path}"/>`;
    // Thème rétro : même série en escalier (H puis V) et marqueurs carrés, affichés par CSS.
    const stepPath = points.map((p, i) => (i ? `H${x(i).toFixed(1)} V${y(p[1]).toFixed(1)}` : `M${x(0).toFixed(1)},${y(p[1]).toFixed(1)}`)).join(' ');
    svg += `<path class="line-step" d="${stepPath}"/>`;
    const step = Math.ceil(points.length / 6);
    points.forEach((p, i) => {
      svg += `<circle class="dot" cx="${x(i).toFixed(1)}" cy="${y(p[1]).toFixed(1)}" r="3.5"/>`;
      svg += `<rect class="dot-px" x="${(x(i) - 4).toFixed(1)}" y="${(y(p[1]) - 4).toFixed(1)}" width="8" height="8"/>`;
      if (i % step === 0 || i === points.length - 1) {
        svg += `<text x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="middle">${fmtDate(p[0]).slice(0, 5)}</text>`;
        // Première et dernière étiquette ancrées vers l'intérieur pour ne pas chevaucher les graduations.
        const anchor = points.length > 1 && i === 0 ? 'start' : (points.length > 1 && i === points.length - 1 ? 'end' : 'middle');
        const dx = anchor === 'start' ? 4 : anchor === 'end' ? -4 : 0;
        svg += `<text class="val" x="${(x(i) + dx).toFixed(1)}" y="${(y(p[1]) - 7).toFixed(1)}" text-anchor="${anchor}">${fmtNum(p[1])}</text>`;
      }
    });
    return svg + '</svg>';
  }

  // ---------- Rendu : Cardio & gainage ----------
  function renderCardio() {
    const f = $('#cardio-form');
    if (!f.date.value) f.date.value = todayISO();
    const g = $('#gainage-form');
    if (!g.date.value) g.date.value = todayISO();

    const list = [...data.cardio].sort((a, b) => b.date.localeCompare(a.date));
    $('#cardio-list').innerHTML = list.length ? list.map((c) => {
      const meta = [
        c.duree_min != null ? `${fmtNum(c.duree_min)} min` : null,
        c.distance_km != null ? `${fmtNum(c.distance_km)} km` : null,
        c.fc_moy != null ? `FC ${fmtNum(c.fc_moy)}${c.fc_max != null ? `/${fmtNum(c.fc_max)}` : ''}` : null,
        c.pente_moy_pct != null ? `pente ${fmtNum(c.pente_moy_pct)} %` : null,
      ].filter(Boolean).join(', ');
      return `<article class="card cardio-item"><span class="d">${fmtDate(c.date)}</span><div><div class="t">${esc(c.type)}</div><div class="m">${esc(meta)}</div></div>
        <button class="btn icon ghost" data-del-cardio="${c.id}" aria-label="Supprimer">×</button>${c.note ? `<div class="n">${esc(c.note)}</div>` : ''}</article>`;
    }).join('') : '<p class="empty">Aucune séance cardio</p>';

    const gl = [...data.gainage].sort((a, b) => b.date.localeCompare(a.date));
    $('#gainage-list').innerHTML = gl.length ? gl.map((g) => `<article class="card cardio-item"><span class="d">${fmtDate(g.date)}</span>
        <div><div class="t">${esc(g.exercice)}</div><div class="m">${fmtNum(g.series)} × ${esc(g.valeur)} ${esc(g.unite)}</div></div>
        <button class="btn icon ghost" data-del-gainage="${g.id}" aria-label="Supprimer">×</button>${g.note ? `<div class="n">${esc(g.note)}</div>` : ''}</article>`).join('')
      : '<p class="empty">Aucun gainage</p>';
  }

  // ---------- Rendu : Profil ----------
  function renderProfil() {
    const p = data.profil;
    const f = $('#profil-form');
    f.taille_cm.value = p.taille_cm ?? '';
    f.naissance.value = p.naissance || '';
    f.fc_max.value = p.fc_max ?? '';
    f.objectif.value = p.objectif || '';
    const age = ageFrom(p.naissance);
    $('#profil-age').textContent = age != null ? `${age} ans` : '';

    const last = lastWeight();
    const wf = $('#poids-form');
    if (!wf.date.value) wf.date.value = todayISO();
    if (!wf.poids_kg.value && last) wf.poids_kg.value = last.poids_kg;

    // Tuiles dérivées
    const tiles = [];
    const imc = p.taille_cm && last ? last.poids_kg / Math.pow(p.taille_cm / 100, 2) : null;
    tiles.push({
      label: 'IMC',
      value: imc != null ? imc.toFixed(1).replace('.', ',') : '—',
      sub: imc != null ? `${fmtNum(last.poids_kg)} kg pour ${fmtNum(p.taille_cm)} cm` : (last ? 'Renseigne ta taille' : 'Renseigne ton poids'),
    });
    const cw = currentCounterweight();
    tiles.push({
      label: 'À tirer en traction',
      value: last && cw ? `${fmtNum(Math.round((last.poids_kg - cw.kg) * 10) / 10)} kg` : '—',
      sub: cw ? `contrepoids ${fmtNum(cw.kg)} (${fmtDate(cw.date)})` : 'Pas encore de traction assistée',
    });
    const cp = lastChestPress();
    tiles.push({
      label: 'Chest press / poids',
      value: last && cp ? `${(cp.kg / last.poids_kg).toFixed(2).replace('.', ',')} ×` : '—',
      sub: cp ? `${fmtNum(cp.kg)} kg le ${fmtDate(cp.date)}` : 'Pas encore de chest press',
    });
    const zone = (lo, hi) => p.fc_max ? `${Math.round(p.fc_max * lo)}${hi ? `–${Math.round(p.fc_max * hi)}` : ''} bpm` : '—';
    tiles.push({ label: 'Zone échauffement', value: p.fc_max ? `< ${Math.round(p.fc_max * 0.6)} bpm` : '—', sub: '< 60 % FC max' });
    tiles.push({ label: 'Zone base', value: zone(0.65, 0.75), sub: '65–75 % FC max' });
    tiles.push({ label: 'Zone intervalles', value: zone(0.8, 0.88), sub: '80–88 % FC max' });
    $('#profil-tiles').innerHTML = tiles.map((t) => `<div class="tile"><span class="tile-label">${esc(t.label)}</span><span class="tile-value">${esc(t.value)}</span><span class="tile-sub">${esc(t.sub)}</span></div>`).join('');

    // Poids de corps : graphique + liste
    const sorted = [...data.poids].sort((a, b) => a.date.localeCompare(b.date));
    const chart = $('#poids-chart');
    if (sorted.length) {
      const pts = sorted.map((w) => [w.date, Number(w.poids_kg)]);
      const first = pts[0][1], lastV = pts[pts.length - 1][1];
      const delta = Math.round((lastV - first) * 10) / 10;
      chart.innerHTML = `<h3>Poids de corps<span>${fmtNum(lastV)}<small> kg</small>${delta ? `<em>${delta > 0 ? '+' : ''}${fmtNum(delta)}</em>` : ''}</span></h3>${svgChart(pts, { label: 'Évolution du poids de corps' })}`;
      chart.hidden = false;
    } else chart.hidden = true;
    const list = [...sorted].reverse();
    $('#poids-list').innerHTML = list.length ? list.map((w) => `<article class="card cardio-item"><span class="d">${fmtDate(w.date)}</span>
        <div><div class="t">${fmtNum(w.poids_kg)} kg</div>${w.note ? `<div class="m">${esc(w.note)}</div>` : ''}</div>
        <button class="btn icon ghost" data-del-poids="${w.id}" aria-label="Supprimer">×</button></article>`).join('')
      : '<p class="empty">Aucune pesée</p>';
  }

  // ---------- Rendu : Données ----------
  function renderData() {
    $('#data-stats').textContent = `${data.muscu.length} séries, ${data.cardio.length} cardio, ${data.gainage.length} gainage, ${data.poids.length} pesée${data.poids.length > 1 ? 's' : ''}, stockés dans ce navigateur.`;
    $('#programme-rules').innerHTML = `<p class="muted" style="margin:0 0 6px">${esc(programme.nom)}</p><ul class="plain">${programme.progression.regles.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>`;
  }

  const render = { today: renderToday, history: renderHistory, progress: renderProgress, cardio: renderCardio, profil: renderProfil, data: renderData };

  // ---------- Événements ----------
  function bindEvents() {
    $('#tabbar').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-target]');
      if (b) showScreen(b.dataset.target);
    });

    $('#session-select').addEventListener('change', (e) => { todayState.sessionId = e.target.value; todayState.extraRows = {}; renderToday(); });
    $('#session-date').addEventListener('change', (e) => {
      todayState.date = e.target.value || todayISO();
      todayState.sessionId = defaultSessionId(todayState.date);
      todayState.extraRows = {};
      renderToday();
    });

    $('#today-content').addEventListener('click', (e) => {
      const ok = e.target.closest('.set-ok');
      if (ok) { logSet(ok.closest('.set-row')); return; }
      const del = e.target.closest('[data-del]');
      if (del) { removeEntry('muscu', del.dataset.del); renderToday(); return; }
      const add = e.target.closest('[data-add]');
      if (add) { todayState.extraRows[add.dataset.add] = (todayState.extraRows[add.dataset.add] || 0) + 1; renderToday(); return; }
      const go = e.target.closest('[data-go]');
      if (go) showScreen(go.dataset.go);
    });
    $('#today-content').addEventListener('change', (e) => {
      if (e.target.classList.contains('warm')) e.target.closest('.chk').classList.toggle('on', e.target.checked);
    });
    // Chargement différé des GIF : la source n'est posée qu'à l'ouverture du bloc.
    $('#today-content').addEventListener('toggle', (e) => {
      const d = e.target;
      if (d.classList?.contains('demo') && d.open) {
        const img = $('img[data-src]', d);
        if (img) { img.src = img.dataset.src; img.removeAttribute('data-src'); }
      }
    }, true);
    // Débloque le son dès le premier geste (nécessaire sur iOS/Android).
    document.addEventListener('pointerdown', unlockAudio, { once: true, passive: true });

    $('#rest-stop').addEventListener('click', () => stopRest());
    $('#rest-plus').addEventListener('click', () => {
      if (!rest.endAt) return;
      rest.endAt = Math.max(rest.endAt, Date.now()) + 30000;
      rest.total += 30;
      rest.fired = false;
      $('#rest-timer').classList.remove('over');
      $('#rest-sub').textContent = rest.label;
      persistRest();
      tickRest();
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden) { tickRest(); updateChrono(); } });
    $('#chrono').addEventListener('click', toggleChrono);

    $('#history-exercise').addEventListener('change', renderHistory);
    $('#history-date').addEventListener('change', renderHistory);
    $('#history-view').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-view]');
      if (!b) return;
      historyState.view = b.dataset.view;
      try { sessionStorage.setItem(HISTORY_VIEW_KEY, historyState.view); } catch (_) { /* ignore */ }
      renderHistory();
    });
    $('#screen-history').addEventListener('click', (e) => {
      const del = e.target.closest('[data-del]');
      if (del && confirm('Supprimer cette série ?')) { removeEntry('muscu', del.dataset.del); renderHistory(); }
    });
    // Mémorise les cartes dépliées pour les conserver après un re-rendu (suppression, filtre).
    $('#history-sessions').addEventListener('toggle', (e) => {
      const d = e.target;
      if (!d.classList?.contains('session-card')) return;
      if (d.open) historyState.open.add(d.dataset.key); else historyState.open.delete(d.dataset.key);
    }, true);

    $('#profil-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      data.profil = normalizeProfil({
        taille_cm: f.taille_cm.value,
        naissance: f.naissance.value,
        fc_max: f.fc_max.value,
        objectif: f.objectif.value.trim(),
      });
      save();
      renderProfil();
      toast('Profil enregistré');
    });
    $('#btn-fcmax').addEventListener('click', () => {
      const f = $('#profil-form');
      const age = ageFrom(f.naissance.value);
      if (age == null) { toast('Renseigne d\'abord ta date de naissance'); return; }
      f.fc_max.value = 220 - age;
      toast(`FC max estimée : 220 − ${age} = ${220 - age}`);
    });
    $('#poids-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      const poids = toNum(f.poids_kg.value);
      if (!f.date.value || poids == null || poids <= 0) { toast('Date et poids requis'); return; }
      data.poids.push({ id: uid(), date: f.date.value, poids_kg: poids, note: f.note.value.trim() });
      save();
      f.note.value = '';
      f.date.value = '';
      f.poids_kg.value = '';
      renderProfil();
      toast('Pesée enregistrée');
    });
    $('#poids-list').addEventListener('click', (e) => {
      const b = e.target.closest('[data-del-poids]');
      if (b && confirm('Supprimer cette pesée ?')) { removeEntry('poids', b.dataset.delPoids); renderProfil(); }
    });

    $('#cardio-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      data.cardio.push({
        id: uid(),
        date: f.date.value,
        type: f.type.value,
        duree_min: toNum(f.duree_min.value),
        distance_km: toNum(f.distance_km.value),
        fc_moy: toNum(f.fc_moy.value),
        fc_max: toNum(f.fc_max.value),
        pente_moy_pct: toNum(f.pente_moy_pct.value),
        note: f.note.value.trim(),
      });
      save();
      f.reset();
      renderCardio();
      toast('Cardio enregistré');
    });
    $('#gainage-form').addEventListener('submit', (e) => {
      e.preventDefault();
      const f = e.target;
      data.gainage.push({
        id: uid(),
        date: f.date.value,
        exercice: f.exercice.value.trim(),
        series: toNum(f.series.value),
        valeur: f.valeur.value.trim(),
        unite: f.unite.value,
        note: f.note.value.trim(),
      });
      save();
      f.reset();
      renderCardio();
      toast('Gainage enregistré');
    });
    $('#screen-cardio').addEventListener('click', (e) => {
      const c = e.target.closest('[data-del-cardio]');
      if (c && confirm('Supprimer cette séance cardio ?')) { removeEntry('cardio', c.dataset.delCardio); renderCardio(); }
      const g = e.target.closest('[data-del-gainage]');
      if (g && confirm('Supprimer cette entrée ?')) { removeEntry('gainage', g.dataset.delGainage); renderCardio(); }
    });

    $('#btn-export').addEventListener('click', () => {
      const blob = new Blob([JSON.stringify(exportJSON(), null, 1) + '\n'], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'seed.json';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
      toast('Export téléchargé');
    });
    $('#input-import').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const raw = JSON.parse(await file.text());
        if (!raw || !Array.isArray(raw.muscu)) throw new Error('format inattendu');
        const incoming = normalize(raw);
        if ($('#import-merge').checked) {
          const key = (x) => JSON.stringify([x.date, x.exercice ?? x.type, x.serie ?? x.duree_min ?? x.valeur ?? x.poids_kg, x.reps, x.charge_kg]);
          for (const k of ['muscu', 'cardio', 'gainage', 'poids']) {
            const have = new Set(data[k].map(key));
            for (const row of incoming[k]) if (!have.has(key(row))) data[k].push(row);
          }
          // Profil : les champs renseignés dans le fichier complètent ou remplacent les champs locaux.
          for (const [k, v] of Object.entries(incoming.profil)) if (v !== null && v !== '') data.profil[k] = v;
        } else {
          data = incoming;
        }
        save();
        renderData();
        toast(`Import : ${data.muscu.length} séries`);
      } catch (err) {
        alert('Import impossible : ' + err.message);
      }
      e.target.value = '';
    });
    $('#theme-select').addEventListener('click', (e) => {
      const b = e.target.closest('button[data-theme-choice]');
      if (b) applyTheme(b.dataset.themeChoice);
    });
    $('#btn-reset').addEventListener('click', async () => {
      if (!confirm('Effacer les données locales et recharger le seed ?')) return;
      try {
        await loadSeed();
        renderData();
        toast('Seed rechargé');
      } catch (err) {
        alert('Impossible de charger le seed : ' + err.message);
      }
    });
  }

  function removeEntry(kind, id) {
    data[kind] = data[kind].filter((e) => e.id !== id);
    save();
  }

  // ---------- Démarrage ----------
  async function init() {
    const d = new Date();
    $('#today-label').textContent = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });

    programme = await fetchJSON(PROG_URL);
    buildAliasMap();

    const stored = load();
    if (stored) {
      data = stored;
      try {
        const added = await mergeNewerSeed();
        if (added) setTimeout(() => toast(`${added} ligne${added > 1 ? 's' : ''} ajoutée${added > 1 ? 's' : ''} depuis les données du dépôt`), 300);
      } catch (err) { console.warn('Seed non fusionné', err); }
    } else {
      try { await loadSeed(); } catch (err) { console.warn('Seed indisponible', err); save(); }
    }

    bindEvents();
    applyTheme(isRetro() ? 'retro' : 'modern', { rerender: false });
    restoreRest();
    updateChrono();
    let start = 'today';
    try { start = sessionStorage.getItem(SESSION_KEY) || 'today'; } catch (_) { /* ignore */ }
    showScreen(render[start] ? start : 'today');

    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('sw.js').catch((err) => console.warn('SW non enregistré', err));
    }
  }

  init().catch((err) => {
    console.error(err);
    $('#app').innerHTML = `<p class="empty">Erreur de chargement : ${esc(err.message)}</p>`;
  });
})();
