/**
 * Nickname generation utility functions
 */

/**
 * Generates a random nickname using adjective + noun + number format
 * @param {Object} options 
 * @param {boolean} options.useApi - Whether to try using API (deprecated)
 * @returns {string} A randomly generated nickname
 */
export const generateRandomNickname = (options = { useApi: false }) => {
  // API 호출을 시도하지 않고 항상 로컬에서 생성
  // 서버 API 호출 실패 방지 (404 /api/users/random_nickname 방지)
  
  const adjectives = [
    '행복한', '즐거운', '신나는', '멋진', '귀여운', '용감한', '똑똑한', '친절한', '재미있는', '활발한',
    '다정한', '유쾌한', '엉뚱한', '낙천적인', '예리한', '명랑한', '따뜻한', '깔끔한', '차분한', '온화한',
    '진지한', '열정적인', '우아한', '평화로운', '창의적인', '밝은', '조용한', '강인한', '섬세한', '순수한'
  ];
  
  const nouns = [
    '고양이', '강아지', '토끼', '여우', '사자', '호랑이', '판다', '코끼리', '기린', '원숭이',
    '앵무새', '펭귄', '코알라', '햄스터', '다람쥐', '곰', '늑대', '족제비', '표범', '재규어',
    '캥거루', '참새', '청설모', '하마', '수달', '너구리', '담비', '알파카', '비버', '순록',
    '미어캣', '고슴도치', '카피바라', '치타', '물개', '해달', '판다', '하늘다람쥐', '두루미', '독수리'
  ];
  
  const randomNum = Math.floor(Math.random() * 1000);
  
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${randomAdj}${randomNoun}${randomNum}`;
};

/**
 * Validates a nickname
 * @param {string} nickname The nickname to validate
 * @returns {Object} An object with isValid and message properties
 */
export const validateNickname = (nickname) => {
  if (!nickname || nickname.trim() === '') {
    return { isValid: false, message: '닉네임을 입력해주세요.' };
  }
  
  if (nickname.length < 2) {
    return { isValid: false, message: '닉네임은 최소 2자 이상이어야 합니다.' };
  }
  
  if (nickname.length > 20) {
    return { isValid: false, message: '닉네임은 최대 20자까지 가능합니다.' };
  }
  
  return { isValid: true, message: '유효한 닉네임입니다.' };
};