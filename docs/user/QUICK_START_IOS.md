# 🍎 iOS 빠른 테스트 가이드

## 현재 상황
- **개발서버**: https://talkk-api.onrender.com (정상 작동 중)
- **iPhone**: 16 Pro (iOS 18.5)
- **Mac**: macOS 환경

## 🚀 빠른 시작 방법

### Method 1: Expo Go 앱 사용 (권장)

#### iPhone에서:
1. **App Store에서 "Expo Go" 앱 설치**
2. **앱 실행 후 로그인** (선택사항)

#### Mac에서:
```bash
# 1. 터미널에서 앱 디렉토리로 이동
cd ~/dev/talk_app_oepn  # 폴더명 변경 예정: talk_app_oepn → talk_app_open

# 2. 터널 모드로 시작 (iPhone 접속용)
npx expo start --tunnel

# 또는 로컬 네트워크 사용
npx expo start
```

#### 연결 방법:
- **QR 코드 스캔**: Expo Go 앱에서 스캔
- **URL 직접 입력**: exp://ip-address:port 형태

### Method 2: 개발 빌드 사용

```bash
# 개발 빌드 생성 (처음 한 번만)
npx expo run:ios

# 이후 개발 서버만 시작
npx expo start --dev-client
```

### Method 3: 웹 브라우저에서 테스트

```bash
# 웹 버전으로 실행 (즉시 테스트 가능)
npx expo start --web
```

## 🔧 문제 해결

### 1. QR 코드 스캔 후 "무언가 잘못되었습니다" 오류
```bash
# 해결방법
npx expo start --tunnel --clear
```

### 2. 네트워크 연결 문제
```bash
# 터널 모드 강제 사용
npx expo start --tunnel --localhost

# 또는 ngrok 직접 설치 후 사용
npm install -g @expo/ngrok@4.1.3
npx expo start --tunnel
```

### 3. Metro 번들러 오류
```bash
# 캐시 완전 제거
rm -rf node_modules
npm install
npx expo start --clear
```

## 📱 테스트 계정 정보

앱에서 로그인 테스트 시 사용:

| 전화번호 | 인증코드 | 비밀번호 |
|----------|----------|----------|
| 01011111111 | 123456 | test1234 |
| 01022222222 | 123456 | test1234 |
| 01033333333 | 123456 | test1234 |

## 🎯 테스트 시나리오

### 1. 기본 기능 테스트
1. **회원가입/로그인**
2. **음성 녹음 및 브로드캐스트**
3. **메시지 수신 및 답장**
4. **알림 기능**

### 2. API 연결 테스트
- 앱 실행 시 서버 연결 상태 확인
- 네트워크 오류 시 적절한 메시지 표시

## ⚡ 즉시 실행 명령어

```bash
# 한 번에 실행
cd ~/dev/talk_app_oepn && npx expo start --tunnel --clear  # 폴더명 변경 예정

# 백그라운드 실행
cd ~/dev/talk_app_oepn && npx expo start --tunnel &  # 폴더명 변경 예정

# 웹에서 즉시 확인
cd ~/dev/talk_app_oepn && npx expo start --web  # 폴더명 변경 예정
```

## 🔍 현재 서버 상태 확인

```bash
# API 서버 상태 확인
curl https://talkk-api.onrender.com/api/health_check

# 결과 예시:
# {"status":"ok","message":"Talk API is running"...}
```

## 📞 문제 발생 시 체크리스트

- [ ] 같은 Wi-Fi 네트워크에 연결되어 있는가?
- [ ] Expo Go 앱이 최신 버전인가?
- [ ] 방화벽이나 VPN이 연결을 차단하고 있는가?
- [ ] 터널 모드로 실행했는가?
- [ ] 캐시를 클리어했는가? 