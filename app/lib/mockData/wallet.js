/**
 * 지갑 관련 모의 데이터
 */

const walletMocks = {
  // 지갑 정보 조회 API
  '/api/v1/wallet': (config) => {
    return {
      success: true,
      balance: 5000, 
      formatted_balance: '₩5,000',
      transaction_count: 3,
      transactions: [
        {
          id: 1,
          amount: 1000,
          type: 'deposit',
          description: '충전',
          created_at: '2023-05-15T10:30:00Z'
        },
        {
          id: 2,
          amount: -200,
          type: 'payment',
          description: '음성 메시지 전송',
          created_at: '2023-05-16T14:20:00Z'
        },
        {
          id: 3,
          amount: 4200,
          type: 'deposit',
          description: '이벤트 보상',
          created_at: '2023-05-17T09:15:00Z'
        }
      ]
    };
  },
  
  // 지갑 거래내역 조회 API
  '/api/v1/wallet/transactions': (config) => {
    return {
      success: true,
      transactions: [
        {
          id: 1,
          amount: 1000,
          type: 'deposit',
          description: '충전',
          created_at: '2023-05-15T10:30:00Z',
          balance_after: 1000
        },
        {
          id: 2,
          amount: -200,
          type: 'payment',
          description: '음성 메시지 전송',
          created_at: '2023-05-16T14:20:00Z',
          balance_after: 800
        },
        {
          id: 3,
          amount: 4200,
          type: 'deposit',
          description: '이벤트 보상',
          created_at: '2023-05-17T09:15:00Z',
          balance_after: 5000
        }
      ]
    };
  }
};

export default walletMocks; 