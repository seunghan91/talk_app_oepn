# TestFlight 배포 완전 가이드

## 🎯 현재 상태 (2025년 1월)
- ✅ **Apple Developer Program**: 가입 완료
- ✅ **빌드 환경**: 모든 검사 통과 (15/15)
- ✅ **New Architecture**: 비활성화 (안정성 확보)
- ✅ **React Native**: 0.76.9 (Expo SDK 52 호환)

## 📋 TestFlight 배포 단계

### 1단계: App Store Connect 앱 등록

#### 1.1 App Store Connect 접속
```
https://appstoreconnect.apple.com
```

#### 1.2 새 앱 생성
1. **My Apps** → **+** 버튼 → **New App**
2. 앱 정보 입력:
   - **Name**: `TALKK` (또는 원하는 이름)
   - **Bundle ID**: `com.talkapp.talkk2025` (현재 설정된 ID)
   - **SKU**: `talkk-app-001` (고유 식별자)
   - **User Access**: Limited Access

#### 1.3 앱 기본 정보 설정
- **Primary Category**: Social Networking
- **Secondary Category**: Entertainment (선택사항)
- **Content Rights**: 해당사항 체크
- **Age Rating**: 적절한 연령대 선택

### 2단계: Xcode Archive 빌드

#### 2.1 Xcode 설정 확인
1. **TALKK.xcworkspace** 열기 (이미 열려있음)
2. **TARGETS → TALKK** 선택
3. **Signing & Capabilities** 확인:
   - ✅ Team 설정 완료
   - ✅ Bundle Identifier: `com.talkapp.talkk2025`
   - ✅ Automatically manage signing 체크

#### 2.2 Release 빌드 설정
1. **상단 타겟을 "Any iOS Device"로 변경**
2. **Product → Scheme → Edit Scheme**
3. **Build Configuration**을 **"Release"**로 변경
4. **Close** 클릭

#### 2.3 Archive 생성
```
Xcode 메뉴: Product → Archive (⌘+Shift+B)
```

**예상 소요시간**: 5-10분

#### 2.4 Archive 완료 후
1. **Organizer** 창이 자동으로 열림
2. 생성된 Archive 확인
3. **Distribute App** 버튼 클릭

### 3단계: App Store Connect 업로드

#### 3.1 배포 방법 선택
1. **App Store Connect** 선택
2. **Upload** 선택
3. **Next** 클릭

#### 3.2 배포 옵션 설정
1. **Include bitcode for iOS content**: 체크 해제 (React Native 호환성)
2. **Upload your app's symbols**: 체크 (크래시 분석용)
3. **Next** 클릭

#### 3.3 업로드 실행
1. **Upload** 버튼 클릭
2. 업로드 진행 상황 확인 (10-30분 소요)
3. **Done** 클릭

### 4단계: TestFlight 설정

#### 4.1 App Store Connect에서 확인
1. **My Apps** → **TALKK** 선택
2. **TestFlight** 탭 클릭
3. 업로드된 빌드 확인 (처리 중일 수 있음)

#### 4.2 빌드 처리 대기
- **Processing**: 10-30분 소요
- **Ready to Submit**: 처리 완료
- 이메일 알림 수신

#### 4.3 테스트 정보 입력
1. **Test Information** 섹션:
   - **What to Test**: 베타 테스트 내용 설명
   - **App Description**: 앱 설명
   - **Feedback Email**: 피드백 받을 이메일
   - **Marketing URL**: 웹사이트 (선택사항)

### 5단계: 베타 테스터 초대

#### 5.1 내부 테스터 (Internal Testing)
1. **Internal Testing** → **+** 버튼
2. **Group Name**: "Internal Team"
3. **Add Internal Users**: Apple Developer 팀원 추가
4. **Add Build**: 업로드한 빌드 선택

#### 5.2 외부 테스터 (External Testing)
1. **External Testing** → **+** 버튼
2. **Group Name**: "Beta Testers"
3. **Add External Testers**:
   - 이메일 주소로 초대
   - 최대 10,000명까지 가능
4. **Add Build**: 업로드한 빌드 선택
5. **Submit for Review** (Apple 검토 필요, 24-48시간)

### 6단계: 테스터 가이드

#### 6.1 테스터에게 전달할 정보
```
📱 TALKK 베타 테스트 초대

안녕하세요! TALKK 앱의 베타 테스트에 초대되었습니다.

1. TestFlight 앱 설치:
   - App Store에서 "TestFlight" 검색 후 설치

2. 초대 수락:
   - 이메일의 초대 링크 클릭
   - TestFlight 앱에서 "Accept" 클릭

3. 앱 설치 및 테스트:
   - TestFlight에서 TALKK 앱 설치
   - 기능 테스트 후 피드백 제공

테스트 기간: 90일
피드백: [your-email@example.com]
```

## 🔧 문제 해결

### Archive 빌드 실패 시
1. **Clean Build Folder**: Product → Clean Build Folder (⌘+Shift+K)
2. **DerivedData 삭제**: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. **Pods 재설치**: `cd ios && pod install`

### 업로드 실패 시
1. **Bundle ID 확인**: App Store Connect와 Xcode 일치 여부
2. **Version/Build Number**: 이전 업로드보다 높은 번호 사용
3. **Provisioning Profile**: 자동 관리 설정 확인

### TestFlight 검토 거부 시
1. **App Description**: 더 자세한 설명 추가
2. **Test Information**: 테스트 시나리오 구체화
3. **Privacy Policy**: 개인정보처리방침 링크 추가

## 📊 예상 일정

| 단계 | 소요시간 | 비고 |
|------|----------|------|
| Archive 빌드 | 5-10분 | Xcode에서 진행 |
| App Store Connect 업로드 | 10-30분 | 네트워크 속도에 따라 |
| Apple 빌드 처리 | 10-30분 | 자동 처리 |
| 외부 테스터 검토 | 24-48시간 | Apple 검토 필요 |
| **총 소요시간** | **1-3일** | 검토 시간 포함 |

## 🎉 베타 테스트 시작!

모든 단계가 완료되면 주변인들에게 TestFlight 초대를 보내고 베타 테스트를 시작할 수 있습니다!

---

**다음 파일**: `PRODUCTION_DEPLOYMENT.md` (정식 출시 가이드) 