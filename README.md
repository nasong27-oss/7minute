# Quiet Seven

첨부 루틴을 기반으로 만든 모바일 운동 타이머입니다. 외부 런타임 의존성이 없는 정적 웹앱입니다.

## 실행

Node.js 20 이상에서 `npm run dev` 후 http://localhost:3000 을 엽니다.
`npm run build` 는 `dist/index.html`을 생성합니다. index.html 단독으로도 실행할 수 있습니다.

## 기능

- 14개 운동, 실제 사람이 시연하는 운동 영상과 두 가지 핵심 안내
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

음성 및 화면 꺼짐 방지는 브라우저/기기 지원에 따릅니다. 백그라운드 운동 진행은 지원하지 않으며 타이머가 자동 일시정지합니다. 실사 영상은 제작자가 제공하는 YouTube/Vimeo 플레이어로 재생합니다. 무음·반복·인라인 자동재생을 요청하며, 브라우저 설정에 따라 첫 재생을 눌러야 할 수 있습니다. 동작을 바꾸면 해당 영상으로 전환하며 영상 멈추기/재생은 운동 타이머와 독립적입니다. 외부 영상은 네트워크와 원본 제공 상태에 의존합니다.

## 영상 출처
Muscle & Strength 공식 운동 라이브러리의 공개 YouTube/Vimeo 임베드. 케틀벨 홀드 스쿼트: James Hanley의 Kettlebell Goblet Squat Hold 공개 YouTube 영상. 원본 링크는 각 운동 영상 아래에 표시됩니다. 영상 파일을 저장소에 재배포하지 않습니다.
