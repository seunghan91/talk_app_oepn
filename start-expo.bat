@echo off
set PATH=%PATH%;C:\Program Files\nodejs
cd /d %USERPROFILE%\Documents\GitHub\talk_app_oepn
node "%USERPROFILE%\Documents\GitHub\talk_app_oepn\node_modules\@expo\cli\build\bin\cli" start --tunnel --port 8083
