
import React, { useState, useRef } from "react";
import { VoiceOption, VoiceSettings } from "@/lib/types";
import { toast } from "sonner";

interface VoiceControlsProps {
  settings: VoiceSettings;
  onUpdate: (settings: VoiceSettings) => void;
  apiKey: string;
  onApiKeyChange: (key: string) => void;
  captionText?: string;
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
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const captionTimingsRef = useRef<{start: number; end: number; text: string}[]>([]);
  const currentCaptionIndexRef = useRef<number>(0);
  
  const updateSettings = (newSettings: Partial<VoiceSettings>) => {
    onUpdate({ ...settings, ...newSettings });
  };

  const generateSentenceTimings = (text: string, durationEstimate: number) => {
    if (!text) return [];
    
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const timings: {start: number; end: number; text: string}[] = [];
    
    let currentTime = 0;
    const avgSentenceDuration = durationEstimate / sentences.length;
    
    sentences.forEach((sentence, index) => {
      const trimmedSentence = sentence.trim();
      if (!trimmedSentence) return;
      
      // Estimate duration based on word count and character length
      const wordCount = trimmedSentence.split(/\s+/).length;
      const charCount = trimmedSentence.length;
      
      // Simple duration estimation algorithm
      const sentenceDuration = (wordCount * 0.5 + charCount * 0.05) * 
                              (settings.speed ? 1/settings.speed : 1);
      
      // Ensure a minimum duration and adjust based on available total time
      const duration = Math.max(0.8, Math.min(sentenceDuration, avgSentenceDuration * 1.5));
      
      timings.push({
        start: currentTime,
        end: currentTime + duration,
        text: trimmedSentence
      });
      
      currentTime += duration;
    });
    
    return timings;
  };

  const playPreview = async () => {
    if (!apiKey) {
      toast.error("Please enter your ElevenLabs API key");
      return;
    }

    if (isPlaying && audioRef.current) {
      // Stop playing if already playing
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    setIsPlaying(true);

    try {
      const selectedVoice = VOICE_OPTIONS.find(v => v.id === settings.voiceId);
      const textToVoice = captionText || "This is a sample voice preview. Adjust the settings to customize how your captions will sound.";
      
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
      const audioUrl = URL.createObjectURL(audioBlob);
      
      // Get approximate duration from blob size (rough estimate)
      const estimatedDuration = (audioBlob.size / 32000) * settings.speed; // rough estimate based on 32kbps audio
      
      // Generate timings for sentence-by-sentence display
      captionTimingsRef.current = generateSentenceTimings(textToVoice, estimatedDuration);
      currentCaptionIndexRef.current = 0;
      
      // Create or update audio element
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      
      audioRef.current.src = audioUrl;
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('ended', handleAudioEnded);
      
      toast.success(`Playing preview with ${selectedVoice?.name || 'selected voice'}`);
      
      // Play the audio
      await audioRef.current.play();
      
    } catch (error) {
      console.error("Error playing voice preview:", error);
      toast.error(error instanceof Error ? error.message : "Failed to play voice preview");
      setIsPlaying(false);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTimeUpdate = () => {
    if (!audioRef.current || captionTimingsRef.current.length === 0) return;
    
    const currentTime = audioRef.current.currentTime;
    const timings = captionTimingsRef.current;
    
    // Find the current caption based on timestamp
    for (let i = 0; i < timings.length; i++) {
      if (currentTime >= timings[i].start && currentTime <= timings[i].end) {
        if (currentCaptionIndexRef.current !== i) {
          currentCaptionIndexRef.current = i;
          // Here you would update the visible caption
          // This is where you'd dispatch an event or call a callback to update the UI
          console.log("Current caption:", timings[i].text);
          
          // In a complete implementation, you'd pass this to a state update or callback
          // that would update the visible caption in the Preview component
        }
        return;
      }
    }
  };
  
  const handleAudioEnded = () => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.removeEventListener('ended', handleAudioEnded);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ speed: parseFloat(e.target.value) });
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ pitch: parseFloat(e.target.value) });
  };

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
          ) : isPlaying ? (
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
          {isLoading ? "Loading..." : isPlaying ? "Stop Preview" : "Play Voice Preview"}
        </button>
      </div>
    </div>
  );
};

export default VoiceControls;
