
import React, { useRef, useEffect, useState } from "react";
import { 
  MediaItem, 
  CaptionSettings, 
  VideoConfig,
  AspectRatio 
} from "@/lib/types";

interface PreviewProps {
  media: MediaItem[];
  captions: CaptionSettings;
  videoConfig: VideoConfig;
  currentTime: number;
  activeCaptionText?: string;
  isPlayingAudio?: boolean;
  onTimeUpdate?: (time: number) => void;
  onPlayPauseToggle?: () => void;
}

const Preview: React.FC<PreviewProps> = ({ 
  media, 
  captions, 
  videoConfig, 
  currentTime,
  activeCaptionText,
  isPlayingAudio = false,
  onTimeUpdate,
  onPlayPauseToggle
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  
  // Calculate aspect ratio dimensions
  const getAspectRatioDimensions = (ratio: AspectRatio, containerWidth: number): { width: number, height: number } => {
    switch (ratio) {
      case "16:9":
        return { width: containerWidth, height: containerWidth * (9/16) };
      case "9:16":
        return { width: containerWidth, height: containerWidth * (16/9) };
      case "1:1":
        return { width: containerWidth, height: containerWidth };
      default:
        return { width: containerWidth, height: containerWidth * (9/16) };
    }
  };

  // Update container size on resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setContainerSize(getAspectRatioDimensions(videoConfig.aspectRatio, width));
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    
    return () => window.removeEventListener("resize", updateSize);
  }, [videoConfig.aspectRatio]);

  // Update current media based on time
  useEffect(() => {
    if (media.length > 0) {
      const mediaDuration = 5; // Assuming 5 seconds per media item for demo
      const totalDuration = media.length * mediaDuration;
      
      // Loop the preview if we're past the total duration
      const normalizedTime = totalDuration > 0 ? currentTime % totalDuration : 0;
      
      // Calculate which media item to show
      const index = Math.floor(normalizedTime / mediaDuration);
      setCurrentMediaIndex(Math.min(index, media.length - 1));
    }
  }, [currentTime, media]);

  // Get current media to display
  const currentMedia = media.length > 0 ? media[currentMediaIndex] : null;

  // Format caption text for optimal readability
  const formatCaptionText = (text: string | undefined): string[] => {
    if (!text || text.trim() === '') return [];
    
    // Split into lines for better readability (max 42 chars per line)
    const MAX_CHARS_PER_LINE = 42;
    let lines: string[] = [];
    let words = text.split(' ');
    let currentLine = '';
    
    words.forEach(word => {
      // Check if adding this word would exceed the max line length
      if ((currentLine + ' ' + word).length <= MAX_CHARS_PER_LINE) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        // If the line would be too long, push the current line and start a new one
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    });
    
    // Add the last line if it exists
    if (currentLine) lines.push(currentLine);
    
    // Return at most 2 lines
    return lines.slice(0, 2);
  };

  // Format caption lines for display
  const captionLines = formatCaptionText(activeCaptionText);

  // Build caption style based on settings
  const captionStyle = {
    fontFamily: captions.font,
    fontSize: `${captions.fontSize}px`,
    color: captions.color,
    opacity: captions.opacity / 100,
    fontWeight: captions.textStyle.bold ? "bold" : "normal",
    fontStyle: captions.textStyle.italic ? "italic" : "normal",
    textShadow: "0px 1px 2px rgba(0,0,0,0.8)", // Add text shadow for better readability
    lineHeight: 1.3,
  };

  // Determine position class for caption
  const captionPositionClass = {
    top: "top-4",
    middle: "top-1/2 -translate-y-1/2",
    bottom: "bottom-4",
  }[captions.position];

  // Handle play/pause click
  const handlePlayPauseClick = () => {
    if (onPlayPauseToggle) {
      onPlayPauseToggle();
    }
  };

  // Calculate total duration and progress
  const totalDuration = media.length * 5; // 5 seconds per media
  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div ref={containerRef} className="glass-panel w-full overflow-hidden">
      <div 
        className="relative bg-black/30"
        style={{ 
          width: `${containerSize.width}px`, 
          height: `${containerSize.height}px`,
          margin: "0 auto"
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {media.length === 0 ? (
          <div className="flex h-full w-full items-center justify-center">
            <div className="text-center text-muted-foreground">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="mx-auto h-12 w-12 mb-2 text-muted-foreground/50"
              >
                <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L8 12l-4.3 4.2c-.4.4-.5.9-.3 1.3l.3.5c.2.4.6.6 1.1.5L13 16l7.3 3.5c.5.2 1 .1 1.4-.3l.5-.5c.4-.4.5-.9.3-1.3-.1.1-.1.1-.2.1z" />
              </svg>
              <p>Upload media to see preview</p>
            </div>
          </div>
        ) : currentMedia?.type === "video" ? (
          <video
            src={currentMedia.url}
            className="h-full w-full object-cover"
            autoPlay
            loop
            muted
          />
        ) : (
          <img
            src={currentMedia?.url}
            alt="Preview"
            className="h-full w-full object-cover"
          />
        )}
        
        {/* Caption overlay */}
        {captionLines.length > 0 && (
          <div
            className={`absolute inset-x-0 px-4 text-center ${captionPositionClass} z-10`}
          >
            <div 
              className="inline-block max-w-[90%] bg-black/40 backdrop-blur-sm px-3 py-2 rounded-md"
              style={captionStyle}
            >
              {captionLines.map((line, index) => (
                <div key={index} className="subtitle-line">
                  {line}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution and FPS indicator */}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-xs px-2 py-1 rounded">
          {videoConfig.resolution} • {videoConfig.frameRate}fps
        </div>
        
        {/* Play/Pause button overlay (visible on hover or when audio is playing) */}
        {(isHovering || isPlayingAudio) && media.length > 0 && (
          <button
            onClick={handlePlayPauseClick}
            className="absolute inset-0 m-auto w-14 h-14 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 transition-all"
            style={{ width: '60px', height: '60px' }}
          >
            {isPlayingAudio ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
              >
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
              >
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>
        )}
        
        {/* Timeline indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-black/20">
          <div 
            className="h-full bg-primary transition-all" 
            style={{ width: `${progress}%` }}
          ></div>
        </div>
        
        {/* Timeline markers */}
        <div className="absolute bottom-0 left-0 right-0 h-2">
          {media.map((_, index) => (
            <div 
              key={index}
              className="absolute top-0 bottom-0 w-px bg-white/30"
              style={{ left: `${(index / media.length) * 100}%` }}
            />
          ))}
        </div>
      </div>
      
      {/* Caption debugging information */}
      {isPlayingAudio && (
        <div className="mt-2 px-2 py-1 text-xs bg-muted/30 rounded-md">
          <p className="font-medium">Current caption: {activeCaptionText || 'None'}</p>
          <p>Time: {currentTime.toFixed(2)}s</p>
        </div>
      )}
    </div>
  );
};

export default Preview;
