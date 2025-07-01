# Talkk 앱 빌드 가이드

## 빌드 번호 관리 시스템

빌드 번호가 일원화되어 다음 파일들에서 자동으로 동기화됩니다:
- `app.config.js` - iOS buildNumber
- `android/app/build.gradle` - versionCode
- `ios/TALKK.xcodeproj/project.pbxproj` - CURRENT_PROJECT_VERSION

### 빌드 번호 관리 명령어

```bash
# 빌드 번호 1 증가
npm run build:increment

# 특정 빌드 번호로 설정
npm run build:set 50

# 현재 빌드 번호 확인
node scripts/increment-build-number.js
```

## iOS 빌드 및 TestFlight 배포

### 1. 빌드 생성 및 TestFlight 업로드

```bash
# iOS 빌드 (빌드 번호 자동 증가 포함)
npm run build:ios

# 또는 수동으로 진행
npm run build:increment
eas build -p ios --profile production
```

### 2. TestFlight 업로드

빌드가 완료되면:
```bash
npm run submit:ios
```

### 3. 빌드 상태 확인

```bash
eas build:list --platform ios --limit 5
```

## Android 빌드

```bash
# Android 빌드 (빌드 번호 자동 증가 포함)
npm run build:android

# Google Play 업로드
npm run submit:android
```

## 모든 플랫폼 빌드

```bash
# iOS와 Android 동시 빌드
npm run build:all
```

## 주의사항

1. **빌드 번호 자동 증가**: `build:ios`, `build:android`, `build:all` 명령어 실행 시 빌드 번호가 자동으로 1씩 증가합니다.

2. **Apple 로그인**: iOS 빌드 시 Apple Developer 계정 로그인이 필요합니다.

3. **현재 빌드 번호**: 42 (2025-01-25 기준)

4. **EAS CLI 업데이트**: 최신 버전 유지를 권장합니다.
   ```bash
   npm install -g eas-cli
   ```

## 문제 해결

### iOS 빌드 에러
```bash
# iOS 빌드 캐시 정리
npm run clean-ios
npm run rebuild-ios
```

### 의존성 문제
```bash
# 의존성 재설치
rm -rf node_modules
npm install
cd ios && pod install
```