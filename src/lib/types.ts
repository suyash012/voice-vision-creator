
// Media types
export type MediaType = "image" | "video";

export interface MediaItem {
  id: string;
  type: MediaType;
  file: File;
  url: string;
  duration?: number; // in seconds, for videos
  thumbnail?: string;
}

// Voice and audio types
export type VoiceOption = {
  id: string;
  name: string;
  gender: "male" | "female";
  preview?: string;
};

export interface VoiceSettings {
  voiceId: string;
  speed: number; // 0.8 - 1.5
  pitch: number; // -20 to +20
}

export type BackgroundMusic = {
  id: string;
  name: string;
  url: string;
  duration: number; // in seconds
};

export interface AudioSettings {
  backgroundMusicId: string | null;
  backgroundMusicVolume: number; // 0-100
  fadeIn: number; // 0-5 seconds
  fadeOut: number; // 0-5 seconds
}

// Caption types
export type FontOption = {
  name: string;
  value: string;
};

export type CaptionPosition = "top" | "middle" | "bottom";

export interface TextStyle {
  bold: boolean;
  italic: boolean;
}

export interface CaptionSettings {
  text: string;
  font: string;
  fontSize: number; // 16-32px
  color: string;
  opacity: number; // 0-100
  position: CaptionPosition;
  textStyle: TextStyle;
}

// Video configuration
export type AspectRatio = "16:9" | "9:16" | "1:1";
export type Resolution = "720p" | "1080p" | "4K";
export type TransitionEffect = "fade" | "slide" | "zoom" | "wipe" | "none";
export type ExportFormat = "mp4" | "webm";
export type ExportQuality = "draft" | "standard" | "high";

export interface VideoConfig {
  aspectRatio: AspectRatio;
  resolution: Resolution;
  duration: number; // 40-50 seconds
  frameRate: number; // locked at 30fps
  transition: TransitionEffect;
}

export interface ExportConfig {
  format: ExportFormat;
  quality: ExportQuality;
}

// Project and state types
export interface Project {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  media: MediaItem[];
  captions: CaptionSettings;
  voiceSettings: VoiceSettings;
  audioSettings: AudioSettings;
  videoConfig: VideoConfig;
  exportConfig: ExportConfig;
  version: number;
}

export interface ProcessingState {
  isProcessing: boolean;
  progress: number; // 0-100
  estimatedTime?: number; // in seconds
  error?: string;
}
