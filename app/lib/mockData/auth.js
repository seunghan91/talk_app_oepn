/**
 * 인증 관련 모의 API 응답
 */

// 랜덤 닉네임 생성 함수
const generateRandomNickname = () => {
  const adjectives = ["행복한", "즐거운", "신나는", "멋진", "귀여운", "깜찍한", "용감한", "똑똑한", "친절한", "착한"];
  const nouns = ["사자", "고양이", "강아지", "펭귄", "여우", "늑대", "호랑이", "토끼", "물개", "곰"];
  
  const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomNum = Math.floor(Math.random() * 1000);
  
  return `${randomAdj}${randomNoun}${randomNum}`;
};

// 인증 관련 모의 API 응답
const authMocks = {
  '/api/generate_random_nickname': {
    nickname: generateRandomNickname()
  },
  '/api/auth/request_code': {
    message: '인증코드가 발송되었습니다.',
    success: true,
    test_code: '123456' // 테스트용 인증코드 추가
  },
  '/api/auth/verify_code': {
    message: '인증코드가 확인되었습니다.',
    success: true,
    verified: true
  },
  '/api/auth/register': (config) => {
    // 요청 데이터 파싱
    const requestData = JSON.parse(config.data || '{}');
    const { phone_number, password, nickname } = requestData;
    
    return {
      message: '회원가입에 성공했습니다.',
      token: `test_token_${Date.now()}`,
      user: {
        id: Math.floor(Math.random() * 1000) + 10,
        phone_number: phone_number,
        nickname: nickname || generateRandomNickname(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  },
  '/api/auth/login': (config) => {
    // 요청 데이터 파싱
    const requestData = JSON.parse(config.data || '{}');
    const user = requestData.user || {};
    const { phone_number, password } = user;
    
    // 요청 데이터 로깅
    console.log('[테스트] 로그인 요청 데이터:', JSON.stringify(requestData, null, 2));
    
    // 테스트 계정 정보
    const testAccounts = [
      { phone: '01011111111', password: 'password', id: 1, nickname: 'A - 김철수', gender: 'male' },
      { phone: '01022222222', password: 'password', id: 2, nickname: 'B - 이영희', gender: 'female' },
      { phone: '01033333333', password: 'password', id: 3, nickname: 'C - 박지민', gender: 'male' },
      { phone: '01044444444', password: 'password', id: 4, nickname: 'D - 최수진', gender: 'female' },
      { phone: '01055555555', password: 'password', id: 5, nickname: 'E - 정민준', gender: 'male' }
    ];
    
    // 테스트 계정 확인
    const account = testAccounts.find(acc => acc.phone === phone_number && acc.password === password);
    
    if (account) {
      console.log(`[테스트] 계정 로그인 성공: ${account.nickname}`);
      return {
        message: '로그인에 성공했습니다.',
        token: `test_token_${account.id}_${Date.now()}`,
        user: {
          id: account.id,
          phone_number: account.phone,
          nickname: account.nickname,
          gender: account.gender,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
    } else {
      console.log('[테스트] 계정 로그인 실패: 일치하는 계정 정보 없음');
      console.log('요청된 전화번호:', phone_number);
      console.log('요청된 비밀번호:', password ? '[비밀번호 입력됨]' : '[비밀번호 없음]');
      
      // 로그인 실패 시 오류 응답
      throw {
        response: {
          status: 401,
          data: { error: '전화번호 또는 비밀번호가 올바르지 않습니다.' }
        }
      };
    }
  }
};

export default authMocks; 