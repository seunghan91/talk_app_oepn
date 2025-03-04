# Talkk API

음성 기반 소셜 미디어 플랫폼 Talkk의 백엔드 API

## 프로젝트 개요

Talkk는 음성 기반 소셜 네트워킹 플랫폼으로, 사용자들이 짧은 음성 메시지를 브로드캐스팅하고 1:1 대화를 나눌 수 있는 서비스입니다. 텍스트 대신 음성을 사용하여 더 인간적이고 감정이 담긴 소통을 가능하게 합니다.

## 주요 기능

### 회원 관리
- 휴대전화번호 기반 회원가입 및 인증
- SMS 인증 코드를 통한 본인 확인
- 익명 닉네임 및 식별코드 자동 부여
- 성별 정보 선택적 제공

### 음성 브로드캐스팅
- 1~30초 길이의 음성 메시지 녹음 및 브로드캐스팅
- 최대 6일간 저장 후 자동 삭제
- 메인 화면에서 최신순으로 브로드캐스트 목록 표시
- 브로드캐스트에 대한 답장으로 1:1 대화 시작 가능

### 1:1 대화
- 브로드캐스트 답장으로 생성되는 1:1 대화방
- 음성 메시지를 통한 대화 지속
- 대화방 즐겨찾기, 삭제 기능
- 사용자 신고 및 차단 기능

### 추가 기능
- 메아리(Echo) 기능: 다수 사용자에게 브로드캐스트
- 알림 설정 (푸시, 진동, 소리)
- 자동재생 설정 (대화방 진입 시 최신 메시지 자동 재생)

## 기술 스택

- Ruby on Rails 7.2.2
- PostgreSQL
- Redis & Sidekiq (비동기 작업 및 작업 스케줄링)
- Active Storage (음성 파일 저장)
- JWT (인증)
- RailsAdmin (관리자 페이지)

## 시작하기

### 사전 요구사항
- Ruby 3.1.0
- PostgreSQL
- Redis

### 설치
```bash
# 저장소 클론
git clone https://github.com/yourusername/talk_api_open.git
cd talk_api_open

# 의존성 설치
bundle install

# 데이터베이스 설정
bin/rails db:create db:migrate

# 서버 실행
bin/rails server