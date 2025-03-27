import React, { useState, useRef, useEffect } from "react";
import { VoiceOption, VoiceSettings } from "@/lib/types";
import { toast } from "sonner";

interface VoiceControlsProps {
  settings: VoiceSettings;
  onUpdate: (settings: VoiceSettings) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  captionText?: string;
  onCaptionTimeUpdate?: (currentTime: number, captionText: string) => void;
  onPlayingChange?: (isPlaying: boolean) => void;
}

// Sample voice options (would be fetched from API in production)
const VOICE_OPTIONS: VoiceOption[] = [
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah", gender: "female" },
  { id: "XB0fDUnXU5powFXDhCwa", name: "Charlotte", gender: "female" },
  { id: "pFZP5JQG7iQjIQuC4Bku", name: "Lily", gender: "female" },
  { id: "TX3LPaxmHKxFdv7VOQHJ", name: "Liam", gender: "male" },
  { id: "iP95p4xoKVk53GoZ742B", name: "Chris", gender: "male" },
];

const VoiceControls: React.FC<VoiceControlsProps> = ({
  settings,
  onUpdate,
  apiKey,
  onApiKeyChange,
  captionText,
  onCaptionTimeUpdate,
  onPlayingChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [captionTimings, setCaptionTimings] = useState<{start: number; end: number; text: string}[]>([]);
  const [currentCaptionIndex, setCurrentCaptionIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastCaptionTextRef = useRef<string>('');
  
  const updateSettings = (newSettings: Partial<VoiceSettings>) => {
    onUpdate({ ...settings, ...newSettings });
  };

  useEffect(() => {
    // Create audio element if it doesn't exist
    if (!audioRef.current) {
      audioRef.current = new Audio();
      
      // Add event listeners
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleAudioEnded);
      audioRef.current.addEventListener('play', handleAudioPlay);
      audioRef.current.addEventListener('pause', handleAudioPause);
    }
    
    // Listen for external play/pause toggle events
    const handleTogglePlayback = () => {
      togglePlayPause();
    };
    
    document.addEventListener('toggle-audio-playback', handleTogglePlayback);
    
    return () => {
      // Clean up event listeners when component unmounts
      if (audioRef.current) {
        audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
        audioRef.current.removeEventListener('ended', handleAudioEnded);
        audioRef.current.removeEventListener('play', handleAudioPlay);
        audioRef.current.removeEventListener('pause', handleAudioPause);
        audioRef.current.pause();
      }
      document.removeEventListener('toggle-audio-playback', handleTogglePlayback);
    };
  }, []);

  // Handle audio play event
  const handleAudioPlay = () => {
    console.log("Audio started playing");
    setIsPlaying(true);
    if (onPlayingChange) {
      onPlayingChange(true);
    }
  };
  
  // Handle audio pause event
  const handleAudioPause = () => {
    console.log("Audio paused");
    setIsPlaying(false);
    if (onPlayingChange) {
      onPlayingChange(false);
    }
  };

  // Update audio URL when it changes
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
      console.log("Audio URL updated:", audioUrl);
    }
  }, [audioUrl]);

  // Function to split text into optimal subtitle segments
  const splitTextIntoSegments = (text: string): string[] => {
    if (!text) return [];
    
    // Split text into words
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const segments: string[] = [];
    
    // Group words into segments of 2-3 words each
    for (let i = 0; i < words.length; i += 3) {
      const segmentWords = words.slice(i, i + 3);
      if (segmentWords.length > 0) {
        segments.push(segmentWords.join(' '));
      }
    }
    
    return segments;
  };

  // Improved function to generate frame-accurate subtitle timings
  const generateSubtitleTimings = (text: string, durationEstimate: number) => {
    if (!text) return [];
    
    console.log("Generating subtitle timings for:", text);
    console.log("Estimated duration:", durationEstimate);
    
    // Split text into segments (2-3 words per segment)
    const segments = splitTextIntoSegments(text);
    console.log("Text segments:", segments);
    
    const timings: {start: number; end: number; text: string}[] = [];
    
    // Calculate time per segment
    const timePerSegment = durationEstimate / segments.length;
    
    // Generate timing for each segment
    segments.forEach((segment, index) => {
      const start = index * timePerSegment;
      const end = (index + 1) * timePerSegment;
      
      timings.push({
        start,
        end,
        text: segment
      });
    });
    
    console.log("Generated timings:", timings);
    return timings;
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || captionTimings.length === 0) return;
    
    const currentTime = audioRef.current.currentTime;
    
    // Find the current caption based on timestamp
    for (let i = 0; i < captionTimings.length; i++) {
      const timing = captionTimings[i];
      if (currentTime >= timing.start && currentTime <= timing.end) {
        if (lastCaptionTextRef.current !== timing.text) {
          setCurrentCaptionIndex(i);
          lastCaptionTextRef.current = timing.text;
          
          console.log(`Caption at ${currentTime.toFixed(2)}s:`, timing.text);
          
          // Call the callback to update the caption in the parent component
          if (onCaptionTimeUpdate) {
            onCaptionTimeUpdate(currentTime, timing.text);
          }
        }
        return;
      }
    }
    
    // If we're between captions or after all captions, clear the text
    if (lastCaptionTextRef.current && currentTime > 0) {
      lastCaptionTextRef.current = '';
      
      // Callback to clear captions in parent
      if (onCaptionTimeUpdate) {
        onCaptionTimeUpdate(currentTime, "");
      }
    }
  };

  const handleAudioEnded = () => {
    console.log("Audio playback ended");
    setIsPlaying(false);
    if (onPlayingChange) {
      onPlayingChange(false);
    }
    
    // Reset current caption index
    setCurrentCaptionIndex(0);
    lastCaptionTextRef.current = '';
    
    // Callback to reset captions in parent
    if (onCaptionTimeUpdate) {
      onCaptionTimeUpdate(0, "");
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) {
      console.log("Cannot toggle play/pause: No audio loaded");
      return;
    }
    
    if (isPlaying) {
      console.log("Pausing audio playback");
      audioRef.current.pause();
    } else {
      console.log("Starting audio playback");
      audioRef.current.play().catch(error => {
        console.error("Error playing audio:", error);
        toast.error("Failed to play audio. Please try again.");
      });
    }
  };

  const playPreview = async () => {
    if (!apiKey) {
      toast.error("Please enter your ElevenLabs API key");
      return;
    }

    // If we already have audio loaded, just toggle play/pause
    if (audioUrl && audioRef.current) {
      togglePlayPause();
      return;
    }

    setIsLoading(true);

    try {
      const selectedVoice = VOICE_OPTIONS.find(v => v.id === settings.voiceId);
      const textToVoice = captionText || "This is a sample voice preview. Adjust the settings to customize how your captions will sound.";
      
      // Clear previous URL if exists
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
        setAudioUrl(null);
      }
      
      console.log("Generating speech with ElevenLabs API...");
      console.log("Voice ID:", settings.voiceId);
      console.log("Speed:", settings.speed);
      console.log("Pitch:", settings.pitch);
      console.log("Text to convert:", textToVoice);
      
      const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + settings.voiceId, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": apiKey
        },
        body: JSON.stringify({
          text: textToVoice,
          model_id: "eleven_monolingual_v1",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.0,
            use_speaker_boost: true,
            speaking_rate: settings.speed,
            pitch: settings.pitch / 100 // ElevenLabs uses -1 to 1 range
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail?.message || `API error: ${response.status}`);
      }

      // Get blob from response
      const audioBlob = await response.blob();
      const newAudioUrl = URL.createObjectURL(audioBlob);
      setAudioUrl(newAudioUrl);
      
      // Get approximate duration from blob size (rough estimate)
      const estimatedDuration = (audioBlob.size / 32000) * settings.speed; // rough estimate based on 32kbps audio
      console.log("Estimated audio duration:", estimatedDuration, "seconds");
      
      // Generate timings for frame-accurate subtitles
      const timings = generateSubtitleTimings(textToVoice, estimatedDuration);
      setCaptionTimings(timings);
      setCurrentCaptionIndex(0);
      lastCaptionTextRef.current = '';
      
      // Set up audio element
      if (audioRef.current) {
        audioRef.current.src = newAudioUrl;
        
        // Play the audio
        toast.success(`Playing preview with ${selectedVoice?.name || 'selected voice'}`);
        await audioRef.current.play();
      }
      
    } catch (error) {
      console.error("Error playing voice preview:", error);
      toast.error(error instanceof Error ? error.message : "Failed to play voice preview");
      setIsPlaying(false);
      if (onPlayingChange) {
        onPlayingChange(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ speed: parseFloat(e.target.value) });
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ pitch: parseFloat(e.target.value) });
  };

  // Display current caption timing info for debugging
  const currentCaption = captionTimings[currentCaptionIndex];

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="space-y-2">
        <label htmlFor="elevenlabs-api-key" className="text-sm font-medium">
          ElevenLabs API Key
        </label>
        <div className="relative">
          <input
            id="elevenlabs-api-key"
            type={showApiKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => onApiKeyChange(e.target.value)}
            placeholder="Enter your ElevenLabs API key"
            className="input-field pr-10"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground hover:text-foreground"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              {showApiKey ? (
                <>
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                  <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                  <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                  <line x1="2" x2="22" y1="2" y2="22" />
                </>
              )}
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Your API key is used only for voice generation and is not stored on our servers
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="voice-select" className="text-sm font-medium">
          Voice
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {VOICE_OPTIONS.map((voice) => (
            <button
              key={voice.id}
              type="button"
              onClick={() => updateSettings({ voiceId: voice.id })}
              className={`flex items-center justify-between rounded-md border p-3 text-sm transition-all 
                ${settings.voiceId === voice.id 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-input"}`}
            >
              <div className="flex items-center">
                <span className="mr-2 h-2 w-2 rounded-full bg-primary/60"></span>
                <span>{voice.name}</span>
              </div>
              <span className="text-xs text-muted-foreground capitalize">{voice.gender}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4 pt-2">
        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="speed-range" className="text-sm font-medium">
              Speed
            </label>
            <span className="text-xs text-muted-foreground">{settings.speed.toFixed(1)}x</span>
          </div>
          <input
            id="speed-range"
            type="range"
            min="0.8"
            max="1.5"
            step="0.1"
            value={settings.speed}
            onChange={handleSpeedChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Slower (0.8x)</span>
            <span>Faster (1.5x)</span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label htmlFor="pitch-range" className="text-sm font-medium">
              Pitch
            </label>
            <span className="text-xs text-muted-foreground">
              {settings.pitch > 0 ? `+${settings.pitch}` : settings.pitch}%
            </span>
          </div>
          <input
            id="pitch-range"
            type="range"
            min="-20"
            max="20"
            step="1"
            value={settings.pitch}
            onChange={handlePitchChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Lower (-20%)</span>
            <span>Higher (+20%)</span>
          </div>
        </div>
      </div>

      {/* Add audio player UI when audio is available */}
      {audioUrl && (
        <div className="pt-2 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Audio Preview</div>
            <div className="text-xs text-muted-foreground">
              {audioRef.current ? 
                `${Math.floor(audioRef.current.currentTime)}s / ${Math.floor(audioRef.current.duration || 0)}s` : 
                "0s / 0s"}
            </div>
          </div>
          
          <div className="mt-2 px-2">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all" 
                style={{ 
                  width: `${audioRef.current ? 
                    (audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100 : 0}%` 
                }}
              ></div>
            </div>
          </div>
          
          <div className="flex justify-center mt-3">
            <button
              type="button"
              onClick={togglePlayPause}
              className="rounded-full bg-primary p-2 text-primary-foreground hover:bg-primary/90"
            >
              {isPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Current caption display */}
          <div className="mt-3 p-2 bg-muted/30 rounded-md text-sm text-center">
            {currentCaption ? currentCaption.text : "No captions available"}
          </div>
          
          {/* Debug info */}
          <div className="mt-2 text-xs text-muted-foreground">
            <p>Total segments: {captionTimings.length}</p>
            <p>Current segment: {currentCaptionIndex + 1} of {captionTimings.length}</p>
          </div>
        </div>
      )}

      <div className="pt-2">
        <button
          type="button"
          onClick={playPreview}
          disabled={isLoading || !apiKey}
          className={`btn-primary w-full flex items-center justify-center ${
            isLoading ? "opacity-80" : ""
          }`}
        >
          {isLoading ? (
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-primary-foreground"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          ) : audioUrl ? (
            <>
              {isPlaying ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="mr-2 h-4 w-4"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
              {isPlaying ? "Pause Preview" : "Play Preview"}
            </>
          ) : (
            <>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mr-2 h-4 w-4"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Generate Voice Preview
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default VoiceControls;
