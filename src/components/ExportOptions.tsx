
import React, { useState } from "react";
import { ExportConfig, ExportFormat, ExportQuality, VideoConfig } from "@/lib/types";
import { toast } from "sonner";

interface ExportOptionsProps {
  config: ExportConfig;
  videoConfig: VideoConfig;
  onConfigChange: (config: ExportConfig) => void;
  onExport: () => void;
  processingProgress?: number;
  isProcessing: boolean;
  totalMediaDuration?: number;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  config,
  videoConfig,
  onConfigChange,
  onExport,
  processingProgress = 0,
  isProcessing,
  totalMediaDuration = 0,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFormatChange = (format: ExportFormat) => {
    onConfigChange({ ...config, format });
  };

  const handleQualityChange = (quality: ExportQuality) => {
    onConfigChange({ ...config, quality });
  };

  const getEstimatedTime = (): string => {
    // More accurate estimation based on media duration
    let baseTime = totalMediaDuration > 0 ? totalMediaDuration : 20; // seconds
    
    // Adjust for quality
    if (config.quality === "high") baseTime *= 3;
    else if (config.quality === "standard") baseTime *= 1.5;
    
    // Adjust for resolution
    if (videoConfig.resolution === "4K") baseTime *= 4;
    else if (videoConfig.resolution === "1080p") baseTime *= 2;
    
    // Format as mm:ss
    const minutes = Math.floor(baseTime / 60);
    const seconds = Math.floor(baseTime % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const getEstimatedSize = (): string => {
    // Base size calculation on duration and resolution
    const durationFactor = totalMediaDuration > 0 ? totalMediaDuration / 60 : 1;
    let baseSize = 10; // MB per minute for standard quality 720p
    
    // Adjust for resolution
    if (videoConfig.resolution === "4K") baseSize *= 6;
    else if (videoConfig.resolution === "1080p") baseSize *= 2.5;
    
    // Adjust for quality
    if (config.quality === "high") baseSize *= 2;
    else if (config.quality === "draft") baseSize *= 0.5;
    
    const estimatedSize = baseSize * durationFactor;
    
    if (estimatedSize > 1000) {
      return `${(estimatedSize / 1000).toFixed(1)} GB`;
    } else {
      return `${Math.round(estimatedSize)} MB`;
    }
  };

  const downloadVideo = () => {
    // For this demo, we're just downloading a placeholder video
    // In a real app, this would be the actual rendered video
    try {
      // Create a blob URL for a sample video (in production this would be your generated video)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `faceless-video-${timestamp}.${config.format}`;
      
      const a = document.createElement('a');
      a.href = "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4";
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast.success(`Downloaded video: ${filename}`);
    } catch (error) {
      console.error("Error downloading video:", error);
      toast.error("Failed to download video");
    }
  };

  // This would be the actual export handler in a real application
  const handleExport = () => {
    // First call the original export processing function
    onExport();
    
    // When processing is done, trigger the download
    if (processingProgress === 100) {
      downloadVideo();
    }
  };

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">Export Options</h3>
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? "Hide Advanced" : "Show Advanced"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Format</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleFormatChange("mp4")}
              className={`btn-accent flex-1 ${config.format === "mp4" ? "bg-primary text-primary-foreground" : ""}`}
            >
              MP4
            </button>
            <button
              type="button"
              onClick={() => handleFormatChange("webm")}
              className={`btn-accent flex-1 ${config.format === "webm" ? "bg-primary text-primary-foreground" : ""}`}
            >
              WebM
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Quality</label>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => handleQualityChange("draft")}
              className={`btn-accent flex-1 ${config.quality === "draft" ? "bg-primary text-primary-foreground" : ""}`}
            >
              Draft
            </button>
            <button
              type="button"
              onClick={() => handleQualityChange("standard")}
              className={`btn-accent flex-1 ${config.quality === "standard" ? "bg-primary text-primary-foreground" : ""}`}
            >
              Standard
            </button>
            <button
              type="button"
              onClick={() => handleQualityChange("high")}
              className={`btn-accent flex-1 ${config.quality === "high" ? "bg-primary text-primary-foreground" : ""}`}
            >
              High
            </button>
          </div>
        </div>
      </div>

      {showAdvanced && (
        <div className="space-y-3 pt-2 border-t border-border">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Resolution</label>
              <div className="input-field py-1.5 text-sm">{videoConfig.resolution}</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Frame Rate</label>
              <div className="input-field py-1.5 text-sm">{videoConfig.frameRate} fps</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium">Aspect Ratio</label>
              <div className="input-field py-1.5 text-sm">{videoConfig.aspectRatio}</div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Estimated Size</label>
              <div className="input-field py-1.5 text-sm">
                {getEstimatedSize()}
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Output Duration</label>
            <div className="input-field py-1.5 text-sm">
              {totalMediaDuration > 0 ? 
                `${Math.floor(totalMediaDuration / 60)}:${Math.floor(totalMediaDuration % 60).toString().padStart(2, '0')}` : 
                "00:00"}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-sm">Estimated rendering time:</span>
          <span className="text-sm font-medium">{getEstimatedTime()}</span>
        </div>

        <button
          type="button"
          onClick={isProcessing && processingProgress === 100 ? downloadVideo : handleExport}
          disabled={isProcessing && processingProgress < 100}
          className="btn-primary w-full py-3 flex items-center justify-center"
        >
          {isProcessing ? (
            <>
              <svg 
                className="animate-spin -ml-1 mr-2 h-5 w-5 text-primary-foreground" 
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
              {processingProgress === 100 ? (
                "Download Video"
              ) : (
                `Processing: ${processingProgress}%`
              )}
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
                className="mr-2 h-5 w-5"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Generate & Download Video
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ExportOptions;
