# 🔐 GitHub Secrets 설정 가이드

## 필수 Secrets 설정

GitHub 저장소 → Settings → Secrets and variables → Actions에서 다음 secrets를 추가하세요:

### 1. Expo 관련
```
EXPO_TOKEN
```
- **값**: Expo 액세스 토큰
- **획득 방법**: 
  ```bash
  npx expo login
  npx expo whoami --json
  ```
  또는 https://expo.dev/accounts/[username]/settings/access-tokens

### 2. Apple 관련 (iOS)
```
APPLE_ID
APPLE_ASC_APP_ID  
APPLE_TEAM_ID
```

- **APPLE_ID**: Apple Developer 계정 이메일
- **APPLE_ASC_APP_ID**: App Store Connect 앱 ID
- **APPLE_TEAM_ID**: Apple Developer Team ID

### 3. Google 관련 (Android)
```
GOOGLE_SERVICE_ACCOUNT_KEY
```
- **값**: Google Play Console 서비스 계정 JSON 키
- **획득 방법**: Google Play Console → API 액세스 → 서비스 계정

## 설정 단계

### 1. Expo Token 설정
```bash
# 1. Expo 로그인
npx expo login

# 2. 토큰 생성
# https://expo.dev/accounts/[username]/settings/access-tokens
# "Create Token" 클릭하여 생성

# 3. GitHub Secrets에 추가
# EXPO_TOKEN = [생성된 토큰]
```

### 2. Apple 설정
```bash
# 1. Apple Developer 정보 확인
# https://developer.apple.com/account/

# 2. App Store Connect 앱 ID 확인
# https://appstoreconnect.apple.com/apps/[app-id]/appstore

# 3. GitHub Secrets에 추가
# APPLE_ID = your-apple-id@email.com
# APPLE_ASC_APP_ID = 1234567890
# APPLE_TEAM_ID = ABCD123456
```

### 3. Google Play Console 설정
```bash
# 1. Google Play Console → API 액세스
# 2. 서비스 계정 생성
# 3. JSON 키 다운로드
# 4. GitHub Secrets에 추가
# GOOGLE_SERVICE_ACCOUNT_KEY = [JSON 내용 전체]
```

## 워크플로우 트리거

### 자동 빌드 조건
- **main 브랜치 push**: 프로덕션 빌드 + TestFlight 제출
- **development 브랜치 push**: 프리뷰 빌드
- **Pull Request**: 테스트만 실행

### 수동 빌드
```bash
# 안드로이드 테스트 APK
npm run build:android:test

# iOS 프리뷰 빌드
npm run build:ios:preview

# 모든 플랫폼 프로덕션 빌드
npm run build:all:prod
```

## 문제 해결

### 일반적인 오류들

**1. EXPO_TOKEN 오류**
```
Error: Authentication failed
```
- 토큰이 만료되었거나 잘못됨
- 새 토큰 생성 후 업데이트

**2. Apple 자격증명 오류**
```
Error: Invalid Apple ID or Team ID
```
- Apple Developer 계정 정보 확인
- 2FA 설정 확인

**3. Android 키스토어 오류**
```
Error: Keystore not found
```
- EAS 자격증명 재설정
- `eas credentials --platform android`

## 보안 주의사항

1. **Secrets 노출 금지**
   - 로그에 secrets 출력하지 않기
   - 코드에 하드코딩 금지

2. **최소 권한 원칙**
   - 필요한 권한만 부여
   - 정기적인 토큰 갱신

3. **모니터링**
   - 워크플로우 실행 로그 확인
   - 실패 알림 설정

---

**참고**: 모든 secrets는 암호화되어 저장되며, 워크플로우 실행 시에만 접근 가능합니다. 