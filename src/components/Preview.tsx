
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
}

const Preview: React.FC<PreviewProps> = ({ 
  media, 
  captions, 
  videoConfig, 
  currentTime,
  activeCaptionText
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

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
    // Simplified logic - in a real app would need to account for media durations
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

  // Build caption style based on settings
  const captionStyle = {
    fontFamily: captions.font,
    fontSize: `${captions.fontSize}px`,
    color: captions.color,
    opacity: captions.opacity / 100,
    fontWeight: captions.textStyle.bold ? "bold" : "normal",
    fontStyle: captions.textStyle.italic ? "italic" : "normal",
  };

  // Determine position class for caption
  const captionPositionClass = {
    top: "top-4",
    middle: "top-1/2 -translate-y-1/2",
    bottom: "bottom-4",
  }[captions.position];

  // Determine which caption text to display - either active caption from TTS or the full caption
  const displayText = activeCaptionText || captions.text;

  return (
    <div ref={containerRef} className="glass-panel w-full overflow-hidden">
      <div 
        className="relative bg-black/30"
        style={{ 
          width: `${containerSize.width}px`, 
          height: `${containerSize.height}px`,
          margin: "0 auto"
        }}
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
        {displayText && (
          <div
            className={`absolute inset-x-0 px-4 text-center ${captionPositionClass}`}
          >
            <div 
              className="inline-block max-w-[90%] bg-black/40 backdrop-blur-sm px-3 py-2 rounded-md"
              style={captionStyle}
            >
              {displayText}
            </div>
          </div>
        )}

        {/* Resolution and FPS indicator */}
        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white/80 text-xs px-2 py-1 rounded">
          {videoConfig.resolution} • {videoConfig.frameRate}fps
        </div>
        
        {/* Timeline indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className="h-full bg-primary transition-all" 
            style={{ 
              width: media.length ? 
                `${(currentMediaIndex + (currentTime % 5) / 5) / media.length * 100}%` : 
                '0%' 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default Preview;
