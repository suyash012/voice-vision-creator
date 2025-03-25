
import React, { useState, useEffect, useRef } from "react";
import { CaptionSettings, FontOption, CaptionPosition, TextStyle } from "@/lib/types";

interface TextEditorProps {
  initialSettings: CaptionSettings;
  onChange: (settings: CaptionSettings) => void;
  maxLength?: number;
}

const FONT_OPTIONS: FontOption[] = [
  { name: "Inter", value: "Inter, sans-serif" },
  { name: "Arial", value: "Arial, sans-serif" },
  { name: "Georgia", value: "Georgia, serif" },
  { name: "Courier New", value: "Courier New, monospace" },
  { name: "Verdana", value: "Verdana, sans-serif" },
];

const POSITION_OPTIONS: { label: string; value: CaptionPosition }[] = [
  { label: "Top", value: "top" },
  { label: "Middle", value: "middle" },
  { label: "Bottom", value: "bottom" },
];

const TextEditor: React.FC<TextEditorProps> = ({ 
  initialSettings, 
  onChange, 
  maxLength = 280 
}) => {
  const [settings, setSettings] = useState<CaptionSettings>(initialSettings);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Update the text with character count limitation
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value.slice(0, maxLength);
    updateSettings({ text: newText });
  };

  // Update specific style property
  const updateTextStyle = (property: keyof TextStyle, value: boolean) => {
    updateSettings({ 
      textStyle: { 
        ...settings.textStyle, 
        [property]: value 
      } 
    });
  };

  // Update any caption setting
  const updateSettings = (newSettings: Partial<CaptionSettings>) => {
    const updatedSettings = { ...settings, ...newSettings };
    setSettings(updatedSettings);
    onChange(updatedSettings);
  };

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "auto";
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [settings.text]);

  return (
    <div className="glass-panel p-5 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="caption-text" className="text-sm font-medium">
            Caption Text
          </label>
          <span className="text-xs text-muted-foreground">
            {settings.text.length}/{maxLength}
          </span>
        </div>
        <textarea
          ref={textAreaRef}
          id="caption-text"
          value={settings.text}
          onChange={handleTextChange}
          placeholder="Enter your caption text here..."
          className="input-field min-h-[100px] resize-none"
          maxLength={maxLength}
        />
        <div className="text-xs text-muted-foreground">
          Maximum 3 lines will be displayed at once
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="font-select" className="text-sm font-medium">
            Font
          </label>
          <select
            id="font-select"
            value={settings.font}
            onChange={(e) => updateSettings({ font: e.target.value })}
            className="input-field"
          >
            {FONT_OPTIONS.map((font) => (
              <option key={font.name} value={font.value} style={{ fontFamily: font.value }}>
                {font.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label htmlFor="font-size" className="text-sm font-medium">
            Font Size ({settings.fontSize}px)
          </label>
          <input
            id="font-size"
            type="range"
            min="16"
            max="32"
            value={settings.fontSize}
            onChange={(e) => updateSettings({ fontSize: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="caption-color" className="text-sm font-medium">
            Color
          </label>
          <div className="flex items-center space-x-2">
            <input
              id="caption-color"
              type="color"
              value={settings.color}
              onChange={(e) => updateSettings({ color: e.target.value })}
              className="h-8 w-8 rounded-md cursor-pointer border border-input"
            />
            <input
              type="text"
              value={settings.color}
              onChange={(e) => updateSettings({ color: e.target.value })}
              className="input-field flex-1"
              placeholder="#FFFFFF"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="opacity" className="text-sm font-medium">
            Opacity ({Math.round(settings.opacity)}%)
          </label>
          <input
            id="opacity"
            type="range"
            min="0"
            max="100"
            value={settings.opacity}
            onChange={(e) => updateSettings({ opacity: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Text Style</label>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => updateTextStyle("bold", !settings.textStyle.bold)}
              className={`btn-accent ${settings.textStyle.bold ? "bg-primary text-primary-foreground" : ""}`}
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
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => updateTextStyle("italic", !settings.textStyle.italic)}
              className={`btn-accent ${settings.textStyle.italic ? "bg-primary text-primary-foreground" : ""}`}
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
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Position</label>
          <div className="flex items-center space-x-2">
            {POSITION_OPTIONS.map((pos) => (
              <button
                key={pos.value}
                type="button"
                onClick={() => updateSettings({ position: pos.value })}
                className={`btn-accent flex-1 ${settings.position === pos.value ? "bg-primary text-primary-foreground" : ""}`}
              >
                {pos.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextEditor;
