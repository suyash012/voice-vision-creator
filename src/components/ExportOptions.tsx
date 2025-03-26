
import React, { useState } from "react";
import { ExportConfig, VideoConfig } from "@/lib/types";
import { toast } from "sonner";

interface ExportOptionsProps {
  config: ExportConfig;
  videoConfig: VideoConfig;
  onConfigChange: (config: ExportConfig) => void;
  onExport: () => void;
  processingProgress: number;
  isProcessing: boolean;
  totalMediaDuration: number;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  config,
  videoConfig,
  onConfigChange,
  onExport,
  processingProgress,
  isProcessing,
  totalMediaDuration,
}) => {
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  const updateConfig = (newConfig: Partial<ExportConfig>) => {
    onConfigChange({ ...config, ...newConfig });
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" + secs : secs}`;
  };
  
  const estimateFileSize = (): string => {
    // Very rough file size estimation based on resolution, duration and quality
    const resolutionFactor = 
      videoConfig.resolution === "4K" ? 8 : 
      videoConfig.resolution === "1080p" ? 2 : 1;
      
    const qualityFactor = 
      config.quality === "high" ? 1.8 :
      config.quality === "standard" ? 1 : 0.7;
      
    // Base bitrate: ~2 MB per minute at 720p standard quality
    const baseSizeMBPerMinute = 2; 
    
    const estimatedSizeMB = (
      totalMediaDuration / 60 * 
      baseSizeMBPerMinute * 
      resolutionFactor * 
      qualityFactor
    );
    
    return estimatedSizeMB < 1 
      ? `${Math.round(estimatedSizeMB * 1000)} KB` 
      : `${estimatedSizeMB.toFixed(1)} MB`;
  };

  const handleDownload = () => {
    // Create a sample video URL for demonstration purposes
    // In a real app, this would be the URL of the generated video
    const dummyVideoUrl = URL.createObjectURL(new Blob([], { type: 'video/mp4' }));
    
    // Create a download link
    const a = document.createElement('a');
    a.href = dummyVideoUrl;
    a.download = `faceless-video-${Date.now()}.${config.format}`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(dummyVideoUrl);
    
    toast.success("Video downloaded successfully!");
    setShowDownloadOptions(false);
  };

  return (
    <div className="glass-panel p-5 space-y-4">
      <h3 className="text-base font-medium">Export Options</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="format-select" className="text-sm font-medium">
            Format
          </label>
          <select
            id="format-select"
            value={config.format}
            onChange={(e) => updateConfig({ format: e.target.value as any })}
            className="input-field"
          >
            <option value="mp4">MP4</option>
            <option value="webm">WebM</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="quality-select" className="text-sm font-medium">
            Quality
          </label>
          <select
            id="quality-select"
            value={config.quality}
            onChange={(e) => updateConfig({ quality: e.target.value as any })}
            className="input-field"
          >
            <option value="draft">Draft (Faster)</option>
            <option value="standard">Standard</option>
            <option value="high">High Quality (Slower)</option>
          </select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-2">
        <div>
          <div className="text-sm text-muted-foreground">Resolution</div>
          <div className="font-medium">{videoConfig.resolution}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Duration</div>
          <div className="font-medium">{formatDuration(totalMediaDuration)}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Format</div>
          <div className="font-medium uppercase">{config.format}</div>
        </div>
        <div>
          <div className="text-sm text-muted-foreground">Est. Size</div>
          <div className="font-medium">{estimateFileSize()}</div>
        </div>
      </div>
      
      {isProcessing ? (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Processing video...</span>
            <span>{processingProgress}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all" 
              style={{ width: `${processingProgress}%` }}
            ></div>
          </div>
          
          {processingProgress === 100 && (
            <div className="pt-2">
              <button 
                type="button" 
                onClick={() => setShowDownloadOptions(true)}
                className="btn-primary w-full"
              >
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
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Download Video
              </button>
              
              {showDownloadOptions && (
                <div className="mt-3 p-3 bg-card rounded-md border">
                  <div className="mb-2 text-sm font-medium">Download options</div>
                  <div className="grid grid-cols-1 gap-2">
                    <button 
                      type="button" 
                      onClick={handleDownload}
                      className="btn-accent flex justify-between items-center"
                    >
                      <span>Video with captions (MP4)</span>
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
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <button 
          type="button" 
          onClick={onExport} 
          className="btn-primary w-full mt-2"
          disabled={totalMediaDuration === 0}
        >
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
            <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
            <path d="M12 12v9" />
            <path d="m8 17 4 4 4-4" />
          </svg>
          Generate Video
        </button>
      )}
      
      <div className="text-xs text-muted-foreground text-center pt-1">
        {isProcessing 
          ? "This may take a few minutes depending on video length and quality" 
          : "Make sure to add media and captions before exporting"}
      </div>
    </div>
  );
};

export default ExportOptions;
