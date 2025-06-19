# 🍎 Xcode를 이용한 앱 빌드 및 실행 가이드

## 현재 상황
- ✅ **iPhone 16 Pro 시뮬레이터**: 실행 중 (C8F20653-B47F-4B97-B3B8-0BFAD7D3BC95)
- ✅ **실제 iPhone**: USB 연결됨 (seunghaaan)
- ✅ **Xcode 프로젝트**: 열림 (TalkApp.xcworkspace)
- ✅ **Metro 서버**: 백그라운드 실행 중

## 🚀 즉시 실행 방법

### Method 1: 시뮬레이터 사용 (권장)

#### Xcode에서:
1. **Target 선택**: 상단 바에서 "iPhone 16 Pro" 시뮬레이터 선택
2. **빌드 실행**: 
   - `Command + R` 누르기
   - 또는 Play 버튼 클릭
   - 또는 `Product → Run`

### Method 2: 실제 iPhone 사용

#### 사전 준비:
1. **iOS 18.5 Platform 설치**:
   - Xcode → Settings → Platforms
   - iOS 18.5 다운로드 및 설치

2. **개발자 계정 설정**:
   - Xcode → Preferences → Accounts
   - Apple ID 로그인
   - Development Team 선택

3. **iPhone 신뢰 설정**:
   - iPhone에서 "이 컴퓨터를 신뢰하시겠습니까?" → 신뢰
   - 설정 → 일반 → VPN 및 기기 관리 → 개발자 앱 → 신뢰

#### 빌드 실행:
1. **Target 선택**: "seunghaaan" (실제 iPhone) 선택
2. **빌드 실행**: `Command + R`

## 🔧 문제 해결

### 1. iOS 18.5 플랫폼 설치 안됨
**해결책 A**: iOS 18.5 설치
```
Xcode → Settings → Platforms → iOS 18.5 다운로드
```

**해결책 B**: Deployment Target 낮추기
```
프로젝트 설정 → Deployment Info → iOS Deployment Target → 17.0
```

### 2. "Unable to install" 오류
```
1. iPhone 설정 → 일반 → VPN 및 기기 관리
2. 개발자 앱에서 인증서 신뢰
3. Xcode에서 Clean Build Folder (Shift + Command + K)
4. 다시 빌드 (Command + R)
```

### 3. Metro 서버 연결 실패
```bash
# 터미널에서 Metro 서버 재시작
npx expo start --dev-client --clear
```

## 🎯 테스트 계정
앱이 실행되면 다음 계정으로 테스트:
- **전화번호**: `01011111111`
- **인증코드**: `123456`
- **비밀번호**: `test1234`

## 📱 기능 테스트 항목
1. **로그인/회원가입**
2. **방 생성 및 입장**
3. **음성 녹음 및 재생**
4. **채팅 기능**
5. **프로필 설정** 