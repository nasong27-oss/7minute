import { EXERCISES, ROUTINES, REST_SECONDS } from './data.js';

const $ = id => document.getElementById(id);
const COUNT = 14;
const ASSET_DIR = 'assets/';
const STORE_KEY = 'quiet-seven:v1';

/* ---------- settings & saved progress (no completion history) ---------- */
const defaults = { routine: 'weighted', work: 20, sound: false, voice: false, weights: { barbell: 15, kettlebell: 12 }, progress: { weighted: null, body: null } };
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
  document.body.classList.toggle('rest', v === 'session' && S.phase === 'rest');
  window.scrollTo(0, 0);
}

/* ---------- ① ready ---------- */
function renderReady() {
  const key = store.routine, r = ROUTINES[key], list = routineExercises(key);
  for (const t of document.querySelectorAll('.tabs [role=tab]')) {
    const on = t.dataset.routine === key;
    t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1;
  }
  $('routineTitle').textContent = r.title;
  const chips = key === 'weighted'
    ? [`바벨 ${kg(store.weights.barbell)}kg`, `케틀벨 ${kg(store.weights.kettlebell)}kg`, '14동작']
    : ['기구 없이', '점프 없이', '14동작'];
  $('routineChips').replaceChildren(...chips.map(c => Object.assign(document.createElement('span'), { textContent: c })));
  $('editWeights').hidden = key !== 'weighted';
  for (const b of document.querySelectorAll('.duration')) b.setAttribute('aria-pressed', String(+b.dataset.work === store.work));
  $('startTotal').textContent = fmt(totalFor(store.work));
  $('firstImg').src = list[0].src; $('firstImg').alt = list[0].name + ' 시연';
  $('firstName').textContent = list[0].name;

  const p = store.progress[key];
  $('resumeCard').hidden = !p;
  if (p) {
    const i = p.phase === 'rest' && p.index < COUNT - 1 ? p.index + 1 : p.index;
    $('resumeName').textContent = `${pad(i + 1)} / 14 · ${list[i].name}`;
    $('resumeMeta').textContent = `남은 시간 ${fmt((COUNT - 1 - p.index) * (p.work + REST_SECONDS) + p.left + (p.phase === 'work' ? REST_SECONDS : 0))} · 운동 ${p.work}초`;
  }

  $('routineList').replaceChildren(...list.map((e, i) => {
    const li = document.createElement('li'), b = document.createElement('button');
    b.innerHTML = `<span class="num">${pad(i + 1)}</span><span><span class="nm"></span><span class="mt"></span></span><span class="sec">${store.work}초</span>`;
    b.querySelector('.nm').textContent = e.name; b.querySelector('.mt').textContent = e.meta;
    b.setAttribute('aria-label', `${pad(i + 1)} ${e.name}부터 시작`);
    b.onclick = () => startSession({ index: i });
    li.append(b); return li;
  }));
  syncToggles();
}
function syncToggles() {
  for (const b of document.querySelectorAll('.sound-btn')) {
    b.setAttribute('aria-pressed', String(store.sound)); b.setAttribute('aria-label', store.sound ? '소리 끄기' : '소리 켜기');
  }
  $('voiceToggle').setAttribute('aria-pressed', String(store.voice));
  $('voiceToggle').setAttribute('aria-label', store.voice ? '음성 안내 끄기' : '음성 안내 켜기');
}
if (!('wakeLock' in navigator)) $('wakeNote').textContent = '이 브라우저는 화면 켜짐 유지를 지원하지 않아요. 자동 잠금을 확인해 주세요';

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
  document.body.classList.toggle('rest', rest);
  document.querySelector('meta[name=theme-color]').content = rest ? '#161c21' : '#16110e';

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
}

function finish() {
  S.running = false; cancelCountdown(); releaseWake(); clearProgress();
  document.body.classList.remove('rest');
  document.querySelector('meta[name=theme-color]').content = '#16110e';
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
for (const t of document.querySelectorAll('.tabs [role=tab]')) {
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
for (const b of document.querySelectorAll('.sound-btn')) b.onclick = () => {
  store.sound = !store.sound; save(); syncToggles();
  if (store.sound) { ensureAudio(); beep(); }
};
$('voiceToggle').onclick = () => {
  store.voice = !store.voice; save(); syncToggles();
  if (store.voice) speak('음성 안내를 켰어요');
  else window.speechSynthesis?.cancel();
};
$('startBtn').onclick = () => startSession();
$('firstCard').onclick = () => startSession();
$('resumeBtn').onclick = () => startSession({ resume: store.progress[store.routine] });
$('discardResume').onclick = () => { clearProgress(store.routine); renderReady(); };

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
  document.body.classList.remove('rest'); document.querySelector('meta[name=theme-color]').content = '#16110e';
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

$('editWeights').onclick = () => {
  $('barbellInput').value = store.weights.barbell; $('kettlebellInput').value = store.weights.kettlebell;
  $('weightDialog').showModal();
};
$('weightDialog').addEventListener('close', () => {
  if ($('weightDialog').returnValue !== 'save') return;
  const clamp = (v, max, fb) => { const n = parseFloat(v); return Number.isFinite(n) ? Math.min(max, Math.max(0, n)) : fb; };
  store.weights.barbell = clamp($('barbellInput').value, 200, store.weights.barbell);
  store.weights.kettlebell = clamp($('kettlebellInput').value, 100, store.weights.kettlebell);
  save(); renderReady();
});

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

renderReady();

if ('serviceWorker' in navigator && location.protocol === 'https:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
