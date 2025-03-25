
import React, { useState } from "react";
import { MediaItem, TransitionEffect } from "@/lib/types";
import { toast } from "sonner";

interface TimelineProps {
  media: MediaItem[];
  onMediaUpdate: (updatedMedia: MediaItem[]) => void;
  onMediaRemove: (id: string) => void;
  transition: TransitionEffect;
  onTransitionChange: (transition: TransitionEffect) => void;
}

type DragItem = {
  index: number;
  id: string;
  type: string;
};

const TRANSITION_OPTIONS: { label: string; value: TransitionEffect }[] = [
  { label: "Fade", value: "fade" },
  { label: "Slide", value: "slide" },
  { label: "Zoom", value: "zoom" },
  { label: "Wipe", value: "wipe" },
  { label: "None", value: "none" },
];

const Timeline: React.FC<TimelineProps> = ({
  media,
  onMediaUpdate,
  onMediaRemove,
  transition,
  onTransitionChange,
}) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number, id: string) => {
    setDraggedItem({ index, id, type: "mediaItem" });
    e.dataTransfer.effectAllowed = "move";
    
    // For Firefox compatibility
    e.dataTransfer.setData("text/plain", id);
    
    // Add dragging class for styling
    const element = e.currentTarget as HTMLElement;
    element.classList.add("dragging");
  };

  const handleDragEnd = (e: React.DragEvent) => {
    const element = e.currentTarget as HTMLElement;
    element.classList.remove("dragging");
    setDraggedItem(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (!draggedItem) return;
    
    // Reorder the items if needed
    if (draggedItem.index !== index) {
      const newMediaItems = [...media];
      const movedItem = newMediaItems[draggedItem.index];
      
      // Remove item from old position
      newMediaItems.splice(draggedItem.index, 1);
      
      // Insert at new position
      newMediaItems.splice(index, 0, movedItem);
      
      // Update state and dragged item index
      onMediaUpdate(newMediaItems);
      setDraggedItem({ ...draggedItem, index });
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return "00:00";
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium">Media Timeline</h3>
        <div className="flex items-center space-x-2">
          <label htmlFor="transition-select" className="text-sm">
            Transition:
          </label>
          <select
            id="transition-select"
            value={transition}
            onChange={(e) => onTransitionChange(e.target.value as TransitionEffect)}
            className="input-field py-1 text-xs"
          >
            {TRANSITION_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {media.length === 0 ? (
        <div className="flex h-20 items-center justify-center rounded-md border border-dashed border-muted-foreground/20 p-4">
          <p className="text-sm text-muted-foreground">No media added yet. Upload media to start.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {media.map((item, index) => (
            <div
              key={item.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index, item.id)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
              className="media-item flex items-center bg-card p-2 gap-3"
            >
              <div className="flex-shrink-0 relative w-16 h-9 bg-muted rounded overflow-hidden">
                {item.thumbnail ? (
                  <img
                    src={item.thumbnail}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-secondary">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      {item.type === "video" ? (
                        <path d="m22 8-6 4 6 4V8Z M2 8v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
                      ) : (
                        <path d="M5 17h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2Z M15 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z M7 17l3.5-3.5L12 15l3-3 2 2" />
                      )}
                    </svg>
                  </div>
                )}
                
                {/* Duration badge for videos */}
                {item.type === "video" && item.duration && (
                  <div className="absolute bottom-0 right-0 bg-black/70 text-white text-[9px] px-1">
                    {formatDuration(item.duration)}
                  </div>
                )}

                {/* Item type badge */}
                <div className="absolute top-0 left-0 bg-primary/80 text-[8px] text-primary-foreground px-1 py-0.5 rounded-br">
                  {item.type === "video" ? "VIDEO" : "IMAGE"}
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    toast.error("This functionality is not implemented in the demo");
                  }}
                  className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/50 transition-colors"
                  title="Replace"
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
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  onClick={() => onMediaRemove(item.id)}
                  className="text-muted-foreground hover:text-destructive p-1 rounded-md hover:bg-muted/50 transition-colors"
                  title="Delete"
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
                    <path d="M3 6h18" />
                    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                  </svg>
                </button>
                
                <button
                  type="button"
                  className="text-muted-foreground hover:text-foreground cursor-grab p-1 rounded-md hover:bg-muted/50 transition-colors"
                  title="Drag to reorder"
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
                    <circle cx="7" cy="6" r="1" />
                    <circle cx="7" cy="12" r="1" />
                    <circle cx="7" cy="18" r="1" />
                    <circle cx="17" cy="6" r="1" />
                    <circle cx="17" cy="12" r="1" />
                    <circle cx="17" cy="18" r="1" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {media.length > 0 && (
        <div className="mt-2 text-xs text-muted-foreground">
          Drag and drop to reorder • Total items: {media.length}
        </div>
      )}
    </div>
  );
};

export default Timeline;
