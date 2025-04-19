# 보이스 챗 애플리케이션

음성을 기반으로 대화할 수 있는 모바일 애플리케이션입니다.

## 기능 소개

- **사용자 인증**: 전화번호를 통한 인증 시스템 및 비밀번호 찾기 기능
- **음성 채팅**: 실시간 음성 메시지 전송 및 수신
- **브로드캐스트 기능**: 불특정 다수에게 음성 메시지 전송
- **알림 시스템**: 새로운 메시지 및 브로드캐스트 알림
- **공지사항 기능**: 관리자가 사용자들에게 공지사항을 전달

## 공지사항 기능 상세 명세

### 개요
관리자가 앱 사용자들에게 중요한 정보를 전달할 수 있는 공지사항 시스템입니다. 공지사항은 알림으로 전송되며, 사용자는 알림을 통해 공지사항 내용을 확인할 수 있습니다.

### 주요 기능
1. **관리자 공지사항 관리**:
   - 공지사항 작성, 수정, 삭제, 조회 기능
   - 카테고리별 공지사항 관리 (공지, 업데이트, 이벤트 등)
   - 중요 공지 플래그 설정

2. **숨김 기능**:
   - 공지사항의 숨김 처리를 통해 일반 사용자에게 노출되지 않도록 설정 가능
   - 미리 작성해두고 나중에 공개하거나, 특정 공지를 일시적으로 숨기는 용도로 활용

3. **공지사항 게시 상태 관리**:
   - 공지사항의 게시 여부 설정을 통해 게시 시점 조절
   - 작성 완료 전에는 미게시 상태로 저장 후 나중에 게시 가능

4. **사용자 공지사항 조회**:
   - 사용자는 게시되고 숨김 처리되지 않은 공지사항만 확인 가능
   - 카테고리별 공지사항 필터링 기능
   - 중요 공지는 시각적으로 구분되어 표시

### 기술 구현 사항
- React Native 및 Expo 기반의 사용자 인터페이스
- 백엔드 API와 연동하여 공지사항 데이터 관리
- 실시간 알림을 통한 새 공지사항 전달
- 관리자 권한 확인을 통한 접근 제어

### 사용자 권한
- **관리자**: 모든 공지사항 작성, 수정, 삭제, 조회 가능. 숨김 처리된 글도 확인 가능.
- **일반 사용자**: 게시되고 숨김 처리되지 않은 공지사항만 조회 가능.

## 개발 환경

- React Native
- Expo
- JavaScript/TypeScript

## 설치 방법

```bash
# 저장소 클론
git clone [repository-url]

# 디렉토리 이동
cd talk_app_open

# 의존성 설치
npm install

# 개발 서버 실행
npm start
```

## 라이센스

이 프로젝트는 [라이센스 이름]에 따라 배포됩니다. 자세한 내용은 LICENSE 파일을 참조하세요.

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## 테스트 계정 정보

개발 및 테스트를 위한 계정 정보입니다. 이 계정들을 사용하여 앱의 기능을 테스트할 수 있습니다.

| ID | 닉네임 | 전화번호 | 비밀번호 | 성별 |
|----|--------|----------|----------|------|
| A | A - 김철수 | 01011111111 | test1234 | male |
| B | B - 이영희 | 01022222222 | test1234 | female |
| C | C - 박지민 | 01033333333 | test1234 | male |
| D | D - 최수진 | 01044444444 | test1234 | female |
| E | E - 정민준 | 01055555555 | test1234 | male |

### 테스트 계정 사용 방법

1. 앱 실행 후 로그인/회원가입 화면으로 이동
2. 전화번호 인증 화면에서 위 계정 중 하나의 전화번호 입력
3. 인증 코드는 개발 환경에서 자동으로 '123456'으로 설정됨
4. 인증 후 회원가입 화면에서 닉네임, 성별, 비밀번호 입력
5. 회원가입 완료 후 로그인하여 테스트 진행

### 녹음 메시지 테스트 방법

1. 계정 A로 로그인하여 방송 녹음 및 전송
2. 계정 B~E로 로그인하여 수신된 방송 확인
3. 계정 B에서 A에게 답장 녹음 및 전송
4. 계정 A로 다시 로그인하여 수신된 메시지 확인

## 서버 연결 및 문제 해결

### API 서버 정보
- API 서버 URL: https://talkk-api.onrender.com
- 상태 확인 엔드포인트: https://talkk-api.onrender.com/api/health_check
- 서버 관련 코드: `app/lib/axios.js`

### 일반적인 오류 해결 방법

#### Expo 앱이 '다운로드 중 100%'에서 멈추는 경우:
1. Metro 번들러 버전 확인:
   ```bash
   npm list metro metro-resolver metro-config
   ```
   패키지 버전이 일치하지 않는 경우, `package.json`의 dependencies에서 버전을 0.81.0으로 통일

2. 서버 연결 테스트 사용:
   - 개발 환경에서는 테스트 모드가 자동으로 활성화되어 실제 서버 연결 없이도 작동
   - 프로덕션 환경에서는 실제 서버에 연결 시도

3. 터널 모드로 실행:
   ```bash
   npx expo start --tunnel --no-dev
   ```
   이 명령어는 개발 도구 없이 더 안정적인 환경으로 실행

#### 'Invalid URL' 또는 네트워크 오류가 발생하는 경우:
1. @expo/ngrok 패키지 설치 확인:
   ```bash
   npm install @expo/ngrok@4.1.3 --save
   ```

2. 캐시 초기화 후 재시작:
   ```bash
   npx expo start --clear
   ```

3. 모든 의존성 패키지 재설치:
   ```bash
   rm -rf node_modules && npm install
   ```

### 안정적인 버전 사용
현재 레포지토리는 안정적인 버전을 'stable_version' 브랜치에 저장하고 있습니다.
새로운 개발을 시작할 때는 이 브랜치에서 분기하여 작업하는 것을 권장합니다:

```bash
git checkout stable_version
git switch -c 새로운_브랜치명
```

## 인증 프로세스 개선 사항

### 회원가입 및 인증 프로세스

1. **백엔드 중심 설계**:
   - 모든 중요 비즈니스 로직과 유효성 검사는 백엔드에서 처리
   - 클라이언트는 표시 계층으로 제한하여 보안 강화

2. **전화번호 인증 개선**:
   - 인증코드 요청 단계에서 이미 가입된 사용자 확인
   - 중복 가입 시 비밀번호 찾기 화면으로 자동 리다이렉트
   - 성별 값을 백엔드와 호환되도록 수정 (`unspecified` → `unknown`)

3. **비밀번호 찾기 기능**:
   - 3단계 프로세스: 전화번호 입력 → 인증코드 검증 → 새 비밀번호 설정
   - 백엔드에서 사용자 존재 여부 및 인증 검증 처리
   - 안전한 비밀번호 재설정 메커니즘

### 백엔드 API 개선

- **인증 컨트롤러 수정**:
  - `request_code` 메서드에서 `user_exists` 필드 반환
  - 전화번호 중복 확인 로직 강화
  - 로깅 및 오류 처리 개선

### 개발/테스트 환경 설정

앱은 개발 환경과 프로덕션 환경에서 다르게 동작합니다:
- 개발 환경: 테스트 모드 활성화, 모의 응답 사용
- 프로덕션 환경: 실제 API 서버 연결, 모의 응답 사용 안 함

개발 환경에서 실제 서버 테스트를 위해 `app/lib/axios.js`에서 테스트 모드 설정 변경 가능:
```javascript
// 테스트 모드 설정 (개발 환경에서만 활성화)
const useMockResponses = false; // isDev에서 false로 변경
```

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
# talkk-app
# talk_app_oepn
