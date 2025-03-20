# Expo 앱을 LAN 모드로 시작하는 PowerShell 스크립트
Write-Host "Expo 앱을 LAN 모드로 시작합니다..." -ForegroundColor Green

# 현재 디렉토리 확인
$currentDir = Get-Location
Write-Host "현재 디렉토리: $currentDir" -ForegroundColor Yellow

# node_modules 확인
if (-not (Test-Path -Path "node_modules")) {
    Write-Host "node_modules를 설치합니다..." -ForegroundColor Yellow
    npm install
}

# 캐시 정리 (선택적)
Write-Host "캐시를 정리합니다..." -ForegroundColor Yellow
Remove-Item -Path ".expo" -Recurse -Force -ErrorAction SilentlyContinue
npm cache clean --force

# 추가 패키지 확인
$packages = @("react-native-crypto", "stream-browserify", "buffer", "react-native-svg-transformer")
foreach ($package in $packages) {
    if (-not (Test-Path -Path "node_modules\$package")) {
        Write-Host "$package 패키지를 설치합니다..." -ForegroundColor Yellow
        npm install $package --save
    }
}

# Expo LAN 모드 실행
Write-Host "Expo 앱을 LAN 모드로 실행합니다..." -ForegroundColor Green
Write-Host "다른 기기에서 접속하려면 Expo Go 앱을 설치하고 같은 네트워크에 연결한 후 QR 코드를 스캔하세요." -ForegroundColor Yellow
npx expo start --port 8083 --lan

# 스크립트 종료 시 메시지
Write-Host "스크립트가 종료되었습니다." -ForegroundColor Green
Pause 