// Talkk API 모델 정의
const models = {};

/**
 * 사용자 인터페이스 (확장된 필드 추가)
 * @typedef {Object} User
 * @property {number} id - 사용자 고유 ID
 * @property {string} nickname - 닉네임
 * @property {string} phone_number - 전화번호 (마스킹 처리됨)
 * @property {string} gender - 성별 ('male', 'female', 'unknown' 중 하나)
 * @property {string} [age_group] - 연령대 ('20s', '30s', '40s', '50s' 중 하나, 선택적)
 * @property {string} [region] - 지역 (국가/시도 형식, 선택적)
 * @property {boolean} profile_completed - 프로필 완성 여부
 * @property {boolean} blocked - 계정 정지/차단 상태
 * @property {number} warning_count - 경고 누적 횟수
 * @property {string} last_login_at - 마지막 로그인 시간
 * @property {string} created_at - 계정 생성 시간
 */

/**
 * 알림 인터페이스 (확장된 알림 유형 추가)
 * @typedef {Object} Notification
 * @property {number} id - 알림 고유 ID
 * @property {string} type - 알림 유형 ('broadcast', 'message', 'system', 'account_warning', 'account_suspension', 'suspension_ended')
 * @property {string} title - 알림 제목
 * @property {string} body - 알림 내용
 * @property {boolean} read - 읽음 여부
 * @property {string} created_at - 생성 일시
 * @property {Object} [data] - 추가 데이터 (선택적)
 * @property {number} [data.conversation_id] - 관련 대화방 ID (선택적)
 * @property {number} [data.broadcast_id] - 관련 브로드캐스트 ID (선택적)
 * @property {number} [data.suspension_duration] - 정지 기간 (초 단위, 정지 관련 알림에서 사용)
 * @property {string} [data.suspension_reason] - 정지 사유 (정지 관련 알림에서 사용)
 * @property {number} [user_id] - 사용자 ID
 * @property {number} [related_id] - 관련 항목 ID
 */

/**
 * 신고 인터페이스
 * @typedef {Object} Report
 * @property {number} id - 신고 고유 ID
 * @property {number} reporter_id - 신고자 ID
 * @property {number} reported_id - 신고대상 ID
 * @property {string} report_type - 신고 유형 ('user', 'broadcast', 'message')
 * @property {string} reason - 신고 사유 ('gender_impersonation', 'inappropriate_content', 'spam', 'harassment', 'other')
 * @property {string} status - 신고 상태 ('pending', 'processing', 'resolved', 'rejected')
 * @property {number} [related_id] - 관련 브로드캐스트 또는 메시지 ID (report_type이 'user'가 아닐 경우)
 * @property {string} created_at - 신고 시간
 * @property {Object} [reporter] - 신고자 정보
 * @property {Object} [reported] - 신고대상 정보
 */

/**
 * 차단 인터페이스
 * @typedef {Object} Block
 * @property {number} id - 차단 고유 ID
 * @property {number} blocker_id - 차단한 사용자 ID
 * @property {number} blocked_id - 차단된 사용자 ID
 * @property {string} created_at - 차단 시간
 * @property {Object} [blocked_user] - 차단된 사용자 정보
 */

/**
 * 계정 정지 인터페이스
 * @typedef {Object} UserSuspension
 * @property {number} id - 정지 고유 ID
 * @property {number} user_id - 정지된 사용자 ID
 * @property {string} reason - 정지 사유
 * @property {string} suspended_at - 정지 시작 시간
 * @property {string} suspended_until - 정지 만료 시간
 * @property {string} suspended_by - 정지 집행자 ('system' 또는 관리자 이메일)
 * @property {boolean} active - 현재 활성화 상태
 * @property {string} created_at - 생성 시간
 */

export default models;