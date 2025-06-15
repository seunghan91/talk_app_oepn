#!/bin/bash

# iOS 접속 문제 해결 스크립트
echo "🔧 iOS 접속 문제 해결 스크립트 시작..."

# 1. Metro 캐시 클리어
echo "📱 Metro 캐시 클리어 중..."
npx expo start --clear &
sleep 5
kill $!

# 2. npm 캐시 클리어
echo "🧹 npm 캐시 클리어 중..."
npm cache clean --force

# 3. node_modules 재설치
echo "📦 node_modules 재설치 중..."
rm -rf node_modules
npm install

# 4. Expo 캐시 클리어
echo "🔄 Expo 캐시 클리어 중..."
npx expo install --fix

# 5. 터널 모드로 시작
echo "🚀 터널 모드로 Expo 개발 서버 시작..."
echo "📱 iOS 기기에서 Expo Go 앱으로 QR 코드를 스캔해주세요."
echo "⚠️  같은 Wi-Fi 네트워크에 연결되어 있는지 확인하세요."
echo "🌐 공용 네트워크나 회사 네트워크인 경우 터널 모드가 필수입니다."

npx expo start --tunnel 