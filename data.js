// Exercise catalogue. Each exercise carries its own media, layout and copy,
// so routines are plain ordered lists of ids.
// `load` marks which weight the exercise uses; the label is filled in from settings.

const MW = 'https://musclewiki.com/exercise/';

export const EXERCISES = {
  rdl: {
    name: '바벨 루마니안 데드리프트', load: 'barbell', area: '하체 / 둔근',
    tips: ['무릎을 살짝 굽히고 엉덩이를 뒤로 밀기', '바벨을 다리 가까이, 허리는 중립 유지'],
    asset: 'real-rdl.webp', source: { url: MW + 'barbell-romanian-deadlift', label: 'MuscleWiki' },
  },
  pushup: {
    name: '푸시업', area: '가슴 / 팔',
    tips: ['머리부터 발끝까지 일직선 유지', '어려우면 무릎을 바닥에 대고 진행'],
    asset: 'real-pushup.webp', source: { url: MW + 'push-up', label: 'MuscleWiki' },
  },
  row: {
    name: '바벨 벤트오버 로우', load: 'barbell', area: '등',
    tips: ['상체를 숙이고 복부에 힘주기', '몸통을 고정하고 팔꿈치를 뒤로 당기기'],
    asset: 'real-row.webp', source: { url: MW + 'barbell-bent-over-row', label: 'MuscleWiki' },
  },
  lunge: {
    name: '리버스 런지', area: '하체',
    tips: ['한 발씩 번갈아 뒤로 내딛기', '앞발로 바닥을 밀어 일어서기'],
    asset: 'real-lunge.webp', source: { url: MW + 'bodyweight-alternating-reverse-lunges', label: 'MuscleWiki' },
  },
  plank: {
    name: '플랭크', area: '코어', hold: true,
    tips: ['팔꿈치를 어깨 아래에 두기', '허리가 꺾이지 않게 복부에 힘주기'],
    asset: 'real-plank.webp', source: { url: MW + 'forearm-plank', label: 'MuscleWiki' },
  },
  goblet: {
    name: '케틀벨 고블릿 스쿼트', load: 'kettlebell', area: '하체',
    tips: ['케틀벨을 가슴 앞에 가깝게 잡기', '무릎은 발끝 방향으로, 천천히 내려가기'],
    asset: 'real-goblet.webp', source: { url: MW + 'kettlebell-goblet-squat', label: 'MuscleWiki' },
  },
  press: {
    name: '바벨 오버헤드 프레스', load: 'barbell', area: '어깨',
    tips: ['복부에 힘주고 허리를 과하게 젖히지 않기', '무게가 부담되면 무게 없이 진행'],
    asset: 'real-press.webp', source: { url: MW + 'barbell-overhead-press', label: 'MuscleWiki' },
  },
  kbdeadlift: {
    name: '케틀벨 데드리프트', load: 'kettlebell', area: '하체 / 둔근',
    tips: ['엉덩이를 뒤로 밀어 손잡이 잡기', '바닥을 밀어 일어나고 조용히 내려놓기'],
    asset: 'real-kbdeadlift.webp', source: { url: MW + 'kettlebell-sumo-deadlift', label: 'MuscleWiki' },
  },
  deadbug: {
    name: '데드버그', area: '코어',
    tips: ['반대쪽 팔과 다리를 번갈아 뻗기', '허리가 바닥에서 뜨지 않는 범위로 움직이기'],
    asset: 'real-deadbug.webp', source: { url: MW + 'dead-bug', label: 'MuscleWiki' },
  },
  bridge: {
    name: '바벨 글루트 브리지', load: 'barbell', area: '둔근',
    tips: ['등 윗부분·어깨와 두 발은 바닥에 고정', '바벨은 골반 위, 어깨–골반–무릎이 일직선까지만 들기'],
    hint: '어깨와 발을 고정하고 골반을 들어 올리세요',
    asset: 'real-bridge.webp', source: { url: MW + 'barbell-glute-bridge', label: 'MuscleWiki' },
  },
  shouldertap: {
    name: '푸시업 숄더탭', area: '코어 / 어깨',
    tips: ['발을 넓혀 골반 흔들림 줄이기', '반대쪽 어깨를 번갈아 천천히 터치'],
    asset: 'real-shouldertap.webp', source: { url: 'https://giphy.com/stickers/Openfit-transparent-giMxIlDEcu8BnWfx1r', label: 'Openfit / GIPHY' },
  },
  squathold: {
    name: '케틀벨 홀드 스쿼트', load: 'kettlebell', area: '하체', hold: true, still: true,
    tips: ['편안한 깊이에서 자세 유지', '숨을 참지 말고 무릎은 발끝 방향'],
    hint: '앉은 자세에서 일어서지 말고 유지하세요',
    asset: 'real-squat-hold.webp', source: { url: MW + 'kettlebell-goblet-squat', label: 'MuscleWiki' },
  },
  sideplankR: {
    name: '사이드 플랭크 · 오른쪽', area: '옆구리', hold: true,
    tips: ['오른쪽 팔꿈치를 어깨 바로 아래에 고정', '머리–골반–발을 일직선으로 유지, 위아래로 반복하지 않기'],
    hint: '오른쪽 팔꿈치로 지지하며 자세를 유지하세요',
    asset: 'real-sideplank.webp', source: { url: MW + 'elbow-side-plank', label: 'MuscleWiki' },
  },
  sideplankL: {
    name: '사이드 플랭크 · 왼쪽', area: '옆구리', hold: true, mirror: true,
    tips: ['왼쪽 팔꿈치를 어깨 바로 아래에 고정', '머리–골반–발을 일직선으로 유지, 위아래로 반복하지 않기'],
    hint: '왼쪽 팔꿈치로 지지하며 자세를 유지하세요',
    asset: 'real-sideplank.webp', source: { url: MW + 'elbow-side-plank', label: 'MuscleWiki' },
  },
  // Bodyweight-only replacements
  bwSquat: {
    name: '스쿼트', area: '하체 / 둔근',
    tips: ['발바닥을 붙이고 엉덩이를 뒤로 보내며 앉기', '무릎은 발끝 방향, 반동 없이 천천히 일어서기'],
    asset: 'real-bw-squat.webp', source: { url: MW + 'bodyweight-squat', label: 'MuscleWiki' },
  },
  bwSuperman: {
    name: '슈퍼맨', area: '등 / 둔근',
    tips: ['엎드려 팔과 다리를 조금 들어 올리기', '목을 길게 유지하고 허리를 과하게 꺾지 않기'],
    asset: 'real-bw-superman.webp', source: { url: MW + 'supermans', label: 'MuscleWiki' },
  },
  bwHinge: {
    name: '굿모닝', area: '하체 / 둔근',
    tips: ['무릎을 살짝 굽히고 엉덩이를 뒤로 밀기', '허리는 중립, 편안한 범위까지만 상체 숙이기'],
    asset: 'real-bw-hinge.webp', source: { url: MW + 'good-mornings', label: 'MuscleWiki' },
  },
  bwArms: {
    name: '암 서클', area: '어깨',
    tips: ['양팔을 옆으로 펴고 작은 원을 천천히 그리기', '어깨를 으쓱하지 말고 몸통은 고정하기'],
    asset: 'real-bw-arms.webp', source: { url: MW + 'forward-arm-circle', label: 'MuscleWiki' },
  },
  bwBird: {
    name: '버드독', area: '코어 / 등',
    tips: ['네발 자세에서 반대쪽 팔과 다리를 번갈아 뻗기', '골반이 돌아가지 않게, 손과 무릎은 조용히 내려놓기'],
    asset: 'real-bw-bird.webp', source: { url: MW + 'bird-dog', label: 'MuscleWiki' },
  },
  bwBridge: {
    name: '글루트 브리지', area: '둔근',
    tips: ['등 윗부분과 두 발을 바닥에 고정하기', '어깨–골반–무릎이 일직선까지만 들고 천천히 내리기'],
    hint: '어깨와 발을 고정하고 골반을 들어 올리세요',
    asset: 'real-bw-bridge.webp', source: { url: MW + 'glute-bridge', label: 'MuscleWiki' },
  },
  bwSquatHold: {
    name: '홀드 스쿼트', area: '하체', hold: true, still: true,
    tips: ['편안한 깊이에서 앉은 자세 유지', '발바닥을 붙이고 숨을 참지 않기'],
    hint: '앉은 자세에서 일어서지 말고 유지하세요',
    asset: 'real-bw-squat-hold.webp', source: { url: MW + 'bodyweight-squat', label: 'MuscleWiki' },
  },
};

export const ROUTINES = {
  weighted: {
    label: '바벨 · 케틀벨',
    title: '전신 루틴',
    ids: ['rdl', 'pushup', 'row', 'lunge', 'plank', 'goblet', 'press', 'kbdeadlift', 'deadbug', 'bridge', 'shouldertap', 'squathold', 'sideplankR', 'sideplankL'],
  },
  body: {
    label: '맨몸',
    title: '맨몸 전신 루틴',
    ids: ['bwSquat', 'pushup', 'bwSuperman', 'lunge', 'plank', 'bwHinge', 'bwArms', 'bwBird', 'deadbug', 'bwBridge', 'shouldertap', 'bwSquatHold', 'sideplankR', 'sideplankL'],
  },
};

export const REST_SECONDS = 10;
export const DURATIONS = [20, 30];
