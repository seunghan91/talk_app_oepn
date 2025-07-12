// app/contexts/DIContext.tsx
import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import { IHttpClient } from '../services/interfaces/IHttpClient';
import { AxiosHttpClient } from '../services/implementations/AxiosHttpClient';
import { IBroadcastRepository, BroadcastRepository } from '../repositories/BroadcastRepository';
import Constants from 'expo-constants';

// DI 컨테이너 인터페이스
export interface IDIContainer {
  httpClient: IHttpClient;
  broadcastRepository: IBroadcastRepository;
  // 추가 Repository 및 Service들
  // authRepository: IAuthRepository;
  // conversationRepository: IConversationRepository;
  // audioRecordingService: IAudioRecordingService;
  // audioPlaybackService: IAudioPlaybackService;
}

// Context 생성
const DIContext = createContext<IDIContainer | null>(null);

// Provider 컴포넌트 Props
interface DIProviderProps {
  children: ReactNode;
  overrides?: Partial<IDIContainer>; // 테스트 시 의존성 오버라이드 가능
}

// Provider 컴포넌트
export const DIProvider: React.FC<DIProviderProps> = ({ children, overrides }) => {
  // 의존성 인스턴스 생성 (메모이제이션으로 재생성 방지)
  const container = useMemo<IDIContainer>(() => {
    // HTTP 클라이언트 생성
    const httpClient = overrides?.httpClient || new AxiosHttpClient({
      baseURL: Constants.expoConfig?.extra?.apiUrl || 'https://talkk-api.onrender.com',
      timeout: 30000,
    });

    // Repository 생성
    const broadcastRepository = overrides?.broadcastRepository || 
      new BroadcastRepository(httpClient);

    // 추가 의존성들
    // const authRepository = overrides?.authRepository || 
    //   new AuthRepository(httpClient);
    
    // const conversationRepository = overrides?.conversationRepository || 
    //   new ConversationRepository(httpClient);

    return {
      httpClient,
      broadcastRepository,
      // authRepository,
      // conversationRepository,
      // audioRecordingService,
      // audioPlaybackService,
    };
  }, [overrides]);

  return (
    <DIContext.Provider value={container}>
      {children}
    </DIContext.Provider>
  );
};

// DI 컨테이너 사용 Hook
export const useDI = (): IDIContainer => {
  const context = useContext(DIContext);
  
  if (!context) {
    throw new Error('useDI must be used within DIProvider');
  }
  
  return context;
};

// 개별 의존성 접근 Hooks (선택적)
export const useHttpClient = (): IHttpClient => {
  const { httpClient } = useDI();
  return httpClient;
};

export const useBroadcastRepository = (): IBroadcastRepository => {
  const { broadcastRepository } = useDI();
  return broadcastRepository;
};

// 추가 Hook들
// export const useAuthRepository = (): IAuthRepository => {
//   const { authRepository } = useDI();
//   return authRepository;
// }; 