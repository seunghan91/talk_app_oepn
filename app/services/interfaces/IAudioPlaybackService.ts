// app/services/interfaces/IAudioPlaybackService.ts

export interface PlaybackStatus {
  isPlaying: boolean;
  isPaused: boolean;
  isLoaded: boolean;
  currentTime: number; // 초 단위
  duration: number; // 초 단위
  volume: number; // 0-1
}

export interface PlaybackOptions {
  volume?: number;
  rate?: number; // 재생 속도
  shouldCorrectPitch?: boolean;
  loop?: boolean;
}

// 오디오 재생 서비스 인터페이스 (SRP)
export interface IAudioPlaybackService {
  // 상태 조회
  getStatus(): PlaybackStatus;
  
  // 재생 제어
  load(uri: string): Promise<void>;
  play(options?: PlaybackOptions): Promise<void>;
  pause(): Promise<void>;
  stop(): Promise<void>;
  seek(position: number): Promise<void>; // 초 단위
  
  // 볼륨 제어
  setVolume(volume: number): Promise<void>;
  
  // 리소스 정리
  unload(): Promise<void>;
  
  // 이벤트 리스너
  onStatusUpdate(callback: (status: PlaybackStatus) => void): () => void;
  onPlaybackFinish(callback: () => void): () => void;
} 