@echo off
echo Expo 앱을 터널 모드로 시작합니다...

cd /d "%~dp0"
npm install

rem 이전에 설치한 Expo CLI 실행
npx expo start --tunnel --port 8083

pause 