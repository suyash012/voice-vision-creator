
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // Process only the first file for simplicity
    const file = acceptedFiles[0];
    if (!file) return;

    setIsUploading(true);

    try {
      // Validate file type
      const fileType = file.type.split('/')[0] as MediaType;
      if (fileType !== 'image' && fileType !== 'video') {
        toast.error('Only images and videos are supported');
        return;
      }

      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File size exceeds the maximum limit of ${maxSize / (1024 * 1024)}MB`);
        return;
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
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          mediaItem.duration = video.duration;
          
          // Create thumbnail (simplified version)
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
              setIsUploading(false);
            }
          };
        };
        
        video.src = mediaItem.url;
      } else {
        // For images, just create a thumbnail from the image itself
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
            setIsUploading(false);
          }
        };
        img.src = mediaItem.url;
      }
    } catch (error) {
      toast.error('Failed to process media');
      console.error('Media upload error:', error);
      setIsUploading(false);
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
    multiple: false,
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
            <div className="h-full w-1/2 animate-pulse-subtle rounded-full bg-primary"></div>
          </div>
          <p className="text-sm text-muted-foreground">Processing...</p>
        </div>
      ) : (
        <>
          <h3 className="mb-2 text-base font-medium">Drop media here or click to browse</h3>
          <p className="text-sm text-muted-foreground">
            Supports JPG, PNG, WebP, MP4, WebM up to 50MB
          </p>
        </>
      )}
    </div>
  );
};

export default MediaUpload;
