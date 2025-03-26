
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
      }
      document.removeEventListener('toggle-audio-playback', handleTogglePlayback);
    };
  }, []);

  // Handle audio play event
  const handleAudioPlay = () => {
    setIsPlaying(true);
    if (onPlayingChange) {
      onPlayingChange(true);
    }
  };
  
  // Handle audio pause event
  const handleAudioPause = () => {
    setIsPlaying(false);
    if (onPlayingChange) {
      onPlayingChange(false);
    }
  };

  // Update audio URL when it changes
  useEffect(() => {
    if (audioUrl && audioRef.current) {
      audioRef.current.src = audioUrl;
    }
  }, [audioUrl]);

  // Function to format text into proper subtitle format
  const formatSubtitleText = (text: string): string => {
    // Trim whitespace
    text = text.trim();
    
    // Limit line length to 42 characters
    const MAX_CHARS_PER_LINE = 42;
    
    if (text.length <= MAX_CHARS_PER_LINE) {
      return text;
    }
    
    // Try to break at natural points (spaces, commas, etc.)
    const breakPoints = [' ', ',', '.', ':', ';', '-', '—'];
    let bestBreakPoint = MAX_CHARS_PER_LINE;
    
    for (let i = MAX_CHARS_PER_LINE; i >= MAX_CHARS_PER_LINE - 10; i--) {
      if (i < text.length && breakPoints.includes(text[i])) {
        bestBreakPoint = i + 1; // Include the space/punctuation in the first line
        break;
      }
    }
    
    // If we can't find a good break point, just break at MAX_CHARS_PER_LINE
    return text.slice(0, bestBreakPoint).trim();
  };

  // Improved function to generate frame-accurate subtitle timings
  const generateSubtitleTimings = (text: string, durationEstimate: number) => {
    if (!text) return [];
    
    // Improved sentence detection regex
    const sentences = text.split(/(?<=[.!?;:])\s+/);
    const timings: {start: number; end: number; text: string}[] = [];
    
    let currentTime = 0;
    const totalTextLength = text.length;
    const AVG_CHARS_PER_SECOND = 15; // Average reading speed
    
    sentences.forEach((sentence, idx) => {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) return;
      
      // Count actual words for more accurate timing
      const words = trimmedSentence.split(/\s+/);
      
      // Process words in groups of 2-3 for subtitle frames
      for (let i = 0; i < words.length; i += 3) {
        const frameWords = words.slice(i, i + 3);
        const subtitleText = frameWords.join(' ');
        
        // Calculate duration based on character count
        const charCount = subtitleText.length;
        const frameDuration = Math.max(0.8, charCount / AVG_CHARS_PER_SECOND);
        
        // Add a small gap between sentence frames
        const isLastFrameInSentence = i + 3 >= words.length;
        const pauseFactor = isLastFrameInSentence ? 1.2 : 1.0;
        
        // Apply speed settings
        const adjustedDuration = (frameDuration * pauseFactor) / (settings.speed || 1);
        
        const formattedText = formatSubtitleText(subtitleText);
        
        timings.push({
          start: currentTime,
          end: currentTime + adjustedDuration,
          text: formattedText
        });
        
        currentTime += adjustedDuration;
      }
      
      // Add a small gap between sentences
      if (idx < sentences.length - 1) {
        currentTime += 0.3 / (settings.speed || 1);
      }
    });
    
    // Adjust timings to match total audio duration
    if (timings.length > 0 && durationEstimate > 0) {
      const scaleFactor = durationEstimate / currentTime;
      return timings.map(timing => ({
        start: timing.start * scaleFactor,
        end: timing.end * scaleFactor,
        text: timing.text
      }));
    }
    
    return timings;
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current || captionTimings.length === 0) return;
    
    const currentTime = audioRef.current.currentTime;
    
    // Find the current caption based on timestamp
    for (let i = 0; i < captionTimings.length; i++) {
      const timing = captionTimings[i];
      if (currentTime >= timing.start && currentTime <= timing.end) {
        if (currentCaptionIndex !== i) {
          setCurrentCaptionIndex(i);
          
          // Call the callback to update the caption in the parent component
          if (onCaptionTimeUpdate) {
            onCaptionTimeUpdate(currentTime, timing.text);
          }
        }
        return;
      }
    }
    
    // If we're between captions, clear the text
    if (onCaptionTimeUpdate && currentTime > 0) {
      onCaptionTimeUpdate(currentTime, "");
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (onPlayingChange) {
      onPlayingChange(false);
    }
    
    // Reset current caption index
    setCurrentCaptionIndex(0);
    
    // Callback to reset captions in parent
    if (onCaptionTimeUpdate) {
      onCaptionTimeUpdate(0, "");
    }
  };

  const togglePlayPause = () => {
    if (!audioRef.current || !audioUrl) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
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
      
      // Generate timings for frame-accurate subtitles
      const timings = generateSubtitleTimings(textToVoice, estimatedDuration);
      setCaptionTimings(timings);
      setCurrentCaptionIndex(0);
      
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
  const currentCaptionText = currentCaption?.text || "";

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
            {currentCaptionText || "No captions available"}
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
