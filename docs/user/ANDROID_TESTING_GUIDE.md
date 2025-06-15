# 📱 TALKK 안드로이드 테스트 가이드

## 🚀 빠른 시작

### 1. 개발용 APK 빌드
```bash
# 개발용 APK (디버그)
eas build --platform android --profile development

# 테스트용 APK (릴리즈)
eas build --platform android --profile test
```

### 2. 프리뷰 APK 빌드
```bash
# 프리뷰용 APK
eas build --platform android --profile preview
```

### 3. 프로덕션 AAB 빌드 (Google Play Store)
```bash
# 프로덕션 AAB
eas build --platform android --profile production
```

## 📋 테스트 방법

### 방법 1: 직접 APK 설치
1. **APK 다운로드**
   - EAS 빌드 완료 후 제공되는 다운로드 링크 사용
   - 또는 Expo 대시보드에서 다운로드

2. **안드로이드 기기에 설치**
   ```bash
   # ADB를 통한 설치 (개발자용)
   adb install app-release.apk
   ```

3. **수동 설치**
   - APK 파일을 기기로 전송
   - 파일 매니저에서 APK 실행
   - "알 수 없는 소스" 허용 필요

### 방법 2: Expo Go 앱 사용 (개발 중)
```bash
# 개발 서버 시작
npx expo start

# QR 코드 스캔으로 테스트
```

### 방법 3: Internal Testing (Google Play Console)
1. **Google Play Console 설정**
   - 앱 등록 및 설정
   - Internal Testing 트랙 생성

2. **AAB 업로드**
   ```bash
   # 프로덕션 빌드 후 자동 업로드
   eas build --platform android --profile production
   eas submit --platform android --latest
   ```

## 🔧 설정 및 준비사항

### 1. Google Play Console 설정
1. **Google Play Console 계정 생성**
   - https://play.google.com/console
   - 개발자 등록비 $25 (일회성)

2. **앱 생성**
   - 앱 이름: TALKK
   - 패키지명: com.talkapp.talkk2025

3. **Internal Testing 설정**
   - Testing → Internal testing
   - 테스터 이메일 추가

### 2. EAS 자격증명 설정
```bash
# Android 키스토어 생성 (자동)
eas credentials

# 또는 수동 설정
eas credentials --platform android
```

### 3. 환경 변수 설정
```bash
# .env 파일 생성
API_URL=https://talkk-api.onrender.com
APP_NAME=TALKK
APP_SLUG=talk-app
```

## 📱 테스트 시나리오

### 기본 기능 테스트
- [ ] 앱 설치 및 실행
- [ ] 회원가입/로그인
- [ ] 음성 메시지 녹음/재생
- [ ] 프로필 설정
- [ ] 푸시 알림

### 성능 테스트
- [ ] 앱 시작 시간
- [ ] 메모리 사용량
- [ ] 배터리 소모
- [ ] 네트워크 연결

### 호환성 테스트
- [ ] 다양한 안드로이드 버전 (API 21+)
- [ ] 다양한 화면 크기
- [ ] 다양한 제조사 기기

## 🐛 문제 해결

### 일반적인 문제들

**1. APK 설치 실패**
```bash
# 기존 앱 제거 후 재설치
adb uninstall com.talkapp.talkk2025
adb install app-release.apk
```

**2. 권한 문제**
- 설정 → 보안 → 알 수 없는 소스 허용
- 또는 설정 → 앱 → 특별 액세스 → 알 수 없는 앱 설치

**3. 빌드 실패**
```bash
# 캐시 정리
eas build --platform android --clear-cache

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

## 📊 테스트 결과 수집

### 1. 크래시 리포트
- Google Play Console → 품질 → Android vitals
- Firebase Crashlytics 연동 권장

### 2. 사용자 피드백
- Google Play Console → 사용자 피드백
- 내부 테스터 피드백 수집

### 3. 성능 모니터링
- Google Play Console → Android vitals
- 앱 성능 지표 모니터링

## 🚀 배포 프로세스

### 1. 내부 테스트
```bash
# 테스트 빌드
eas build --platform android --profile test

# 내부 테스터에게 배포
eas submit --platform android --track internal
```

### 2. 알파/베타 테스트
```bash
# 베타 빌드
eas build --platform android --profile production

# 베타 트랙에 배포
eas submit --platform android --track beta
```

### 3. 프로덕션 배포
```bash
# 프로덕션 빌드
eas build --platform android --profile production

# 프로덕션 배포
eas submit --platform android --track production
```

## 📞 지원 및 문의

- **개발팀**: [개발팀 이메일]
- **이슈 리포트**: GitHub Issues
- **문서**: 이 가이드 및 Expo 공식 문서

---

**참고**: 이 가이드는 TALKK 앱의 안드로이드 테스트를 위한 것입니다. 최신 정보는 Expo 공식 문서를 참조하세요. 