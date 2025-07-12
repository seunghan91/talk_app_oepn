// app/services/interfaces/IAudioRecordingService.ts

export interface RecordingOptions {
  maxDuration?: number; // 초 단위
  quality?: 'low' | 'medium' | 'high';
  format?: 'mp3' | 'wav' | 'm4a';
}

export interface RecordingStatus {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // 초 단위
  uri?: string;
}

// 오디오 녹음 서비스 인터페이스 (SRP)
export interface IAudioRecordingService {
  // 상태 조회
  getStatus(): RecordingStatus;
  
  // 녹음 제어
  startRecording(options?: RecordingOptions): Promise<void>;
  stopRecording(): Promise<string>; // 녹음 파일 URI 반환
  pauseRecording(): Promise<void>;
  resumeRecording(): Promise<void>;
  cancelRecording(): Promise<void>;
  
  // 권한 관련
  requestPermissions(): Promise<boolean>;
  checkPermissions(): Promise<boolean>;
  
  // 이벤트 리스너
  onStatusUpdate(callback: (status: RecordingStatus) => void): () => void; // unsubscribe 함수 반환
} 