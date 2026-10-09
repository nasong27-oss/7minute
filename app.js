import { EXERCISES, ROUTINES, REST_SECONDS } from './data.js';

const $ = id => document.getElementById(id);
const COUNT = 14;
const ASSET_DIR = 'assets/';
const STORE_KEY = 'quiet-seven:v1';

/* ---------- settings & saved progress (no completion history) ---------- */
const THEMES = ['lava', 'champagne', 'emerald'];
const defaults = { routine: 'weighted', work: 20, sound: false, voice: false, theme: 'lava', seenSafety: false, weights: { barbell: 15, kettlebell: 12 }, progress: { weighted: null, body: null } };
function loadStore() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORE_KEY) || 'null');
    if (!raw) return structuredClone(defaults);
    return { ...structuredClone(defaults), ...raw, weights: { ...defaults.weights, ...raw.weights }, progress: { ...defaults.progress, ...raw.progress } };
  } catch { return structuredClone(defaults); }
}
const store = loadStore();
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(store)); } catch {} }
if (!ROUTINES[store.routine]) store.routine = 'weighted';
if (![20, 30].includes(store.work)) store.work = 20;
if (!THEMES.includes(store.theme)) store.theme = 'lava';

/* ---------- helpers ---------- */
const fmt = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const pad = n => String(n).padStart(2, '0');
const kg = n => (Math.round(n * 10) / 10).toString();
function routineExercises(key) {
  return ROUTINES[key].ids.map(id => {
    const e = EXERCISES[id];
    const meta = e.load === 'barbell' ? `바벨 ${kg(store.weights.barbell)}kg · ${e.area}`
      : e.load === 'kettlebell' ? `케틀벨 ${kg(store.weights.kettlebell)}kg · ${e.area}`
      : `맨몸 · ${e.area}`;
    return { ...e, id, meta, src: ASSET_DIR + e.asset };
  });
}
const totalFor = work => COUNT * (work + REST_SECONDS);

/* ---------- audio & voice ---------- */
let audio = null;
function ensureAudio() {
  if (!store.sound) return;
  try { audio ??= new (window.AudioContext || window.webkitAudioContext)(); audio.resume?.(); } catch {}
}
function beep(kind = 'count') {
  if (!store.sound || !audio) return;
  const now = audio.currentTime;
  const tones = kind === 'start' ? [[784, 0, .14], [1175, .16, .28]]
    : kind === 'rest' ? [[523, 0, .30]]
    : kind === 'done' ? [[784, 0, .16], [988, .18, .16], [1175, .36, .34]]
    : [[988, 0, .12]];
  for (const [hz, delay, len] of tones) {
    const o = audio.createOscillator(), g = audio.createGain();
    o.type = 'sine'; o.frequency.value = hz; o.connect(g); g.connect(audio.destination);
    const t = now + delay;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.4, t + .01);
    g.gain.setValueAtTime(.4, t + len - .05); g.gain.linearRampToValueAtTime(0, t + len);
    o.start(t); o.stop(t + len + .02); o.onended = () => { o.disconnect(); g.disconnect(); };
  }
}
let koVoice = null;
function pickVoice() {
  const vs = window.speechSynthesis?.getVoices?.() || [];
  koVoice = vs.find(v => /^ko/i.test(v.lang) && /Yuna|유나|Google/i.test(v.name)) || vs.find(v => /^ko/i.test(v.lang)) || null;
}
if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
function speak(text) {
  if (!store.voice || !('speechSynthesis' in window)) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR'; u.rate = 1.02; u.volume = 1; if (koVoice) u.voice = koVoice;
    speechSynthesis.speak(u);
  } catch {}
}

/* ---------- wake lock ---------- */
let wake = null;
async function keepAwake() {
  if (!('wakeLock' in navigator) || wake) return;
  try { wake = await navigator.wakeLock.request('screen'); wake.addEventListener('release', () => { wake = null; }); } catch {}
}
function releaseWake() { wake?.release().catch(() => {}); wake = null; }

/* ---------- session state ---------- */
const S = {
  key: store.routine, list: routineExercises(store.routine), work: store.work,
  index: 0, phase: 'work', left: store.work, running: false, deadline: 0,
  completed: new Set(), skipped: new Set(), lastBeep: -1, countdown: null, mediaKey: '', mediaPaused: false,
};
const duration = () => S.phase === 'work' ? S.work : REST_SECONDS;
const isFinale = () => S.phase === 'rest' && S.index === COUNT - 1;
function remaining() {
  const after = (COUNT - 1 - S.index) * (S.work + REST_SECONDS);
  return S.phase === 'work' ? S.left + REST_SECONDS + after : S.left + after;
}
function saveProgress() {
  store.progress[S.key] = { index: S.index, phase: S.phase, left: Math.ceil(S.left), work: S.work, completed: [...S.completed], skipped: [...S.skipped] };
  save();
}
function clearProgress(key = S.key) { store.progress[key] = null; save(); }

/* ---------- views ---------- */
function setView(v) {
  document.body.dataset.view = v;
  setRest(v === 'session' && S.phase === 'rest');
  window.scrollTo(0, 0);
}
const themeMeta = document.querySelector('meta[name=theme-color]');
function setRest(on) {
  if (document.body.classList.contains('rest') === on && themeMeta.dataset.t === store.theme) return;
  document.body.classList.toggle('rest', on);
  themeMeta.dataset.t = store.theme;
  themeMeta.content = getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#0f0f11';
}
function applyTheme() {
  document.body.dataset.theme = store.theme;
  themeMeta.dataset.t = '';
  setRest(document.body.classList.contains('rest'));
  for (const b of document.querySelectorAll('[data-theme-opt]')) b.setAttribute('aria-checked', String(b.dataset.themeOpt === store.theme));
}

/* ---------- ① ready ---------- */
const rhythmEls = [];
for (let i = 0; i < COUNT; i++) {
  const w = document.createElement('i'), r = document.createElement('i');
  w.className = 'w'; if (i === COUNT - 1) r.className = 'last';
  rhythmEls.push(w, r);
}
$('rhythm').append(...rhythmEls);
const workLabel = w => w === 20 ? '7분' : '9분 20초';

function renderReady() {
  const key = store.routine, r = ROUTINES[key], list = routineExercises(key);
  const p = store.progress[key];
  for (const t of document.querySelectorAll('[data-routine]')) {
    const on = t.dataset.routine === key;
    t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
  }
  for (const b of document.querySelectorAll('.duration')) b.setAttribute('aria-pressed', String(+b.dataset.work === store.work));

  $('selectors').hidden = !!p; $('stripBlock').hidden = !!p; $('resumeBlock').hidden = !p;
  $('discardResume').hidden = !p;
  $('startLabel').textContent = p ? '이어서 시작' : '운동 시작';
  $('rhythm').classList.toggle('progress', !!p);

  if (p) {
    const i = p.phase === 'rest' && p.index < COUNT - 1 ? p.index + 1 : p.index;
    const e = list[i], done = new Set(p.completed || []);
    const left = (COUNT - 1 - p.index) * (p.work + REST_SECONDS) + p.left + (p.phase === 'work' ? REST_SECONDS : 0);
    $('heroCaption').textContent = 'RESUME · 남은 시간';
    $('heroTime').textContent = fmt(left);
    $('heroSub').textContent = `${pad(i + 1)} / 14 · ${e.name}부터`;
    rhythmEls.forEach((el, k) => {
      const n = k >> 1, isWork = !(k & 1);
      el.classList.toggle('ok', done.has(n) && (isWork || n < p.index || (n === p.index && p.phase === 'rest')));
      el.classList.toggle('now', isWork && n === i);
    });
    $('rhythmLeft').textContent = `${done.size}동작 완료`;
    $('rhythmRight').textContent = `${r.label} · ${workLabel(p.work)}`;
    $('resumeImg').src = e.src; $('resumeImg').alt = e.name + ' 시연';
    $('resumeThumb').classList.toggle('mirror', !!e.mirror);
    $('resumeLabel').textContent = `NEXT · ${pad(i + 1)}`;
    $('resumeName').textContent = e.name;
    $('resumeMeta').textContent = `${e.meta} · ${p.work}초`;
    const restCount = COUNT - 1 - i;
    $('resumeRest').textContent = restCount > 0 ? `${pad(i + 2)} ${list[i + 1].name} 외 ${restCount - 1}개` : '마지막 동작';
    $('resumeSplit').textContent = `${p.work}초 / ${REST_SECONDS}초`;
  } else {
    $('heroCaption').textContent = `TODAY · ${r.title}`;
    $('heroTime').textContent = fmt(totalFor(store.work));
    $('heroSub').textContent = `14동작 · 운동 ${store.work}초 / 휴식 ${REST_SECONDS}초`;
    rhythmEls.forEach(el => el.classList.remove('ok', 'now'));
    $('rhythmLeft').innerHTML = '<span class="k w"></span>운동<span class="k r"></span>휴식';
    $('rhythmRight').textContent = '마지막 10초 마무리';
    $('weightsText').textContent = key === 'weighted'
      ? `바벨 ${kg(store.weights.barbell)}kg · 케틀벨 ${kg(store.weights.kettlebell)}kg` : '기구 없이 · 점프 없이';
    $('weightsText').disabled = key !== 'weighted';
    $('strip').replaceChildren(...list.map((e, i) => {
      const li = document.createElement('li'), b = document.createElement('button');
      b.innerHTML = `<span class="thumb${e.mirror ? ' mirror' : ''}"><img loading="lazy" decoding="async" alt=""><b>${pad(i + 1)}</b></span><span class="nm"></span>`;
      b.querySelector('img').src = e.src;
      b.querySelector('.nm').textContent = e.name;
      b.setAttribute('aria-label', `${pad(i + 1)} ${e.name}부터 시작`);
      b.onclick = () => startSession({ index: i });
      li.append(b); return li;
    }));
  }
  $('safetyNote').hidden = !!store.seenSafety;
  syncToggles();
}
function syncToggles() {
  for (const b of document.querySelectorAll('.sound-btn')) {
    b.setAttribute('aria-pressed', String(store.sound)); b.setAttribute('aria-label', store.sound ? '소리 끄기' : '소리 켜기');
  }
  $('soundSwitch').setAttribute('aria-checked', String(store.sound));
  $('voiceSwitch').setAttribute('aria-checked', String(store.voice));
  $('barbellVal').textContent = kg(store.weights.barbell);
  $('kettlebellVal').textContent = kg(store.weights.kettlebell);
}
if (!('wakeLock' in navigator)) { $('wakeNote').textContent = '이 브라우저는 화면 켜짐 유지를 지원하지 않아요. 자동 잠금을 확인해 주세요'; $('wakeNote').hidden = false; }

/* ---------- ②③ session ---------- */
const segs = Array.from({ length: COUNT }, () => document.createElement('i'));
$('segments').append(...segs);
$('doneSegments').append(...Array.from({ length: COUNT }, () => document.createElement('i')));
const nextPreload = new Image();

function startSession({ index = 0, resume = null } = {}) {
  S.key = store.routine; S.list = routineExercises(S.key);
  if (resume) {
    Object.assign(S, { index: resume.index, phase: resume.phase, left: resume.left, work: resume.work });
    S.completed = new Set(resume.completed || []); S.skipped = new Set(resume.skipped || []);
  } else {
    Object.assign(S, { index, phase: 'work', work: store.work, left: store.work });
    S.completed = new Set(); S.skipped = new Set();
    for (let i = 0; i < index; i++) S.skipped.add(i);
    clearProgress();
  }
  S.running = false; S.lastBeep = -1; S.mediaKey = '';
  if (!store.seenSafety) { store.seenSafety = true; save(); }
  ensureAudio();
  if (store.voice && 'speechSynthesis' in window) { try { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance('')); } catch {} }
  keepAwake();
  setView('session'); renderSession();
  runCountdown(resume ? '이어서' : '준비', () => { run(); announcePhase(); });
}

function runCountdown(label, then) {
  cancelCountdown();
  let n = 3;
  $('countdownLabel').textContent = label; $('countdownNum').textContent = n; $('countdown').hidden = false;
  $('sessionView').classList.remove('paused'); setToggleLabels();
  $('sessionNote').textContent = '';
  beep();
  S.countdown = setInterval(() => {
    n--;
    if (n > 0) { $('countdownNum').textContent = n; beep(); return; }
    cancelCountdown(); then();
  }, 1000);
}
function cancelCountdown() {
  if (S.countdown) clearInterval(S.countdown);
  S.countdown = null; $('countdown').hidden = true;
}

function run() {
  S.running = true; S.deadline = performance.now() + S.left * 1000; S.lastBeep = -1;
  keepAwake(); renderSession();
}
function pause(note = '') {
  if (S.countdown) { cancelCountdown(); }
  else if (S.running) { tick(); S.running = false; }
  saveProgress(); releaseWake();
  $('sessionView').classList.add('paused'); setToggleLabels();
  $('sessionNote').textContent = note;
  renderSession();
}
function resume() { ensureAudio(); runCountdown('계속', run); }
function togglePause() { (S.running || S.countdown) ? pause('일시정지됨') : resume(); }
function setToggleLabels() {
  const paused = $('sessionView').classList.contains('paused');
  $('toggleLabel').textContent = paused ? '계속하기' : '일시정지';
  $('restToggleBtn').setAttribute('aria-label', paused ? '계속하기' : '일시정지');
}

function advance() {
  if (S.phase === 'work') {
    S.completed.add(S.index); S.skipped.delete(S.index);
    S.phase = 'rest'; S.left = REST_SECONDS;
  } else if (S.index < COUNT - 1) {
    S.index++; S.phase = 'work'; S.left = S.work;
  } else { finish(); return false; }
  S.lastBeep = -1; announcePhase(); return true;
}
function tick() {
  if (!S.running) return;
  const now = performance.now();
  while (S.running && now >= S.deadline) {
    if (!advance()) return;
    S.deadline += duration() * 1000;
  }
  S.left = Math.max(0, (S.deadline - now) / 1000);
  const sec = Math.ceil(S.left);
  if (sec <= 3 && sec > 0 && S.lastBeep !== sec) { S.lastBeep = sec; beep(); }
  renderSession();
}
setInterval(tick, 100);

/* jump while keeping the timer state (running stays running) */
function goTo(index, phase = 'work') {
  S.index = index; S.phase = phase; S.left = phase === 'work' ? S.work : REST_SECONDS; S.lastBeep = -1;
  S.completed.delete(index); S.skipped.delete(index);
  if (S.running) { S.deadline = performance.now() + S.left * 1000; announcePhase(); }
  renderSession(); if (!S.running) saveProgress();
}
function next() {
  if (S.phase !== 'work') return;
  if (!S.completed.has(S.index)) S.skipped.add(S.index);
  if (S.index < COUNT - 1) goTo(S.index + 1);
  else { S.phase = 'rest'; S.left = REST_SECONDS; S.lastBeep = -1; if (S.running) { S.deadline = performance.now() + S.left * 1000; announcePhase(); } renderSession(); }
}
function prev() {
  if (S.phase !== 'work') return;
  if (S.index > 0 && S.left > S.work - 3) goTo(S.index - 1); // tap within first 3s → previous exercise
  else goTo(S.index);                                        // otherwise restart current
}
function addRest() {
  if (S.phase !== 'rest') return;
  S.left += 10; if (S.running) S.deadline += 10000; renderSession();
}
function skipRest() {
  if (S.phase !== 'rest') return;
  if (!advance()) return;
  if (S.running) S.deadline = performance.now() + S.left * 1000;
  renderSession(); if (!S.running) saveProgress();
}

function announcePhase() {
  const e = S.list[S.index];
  if (S.phase === 'work') {
    $('announce').textContent = `${e.name} 시작`; beep('start'); speak(e.name);
  } else if (isFinale()) {
    $('announce').textContent = '마무리 휴식'; beep('rest'); speak('마지막 동작 완료. 호흡을 정리하세요');
  } else {
    const n = S.list[S.index + 1];
    $('announce').textContent = `10초 휴식. 다음은 ${n.name}`; beep('rest'); speak(`휴식. 다음은 ${n.name}`);
  }
}

function setMedia(e) {
  const key = e ? e.id : 'none';
  if (S.mediaKey === key) return;
  S.mediaKey = key; S.mediaPaused = false;
  const im = $('pose'), media = $('media');
  $('poseStill').hidden = true; im.hidden = false;
  if (!e) return;
  im.onload = () => { if (S.mediaPaused) freeze(); };
  im.src = e.src; im.alt = e.name + ' 실제 시연';
  media.classList.toggle('mirror', !!e.mirror);
  $('motionToggle').hidden = !!e.still;
  $('motionToggle').setAttribute('aria-pressed', 'false');
  $('mediaHint').textContent = e.hint || '';
}
function freeze() {
  const im = $('pose'), c = $('poseStill');
  if (!im.complete || !im.naturalWidth) return;
  c.width = im.naturalWidth; c.height = im.naturalHeight;
  c.getContext('2d').drawImage(im, 0, 0); c.hidden = false; im.hidden = true;
}

let tipsKey = '';
function renderSession() {
  if (document.body.dataset.view !== 'session') return;
  const rest = S.phase === 'rest', finale = isFinale();
  const cur = S.list[S.index];
  const upcoming = rest && !finale ? S.list[S.index + 1] : null;
  const shown = rest ? upcoming : cur;

  $('sessionView').dataset.phase = S.phase;
  setRest(rest);

  const sec = Math.ceil(S.left);
  $('seconds').textContent = sec;
  $('seconds').classList.toggle('final', sec <= 3 && (S.running || !!S.countdown));
  $('phaseLabel').textContent = rest ? (finale ? 'FINISH' : 'REST') : `WORK · ${pad(S.index + 1)} / 14`;
  $('phaseWord').textContent = finale ? '마무리' : '휴식';
  $('restHint').textContent = finale ? '천천히 호흡하며 몸을 정리하세요' : '호흡을 고르고 다음 자세를 준비하세요';
  $('phaseBar').style.width = ((1 - S.left / duration()) * 100) + '%';
  $('remaining').textContent = fmt(remaining());

  $('exName').textContent = cur.name; $('exMeta').textContent = cur.meta;
  if (tipsKey !== cur.id + S.key) {
    tipsKey = cur.id + S.key;
    $('tips').replaceChildren(...cur.tips.map(t => Object.assign(document.createElement('li'), { textContent: t })));
  }
  setMedia(shown || cur);

  // next row (work) & next card (rest)
  $('nextName').textContent = S.index < COUNT - 1 ? S.list[S.index + 1].name : '마무리 휴식';
  const card = $('nextCard');
  card.classList.toggle('finale', finale);
  if (rest) {
    if (finale) {
      $('nextCardLabel').textContent = 'NEXT'; $('nextCardTime').textContent = '';
      $('nextCardName').textContent = '운동 완료'; $('nextCardMeta').textContent = `${ROUTINES[S.key].title} · 14동작`;
      $('nextCardTip').textContent = '수고하셨어요';
    } else {
      $('nextCardLabel').textContent = `NEXT · ${pad(S.index + 2)} / 14`; $('nextCardTime').textContent = `${S.work}초`;
      if ($('nextImg').dataset.id !== upcoming.id) { $('nextImg').dataset.id = upcoming.id; $('nextImg').src = upcoming.src; }
      $('nextImg').alt = upcoming.name + ' 미리보기';
      $('nextImg').style.transform = upcoming.mirror ? 'scaleX(-1)' : '';
      $('nextCardName').textContent = upcoming.name; $('nextCardMeta').textContent = upcoming.meta;
      $('nextCardTip').textContent = upcoming.tips[0];
    }
  }
  $('skipRestLabel').textContent = finale ? '완료하기' : '바로 시작';

  const after = S.list[Math.min(S.index + (rest ? 2 : 1), COUNT - 1)];
  if (nextPreload.dataset.src !== after.src) { nextPreload.dataset.src = after.src; nextPreload.src = after.src; }

  segs.forEach((s, i) => {
    s.className = S.completed.has(i) ? 'ok' : S.skipped.has(i) ? 'skipped' : '';
    if ((!rest && i === S.index) || (rest && i === S.index + 1)) s.classList.add('now');
  });
  $('prevBtn').disabled = S.index === 0 && S.left > S.work - 3;
  renderFinalCount(sec, rest, finale);
}

/* last 3 seconds of every work / rest segment */
let finalShown = 0;
function renderFinalCount(sec, rest, finale) {
  const show = S.running && !S.countdown && sec > 0 && sec <= 3;
  const box = $('finalCount');
  if (!show) { if (finalShown) { box.hidden = true; finalShown = 0; } return; }
  if (finalShown === sec) return;
  finalShown = sec;
  const nextLabel = rest
    ? (finale ? '다음 · 운동 완료' : `다음 · ${S.list[S.index + 1].name}`)
    : (S.index === COUNT - 1 ? '다음 · 마무리 휴식' : '다음 · 휴식');
  $('finalNext').textContent = nextLabel;
  const num = $('finalNum');
  num.textContent = sec;
  num.classList.remove('tick'); void num.offsetWidth; num.classList.add('tick');
  box.querySelectorAll('.final-dots i').forEach((d, i) => d.classList.toggle('on', i < 4 - sec));
  box.hidden = false;
}

function finish() {
  S.running = false; cancelCountdown(); releaseWake(); clearProgress();
  setRest(false);
  $('doneRoutine').textContent = `${ROUTINES[S.key].title} · ${ROUTINES[S.key].label}`;
  $('doneTime').textContent = fmt(totalFor(S.work));
  $('doneCount').textContent = S.completed.size;
  $('doneSplit').textContent = `${S.work} / ${REST_SECONDS}`;
  $('announce').textContent = '운동을 완료했습니다';
  beep('done'); speak('오늘의 운동 완료. 수고하셨습니다');
  setView('done');
}

let resumeAfterDialog = false;
function exitSession() {
  resumeAfterDialog = S.running || !!S.countdown;
  if (resumeAfterDialog) pause('일시정지됨');
  $('exitDialog').showModal();
}
function cancelExit() { $('exitDialog').close(); if (resumeAfterDialog) resume(); }

/* ---------- wiring ---------- */
for (const t of document.querySelectorAll('[data-routine]')) {
  t.onclick = () => { store.routine = t.dataset.routine; save(); renderReady(); };
  t.onkeydown = e => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key)) return;
    e.preventDefault();
    const k = store.routine === 'weighted' ? 'body' : 'weighted';
    store.routine = e.key === 'Home' ? 'weighted' : e.key === 'End' ? 'body' : k; save(); renderReady();
    $('tab-' + store.routine).focus();
  };
}
for (const b of document.querySelectorAll('.duration')) b.onclick = () => { store.work = +b.dataset.work; save(); renderReady(); };
function toggleSound() {
  store.sound = !store.sound; save(); syncToggles();
  if (store.sound) { ensureAudio(); beep(); }
}
for (const b of document.querySelectorAll('.sound-btn')) b.onclick = toggleSound;
$('soundSwitch').onclick = toggleSound;
$('voiceSwitch').onclick = () => {
  store.voice = !store.voice; save(); syncToggles();
  if (store.voice) speak('음성 안내를 켰어요');
  else window.speechSynthesis?.cancel();
};
$('startBtn').onclick = () => {
  const p = store.progress[store.routine];
  p ? startSession({ resume: p }) : startSession();
};
$('discardResume').onclick = () => { clearProgress(store.routine); renderReady(); };
$('safetyOk').onclick = () => { store.seenSafety = true; save(); $('safetyNote').hidden = true; };

const sheet = $('settingsSheet');
const openSettings = () => { syncToggles(); applyTheme(); sheet.showModal(); };
$('settingsBtn').onclick = openSettings;
$('weightsText').onclick = openSettings;
$('settingsClose').onclick = () => sheet.close();
sheet.addEventListener('click', e => { if (e.target === sheet) sheet.close(); });
for (const b of sheet.querySelectorAll('.stepper button')) b.onclick = () => {
  const w = b.dataset.w, max = w === 'barbell' ? 200 : 100;
  store.weights[w] = Math.min(max, Math.max(0, Math.round((store.weights[w] + +b.dataset.d) * 10) / 10));
  save(); syncToggles(); renderReady();
};
for (const b of sheet.querySelectorAll('[data-theme-opt]')) b.onclick = () => {
  store.theme = b.dataset.themeOpt; save(); applyTheme();
};

$('toggleBtn').onclick = togglePause;
$('restToggleBtn').onclick = togglePause;
$('nextBtn').onclick = next;
$('prevBtn').onclick = prev;
$('addRestBtn').onclick = addRest;
$('skipRestBtn').onclick = skipRest;
$('exitBtn').onclick = exitSession;
$('exitCancel').onclick = cancelExit;
$('exitConfirm').onclick = () => {
  $('exitDialog').close(); saveProgress(); releaseWake(); window.speechSynthesis?.cancel();
  setRest(false);
  setView('ready'); renderReady();
};
$('exitDialog').addEventListener('cancel', e => { e.preventDefault(); cancelExit(); });
$('motionToggle').onclick = () => {
  S.mediaPaused = !S.mediaPaused;
  if (S.mediaPaused) freeze(); else { $('pose').hidden = false; $('poseStill').hidden = true; }
  $('motionToggle').setAttribute('aria-pressed', String(S.mediaPaused));
  $('motionToggle').setAttribute('aria-label', S.mediaPaused ? '시연 재생' : '시연 멈추기');
};
$('doneBtn').onclick = () => { setView('ready'); renderReady(); };
$('againBtn').onclick = () => startSession();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (document.body.dataset.view === 'session' && (S.running || S.countdown)) pause('화면을 벗어나 일시정지했어요');
  } else if (S.running) keepAwake();
});
document.addEventListener('keydown', e => {
  if (document.body.dataset.view !== 'session' || document.querySelector('dialog[open]')) return;
  if (e.key === ' ') { e.preventDefault(); togglePause(); }
  else if (e.key === 'ArrowRight') S.phase === 'rest' ? skipRest() : next();
  else if (e.key === 'ArrowLeft') prev();
});

applyTheme();
renderReady();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
