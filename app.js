'use strict';
/* Casco: mentor diario de estudio. Todo se guarda en este dispositivo (localStorage). */

const CLAVE = 'casco-v1';
const CORTE = { netas: 58, de: 87 };            // corte del test en 2026
const GAPS = [1, 2, 4, 8, 15];                  // días entre repasos (= +1, +3, +7, +15, +30); luego cada 30
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* ---------- Estado ---------- */
function estadoNuevo() {
  return {
    v: 1, inicio: null, nivel: 1,
    ajustes: { hora: '18:00', foco: 25, descanso: 5 },
    dias: {},        // 'aaaa-mm-dd': { pomos, min }
    temas: {},       // id: { pag, fin, rep: [fechas] }
    tests: [],       // { fecha, tema, a, f, b }
    ctx: null,       // { tipo, tema }
    timer: null,     // { fase, fin, resto, dur }
    oferta: null,    // semana en la que ya se ofreció cambiar de nivel
  };
}
let st = cargar();
function cargar() {
  try {
    const raw = localStorage.getItem(CLAVE);
    if (raw) return Object.assign(estadoNuevo(), JSON.parse(raw));
  } catch (e) { /* almacenamiento no disponible */ }
  return estadoNuevo();
}
function guardar() {
  try { localStorage.setItem(CLAVE, JSON.stringify(st)); } catch (e) { /* sin almacenamiento */ }
}

/* ---------- Fechas ---------- */
const pad = n => String(n).padStart(2, '0');
const coma = s => String(s).replace('.', ',');
const clave = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const aFecha = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const sumar = (s, n) => { const d = aFecha(s); d.setDate(d.getDate() + n); return clave(d); };
const dow = s => aFecha(s).getDay();
const diasEntre = (a, b) => Math.round((aFecha(b) - aFecha(a)) / 864e5);
const bonita = s => { const d = aFecha(s); return `${DIAS[d.getDay()].toLowerCase()} ${d.getDate()} ${MESES[d.getMonth()]}`; };
function hoy() {
  const q = new URLSearchParams(location.search).get('hoy');   // solo para pruebas
  return q && /^\d{4}-\d{2}-\d{2}$/.test(q) ? q : clave(new Date());
}
function lunes(s) { const w = dow(s); return sumar(s, w === 0 ? -6 : 1 - w); }

/* ---------- Reglas del día ---------- */
const nivel = () => NIVELES[Math.min(Math.max(st.nivel, 1), NIVELES.length) - 1];
function objetivo(s) {
  const w = dow(s);
  if (w === 0) return 0;                                  // domingo: descanso
  if (w === 6) return Math.max(1, Math.ceil(nivel().pomos / 2)); // sábado: repaso ligero
  return nivel().pomos;
}
const dia = s => st.dias[s] || { pomos: 0, min: 0 };
const antesDeEmpezar = s => !st.inicio || s < st.inicio;

function racha() {
  let n = 0, fallos = 0, s = hoy();
  if (dia(s).pomos === 0) s = sumar(s, -1);               // hoy aún no ha terminado
  while (!antesDeEmpezar(s)) {
    if (dia(s).pomos > 0) { n++; fallos = 0; }
    else if (dow(s) !== 0) { fallos++; if (fallos >= 2) break; }
    s = sumar(s, -1);
  }
  return n;
}
function mejorRacha() {
  if (!st.inicio) return 0;
  let mejor = 0, n = 0, fallos = 0;
  for (let s = st.inicio; s <= hoy(); s = sumar(s, 1)) {
    if (dia(s).pomos > 0) { n++; fallos = 0; mejor = Math.max(mejor, n); }
    else if (dow(s) !== 0 && s !== hoy()) { fallos++; if (fallos >= 2) n = 0; }
  }
  return mejor;
}
function cadenaEnPeligro() {
  const h = hoy(); if (dia(h).pomos > 0) return false;
  let y = sumar(h, -1); if (dow(y) === 0) y = sumar(y, -1);
  return !antesDeEmpezar(y) && dia(y).pomos === 0 && dow(h) !== 0;
}

/* ---------- Temario y repasos ---------- */
const tema = id => TEMAS.find(t => t.id === id);
const et = id => st.temas[id] || (st.temas[id] = { pag: 0, fin: null, rep: [] });
function proximoRepaso(id) {
  const s = st.temas[id]; if (!s || !s.fin) return null;
  const k = s.rep.length;
  const base = k === 0 ? s.fin : s.rep[k - 1];
  return sumar(base, GAPS[k] !== undefined ? GAPS[k] : 30);
}
const repasosPendientes = () => TEMAS.filter(t => { const r = proximoRepaso(t.id); return r && r <= hoy(); });
const temaActual = tipo => TEMAS.find(t => t.tipo === tipo && !(st.temas[t.id] && st.temas[t.id].fin));
function tipoDeHoy() {
  let tipo = dow(hoy()) === 5 ? 'com' : 'esp';             // viernes: comunes
  if (!temaActual(tipo)) tipo = tipo === 'com' ? 'esp' : 'com';
  return temaActual(tipo) ? tipo : null;
}
function terminarTema(id) {
  const s = et(id); s.pag = tema(id).p; s.fin = s.fin || hoy(); guardar();
}
function repasar(id) { et(id).rep.push(hoy()); guardar(); }
const netas = t => t.a - t.f / 3;
const pct = t => { const tot = t.a + t.f + (t.b || 0); return tot ? netas(t) / tot : 0; };

/* ---------- Niveles ---------- */
function semanaCumplida(lun) {
  let ok = 0;
  for (let i = 0; i < 6; i++) { const s = sumar(lun, i); if (!antesDeEmpezar(s) && dia(s).pomos >= objetivo(s)) ok++; }
  return ok;
}
function semanaConAlgo(lun) {
  let ok = 0;
  for (let i = 0; i < 6; i++) if (dia(sumar(lun, i)).pomos > 0) ok++;
  return ok;
}
function propuestaNivel() {
  const esta = lunes(hoy());
  if (st.oferta === esta || !st.inicio) return null;
  const s1 = sumar(esta, -7), s2 = sumar(esta, -14);
  if (antesDeEmpezar(s2)) return null;                     // hacen falta 2 semanas completas
  if (st.nivel < NIVELES.length && semanaCumplida(s1) >= 5 && semanaCumplida(s2) >= 5) return 'subir';
  if (st.nivel > 1 && semanaConAlgo(s1) < 3 && semanaConAlgo(s2) < 3) return 'bajar';
  return null;
}

/* ---------- Utilidades de interfaz ---------- */
const $ = sel => document.querySelector(sel);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.hidden = false;
  clearTimeout(toast.h); toast.h = setTimeout(() => { t.hidden = true; }, 2600);
}
function modal(html) {
  const m = $('#modal'); m.innerHTML = `<div class="sheet">${html}</div>`; m.hidden = false;
}
function cerrarModal() { $('#modal').hidden = true; $('#modal').innerHTML = ''; }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') cerrarModal(); });
const ninja = (url, txt, cls = 'btn small ghost') => `<a class="${cls}" href="${url}" target="_blank" rel="noopener">🥷 ${txt}</a>`;
function tecnicasDesbloqueadas() { return TECNICAS.filter(t => t.nivel <= st.nivel); }
function fraseDelDia() {
  const n = diasEntre('2026-01-01', hoy());
  return FRASES[((n % FRASES.length) + FRASES.length) % FRASES.length];
}

/* ---------- Vista: Hoy ---------- */
function vistaHoy() {
  const h = hoy(), d = dia(h), obj = objetivo(h), r = racha(), niv = nivel();
  const pend = repasosPendientes();
  const tipo = tipoDeHoy(), act = tipo && temaActual(tipo);
  const w = dow(h);

  // Mentor
  let mentor;
  if (!st.inicio) mentor = '¡Bienvenido! Empezamos poco a poco.';
  else if (w === 0) mentor = 'Hoy es domingo: toca descansar. No rompe la cadena. Si te apetece, un repaso suave y ya.';
  else if (d.pomos >= obj) mentor = `Objetivo de hoy cumplido (${d.pomos}/${obj}). Todo lo que hagas de más es extra; también vale parar aquí.`;
  else if (cadenaEnPeligro()) mentor = 'Ayer no hubo estudio. No pasa nada: la regla es no fallar nunca dos días seguidos. Hoy, con 1 pomodoro, la cadena sigue viva.';
  else if (d.pomos > 0) mentor = `Llevas ${d.pomos} de ${obj}. ¡Vas bien!`;
  else mentor = fraseDelDia();

  // Propuesta de nivel
  const prop = propuestaNivel();
  let propHtml = '';
  if (prop === 'subir') {
    const sig = NIVELES[st.nivel];
    propHtml = `<div class="card hot"><h3>🔥 Dos semanas cumpliendo. ¿Subes a ${sig.nombre}?</h3>
      <p class="muted small">Objetivo: ${sig.pomos} pomodoros al día. ${sig.desc}</p>
      <div class="row"><button class="btn primary small" data-act="nivel-subir">Sí, subo</button>
      <button class="btn ghost small" data-act="nivel-quedar">Todavía no</button></div></div>`;
  } else if (prop === 'bajar') {
    propHtml = `<div class="card"><h3>¿Bajamos un nivel?</h3>
      <p class="muted small">Las dos últimas semanas han sido flojas. No pasa nada: mejor un objetivo que se cumpla que uno que agobie.</p>
      <div class="row"><button class="btn small" data-act="nivel-bajar">Bajar a ${NIVELES[st.nivel - 2].nombre}</button>
      <button class="btn ghost small" data-act="nivel-quedar">Seguir igual</button></div></div>`;
  }

  // Cadena de los últimos 7 días
  let cadena = '';
  for (let i = 6; i >= 0; i--) {
    const s = sumar(h, -i), p = dia(s).pomos, o = objetivo(s);
    const cls = dow(s) === 0 && p === 0 ? 'rest' : p >= o && p > 0 ? 'full' : p > 0 ? 'some' : '';
    cadena += `<div class="d"><div class="dot ${cls} ${i === 0 ? 'today' : ''}">${p > 0 ? '✓' : dow(s) === 0 ? '·' : ''}</div>${DIAS[dow(s)]}</div>`;
  }

  // Tareas
  let tareas = '';
  if (w === 0) {
    tareas = `<div class="task"><div class="ic">🛌</div><div class="txt"><b>Descanso</b><div class="muted small">Recarga. Mañana se vuelve.</div></div></div>`;
  } else {
    let resto = obj;
    if (pend.length) {
      resto--;
      tareas += `<div class="task"><div class="ic">🔁</div><div class="txt"><b>Repaso espaciado</b>
        <div class="muted small">Folio en blanco y márgenes, no releer entero. ${pend.length > 1 ? `Hay ${pend.length} temas pendientes.` : ''}</div>
        ${pend.slice(0, 4).map(t => `<div class="row between" style="margin-top:8px"><span class="grow">Tema ${t.n} · ${esc(t.t)}</span>
          <button class="btn small" data-act="pomo" data-tipo="repaso" data-tema="${t.id}">▶</button>
          <button class="btn small ok" data-act="repasado" data-tema="${t.id}">✓</button></div>`).join('')}
      </div></div>`;
    }
    const cierre = st.nivel >= 2 && obj >= 3;
    if (cierre) resto--;
    if (w === 6) {
      tareas += `<div class="task"><div class="ic">🧪</div><div class="txt"><b>Sábado: test mixto en Ninja</b>
        <div class="muted small">Un test que mezcle todo lo visto hasta ahora. Luego marca con ★ en el PDF lo que hayas fallado.</div>
        <div class="acts">${ninja(NINJA.tests, 'Ir a los tests')}<button class="btn small" data-act="test">Apuntar resultado</button></div></div></div>`;
    } else if (act) {
      const s = et(act.id), n = Math.max(1, resto), desde = s.pag + 1;
      const hasta = Math.min(act.p, s.pag + n * PAGS_POMO[act.tipo]);
      const prog = Math.round(100 * s.pag / act.p);
      tareas += `<div class="task"><div class="ic">📖</div><div class="txt"><b>Tema ${act.n} · ${esc(act.t)}</b>
        <div class="muted small">${act.tipo === 'com' ? 'Viernes de comunes. ' : ''}Hoy: páginas ${desde} a ${hasta} (${n} pomodoro${n > 1 ? 's' : ''}).</div>
        <div class="bar" style="margin-top:8px"><i style="width:${prog}%"></i></div>
        <div class="muted small" style="margin-top:6px">💡 ${esc(act.tip)}</div>
        <div class="acts"><button class="btn small primary" data-act="pomo" data-tipo="nuevo" data-tema="${act.id}">▶ Empezar</button>
        ${ninja(NINJA.clases, 'Clase en Ninja')}</div></div></div>`;
    } else {
      tareas += `<div class="task"><div class="ic">🏁</div><div class="txt"><b>¡Primera vuelta completa!</b><div class="muted small">Ahora todo es repaso y tests.</div></div></div>`;
    }
    if (cierre && w !== 6) {
      tareas += `<div class="task"><div class="ic">📝</div><div class="txt"><b>Cierre: folio en blanco + test corto</b>
        <div class="muted small">Folio de lo de hoy y 10-20 preguntas del tema en Ninja.</div>
        <div class="acts"><button class="btn small" data-act="pomo" data-tipo="cierre" data-tema="${act ? act.id : ''}">▶ Pomodoro</button>
        ${ninja(NINJA.tests, 'Test en Ninja')}<button class="btn small" data-act="test">Apuntar resultado</button></div></div></div>`;
    }
  }

  const tec = tecnicasDesbloqueadas();
  const tecHoy = tec[diasEntre('2026-01-01', h) % tec.length];
  const pomos = Array.from({ length: Math.max(obj, d.pomos) }, (_, i) => `<span class="${i < d.pomos ? 'on' : ''}">${i < d.pomos ? '🔥' : ''}</span>`).join('');

  return `<div class="top">
    <a href="#ajustes" class="gear-mobile" aria-label="Ajustes">⚙️</a>
    <p class="muted small" style="margin:0">${bonita(h)}</p>
    <h1>Hoy</h1></div>
    <div class="card">
      <div class="streak"><div class="big">🔥</div><div class="grow"><div class="num">${r} día${r === 1 ? '' : 's'}</div>
      <div class="muted small">de cadena · nivel ${niv.n} · ${niv.nombre}</div></div>
      <div style="text-align:right"><div class="pomos">${pomos}</div><div class="muted small" style="margin-top:4px">${d.pomos}/${obj} hoy</div></div></div>
      <div class="chain">${cadena}</div>
    </div>
    <div class="card mentor"><div class="av">🧑‍🚒</div><p>${mentor}</p></div>
    ${propHtml}
    <h2>Lo que toca</h2>
    <div class="card">${tareas}</div>
    <div class="row wrap">
      <button class="btn ghost small" data-act="mas-pomo">＋ Apuntar un pomodoro hecho sin la app</button>
      ${ninja(NINJA.inicio, 'Abrir Formación Ninja')}
    </div>
    <h2>Técnica del día</h2>
    <a class="card tec" href="#tecnicas" style="display:block;text-decoration:none;color:inherit">
      <div class="head"><span class="ico">${tecHoy.icono}</span><div><b>${tecHoy.nombre}</b><div class="muted small">${tecHoy.corto}</div></div></div>
    </a>`;
}

/* ---------- Vista: Pomodoro ---------- */
function vistaPomodoro() {
  const ctx = st.ctx || { tipo: 'libre', tema: null };
  const t = ctx.tema && tema(ctx.tema);
  const guia = GUIAS[ctx.tipo] || GUIAS.libre;
  const titulo = { nuevo: 'Materia nueva', repaso: 'Repaso', cierre: 'Cierre del día', libre: 'Pomodoro libre' }[ctx.tipo];
  const tm = st.timer;
  const enMarcha = tm && !tm.resto;
  return `<h1>Pomodoro</h1>
    <p class="sub">${titulo}${t ? ` · Tema ${t.n} · ${esc(t.t)}` : ''}</p>
    <div class="card">
      <div class="timer-wrap">
        <div class="ring"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="none" stroke="#2a231f" stroke-width="7"/>
          <circle id="arc" cx="50" cy="50" r="45" fill="none" stroke="url(#g)" stroke-width="7" stroke-linecap="round" stroke-dasharray="282.7" stroke-dashoffset="0"/>
          <defs><linearGradient id="g"><stop offset="0" stop-color="#e8412c"/><stop offset="1" stop-color="#ff8a3d"/></linearGradient></defs></svg>
          <div class="time"><b id="reloj">--:--</b><span id="fase">${tm ? (tm.fase === 'foco' ? 'Foco' : 'Descanso') : 'Listo'}</span></div></div>
        <div class="row" style="margin-top:16px">
          ${!tm ? `<button class="btn primary" data-act="t-start">▶ Empezar ${st.ajustes.foco} min</button>`
            : enMarcha ? `<button class="btn" data-act="t-pausa">⏸ Pausa</button><button class="btn ghost" data-act="t-parar">■ Terminar</button>`
            : `<button class="btn primary" data-act="t-seguir">▶ Seguir</button><button class="btn ghost" data-act="t-parar">■ Terminar</button>`}
        </div>
        <p class="muted small" style="text-align:center">Hoy: ${dia(hoy()).pomos} pomodoro(s) · ${dia(hoy()).min} min netos</p>
      </div>
    </div>
    <h2>Pasos</h2>
    <div class="card"><ol class="steps">${guia.map(g => `<li>${esc(g)}</li>`).join('')}</ol>
      ${t ? `<p class="muted small">💡 ${esc(t.tip)}</p>` : ''}
      ${ctx.tipo === 'cierre' ? `<div class="row">${ninja(NINJA.tests, 'Test en Ninja')}<button class="btn small" data-act="test">Apuntar resultado</button></div>` : ''}
    </div>
    <h2>Cambiar de tipo</h2>
    <div class="seg">${['nuevo', 'repaso', 'cierre', 'libre'].map(k => `<button class="${ctx.tipo === k ? 'on' : ''}" data-act="ctx" data-tipo="${k}">${k[0].toUpperCase() + k.slice(1)}</button>`).join('')}</div>
    <p class="muted small">En el iPhone, deja la app abierta durante el pomodoro: la pantalla no se apaga mientras corre el tiempo.</p>`;
}

let wakeLock = null;
async function pedirWakeLock() {
  try { if ('wakeLock' in navigator && !wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); } } catch (e) { /* no disponible */ }
}
function soltarWakeLock() { try { wakeLock && wakeLock.release(); } catch (e) { /* nada */ } wakeLock = null; }

let audioCtx = null;
function prepararAudio() {
  try { audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)(); audioCtx.resume(); } catch (e) { /* sin audio */ }
}
function pitido() {
  if (!audioCtx) return;
  [0, .35, .7].forEach(t0 => {
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
    const t = audioCtx.currentTime + t0;
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.3, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .25);
    o.start(t); o.stop(t + .3);
  });
}
async function avisar(texto) {
  pitido();
  try { navigator.vibrate && navigator.vibrate([300, 150, 300]); } catch (e) { /* nada */ }
  try {
    if ('Notification' in window && Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) reg.showNotification('Casco', { body: texto, icon: 'icons/icon-192.png' });
      else new Notification('Casco', { body: texto });
    }
  } catch (e) { /* nada */ }
}

function iniciarTimer(fase) {
  const min = fase === 'foco' ? st.ajustes.foco : st.ajustes.descanso;
  st.timer = { fase, dur: min, fin: Date.now() + min * 60000, resto: null };
  guardar(); pedirWakeLock();
}
function sumarPomodoro(min, completo) {
  const h = hoy(), d = st.dias[h] || (st.dias[h] = { pomos: 0, min: 0 });
  if (completo) d.pomos++;
  d.min += Math.round(min);
  if (!st.inicio) st.inicio = h;
  guardar();
}
function tick() {
  const tm = st.timer;
  const reloj = $('#reloj'), arc = $('#arc');
  if (!tm) { if (reloj) reloj.textContent = `${pad(st.ajustes.foco)}:00`; if (document.title !== 'Casco') document.title = 'Casco'; return; }
  const resto = tm.resto != null ? tm.resto : tm.fin - Date.now();
  if (resto <= 0) return terminarFase();
  if (reloj) {
    const s = Math.ceil(resto / 1000);
    reloj.textContent = `${pad(Math.floor(s / 60))}:${pad(s % 60)}`;
    arc.setAttribute('stroke-dashoffset', String(282.7 * (1 - resto / (tm.dur * 60000))));
    document.title = `${pad(Math.floor(s / 60))}:${pad(s % 60)} · Casco`;
  }
}
function terminarFase() {
  const tm = st.timer; st.timer = null; document.title = 'Casco';
  if (tm.fase === 'foco') {
    sumarPomodoro(tm.dur, true);
    avisar('¡Pomodoro hecho! Toca descanso.');
    iniciarTimer('descanso');
    render();
    preguntarTrasPomodoro();
  } else {
    guardar(); soltarWakeLock();
    avisar('Fin del descanso. ¿Otro pomodoro?');
    render();
  }
}
function preguntarTrasPomodoro() {
  const ctx = st.ctx; const d = dia(hoy()), obj = objetivo(hoy());
  const meta = d.pomos === obj ? '<p>🎯 <b>¡Objetivo del día cumplido!</b></p>' : '';
  if (ctx && ctx.tipo === 'nuevo' && ctx.tema) {
    const t = tema(ctx.tema), s = et(t.id);
    modal(`<h3>🔥 Pomodoro ${d.pomos} hecho</h3>${meta}
      <label class="f">¿Hasta qué página has llegado del tema ${t.n}? (tiene ${t.p})</label>
      <input type="number" id="pag" min="0" max="${t.p}" value="${Math.min(t.p, s.pag + PAGS_POMO[t.tipo])}">
      <div class="row" style="margin-top:14px"><button class="btn primary grow" data-act="guardar-pag" data-tema="${t.id}">Guardar</button>
      <button class="btn ghost" data-act="cerrar">Luego</button></div>`);
  } else if (ctx && ctx.tipo === 'repaso' && ctx.tema) {
    const t = tema(ctx.tema);
    modal(`<h3>🔥 Pomodoro ${d.pomos} hecho</h3>${meta}<p>¿Das por hecho el repaso del tema ${t.n}?</p>
      <div class="row"><button class="btn ok grow" data-act="repasado" data-tema="${t.id}">✓ Sí, repasado</button>
      <button class="btn ghost" data-act="cerrar">Todavía no</button></div>`);
  } else if (meta) {
    modal(`<h3>🔥 Pomodoro ${d.pomos} hecho</h3>${meta}<button class="btn primary block" data-act="cerrar">Genial</button>`);
  } else toast(`🔥 Pomodoro ${d.pomos} hecho. ¡A descansar!`);
}

/* ---------- Vista: Temario ---------- */
function vistaTemario() {
  const bloques = [...new Set(TEMAS.map(t => t.b))];
  const totalP = TEMAS.reduce((a, t) => a + t.p, 0);
  const leidas = TEMAS.reduce((a, t) => a + Math.min(t.p, (st.temas[t.id] || {}).pag || 0), 0);
  const hechos = TEMAS.filter(t => (st.temas[t.id] || {}).fin).length;
  return `<h1>Temario</h1>
    <p class="sub">${hechos}/40 temas en primera vuelta · ${leidas} de ${totalP} páginas</p>
    <div class="bar" style="margin-bottom:16px"><i style="width:${100 * leidas / totalP}%"></i></div>
    <div class="row wrap" style="margin-bottom:8px">${ninja(NINJA.clases, 'Clases en Ninja')}${ninja(NINJA.tests, 'Tests en Ninja')}</div>
    ${bloques.map(b => `<h2>${esc(b)}</h2><div class="card">${TEMAS.filter(t => t.b === b).map(filaTema).join('')}</div>`).join('')}`;
}
function filaTema(t) {
  const s = st.temas[t.id] || { pag: 0 };
  const rep = proximoRepaso(t.id);
  let chip;
  if (s.fin) chip = rep <= hoy() ? '<span class="chip warn">Repaso hoy</span>' : `<span class="chip ok">Repaso ${bonita(rep)}</span>`;
  else if (s.pag > 0) chip = `<span class="chip fire">${Math.round(100 * s.pag / t.p)} %</span>`;
  else chip = '<span class="chip">Sin empezar</span>';
  return `<div class="tema" data-act="tema" data-tema="${t.id}"><div class="num">${t.n}</div>
    <div class="info"><b>${esc(t.t)}</b><span class="muted small">${t.p} págs.</span></div>${chip}</div>`;
}
function abrirTema(id) {
  const t = tema(id), s = et(id), rep = proximoRepaso(id);
  const tests = st.tests.filter(x => x.tema === id);
  modal(`<p class="muted small" style="margin:0">Tema ${t.n} · ${esc(t.b)}</p><h3 style="font-size:20px">${esc(t.t)}</h3>
    <p class="small">💡 ${esc(t.tip)}</p>
    <label class="f">Página por la que vas (de ${t.p})</label>
    <div class="row"><input type="number" id="pag" min="0" max="${t.p}" value="${s.pag}"><button class="btn" data-act="guardar-pag" data-tema="${id}">Guardar</button></div>
    <hr>
    ${s.fin ? `<p class="small">Primera vuelta terminada el ${bonita(s.fin)} · ${s.rep.length} repaso(s) hecho(s).<br>Próximo repaso: <b>${bonita(rep)}</b></p>
      <div class="row wrap"><button class="btn ok small" data-act="repasado" data-tema="${id}">✓ Repaso hecho hoy</button>
      <button class="btn ghost small" data-act="desterminar" data-tema="${id}">Desmarcar terminado</button></div>`
      : `<button class="btn primary block" data-act="terminar" data-tema="${id}">✓ Primera vuelta terminada</button>`}
    <hr>
    <div class="row wrap"><button class="btn small" data-act="pomo" data-tipo="${s.fin ? 'repaso' : 'nuevo'}" data-tema="${id}">▶ Pomodoro con este tema</button>
      <button class="btn small" data-act="test" data-tema="${id}">Apuntar test</button>${ninja(NINJA.tests, 'Test en Ninja')}</div>
    ${tests.length ? `<p class="muted small">Tests: ${tests.slice(-5).map(x => `${Math.round(100 * pct(x))} %`).join(' · ')}</p>` : ''}
    <button class="btn ghost block" style="margin-top:12px" data-act="cerrar">Cerrar</button>`);
}

/* ---------- Tests ---------- */
function abrirTest(temaId) {
  const opts = [['mixto', 'Test mixto'], ['simulacro', 'Simulacro completo'], ...TEMAS.map(t => [t.id, `Tema ${t.n} · ${t.t}`])];
  const sel = temaId || (st.ctx && st.ctx.tema) || 'mixto';
  modal(`<h3>Apuntar resultado de un test de Ninja</h3>
    <label class="f">¿De qué?</label>
    <select id="tt">${opts.map(([v, l]) => `<option value="${v}" ${v === sel ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
    <div class="grid3"><div><label class="f">Aciertos</label><input type="number" id="ta" min="0" inputmode="numeric"></div>
    <div><label class="f">Fallos</label><input type="number" id="tf" min="0" inputmode="numeric"></div>
    <div><label class="f">En blanco</label><input type="number" id="tb" min="0" inputmode="numeric" value="0"></div></div>
    <p class="muted small">Netas = aciertos − fallos ÷ 3. Corte de 2026: ${CORTE.netas} de ${CORTE.de} (${Math.round(100 * CORTE.netas / CORTE.de)} %).</p>
    <div class="row"><button class="btn primary grow" data-act="guardar-test">Guardar</button><button class="btn ghost" data-act="cerrar">Cancelar</button></div>`);
}
function guardarTest() {
  const a = +$('#ta').value || 0, f = +$('#tf').value || 0, b = +$('#tb').value || 0;
  if (a + f + b === 0) return toast('Pon al menos los aciertos y los fallos');
  const t = { fecha: hoy(), tema: $('#tt').value, a, f, b };
  st.tests.push(t); guardar(); cerrarModal();
  const p = pct(t), eq = coma((p * CORTE.de).toFixed(1));
  modal(`<h3>${p >= CORTE.netas / CORTE.de ? '✅ Por encima del corte' : '📌 Por debajo del corte… por ahora'}</h3>
    <p><b>${coma(netas(t).toFixed(2))} netas</b> de ${a + f + b} (${Math.round(100 * p)} %). En el examen equivaldría a <b>${eq}</b> de ${CORTE.de}; el corte fue ${CORTE.netas}.</p>
    <p class="muted small">Subrayado inverso: busca en el PDF las ${f} preguntas falladas y márcalas con ★.</p>
    <button class="btn primary block" data-act="cerrar">Hecho</button>`);
  render();
}

/* ---------- Vista: Técnicas ---------- */
let tecAbierta = null;
function vistaTecnicas() {
  return `<h1>Técnicas</h1>
    <p class="sub">Se desbloquean de una en una según subes de nivel, para no agobiarse. Estás en el nivel ${st.nivel} · ${nivel().nombre}.</p>
    ${TECNICAS.map(t => {
      const lock = t.nivel > st.nivel, open = tecAbierta === t.id;
      return `<div class="card tec ${lock ? 'locked' : ''}" data-act="tec" data-id="${t.id}">
        <div class="head"><span class="ico">${lock ? '🔒' : t.icono}</span><div class="grow"><b>${t.nombre}</b>
        <div class="muted small">${lock ? `Se desbloquea en el nivel ${t.nivel} (${NIVELES[t.nivel - 1].nombre})` : t.corto}</div></div>
        <span class="muted">${open ? '▴' : '▾'}</span></div>
        ${open ? `<ol>${t.pasos.map(p => `<li>${esc(p)}</li>`).join('')}</ol>${t.id === 'fonetico' ? conversorHtml() : ''}` : ''}
      </div>`;
    }).join('')}
    <h2>Lo que nunca se salta</h2>
    <div class="card"><b>🔁 Repaso espaciado</b><p class="muted small" style="margin:4px 0 0">Cuando terminas un tema, la app te lo devuelve para repasar al día siguiente, a los 3 días, a la semana, a los 15 días y al mes. Sin repaso, en un mes se olvida casi todo.</p></div>`;
}
const FONO = { 0: 'S / Z', 1: 'T / D', 2: 'N / Ñ', 3: 'M', 4: 'R', 5: 'L', 6: 'J / G / CH', 7: 'K / C / Q', 8: 'F', 9: 'P / B' };
function conversorHtml() {
  return `<div style="margin-top:14px" onclick="event.stopPropagation()"><label class="f">Conversor: escribe un número</label>
    <input type="text" inputmode="numeric" id="fono" placeholder="Ej.: 14" autocomplete="off">
    <div id="fono-out" class="small" style="margin-top:8px"></div>
    <div style="margin-top:10px">${ninja(NINJA.inicio, 'Calculadora Fonética de Ninja')}</div></div>`;
}

/* ---------- Vista: Progreso ---------- */
function vistaProgreso() {
  const h = hoy();
  const totalPomos = Object.values(st.dias).reduce((a, d) => a + d.pomos, 0);
  const totalMin = Object.values(st.dias).reduce((a, d) => a + d.min, 0);
  const hechos = TEMAS.filter(t => (st.temas[t.id] || {}).fin).length;
  // Mapa de calor: 12 semanas, de lunes a domingo
  const ini = sumar(lunes(h), -77);
  let heat = DIAS.slice(1).concat('Dom').map(x => `<div class="hd">${x[0]}</div>`).join('');
  for (let i = 0; i < 84; i++) {
    const s = sumar(ini, i), p = dia(s).pomos, o = Math.max(1, objetivo(s));
    const l = s > h ? 'fut' : p === 0 ? '' : p >= o * 1.5 ? 'l4' : p >= o ? 'l3' : p >= o / 2 ? 'l2' : 'l1';
    heat += `<div class="${l}" title="${s}: ${p} pomodoros"></div>`;
  }
  // Horas por semana (8 semanas)
  const semanas = [];
  for (let k = 7; k >= 0; k--) {
    const l = sumar(lunes(h), -7 * k); let m = 0;
    for (let i = 0; i < 7; i++) m += dia(sumar(l, i)).min;
    semanas.push({ l, m });
  }
  const maxM = Math.max(60, ...semanas.map(s => s.m));
  const barras = semanas.map(s => `<div style="flex:1;text-align:center"><div style="height:110px;display:flex;align-items:flex-end;justify-content:center">
    <div style="width:70%;height:${100 * s.m / maxM}%;background:linear-gradient(180deg,#ff8a3d,#e8412c);border-radius:6px 6px 2px 2px;min-height:${s.m ? 4 : 0}px"></div></div>
    <div class="muted small">${coma((s.m / 60).toFixed(1))} h</div><div class="muted" style="font-size:10px">${aFecha(s.l).getDate()} ${MESES[aFecha(s.l).getMonth()]}</div></div>`).join('');
  return `<h1>Progreso</h1><p class="sub">Lo que se mide, mejora.</p>
    <div class="stats">
      <div class="stat"><b>🔥 ${racha()}</b><span>días de cadena</span></div>
      <div class="stat"><b>${mejorRacha()}</b><span>mejor cadena</span></div>
      <div class="stat"><b>${totalPomos}</b><span>pomodoros</span></div>
      <div class="stat"><b>${coma((totalMin / 60).toFixed(1))} h</b><span>estudio neto</span></div>
      <div class="stat"><b>${hechos}/40</b><span>temas vistos</span></div>
      <div class="stat"><b>${st.nivel} · ${nivel().nombre}</b><span>nivel</span></div>
    </div>
    <h2>Últimas 12 semanas</h2><div class="card"><div class="heat">${heat}</div></div>
    <h2>Horas netas por semana</h2><div class="card"><div class="row" style="align-items:flex-end;gap:4px">${barras}</div></div>
    <h2>Tests de Ninja</h2>${graficaTests()}`;
}
function graficaTests() {
  const ts = st.tests.slice(-20);
  if (!ts.length) return `<div class="card muted">Todavía no hay tests apuntados. Después de cada test en Ninja, apunta aciertos y fallos para ver tu evolución frente al corte.<div style="margin-top:10px"><button class="btn small" data-act="test">Apuntar el primero</button></div></div>`;
  const W = 320, H = 140, pad = 24, corte = CORTE.netas / CORTE.de;
  const x = i => pad + (ts.length === 1 ? (W - 2 * pad) / 2 : i * (W - 2 * pad) / (ts.length - 1));
  const y = p => H - pad - Math.max(0, Math.min(1, p)) * (H - 2 * pad);
  const pts = ts.map((t, i) => `${x(i)},${y(pct(t))}`).join(' ');
  const nombre = id => id === 'mixto' ? 'Mixto' : id === 'simulacro' ? 'Simulacro' : `Tema ${tema(id) ? tema(id).n : id}`;
  return `<div class="card"><svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto">
      <line x1="${pad}" x2="${W - pad}" y1="${y(corte)}" y2="${y(corte)}" stroke="#3fb27f" stroke-dasharray="4 4"/>
      <text x="${W - pad}" y="${y(corte) - 5}" fill="#8fe0b8" font-size="10" text-anchor="end">corte ${Math.round(corte * 100)} %</text>
      <polyline points="${pts}" fill="none" stroke="#ff8a3d" stroke-width="2.5" stroke-linejoin="round"/>
      ${ts.map((t, i) => `<circle cx="${x(i)}" cy="${y(pct(t))}" r="3.5" fill="#e8412c"/>`).join('')}
    </svg>
    ${ts.slice(-6).reverse().map(t => `<div class="row between small" style="padding:6px 0;border-top:1px solid var(--line)">
      <span>${bonita(t.fecha)} · ${esc(nombre(t.tema))}</span><span><b>${Math.round(100 * pct(t))} %</b> <span class="muted">(${coma(netas(t).toFixed(1))} netas)</span></span></div>`).join('')}
    <div style="margin-top:10px"><button class="btn small" data-act="test">Apuntar test</button></div></div>`;
}

/* ---------- Vista: Ajustes ---------- */
function vistaAjustes() {
  const a = st.ajustes;
  const notif = 'Notification' in window ? Notification.permission : 'no';
  return `<h1>Ajustes</h1>
    <h2>⏰ Alarma diaria</h2>
    <div class="card"><label class="f">Hora de estudio (siempre la misma: el hábito se ata a una hora)</label>
      <input type="time" id="hora" value="${a.hora}">
      <p class="muted small">Esto crea un evento que se repite de lunes a sábado, con aviso, en el calendario del móvil o del ordenador. En el iPhone, ábrelo y pulsa «Añadir todo».</p>
      <button class="btn primary block" data-act="ics">📅 Añadir la alarma al calendario</button></div>
    <h2>⏱️ Pomodoro</h2>
    <div class="card"><div class="grid3" style="grid-template-columns:1fr 1fr">
      <div><label class="f">Foco (min)</label><select id="foco">${[25, 30, 40, 50].map(v => `<option ${v === a.foco ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
      <div><label class="f">Descanso (min)</label><select id="desc">${[5, 10, 15].map(v => `<option ${v === a.descanso ? 'selected' : ''}>${v}</option>`).join('')}</select></div></div>
      <p class="muted small">Empieza con 25 y 5. Cuando se quede corto (hacia el segundo mes), pasa a 50 y 10.</p>
      <p class="small">Avisos del navegador: <b>${notif === 'granted' ? 'activados' : notif === 'denied' ? 'bloqueados' : notif === 'no' ? 'no disponibles aquí' : 'sin activar'}</b>
      ${notif === 'default' ? '<button class="btn small" data-act="notif">Activar</button>' : ''}</p>
      ${notif === 'no' ? '<p class="muted small">En el iPhone, los avisos solo funcionan con la app añadida a la pantalla de inicio.</p>' : ''}</div>
    <h2>🔥 Nivel</h2>
    <div class="card"><select id="nivel">${NIVELES.map(n => `<option value="${n.n}" ${n.n === st.nivel ? 'selected' : ''}>${n.n} · ${n.nombre} · ${n.pomos} pomodoros/día</option>`).join('')}</select>
      <p class="muted small">${nivel().desc} La app te propondrá subir tras dos semanas cumpliendo, y bajar si cuesta. Nunca hay prisa.</p></div>
    <h2>📲 Instalar en el móvil</h2>
    <div class="card small"><b>iPhone:</b> abre esta página en Safari → botón Compartir → «Añadir a pantalla de inicio».<br>
      <b>Android:</b> en Chrome, menú ⋮ → «Instalar aplicación».<br>
      <b>Ordenador:</b> en Chrome o Edge, el icono de instalar de la barra de direcciones.</div>
    <h2>🎬 Intro</h2>
    <div class="card"><p class="muted small" style="margin-top:0">El tutorial del principio: cómo funciona la app y cómo será el plan.</p>
      <button class="btn" data-act="intro">▶ Ver la intro otra vez</button></div>
    <h2>💾 Copia de seguridad</h2>
    <div class="card"><p class="muted small" style="margin-top:0">Los datos se guardan solo en este dispositivo. Para pasarlos del móvil al ordenador (o al revés), o para no perderlos, haz una copia y cárgala en el otro.</p>
      <div class="row wrap"><button class="btn" data-act="exportar">⬇️ Descargar copia</button>
      <label class="btn">⬆️ Cargar copia<input type="file" id="importar" accept="application/json,.json" hidden></label></div>
      <hr><button class="btn ghost small" data-act="borrar">Borrar todos los datos</button></div>
    <p class="muted small">Casco · herramienta personal de estudio. No está vinculada a Formación Ninja: solo enlaza a su plataforma.</p>`;
}
function descargar(nombre, tipo, texto) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([texto], { type: tipo }));
  a.download = nombre; document.body.appendChild(a); a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
}
function crearIcs() {
  const [hh, mm] = st.ajustes.hora.split(':');
  const d = hoy().replace(/-/g, '');
  const ics = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Casco//Estudio//ES', 'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT', `UID:casco-estudio-${Date.now()}@casco`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}Z`,
    `DTSTART:${d}T${hh}${mm}00`, 'DURATION:PT1H', 'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA',
    'SUMMARY:🔥 Estudio · Casco', `DESCRIPTION:Abre Casco y mira qué toca hoy: ${location.origin}${location.pathname}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:Hora de estudiar', 'TRIGGER:PT0M', 'END:VALARM',
    'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:En 10 minutos, a estudiar', 'TRIGGER:-PT10M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
  descargar('alarma-estudio.ics', 'text/calendar', ics);
}

/* ---------- Intro (como el opening de un videojuego) ---------- */
const INTRO = [
  () => `<div class="i-title">
      <img class="i-flame r" src="icons/icon-512.png" alt="">
      <h1 class="r" style="--d:.3s">CASCO</h1>
      <p class="r" style="--d:.7s">Tu mentor de estudio, de hoy al examen</p>
      <p class="i-blink r" style="--d:1.4s">Toca para empezar</p></div>`,
  () => `<div class="i-ico r">🚒</div><p class="i-kicker r" style="--d:.1s">Capítulo 1</p><h2 class="r" style="--d:.2s">La misión</h2>
      <p class="r" style="--d:.35s">Plaza de <b>Bombero/a Especialista del Ayuntamiento de Madrid</b>.</p>
      <div class="i-chips r" style="--d:.5s"><span>📝 90 preguntas en 95 min</span><span>🎯 Corte de 2026: 58 netas de 87</span><span>📅 Examen previsto: verano de 2027</span></div>
      <p class="i-note r" style="--d:.7s">No hay prisa. Si no es este año, será el siguiente. Lo primero es construir el <b>hábito</b>.</p>`,
  () => `<div class="i-ico r">🔥</div><p class="i-kicker r" style="--d:.1s">Capítulo 2</p><h2 class="r" style="--d:.2s">Cada día, una misión</h2>
      <p class="r" style="--d:.35s">Abres la app, miras <b>Hoy</b> y haces lo que toca. Nada más.</p>
      <div class="i-list">
        <div class="r" style="--d:.5s"><span>🔁</span><div><b>Repaso</b><small>Los temas que toca refrescar hoy</small></div></div>
        <div class="r" style="--d:.65s"><span>📖</span><div><b>Tema nuevo</b><small>Qué tema y qué páginas exactas</small></div></div>
        <div class="r" style="--d:.8s"><span>📝</span><div><b>Cierre</b><small>Folio en blanco y test en Ninja</small></div></div>
      </div>`,
  () => `<div class="i-ring r"><b>25:00</b><span>Foco</span></div><p class="i-kicker r" style="--d:.1s">Capítulo 3</p><h2 class="r" style="--d:.2s">El pomodoro</h2>
      <p class="r" style="--d:.35s"><b>25 minutos</b> de foco total y <b>5</b> de descanso. El móvil, lejos.</p>
      <p class="i-note r" style="--d:.55s">Durante el pomodoro, la app te va diciendo los pasos: prelectura, lectura, subrayado… Al terminar, apuntas hasta qué página llegaste.</p>`,
  () => `<div class="i-chain r">${['✓', '✓', '✓', '✓', '✓', '✓', '·'].map((c, i) => `<span class="${c === '·' ? 'rest' : ''}" style="--d:${.1 + i * .08}s">${c}</span>`).join('')}</div>
      <p class="i-kicker r" style="--d:.1s">Capítulo 4</p><h2 class="r" style="--d:.2s">La cadena</h2>
      <p class="r" style="--d:.4s">Cada día que estudias, la cadena crece. Las reglas son sencillas:</p>
      <div class="i-chips r" style="--d:.6s"><span>⛓️ Nunca dos días seguidos sin estudiar</span><span>🛌 El domingo se descansa y no rompe la cadena</span><span>🩹 ¿Un día malo? Con 1 pomodoro basta</span></div>`,
  () => `<p class="i-kicker r">Capítulo 5</p><h2 class="r" style="--d:.1s">Sube de nivel</h2>
      <div class="i-levels">${NIVELES.map((n, i) => `<div class="r" style="--d:${.25 + i * .12}s"><b>${n.nombre}</b><span>${'🔥'.repeat(i + 1)}</span><small>${n.pomos} pomodoros/día</small></div>`).join('')}</div>
      <p class="i-note r" style="--d:.95s">Empiezas en <b>Chispa</b>, con menos de una hora al día. Tras dos semanas cumpliendo, la app te propone subir, pero decides tú. Cada nivel desbloquea <b>técnicas de estudio</b> nuevas.</p>`,
  () => `<div class="i-ico r">🧠</div><p class="i-kicker r" style="--d:.1s">Capítulo 6</p><h2 class="r" style="--d:.2s">Memoria de examen</h2>
      <p class="r" style="--d:.35s">Al terminar un tema, la app te lo devuelve para repasarlo justo antes de que se olvide:</p>
      <div class="i-spaced r" style="--d:.55s">${['+1', '+3', '+7', '+15', '+30'].map(x => `<span>${x}<small>días</small></span>`).join('<i></i>')}</div>
      <p class="i-note r" style="--d:.75s">Sin repasos, en un mes se olvida casi todo. Con ellos, llega al examen.</p>`,
  () => `<div class="i-ico r">🥷</div><p class="i-kicker r" style="--d:.1s">Capítulo 7</p><h2 class="r" style="--d:.2s">Tu equipo: Formación Ninja</h2>
      <p class="r" style="--d:.35s">Las <b>clases</b> y los <b>tests</b> siguen en Ninja. Casco te dice cuándo hacerlos y te lleva directo con un botón.</p>
      <p class="i-note r" style="--d:.55s">Después de cada test apuntas aciertos y fallos, y ves tus netas frente al corte.</p>`,
  () => `<p class="i-kicker r">Capítulo 8</p><h2 class="r" style="--d:.1s">El plan</h2>
      <div class="i-road">
        ${[['🌱', 'Hábito', 'nov – dic', 'Sentarse cada día'], ['📖', 'Primera vuelta', 'ene – abr', 'Todo el temario, tema a tema'],
          ['🔁', 'Segunda vuelta', 'may – jun', 'Repaso y tests por bloques'], ['⏱️', 'Simulacros', 'jun – jul', 'Exámenes completos cronometrados'],
          ['🎯', 'Examen', 'verano de 2027', '']].map(([ic, t, f, d], i) =>
          `<div class="r" style="--d:${.25 + i * .15}s"><span>${ic}</span><div><b>${t}</b> <em>${f}</em>${d ? `<small>${d}</small>` : ''}</div></div>`).join('')}
      </div>
      <p class="i-note r" style="--d:1.1s">Es orientativo: el plan se adapta a tu ritmo, no al revés.</p>`,
  () => st.inicio
    ? `<div class="i-ico r">🧑‍🚒</div><h2 class="r" style="--d:.1s">Eso es todo</h2><p class="r" style="--d:.25s">Vuelve a la app y sigue con tu cadena.</p>
       <button class="btn primary block r" style="--d:.4s;margin-top:20px" data-i="fin">Volver a la app</button>`
    : `<div class="i-ico r">⏰</div><p class="i-kicker r" style="--d:.1s">Último paso</p><h2 class="r" style="--d:.2s">¿A qué hora empieza tu turno de estudio?</h2>
       <p class="r" style="--d:.35s">Siempre a la misma hora y en el mismo sitio: así el hábito se pega solo.</p>
       <input class="r" style="--d:.5s" type="time" id="hora0" value="${st.ajustes.hora}">
       <button class="btn primary block r" style="--d:.65s;margin-top:16px" data-i="fin">🔥 Empezar mi primer turno</button>
       <p class="i-note r" style="--d:.8s">Hoy toca nivel Chispa: 2 pomodoros. Menos de una hora.</p>`,
];
let introPos = 0;
function intro(desde = 0) {
  let el = $('#intro');
  if (!el) {
    el = document.createElement('div'); el.id = 'intro'; el.className = 'intro';
    el.innerHTML = `<div class="i-embers">${Array.from({ length: 22 }, () =>
      `<i style="left:${Math.random() * 100}%;--t:${6 + Math.random() * 8}s;--w:${-Math.random() * 12}s;--s:${2 + Math.random() * 4}px"></i>`).join('')}</div>
      <div class="i-bar"></div><button class="i-skip" data-i="saltar">Saltar intro ⏭</button>
      <div class="i-stage"></div>
      <div class="i-nav"><button class="i-back" data-i="atras" aria-label="Atrás">‹</button><button class="btn primary" data-i="sig">Siguiente ›</button></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => {
      const b = e.target.closest('[data-i]');
      if (b) {
        const a = b.dataset.i;
        if (a === 'sig') introIr(introPos + 1);
        if (a === 'atras') introIr(introPos - 1);
        if (a === 'saltar') { if (st.inicio) cerrarIntro(); else introIr(INTRO.length - 1); }
        if (a === 'fin') cerrarIntro();
        return;
      }
      if (e.target.closest('input, button, a')) return;
      if (introPos < INTRO.length - 1) introIr(introPos + 1);    // tocar en cualquier sitio avanza
    });
    let x0 = null;
    el.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', e => {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 60) { e.preventDefault(); introIr(introPos + (dx < 0 ? 1 : -1)); }
    });
  }
  introIr(desde);
}
function introIr(n) {
  const el = $('#intro'); if (!el) return;
  introPos = Math.max(0, Math.min(INTRO.length - 1, n));
  el.querySelector('.i-stage').innerHTML = `<div class="i-slide ${introPos === 0 ? 'first' : ''}">${INTRO[introPos]()}</div>`;
  el.querySelector('.i-bar').innerHTML = INTRO.map((_, i) => `<i class="${i <= introPos ? 'on' : ''}"></i>`).join('');
  const ultima = introPos === INTRO.length - 1;
  el.querySelector('.i-nav').style.visibility = introPos === 0 || ultima ? 'hidden' : 'visible';
  el.querySelector('.i-back').style.visibility = introPos > 1 ? 'visible' : 'hidden';
  el.querySelector('.i-skip').style.visibility = ultima ? 'hidden' : 'visible';
}
document.addEventListener('keydown', e => {
  if (!$('#intro') || e.target.tagName === 'INPUT') return;
  if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') { e.preventDefault(); introIr(introPos + 1); }
  if (e.key === 'ArrowLeft') introIr(introPos - 1);
  if (e.key === 'Escape') { if (st.inicio) cerrarIntro(); else introIr(INTRO.length - 1); }
});
function cerrarIntro() {
  const h = $('#hora0');
  if (!st.inicio) { st.ajustes.hora = (h && h.value) || st.ajustes.hora; st.inicio = hoy(); }
  st.introVista = true; guardar();
  const el = $('#intro'); el.classList.add('out');
  setTimeout(() => el.remove(), 450);
  render();
}

/* ---------- Router y eventos ---------- */
const VISTAS = { hoy: vistaHoy, pomodoro: vistaPomodoro, temario: vistaTemario, tecnicas: vistaTecnicas, progreso: vistaProgreso, ajustes: vistaAjustes };
function vistaActual() { const v = location.hash.slice(1); return VISTAS[v] ? v : 'hoy'; }
function render() {
  const v = vistaActual();
  $('#app').innerHTML = VISTAS[v]();
  document.querySelectorAll('#tabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === v));
  if (v === 'pomodoro') tick();
}
window.addEventListener('hashchange', () => { render(); window.scrollTo(0, 0); });

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const act = el.dataset.act, id = el.dataset.tema;
  switch (act) {
    case 'cerrar': cerrarModal(); break;
    case 'intro': intro(0); break;
    case 'pomo':
      st.ctx = { tipo: el.dataset.tipo, tema: id || null }; guardar(); cerrarModal();
      if (location.hash !== '#pomodoro') location.hash = 'pomodoro'; else render(); break;
    case 'ctx': st.ctx = { tipo: el.dataset.tipo, tema: (st.ctx && st.ctx.tema) || null }; guardar(); render(); break;
    case 't-start': prepararAudio(); iniciarTimer('foco'); render(); break;
    case 't-pausa': st.timer.resto = st.timer.fin - Date.now(); guardar(); soltarWakeLock(); render(); break;
    case 't-seguir': prepararAudio(); st.timer.fin = Date.now() + st.timer.resto; st.timer.resto = null; guardar(); pedirWakeLock(); render(); break;
    case 't-parar': {
      const tm = st.timer;
      if (tm && tm.fase === 'foco') {
        const hecho = (tm.dur * 60000 - (tm.resto != null ? tm.resto : tm.fin - Date.now())) / 60000;
        if (hecho >= 1) { sumarPomodoro(hecho, false); toast(`Se apuntan ${Math.round(hecho)} min netos (no cuenta como pomodoro)`); }
      }
      st.timer = null; guardar(); soltarWakeLock(); document.title = 'Casco'; render(); break;
    }
    case 'repasado': repasar(id); cerrarModal(); toast('🔁 Repaso apuntado'); render(); break;
    case 'terminar': terminarTema(id); cerrarModal(); toast('🏁 ¡Tema terminado! Mañana toca su primer repaso'); render(); break;
    case 'desterminar': { const s = et(id); s.fin = null; s.rep = []; guardar(); cerrarModal(); render(); break; }
    case 'guardar-pag': {
      const t = tema(id), v = Math.max(0, Math.min(t.p, +$('#pag').value || 0));
      et(id).pag = v; guardar(); cerrarModal();
      if (v >= t.p && !st.temas[id].fin) {
        modal(`<h3>🏁 ¿Has terminado el tema ${t.n}?</h3><p>Si lo das por terminado, mañana empieza su repaso espaciado.</p>
          <div class="row"><button class="btn primary grow" data-act="terminar" data-tema="${id}">Sí, terminado</button><button class="btn ghost" data-act="cerrar">Aún no</button></div>`);
      } else toast('Guardado');
      render(); break;
    }
    case 'tema': abrirTema(id); break;
    case 'test': abrirTest(id); break;
    case 'guardar-test': guardarTest(); break;
    case 'mas-pomo': sumarPomodoro(st.ajustes.foco, true); toast('🔥 Pomodoro apuntado'); render(); break;
    case 'nivel-subir': st.nivel++; st.oferta = lunes(hoy()); guardar(); toast(`🔥 ¡Nivel ${nivel().nombre}!`); render(); break;
    case 'nivel-bajar': st.nivel--; st.oferta = lunes(hoy()); guardar(); toast('Hecho. Paso a paso.'); render(); break;
    case 'nivel-quedar': st.oferta = lunes(hoy()); guardar(); render(); break;
    case 'tec': if (!el.classList.contains('locked')) { tecAbierta = tecAbierta === el.dataset.id ? null : el.dataset.id; render(); } break;
    case 'ics': crearIcs(); break;
    case 'notif': Notification.requestPermission().then(render); break;
    case 'exportar': descargar(`casco-copia-${hoy()}.json`, 'application/json', JSON.stringify(st, null, 1)); break;
    case 'borrar':
      if (confirm('¿Seguro? Se borra todo lo apuntado en este dispositivo. Haz antes una copia si la quieres.')) { st = estadoNuevo(); guardar(); render(); intro(0); }
      break;
  }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'hora') { st.ajustes.hora = t.value; guardar(); toast('Hora guardada. Vuelve a añadir la alarma al calendario.'); }
  if (t.id === 'foco') { st.ajustes.foco = +t.value; guardar(); }
  if (t.id === 'desc') { st.ajustes.descanso = +t.value; guardar(); }
  if (t.id === 'nivel') { st.nivel = +t.value; st.oferta = lunes(hoy()); guardar(); render(); }
  if (t.id === 'importar' && t.files[0]) {
    t.files[0].text().then(txt => {
      try {
        const d = JSON.parse(txt);
        if (!d || d.v !== 1 || typeof d.dias !== 'object') throw new Error();
        if (!confirm('Se sustituirán los datos de este dispositivo por los de la copia. ¿Seguir?')) return;
        st = Object.assign(estadoNuevo(), d); guardar(); render(); toast('Copia cargada');
      } catch (err) { toast('Ese archivo no es una copia de Casco'); }
    });
  }
});
document.addEventListener('input', e => {
  if (e.target.id !== 'fono') return;
  const dig = e.target.value.replace(/\D/g, '').slice(0, 8);
  $('#fono-out').innerHTML = dig ? dig.split('').map(c => `<span class="chip fire" style="margin:2px">${c} → ${FONO[c]}</span>`).join('') +
    '<div class="muted" style="margin-top:6px">Ahora rellena con vocales hasta formar una palabra que se pueda imaginar.</div>' : '';
});
document.addEventListener('visibilitychange', () => { if (!document.hidden) { if (st.timer && !st.timer.resto) pedirWakeLock(); render(); } });

setInterval(tick, 500);
render();
if (!st.inicio) intro(0);
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
