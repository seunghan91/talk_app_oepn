# TestFlight 베타 테스트 설정 가이드

## 🚀 TestFlight 베타 테스트 준비

### 1. 사전 준비사항

#### Apple Developer Program 가입 (필수)
- **연간 비용**: $99 USD
- **가입 링크**: https://developer.apple.com/programs/
- **필요 문서**: 개인/법인 증명서류
- **승인 시간**: 24-48시간

#### App Store Connect 접근
- Apple Developer 계정으로 로그인
- https://appstoreconnect.apple.com

### 2. App Store Connect 앱 등록

#### 2.1 새 앱 생성
1. App Store Connect → **My Apps** → **+** 버튼
2. **New App** 선택
3. 앱 정보 입력:
   - **Name**: `Talkk` (또는 원하는 이름)
   - **Bundle ID**: `com.talkapp` (Xcode와 동일)
   - **SKU**: `talkk-app-001` (고유 식별자)
   - **User Access**: Limited Access

#### 2.2 앱 기본 정보 설정
- **Category**: Social Networking
- **Content Rights**: 해당사항 체크
- **Age Rating**: 적절한 연령대 선택

### 3. Archive 빌드 생성

#### 3.1 Release 설정 확인
```bash
# 프로덕션 서버 URL 확인
cat src/utils/axios.js | grep baseURL
```

#### 3.2 Xcode에서 Archive 생성
1. Xcode에서 **Device > Any iOS Device** 선택
2. **Product → Archive** (⌘+Shift+B)
3. 빌드 완료 대기 (5-10분)

#### 3.3 Organizer에서 업로드
1. **Window → Organizer** 
2. 생성된 Archive 선택
3. **Distribute App** 클릭
4. **TestFlight & App Store** 선택
5. **Upload** 선택
6. Apple ID 로그인 후 업로드

### 4. TestFlight 설정

#### 4.1 App Store Connect에서 확인
1. **TestFlight** 탭 클릭
2. 업로드된 빌드 확인 (처리 시간: 10-30분)

#### 4.2 테스트 정보 입력
- **What to Test**: 베타 테스트 내용 설명
- **Test Details**: 테스트 방법 안내

#### 4.3 Internal Testing (내부 테스트)
- **최대 25명** 초대 가능
- Apple Developer 팀 멤버만 참여
- 즉시 테스트 가능

#### 4.4 External Testing (외부 테스트)
- **최대 10,000명** 초대 가능
- Apple 심사 필요 (24-48시간)
- 일반 사용자도 참여 가능

### 5. 베타 테스터 초대

#### 5.1 테스터 그룹 생성
1. **TestFlight → External Testing**
2. **+** 버튼으로 새 그룹 생성
3. **그룹명**: `Friends & Family`

#### 5.2 테스터 추가
```
이메일 주소로 초대:
- 테스터의 Apple ID 이메일 입력
- 또는 TestFlight 공개 링크 생성
```

#### 5.3 초대 메시지 커스터마이징
```
안녕하세요!

음성 기반 소셜 네트워킹 앱 'Talkk'의 베타 테스트에 초대합니다.

주요 기능:
- 음성 메시지 송수신
- 1:1 대화 및 그룹 채팅  
- 실시간 음성 브로드캐스팅
- 전화번호 인증

테스트 중 발견되는 버그나 개선사항을 알려주세요.

감사합니다!
```

### 6. 테스터 안내사항

#### 6.1 TestFlight 앱 설치
- App Store에서 **TestFlight** 앱 다운로드
- 무료 앱

#### 6.2 테스트 참여 방법
1. 초대 이메일의 **View in TestFlight** 클릭
2. TestFlight 앱에서 **Accept** 클릭
3. **Install** 버튼으로 앱 설치
4. 테스트 시작!

### 7. 빌드 업데이트

#### 7.1 새 버전 배포
```bash
# 버전 업데이트
npx expo install --fix

# 새 Archive 생성 후 업로드
# (위 3.2-3.3 과정 반복)
```

#### 7.2 테스터 알림
- 새 빌드 업로드 시 자동 알림
- 수동으로 릴리스 노트 작성 가능

### 8. 피드백 수집

#### 8.1 TestFlight 피드백
- 앱 내 스크린샷 + 피드백
- 자동으로 App Store Connect에 수집

#### 8.2 추가 피드백 채널
- 이메일: feedback@talkapp.com
- 카카오톡 오픈채팅방
- Google Form 설문조사

### 9. 주의사항

#### 9.1 베타 테스트 제한
- **테스트 기간**: 최대 90일
- **빌드 만료**: 30일 후 자동 만료
- **정기 업데이트** 필요

#### 9.2 개인정보 보호
- 테스터 동의서 준비
- 개인정보처리방침 앱 내 포함
- 테스트 데이터 관리 정책

### 10. 다음 단계: App Store 출시

#### 10.1 베타 테스트 완료 후
- 버그 수정 및 개선사항 반영
- App Store 심사 준비
- 마케팅 자료 및 스크린샷 준비

---

## 📋 체크리스트

- [ ] Apple Developer Program 가입
- [ ] App Store Connect 앱 생성
- [ ] Xcode Archive 빌드
- [ ] TestFlight 업로드
- [ ] 테스터 그룹 생성
- [ ] 베타 테스터 초대
- [ ] 피드백 수집 시스템 구축

## 🔗 유용한 링크

- [Apple Developer](https://developer.apple.com)
- [App Store Connect](https://appstoreconnect.apple.com)
- [TestFlight 가이드](https://developer.apple.com/testflight/)
- [베타 테스트 베스트 프랙티스](https://developer.apple.com/app-store/review/guidelines/#beta-testing) 