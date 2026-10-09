# Quiet Seven

좁은 공간에서 조용하게 하는 7분 전신 운동 타이머. 외부 런타임 의존성 없는 정적 PWA입니다.
## 저장소 운영

| 저장소 | 용도 | 배포 |
|---|---|---|
| [nasong27-oss/quiet-seven](https://github.com/nasong27-oss/quiet-seven) | 수정 · 테스트 | Vercel (테스트) |
| [nasong27-oss/7minute](https://github.com/nasong27-oss/7minute) | 운영 | https://7minute.vercel.app |

두 저장소는 같은 커밋 히스토리를 공유합니다. quiet-seven에서 수정 · 확인한 뒤 운영으로 올립니다.

```
git remote add prod https://github.com/nasong27-oss/7minute   # 최초 1회
git push prod main                                              # 운영 반영
```

## 실행

```
npm run dev     # http://localhost:3000
npm run build   # dist/ 생성
```

Node.js 20 이상.

## 화면

| 상태 | 구성 |
|---|---|
| 준비 | 총 시간 · 운동/휴식 리듬 바, 루틴 · 시간 선택, 14동작 썸네일 스트립, 진행 중이면 이어서 하기 화면으로 전환 |
| 설정 | 알림음 · 음성 안내, 바벨 · 케틀벨 무게, 테마(라바 · 샴페인 · 에메랄드) |
| 운동 | 포커스 모드 — 큰 초 표시, 14칸 진행바, 남은 시간, 시연, 핵심 팁, 다음 동작 |
| 휴식 | 쿨 그래파이트 톤 전환, 다음 동작 미리보기, +10초 / 바로 시작 |
| 완료 | 운동 시간 · 완료 동작 수 요약 |

가로로 거치하면 시연(왼쪽) · 타이머(오른쪽) 2단 레이아웃으로 바뀝니다.

## 기능

- 운동 20초 + 휴식 10초 × 14 = 7분 / 운동 30초 + 휴식 10초 × 14 = 9분 20초
- 시작·재개 시 3초 카운트다운, 이전/다음으로 넘겨도 타이머 계속 진행
- 소리(알림음)와 음성 안내(동작 이름, 휴식 안내) 개별 켜기 — 기본 꺼짐
- 설정·무게·진행 상태를 기기에 저장 (운동 기록/스트릭은 저장하지 않음)
- Screen Wake Lock, 화면을 벗어나면 자동 일시정지
- 홈 화면 설치·오프라인 실행 (서비스워커가 앱과 시연 이미지를 캐시)
- 키보드: Space 일시정지/재개, ← 이전, → 다음

## 구조

```
index.html   화면 마크업 (준비 / 운동·휴식 / 완료)
app.css      스타일 — 테마 3종(기본 라바: 카본 블랙 + 오렌지, 휴식 틸)
app.js       타이머 · 상태 · 저장 · 오디오/음성
data.js      동작 카탈로그와 루틴 정의 (동작별 객체)
sw.js        오프라인 캐시
assets/      실제 시연 Animated WebP
```

동작을 바꾸려면 `data.js`에서 `EXERCISES`에 항목을 추가하고 `ROUTINES`의 id 순서만 수정하면 됩니다.

## 배포 (Vercel)

`vercel.json`에 빌드 설정과 캐시 헤더가 들어 있습니다. Vercel에서 이 저장소를 Import하면 Framework Preset은 Other로 인식되고, 이후 `main` push마다 Production, PR마다 Preview가 배포됩니다.

## 시연 이미지 출처

MuscleWiki와 Openfit(GIPHY)의 실제 촬영 시연을 출처 표기와 함께 사용합니다. 개인 비영리 운동 참고용이며, 상업적 이용 시 별도 권리 검토가 필요합니다. 자세한 출처는 [MOTION.md](MOTION.md)를 확인하세요.
