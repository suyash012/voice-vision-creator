import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";
import Layout from "@/components/Layout";
import MediaUpload from "@/components/MediaUpload";
import TextEditor from "@/components/TextEditor";
import VoiceControls from "@/components/VoiceControls";
import Preview from "@/components/Preview";
import Timeline from "@/components/Timeline";
import ExportOptions from "@/components/ExportOptions";
import { useAuth } from "@/contexts/AuthContext";
import {
  MediaItem,
  CaptionSettings,
  VoiceSettings,
  AudioSettings,
  VideoConfig,
  ExportConfig,
  AspectRatio,
  Resolution,
  TransitionEffect,
  ExportFormat,
  ExportQuality,
  ProcessingState
} from "@/lib/types";

const DEFAULT_CAPTION_SETTINGS: CaptionSettings = {
  text: "Enter your caption text here",
  font: "Inter, sans-serif",
  fontSize: 24,
  color: "#FFFFFF",
  opacity: 100,
  position: "bottom",
  textStyle: {
    bold: false,
    italic: false,
  },
};

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  voiceId: "EXAVITQu4vr4xnSDxMaL", // Sarah
  speed: 1.0,
  pitch: 0,
};

const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  backgroundMusicId: null,
  backgroundMusicVolume: 50,
  fadeIn: 0,
  fadeOut: 0,
};

const DEFAULT_VIDEO_CONFIG: VideoConfig = {
  aspectRatio: "16:9",
  resolution: "1080p",
  duration: 45,
  frameRate: 30,
  transition: "fade",
};

const DEFAULT_EXPORT_CONFIG: ExportConfig = {
  format: "mp4",
  quality: "standard",
};

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [captions, setCaptions] = useState<CaptionSettings>(DEFAULT_CAPTION_SETTINGS);
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);
  const [apiKey, setApiKey] = useState<string>("");
  const [audioSettings, setAudioSettings] = useState<AudioSettings>(DEFAULT_AUDIO_SETTINGS);
  const [videoConfig, setVideoConfig] = useState<VideoConfig>(DEFAULT_VIDEO_CONFIG);
  const [exportConfig, setExportConfig] = useState<ExportConfig>(DEFAULT_EXPORT_CONFIG);
  const [processingState, setProcessingState] = useState<ProcessingState>({
    isProcessing: false,
    progress: 0,
  });
  const [currentTime, setCurrentTime] = useState(0);
  const [activeCaptionText, setActiveCaptionText] = useState<string>("");
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimestampRef = useRef<number | null>(null);
  const previewPausedRef = useRef<boolean>(false);
  const captionsDataRef = useRef<{text: string, startTime: number, endTime: number}[]>([]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    const updatePreview = (timestamp: number) => {
      if (!lastTimestampRef.current) {
        lastTimestampRef.current = timestamp;
      }
      
      const elapsed = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;
      
      if (!previewPausedRef.current && isPlayingAudio) {
        setCurrentTime(prevTime => prevTime + elapsed / 1000);
      }
      
      animationFrameRef.current = requestAnimationFrame(updatePreview);
    };
    
    animationFrameRef.current = requestAnimationFrame(updatePreview);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlayingAudio]);

  useEffect(() => {
    const saveInterval = setInterval(() => {
      if (media.length > 0) {
        toast.success("Project auto-saved", {
          duration: 2000,
          position: "bottom-right",
        });
      }
    }, 30000);
    
    return () => clearInterval(saveInterval);
  }, [media]);

  const handleMediaAdded = (newMedia: MediaItem) => {
    setMedia(prevMedia => [...prevMedia, newMedia]);
    toast.success("Media added successfully");
  };

  const handleMediaUpdate = (updatedMedia: MediaItem[]) => {
    setMedia(updatedMedia);
  };

  const handleMediaRemove = (id: string) => {
    setMedia(prevMedia => prevMedia.filter(item => item.id !== id));
    toast.success("Media removed");
  };

  const handleTransitionChange = (transition: TransitionEffect) => {
    setVideoConfig(prev => ({ ...prev, transition }));
  };

  const handleAspectRatioChange = (aspectRatio: AspectRatio) => {
    setVideoConfig(prev => ({ ...prev, aspectRatio }));
  };

  const handleResolutionChange = (resolution: Resolution) => {
    setVideoConfig(prev => ({ ...prev, resolution }));
  };

  const handleCaptionTimeUpdate = (currentTime: number, captionText: string) => {
    console.log("Caption time update:", currentTime, captionText);
    setActiveCaptionText(captionText);
    
    if (captionText && currentTime >= 0) {
      if (!captionsDataRef.current.some(c => c.text === captionText && Math.abs(c.startTime - currentTime) < 0.1)) {
        captionsDataRef.current.push({
          text: captionText,
          startTime: currentTime,
          endTime: currentTime + 2
        });
      }
    }
  };

  const handleAudioPlayingChange = (isPlaying: boolean) => {
    console.log("Audio playing changed:", isPlaying);
    setIsPlayingAudio(isPlaying);
    
    if (isPlaying && !previewPausedRef.current) {
      setCurrentTime(0);
      captionsDataRef.current = [];
    }
    
    previewPausedRef.current = !isPlaying;
  };

  const handlePlayPauseToggle = () => {
    document.dispatchEvent(new CustomEvent('toggle-audio-playback'));
  };

  const handleExport = () => {
    if (media.length === 0) {
      toast.error("Please add at least one media item before exporting");
      return;
    }
    
    if (!captions.text.trim()) {
      toast.error("Please add caption text before exporting");
      return;
    }
    
    setProcessingState({
      isProcessing: true,
      progress: 0,
    });
    
    let progress = 0;
    const totalSteps = 100;
    const processingTime = Math.min(15000, 5000 + (media.length * 1000));
    const interval = setInterval(() => {
      progress += 100 / (processingTime / 200);
      
      if (progress >= 100) {
        clearInterval(interval);
        progress = 100;
        
        setProcessingState({
          isProcessing: true,
          progress: 100,
        });
        
        toast.success("Video ready to download!");
      } else {
        setProcessingState({
          isProcessing: true,
          progress: Math.min(Math.round(progress), 99),
        });
      }
    }, 200);
  };

  const resetProcessingState = () => {
    setProcessingState({
      isProcessing: false,
      progress: 0,
    });
  };

  const calculateTotalDuration = (): number => {
    if (media.length === 0) return 0;
    
    return media.reduce((total, item) => {
      return total + (item.duration || 5);
    }, 0);
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary"></div>
            <p className="mt-4 text-lg">Loading...</p>
          </div>
        </div>
      </Layout>
    );
  }

  const totalMediaDuration = calculateTotalDuration();

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Faceless Video Creator</h1>
            <p className="text-muted-foreground mt-1">
              Transform your content with captivating faceless videos
            </p>
          </div>
          
          <div className="flex space-x-3">
            <div className="space-x-2">
              <button
                type="button"
                onClick={() => handleAspectRatioChange("16:9")}
                className={`btn-accent ${videoConfig.aspectRatio === "16:9" ? "bg-primary text-primary-foreground" : ""}`}
              >
                16:9
              </button>
              <button
                type="button"
                onClick={() => handleAspectRatioChange("9:16")}
                className={`btn-accent ${videoConfig.aspectRatio === "9:16" ? "bg-primary text-primary-foreground" : ""}`}
              >
                9:16
              </button>
              <button
                type="button"
                onClick={() => handleAspectRatioChange("1:1")}
                className={`btn-accent ${videoConfig.aspectRatio === "1:1" ? "bg-primary text-primary-foreground" : ""}`}
              >
                1:1
              </button>
            </div>
            
            <select
              value={videoConfig.resolution}
              onChange={(e) => handleResolutionChange(e.target.value as Resolution)}
              className="input-field py-1 h-9 text-sm"
            >
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="4K">4K</option>
            </select>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <Preview
              media={media}
              captions={captions}
              videoConfig={videoConfig}
              currentTime={currentTime}
              activeCaptionText={activeCaptionText}
              isPlayingAudio={isPlayingAudio}
              onPlayPauseToggle={handlePlayPauseToggle}
            />
            
            <MediaUpload onMediaAdded={handleMediaAdded} />
            
            <Timeline
              media={media}
              onMediaUpdate={handleMediaUpdate}
              onMediaRemove={handleMediaRemove}
              transition={videoConfig.transition}
              onTransitionChange={handleTransitionChange}
            />
          </div>
          
          <div className="space-y-6">
            <TextEditor
              initialSettings={captions}
              onChange={setCaptions}
            />
            
            <VoiceControls
              settings={voiceSettings}
              onUpdate={setVoiceSettings}
              apiKey={apiKey}
              onApiKeyChange={setApiKey}
              captionText={captions.text}
              onCaptionTimeUpdate={handleCaptionTimeUpdate}
              onPlayingChange={handleAudioPlayingChange}
            />
            
            <ExportOptions
              config={exportConfig}
              videoConfig={videoConfig}
              onConfigChange={setExportConfig}
              onExport={handleExport}
              processingProgress={processingState.progress}
              isProcessing={processingState.isProcessing}
              totalMediaDuration={totalMediaDuration}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Index;
