# iOS 접속 문제 해결 PowerShell 스크립트
Write-Host "🔧 iOS 접속 문제 해결 스크립트 시작..." -ForegroundColor Green

# 1. Metro 캐시 클리어
Write-Host "📱 Metro 캐시 클리어 중..." -ForegroundColor Yellow
$process = Start-Process -FilePath "npx" -ArgumentList "expo", "start", "--clear" -PassThru -NoNewWindow
Start-Sleep -Seconds 5
Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue

# 2. npm 캐시 클리어
Write-Host "🧹 npm 캐시 클리어 중..." -ForegroundColor Yellow
npm cache clean --force

# 3. node_modules 재설치
Write-Host "📦 node_modules 재설치 중..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Remove-Item -Path "node_modules" -Recurse -Force
}
npm install

# 4. Expo 캐시 클리어
Write-Host "🔄 Expo 캐시 클리어 중..." -ForegroundColor Yellow
npx expo install --fix

# 5. 터널 모드로 시작
Write-Host "🚀 터널 모드로 Expo 개발 서버 시작..." -ForegroundColor Green
Write-Host "📱 iOS 기기에서 Expo Go 앱으로 QR 코드를 스캔해주세요." -ForegroundColor Cyan
Write-Host "⚠️  같은 Wi-Fi 네트워크에 연결되어 있는지 확인하세요." -ForegroundColor Red
Write-Host "🌐 공용 네트워크나 회사 네트워크인 경우 터널 모드가 필수입니다." -ForegroundColor Red

npx expo start --tunnel 