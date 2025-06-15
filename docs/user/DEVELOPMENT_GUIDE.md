# Development Guide

## 🚨 필수 사항 - iOS 개발자 모드 활성화

**중요: 반드시 iPhone에서 개발자 모드를 켜야 합니다!**

### iOS 개발자 모드 활성화 방법:
1. iPhone 설정 → 개인정보 보호 및 보안 → 개발자 모드
2. 개발자 모드 켬 (ON)
3. iPhone 재시작 (시스템에서 요구)
4. 재시작 후 개발자 모드 활성화 확인

### 개발자 모드 비활성화시 문제점:
- Expo Go 앱 실행 불가
- USB 디버깅 불가  
- 위치 권한, 개인정보 보호 설정 초기화
- 개발 빌드 설치 불가

### 확인 방법:
```bash
# 연결된 기기 확인
xcrun devicectl list devices

# iPhone이 "connected" 상태여야 함
```

**앞으로 개발 시작 전 항상 개발자 모드가 켜져있는지 확인하세요!**

---

## 환경 설정

### 필요한 도구
- Node.js 18+
- Expo CLI
- Xcode (iOS 개발용)
- Android Studio (Android 개발용)

### 설치
```bash
npm install
npx expo install
```

### 개발 서버 시작
```bash
# Expo Go 앱용 (권장)
npx expo start --tunnel

# iOS 시뮬레이터용
npx expo start --ios

# Android 에뮬레이터용
npx expo start --android
```

### 실제 기기 연결
1. **개발자 모드 활성화** (위 섹션 참조)
2. iPhone에서 Expo Go 앱 설치
3. QR 코드 스캔하여 앱 실행

### 트러블슈팅
- 연결 안될 시: `--tunnel` 옵션 사용
- 캐시 문제: `--reset-cache` 옵션 추가
- iOS 접속 불가: 개발자 모드 확인 후 재시작 