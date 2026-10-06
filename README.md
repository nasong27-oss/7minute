# Quiet Seven

첨부 루틴을 기반으로 만든 모바일 운동 타이머입니다. 외부 런타임 의존성이 없는 정적 웹앱입니다.

## 실행

Node.js 20 이상에서 `npm run dev` 후 http://localhost:3000 을 엽니다.
`npm run build` 는 `dist/index.html`을 생성합니다. index.html 단독으로도 실행할 수 있습니다.

## 기능

- 14개 운동, 동작 GIF와 두 가지 핵심 안내, GIF 멈추기/재생
- 7분: 운동 20초 + 전환 10초 × 14 (마지막 10초는 마무리 휴식)
- 원본 시간: 운동 30초 + 전환 10초 × 14 = 9분 20초
- 시작/일시정지/재개, 이전/다음 동작, 동작 선택, 초기화 확인
- 선택 가능한 카운트다운 소리 및 한국어 음성
- 지원 브라우저의 Screen Wake Lock; 페이지를 벗어나면 자동 일시정지
- 모바일/태블릿/데스크톱 반응형 화면

## GitHub → Vercel

1. 이 프로젝트를 GitHub 저장소의 main 브랜치에 push합니다.
2. Vercel에서 해당 GitHub 저장소를 Import합니다.
3. Framework Preset: Other. Build Command: npm run build. Output Directory: dist.
4. Vercel Git 연동이 활성화되면 main push마다 Production 배포, PR마다 Preview 배포가 생성됩니다.

`vercel.json`에 빌드 설정이 포함되어 있습니다. 배포 상태와 Git 연동은 계정 연결 후 실제 Vercel 프로젝트에서 확인해야 합니다.

## 제한

음성 및 화면 꺼짐 방지는 브라우저/기기 지원에 따릅니다. 백그라운드 운동 진행은 지원하지 않으며 타이머가 자동 일시정지합니다. 플랭크는 움직임이 없는 자세 유지 이미지입니다. 홀드 스쿼트와 사이드 플랭크의 GIF는 진입 자세 참고용이며 운동 중에는 안내대로 자세를 유지합니다. GIF 멈추기로 원하는 자세를 정지해 볼 수 있습니다.

## Media credits

ExerciseDB V1 / AscendAPI (https://oss.exercisedb.dev/docs), 180p GIFs for personal non-commercial use. Metadata and corresponding media sourced from https://github.com/Alejor-Dev/ejercicios-dataset. Reverse lunge, kettlebell deadlift and static plank reference: Fitness Programer (https://fitnessprogramer.com). Media remains the property of its respective owners; no commercial redistribution license is granted by this project.
