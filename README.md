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

# 팀원과 Talkk 앱 공유하기

## 터널 모드로 앱 공유하기

Talkk 앱을 팀원들과 공유하여 외부에서 접근할 수 있게 하려면 다음 단계를 따르세요:

### 방법 1: 배치 파일 사용 (Windows)

1. 프로젝트 폴더의 `start-expo-tunnel.bat` 파일을 더블 클릭합니다.
2. 터미널 창이 열리면서 Expo 서버가 시작됩니다.
3. 터미널에 QR 코드가 표시됩니다. 이 QR 코드를 팀원들에게 공유하세요.
4. 팀원들은 모바일 기기에서 Expo Go 앱을 설치한 후 QR 코드를 스캔하여 앱에 접속할 수 있습니다.
5. 터미널에 표시되는 URL(예: `exp://ez-xyz.yourusername.talk_app_oepn.exp.direct:80`)도 공유할 수 있습니다.

### 방법 2: 명령어 사용

1. 프로젝트 폴더에서 터미널(PowerShell 또는 명령 프롬프트)을 엽니다.
2. 다음 명령어를 실행합니다:
   ```
   npx expo start --tunnel
   ```
3. 터미널에 QR 코드가 표시됩니다. 이 QR 코드를 팀원들에게 공유하세요.
4. 팀원들은 모바일 기기에서 Expo Go 앱을 설치한 후 QR 코드를 스캔하여 앱에 접속할 수 있습니다.

### 방법 3: package.json 스크립트 사용

1. 프로젝트 폴더에서 터미널을 엽니다.
2. 다음 명령어를 실행합니다:
   ```
   npm run start-tunnel
   ```
3. 터미널에 QR 코드가 표시됩니다. 이 QR 코드를 팀원들에게 공유하세요.

## 팀원들의 접속 방법

1. iOS 기기: 카메라 앱으로 QR 코드를 스캔합니다.
2. Android 기기: Expo Go 앱을 설치한 후 앱에서 QR 코드를 스캔합니다.
3. URL을 통한 접속: Expo Go 앱에서 URL을 직접 입력하여 접속할 수도 있습니다.

## 주의사항

- 터널 모드는 인터넷 연결이 필요합니다.
- 방화벽 설정에 따라 연결이 차단될 수 있습니다.
- 앱 개발자(본인)의 컴퓨터가 켜져 있고 Expo 서버가 실행 중이어야 합니다.
- 많은 사용자가 동시에 접속하면 성능이 저하될 수 있습니다.
- 개발용으로만 사용하세요. 실제 배포에는 적합하지 않습니다.
