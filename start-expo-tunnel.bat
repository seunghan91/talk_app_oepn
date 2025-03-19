@echo off
set PATH=%PATH%;C:\Program Files\nodejs
cd /d %USERPROFILE%\Documents\GitHub\talk_app_oepn
echo Talkk 앱을 터널 모드로 시작합니다...
echo 실행이 완료되면 터미널에 표시되는 QR 코드를 스캔하거나 URL을 공유하세요.
echo.
node "%USERPROFILE%\Documents\GitHub\talk_app_oepn\node_modules\@expo\cli\build\bin\cli" start --tunnel --port 8083 