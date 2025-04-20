/**
 * Talkk 앱 디자인 시스템 상수
 */

export const COLORS = {
  // 브랜드 색상
  primary: '#FF5A60',       // 브랜드 메인 색상 (강조색)
  primaryLight: '#FF8086',  // 브랜드 라이트 색상 (그라데이션용)
  primaryDark: '#E5353B',   // 브랜드 다크 색상 (버튼 눌림 효과)
  
  // 배경색
  background: '#FAFAFA',     // 앱 기본 배경
  card: '#FFFFFF',          // 카드 배경
  dim: 'rgba(0, 0, 0, 0.5)', // 모달 딤 처리
  
  // 텍스트 색상
  text: {
    primary: '#121212',     // 주요 텍스트
    secondary: '#424242',   // 보조 텍스트
    tertiary: '#757575',    // 부가 텍스트
    placeholder: '#9E9E9E', // 플레이스홀더
    disabled: '#BDBDBD',    // 비활성화 텍스트
    inverse: '#FFFFFF',     // 반전 텍스트 (어두운 배경용)
  },
  
  // 상태 색상
  status: {
    success: '#4CAF50',     // 성공
    warning: '#FFC107',     // 경고
    error: '#F44336',       // 오류
    info: '#2196F3',        // 정보
  },
  
  // 구분선, 테두리 등
  border: '#E0E0E0',        // 기본 테두리
  divider: '#F0F0F0',       // 구분선
  
  // 입력 필드
  input: {
    background: '#F5F5F5',   // 입력 필드 배경
    border: '#E0E0E0',       // 입력 필드 테두리
    focus: '#FF5A60',        // 포커스 상태
  },
  
  // 음성 메시지 관련
  voice: {
    waveform: '#FF5A60',     // 웨이브폼 색상
    waveformBg: '#F5F5F5',   // 웨이브폼 배경
    progress: '#FF8086',     // 재생 진행률
    duration: '#757575',     // 재생 시간
  }
};

export const SPACING = {
  xs: 4,    // 최소 간격
  sm: 8,    // 작은 간격
  md: 16,   // 중간 간격
  lg: 24,   // 큰 간격
  xl: 32,   // 매우 큰 간격
  xxl: 48,  // 특대 간격
};

export const BORDER_RADIUS = {
  xs: 4,      // 최소 반경
  sm: 8,      // 작은 반경
  md: 12,     // 중간 반경
  lg: 16,     // 큰 반경
  xl: 24,     // 매우 큰 반경
  circular: 999, // 원형
};

// 기본 테마 객체 내보내기
export default {
  COLORS,
  SPACING,
  BORDER_RADIUS
};
