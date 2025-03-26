
import React, { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { MediaItem, MediaType } from "@/lib/types";
import { v4 as uuidv4 } from 'uuid';

interface MediaUploadProps {
  onMediaAdded: (newMedia: MediaItem) => void;
  maxSize?: number; // in bytes
}

const MediaUpload: React.FC<MediaUploadProps> = ({ 
  onMediaAdded, 
  maxSize = 50 * 1024 * 1024 // 50MB default
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setIsUploading(true);
    setProcessedCount(0);
    setTotalFiles(acceptedFiles.length);

    for (const file of acceptedFiles) {
      try {
        // Validate file type
        const fileType = file.type.split('/')[0] as MediaType;
        if (fileType !== 'image' && fileType !== 'video') {
          toast.error(`File ${file.name}: Only images and videos are supported`);
          continue;
        }

        // Validate file size
        if (file.size > maxSize) {
          toast.error(`File ${file.name}: Exceeds the maximum limit of ${maxSize / (1024 * 1024)}MB`);
          continue;
        }

        // Create media item
        const mediaItem: MediaItem = {
          id: uuidv4(),
          type: fileType,
          file,
          url: URL.createObjectURL(file),
        };

        // If it's a video, get duration and create thumbnail
        if (fileType === 'video') {
          await new Promise<void>((resolve) => {
            const video = document.createElement('video');
            video.preload = 'metadata';
            
            video.onloadedmetadata = () => {
              mediaItem.duration = video.duration;
              
              // Create thumbnail
              const canvas = document.createElement('canvas');
              canvas.width = 160;
              canvas.height = 90;
              video.currentTime = 1; // Seek to 1 second
              
              video.onseeked = () => {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                  mediaItem.thumbnail = canvas.toDataURL();
                  onMediaAdded(mediaItem);
                  setProcessedCount(prev => prev + 1);
                  resolve();
                }
              };
            };
            
            video.onerror = () => {
              toast.error(`Failed to process video: ${file.name}`);
              resolve();
            };
            
            video.src = mediaItem.url;
          });
        } else {
          // For images, create a thumbnail from the image itself
          await new Promise<void>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const canvas = document.createElement('canvas');
              canvas.width = 160;
              canvas.height = 90;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                mediaItem.thumbnail = canvas.toDataURL();
                onMediaAdded(mediaItem);
                setProcessedCount(prev => prev + 1);
                resolve();
              }
            };
            
            img.onerror = () => {
              toast.error(`Failed to process image: ${file.name}`);
              resolve();
            };
            
            img.src = mediaItem.url;
          });
        }
      } catch (error) {
        toast.error(`Failed to process file: ${file.name}`);
        console.error('Media upload error:', error);
      }
    }
    
    setIsUploading(false);
    if (processedCount > 0) {
      toast.success(`Added ${processedCount} media files`);
    }
  }, [onMediaAdded, maxSize]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'video/mp4': [],
      'video/webm': [],
    },
    maxSize,
    multiple: true, // Allow multiple file selection
  });

  return (
    <div
      {...getRootProps()}
      className={`glass-panel flex flex-col items-center justify-center p-8 text-center transition-all duration-300
        ${isDragActive ? 'border-primary/50 bg-primary/5' : ''}
        ${isUploading ? 'opacity-80' : ''}`}
    >
      <input {...getInputProps()} />
      
      <div className="mb-4 rounded-full bg-secondary/80 p-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-6 w-6 text-primary/80"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
      </div>
      
      {isUploading ? (
        <div className="mb-2 flex flex-col items-center">
          <div className="mb-2 h-1 w-48 overflow-hidden rounded-full bg-secondary">
            <div 
              className="h-full rounded-full bg-primary transition-all" 
              style={{ width: `${(processedCount / totalFiles) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-muted-foreground">
            Processing {processedCount}/{totalFiles} files...
          </p>
        </div>
      ) : (
        <>
          <h3 className="mb-2 text-base font-medium">Drop media here or click to browse</h3>
          <p className="text-sm text-muted-foreground">
            Supports multiple JPG, PNG, WebP, MP4, WebM files up to 50MB each
          </p>
        </>
      )}
    </div>
  );
};

export default MediaUpload;
