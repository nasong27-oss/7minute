# Quiet Seven

첨부 루틴을 기반으로 만든 모바일 운동 타이머입니다. 외부 런타임 의존성이 없는 정적 웹앱입니다.

## 실행

Node.js 20 이상에서 `npm run dev` 후 http://localhost:3000 을 엽니다.
`npm run build` 는 `dist/`에 앱과 동작 이미지를 생성합니다. 동작 파일은 index.html과 같은 경로에서 함께 제공합니다.

## 기능

- 14개 운동, 경량 반복 동작 애니메이션과 두 가지 핵심 안내
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

## 동작 이미지

- 처음 사용했던 원본 GIF의 픽셀, 프레임 순서, 재생 시간을 그대로 복원했습니다.
- AI 생성 자세, optical flow, 새 중간 프레임을 사용하지 않습니다.
- 화면 CSS에서 붉은 근육 강조색만 낮춥니다. 해부학적 인물 표현은 남아 있으며 실사/운동복 이미지로 변경된 것은 아닙니다.
- 홀드 스쿼트와 사이드 플랭크 GIF는 진입 동작 참고용입니다. 안내 문구에 따라 자세를 유지합니다.
- 현재/다음 운동만 로드하고, 타이머와 별도로 동작을 멈출 수 있습니다.
- 출처: ExerciseDB / AscendAPI, Fitness Programer. 원본 URL은 MOTION.md 참고.

## 제한

음성 및 화면 꺼짐 방지는 브라우저/기기 지원에 따릅니다. 백그라운드 운동 진행은 지원하지 않으며 타이머가 자동 일시정지합니다.
