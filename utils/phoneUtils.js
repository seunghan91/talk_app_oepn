/**
 * 전화번호 포맷팅 유틸리티 함수
 */

/**
 * 전화번호를 한국 형식(010-1234-5678)으로 포맷팅합니다.
 * @param {string} phoneNumber - 포맷팅할 전화번호 문자열
 * @returns {string} 포맷팅된 전화번호
 */
export const formatKoreanPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return '';
  
  // 숫자만 추출
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // 길이에 따라 다르게 포맷팅
  if (digitsOnly.length <= 3) {
    return digitsOnly;
  } else if (digitsOnly.length <= 7) {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3)}`;
  } else {
    return `${digitsOnly.slice(0, 3)}-${digitsOnly.slice(3, 7)}-${digitsOnly.slice(7, 11)}`;
  }
};

/**
 * 전화번호가 유효한 한국 휴대전화 번호인지 검증합니다.
 * @param {string} phoneNumber - 검증할 전화번호 문자열
 * @returns {boolean} 유효성 여부
 */
export const isValidKoreanPhoneNumber = (phoneNumber) => {
  if (!phoneNumber) return false;
  
  // 숫자만 추출
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // 한국 휴대전화 번호 패턴 검사 (010, 011, 016, 017, 018, 019로 시작하는 10-11자리)
  const koreanPhonePattern = /^01[0-9]{8,9}$/;
  
  return koreanPhonePattern.test(digitsOnly);
}; 