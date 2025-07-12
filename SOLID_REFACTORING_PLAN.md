# React Native 앱 SOLID 리팩토링 계획

## 1. 주요 SOLID 원칙 위반 사항

### 1.1 VoiceRecorder 컴포넌트 (383줄)
- **SRP 위반**: 녹음, 재생, 애니메이션, 설정 관리, 파일 처리 등 너무 많은 책임
- **OCP 위반**: 새로운 녹음 형식 추가 시 컴포넌트 수정 필요
- **DIP 위반**: expo-av, AsyncStorage 등 구체적 구현에 직접 의존

### 1.2 axios.js (590줄)
- **SRP 위반**: API 호출, 인터셉터, 모의 응답, 서버 연결 테스트 등 다중 책임
- **OCP 위반**: 새로운 API 엔드포인트나 모의 응답 추가 시 파일 수정 필요
- **DIP 위반**: axios 라이브러리에 직접 의존

### 1.3 API 호출 패턴
- **DIP 위반**: 컴포넌트에서 axiosInstance를 직접 사용
- **ISP 위반**: 모든 API 기능이 하나의 거대한 인터페이스로 제공

## 2. 개선 계획

### 2.1 VoiceRecorder 리팩토링

#### 2.1.1 서비스 분리
```typescript
// services/AudioRecordingService.ts
interface IAudioRecordingService {
  startRecording(): Promise<void>;
  stopRecording(): Promise<string>;
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
}

// services/AudioPlaybackService.ts  
interface IAudioPlaybackService {
  play(uri: string): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  getStatus(): Promise<PlaybackStatus>;
}

// services/AudioStorageService.ts
interface IAudioStorageService {
  save(uri: string): Promise<string>;
  delete(uri: string): Promise<void>;
  getMetadata(uri: string): Promise<AudioMetadata>;
}
```

#### 2.1.2 애니메이션 분리
```typescript
// components/WaveformAnimation.tsx
interface WaveformAnimationProps {
  isActive: boolean;
  audioLevels?: number[];
}

// hooks/useWaveformAnimation.ts
export const useWaveformAnimation = (isRecording: boolean) => {
  // 애니메이션 로직 분리
};
```

#### 2.1.3 간소화된 VoiceRecorder
```typescript
// components/VoiceRecorder.tsx
export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  recordingService,
  playbackService,
  storageService
}) => {
  // 의존성 주입을 통한 서비스 사용
  // UI와 조합 로직만 담당
};
```

### 2.2 API 레이어 리팩토링

#### 2.2.1 Repository 패턴 도입
```typescript
// repositories/BaseRepository.ts
export abstract class BaseRepository {
  constructor(protected httpClient: IHttpClient) {}
  
  protected async get<T>(url: string): Promise<T> {
    return this.httpClient.get<T>(url);
  }
  
  protected async post<T>(url: string, data: any): Promise<T> {
    return this.httpClient.post<T>(url, data);
  }
}

// repositories/BroadcastRepository.ts
export class BroadcastRepository extends BaseRepository {
  async getBroadcasts(): Promise<Broadcast[]> {
    const response = await this.get<{ broadcasts: Broadcast[] }>('/broadcasts');
    return response.broadcasts;
  }
  
  async createBroadcast(data: CreateBroadcastDto): Promise<Broadcast> {
    return this.post<Broadcast>('/broadcasts', data);
  }
}
```

#### 2.2.2 HTTP Client 추상화
```typescript
// services/IHttpClient.ts
export interface IHttpClient {
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  setAuthToken(token: string): void;
  clearAuthToken(): void;
}

// services/AxiosHttpClient.ts
export class AxiosHttpClient implements IHttpClient {
  private axiosInstance: AxiosInstance;
  
  constructor(config: HttpClientConfig) {
    this.axiosInstance = axios.create(config);
    this.setupInterceptors();
  }
  
  // IHttpClient 구현
}
```

#### 2.2.3 Mock Service 분리
```typescript
// services/MockService.ts
export interface IMockService {
  isEnabled(): boolean;
  getMockResponse(endpoint: string, method: string): any;
}

// services/NetworkService.ts
export class NetworkService {
  constructor(
    private httpClient: IHttpClient,
    private mockService: IMockService
  ) {}
  
  async request<T>(config: RequestConfig): Promise<T> {
    if (this.mockService.isEnabled()) {
      return this.mockService.getMockResponse(config.url, config.method);
    }
    return this.httpClient.request<T>(config);
  }
}
```

### 2.3 Context와 Hook 개선

#### 2.3.1 의존성 주입 컨테이너
```typescript
// contexts/DIContext.tsx
interface IDIContainer {
  httpClient: IHttpClient;
  authRepository: IAuthRepository;
  broadcastRepository: IBroadcastRepository;
  audioRecordingService: IAudioRecordingService;
  audioPlaybackService: IAudioPlaybackService;
}

export const DIContext = React.createContext<IDIContainer | null>(null);

export const useDI = () => {
  const context = useContext(DIContext);
  if (!context) {
    throw new Error('useDI must be used within DIProvider');
  }
  return context;
};
```

#### 2.3.2 Custom Hooks로 비즈니스 로직 분리
```typescript
// hooks/useBroadcast.ts
export const useBroadcast = () => {
  const { broadcastRepository } = useDI();
  
  const getBroadcasts = useCallback(async () => {
    return broadcastRepository.getBroadcasts();
  }, [broadcastRepository]);
  
  const createBroadcast = useCallback(async (data: CreateBroadcastDto) => {
    return broadcastRepository.createBroadcast(data);
  }, [broadcastRepository]);
  
  return { getBroadcasts, createBroadcast };
};
```

## 3. 구현 순서

### Phase 1: API 레이어 리팩토링 (1주)
1. IHttpClient 인터페이스 정의
2. AxiosHttpClient 구현
3. Repository 패턴 구현
4. Mock Service 분리
5. DI Container 설정

### Phase 2: VoiceRecorder 리팩토링 (1주)
1. Audio 서비스 인터페이스 정의
2. 서비스 구현 (Recording, Playback, Storage)
3. WaveformAnimation 컴포넌트 분리
4. VoiceRecorder 컴포넌트 간소화
5. 통합 테스트

### Phase 3: 전체 앱 적용 (1주)
1. 모든 API 호출을 Repository 패턴으로 변경
2. Custom Hook으로 비즈니스 로직 이동
3. 컴포넌트 의존성 주입 적용
4. 테스트 작성

## 4. 기대 효과

### 4.1 유지보수성 향상
- 각 클래스/컴포넌트가 단일 책임만 가짐
- 변경 사항이 격리되어 영향 범위 최소화

### 4.2 테스트 용이성
- 모든 의존성이 주입 가능하여 Mock 객체 사용 가능
- 단위 테스트 작성이 쉬워짐

### 4.3 확장성
- 새로운 오디오 형식, API 클라이언트 추가가 기존 코드 수정 없이 가능
- Strategy 패턴으로 런타임에 동작 변경 가능

### 4.4 재사용성
- 서비스와 Repository는 다른 프로젝트에서도 재사용 가능
- 컴포넌트가 더 범용적으로 사용 가능 