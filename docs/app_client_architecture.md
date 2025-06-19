# Talkk 앱 클라이언트 아키텍처 문서

## 개요
Talkk 앱은 React Native + Expo SDK 51 기반의 크로스 플랫폼 모바일 애플리케이션으로, 음성 메시징을 중심으로 한 소셜 커뮤니케이션 앱입니다.

## 기술 스택
- **프레임워크**: React Native 0.74 / Expo SDK 51
- **라우팅**: Expo Router (파일 기반 라우팅)
- **상태 관리**: React Context API
- **UI 프레임워크**: shadcn/ui + NativeWind (Tailwind CSS)
- **오디오**: expo-av (녹음/재생)
- **빌드/배포**: EAS Build & Update

## 프로젝트 구조

```
talk_app_oepn/  <!-- 폴더명 변경 예정: talk_app_oepn → talk_app_open -->
├── app/                    # 앱 메인 디렉토리 (Expo Router)
│   ├── (auth)/            # 인증 관련 화면
│   │   ├── login.js       # 로그인
│   │   └── verify.js      # OTP 검증
│   ├── (tabs)/            # 탭 네비게이션 화면들
│   │   ├── index.js       # 홈/대화 목록
│   │   ├── broadcast.js   # 브로드캐스트
│   │   └── profile.js     # 프로필
│   ├── conversations/     # 대화 관련
│   │   ├── [id].js        # 대화 상세
│   │   └── new.js         # 새 대화
│   ├── broadcast/         # 브로드캐스트 관련
│   │   └── reply.js       # 브로드캐스트 답장
│   └── _layout.js         # 루트 레이아웃
├── components/            # 재사용 컴포넌트
│   ├── ui/               # UI 컴포넌트
│   │   ├── Button.js     # 버튼
│   │   ├── Card.js       # 카드
│   │   └── Input.js      # 입력 필드
│   ├── VoiceRecorder.js  # 음성 녹음
│   ├── VoicePlayer.js    # 음성 재생
│   └── ConversationItem.js # 대화 목록 아이템
├── lib/                   # 유틸리티
│   ├── api.js            # API 클라이언트
│   ├── auth.js           # 인증 헬퍼
│   ├── storage.js        # AsyncStorage 래퍼
│   └── utils.js          # 공통 유틸리티
├── contexts/             # React Context
│   ├── AuthContext.js    # 인증 상태
│   └── AppContext.js     # 앱 전역 상태
├── assets/               # 정적 자원
│   ├── images/          # 이미지
│   └── sounds/          # 사운드 효과
├── app.json             # Expo 설정
├── eas.json             # EAS 빌드 설정
└── package.json         # 의존성 관리
```

## 주요 화면 흐름

### 1. 인증 플로우
```
시작 → 로그인(전화번호) → OTP 검증 → 홈 화면
```

### 2. 대화 플로우
```
대화 목록 → 대화 상세 → 음성 녹음 → 메시지 전송
         ↓
    새 대화 생성
```

### 3. 브로드캐스트 플로우
```
브로드캐스트 탭 → 녹음/전송 → 수신 목록 → 답장
```

## 핵심 컴포넌트

### VoiceRecorder
- 음성 녹음 기능 (1~30초)
- 실시간 녹음 시간 표시
- 파형 시각화
- 녹음 완료 후 미리듣기

### VoicePlayer
- 음성 메시지 재생
- 재생 진행률 표시
- 재생 속도 조절
- 자동 읽음 처리

### ConversationItem
- 대화 목록 아이템
- 최신 메시지 미리보기
- 읽지 않은 메시지 카운트
- 시간 표시 (상대 시간)

## API 통신

### 기본 설정
```javascript
// lib/api.js
const API_URL = 'https://talkk-api.onrender.com';

// 인증 헤더 자동 추가
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

### 주요 API 호출
- 인증: `auth.sendOtp()`, `auth.verifyOtp()`
- 대화: `conversations.list()`, `conversations.create()`
- 메시지: `messages.send()`, `messages.markAsRead()`
- 브로드캐스트: `broadcasts.create()`, `broadcasts.getReceived()`

## 상태 관리

### AuthContext
- 사용자 인증 상태
- 토큰 관리
- 자동 토큰 갱신

### AppContext
- 대화 목록 캐싱
- 실시간 메시지 업데이트
- 푸시 알림 처리

## 오디오 처리

### 녹음 설정
```javascript
{
  android: {
    extension: '.m4a',
    outputFormat: RECORDING_OPTIONS_PRESET_HIGH_QUALITY.android.outputFormat,
    audioEncoder: RECORDING_OPTIONS_PRESET_HIGH_QUALITY.android.audioEncoder,
  },
  ios: {
    extension: '.m4a',
    outputFormat: RECORDING_OPTIONS_PRESET_HIGH_QUALITY.ios.outputFormat,
    audioQuality: RECORDING_OPTIONS_PRESET_HIGH_QUALITY.ios.audioQuality,
  }
}
```

### 오디오 업로드
1. 녹음 완료 → Base64 인코딩
2. API 전송 → S3 업로드
3. URL 반환 → 메시지에 포함

## 빌드 설정 (eas.json)

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "ios": {
        "resourceClass": "m-medium"
      }
    },
    "production": {
      "ios": {
        "resourceClass": "m-medium"
      },
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

## 환경 변수

```javascript
// app.json
{
  "expo": {
    "extra": {
      "apiUrl": "https://talkk-api.onrender.com",
      "sentryDsn": "...",
      "amplitudeApiKey": "..."
    }
  }
}
```

## 푸시 알림

### 설정
- Expo Push Notifications 사용
- 디바이스 토큰 서버 등록
- 백그라운드 알림 처리

### 알림 유형
1. 새 메시지 알림
2. 브로드캐스트 수신 알림
3. 시스템 공지사항

## 성능 최적화

### 1. 이미지/미디어
- expo-image 사용 (캐싱)
- 썸네일 생성
- Lazy loading

### 2. 리스트 최적화
- FlashList 사용
- 가상화 스크롤
- 메모이제이션

### 3. 오디오 최적화
- 프리로딩
- 스트리밍 재생
- 메모리 관리

## 보안 고려사항

1. **토큰 저장**
   - SecureStore 사용
   - 자동 만료 처리

2. **API 통신**
   - HTTPS 강제
   - Certificate pinning

3. **오디오 파일**
   - 임시 파일 자동 삭제
   - URL 만료 시간 체크

## 배포 프로세스

### 1. 개발 빌드
```bash
npx eas build --profile development --platform all
```

### 2. 내부 테스트
```bash
npx eas build --profile preview --platform all
```

### 3. 프로덕션 배포
```bash
npx eas build --profile production --platform all
npx eas submit --platform all
```

### 4. OTA 업데이트
```bash
npx eas update --branch production --message "버그 수정"
```

## 모니터링

- **Sentry**: 크래시 리포팅
- **Amplitude**: 사용자 행동 분석
- **EAS Insights**: 빌드/업데이트 분석

## 알려진 이슈 및 개선사항

1. **Android 오디오 권한**
   - 일부 기기에서 권한 요청 타이밍 이슈
   - 해결: 명시적 권한 요청 추가

2. **iOS 백그라운드 오디오**
   - 백그라운드에서 재생 중단
   - 해결: Audio Session 설정 필요

3. **번들 ID 설정**
   - 네이티브 코드에서 직접 수정 필요
   - app.json 설정이 무시됨

## 다음 단계

1. **성능 개선**
   - React Native New Architecture 적용
   - Hermes 엔진 최적화

2. **기능 추가**
   - 실시간 채팅 (WebSocket)
   - 영상 메시지 지원

3. **UI/UX 개선**
   - 다크 모드 지원
   - 접근성 향상
