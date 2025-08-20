// src/components/ui/FileUpload.tsx
'use client';

import { cn } from '@/lib/utils';
import { FileText, Image, Upload, X } from 'lucide-react';
import React, { useRef, useState } from 'react';

// กำหนด type ภายในไฟล์ (ไม่ต้อง import จาก storage)
export interface UploadProgress {
  progress: number;
  error?: string;
}

export interface FileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  uploading?: boolean;
  progress?: UploadProgress;
  preview?: string[];
  onFilesSelected?: (files: File[]) => void;
  onRemove?: (index: number) => void;
  className?: string;
  type?: 'image' | 'document';
}

export function FileUpload({
  accept = 'image/*',
  multiple = false,
  maxFiles = 1,
  maxSize = 3.5 * 1024 * 1024,
  disabled = false,
  uploading = false,
  progress,
  preview = [],
  onFilesSelected,
  onRemove,
  className,
  type = 'image',
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || uploading) return;

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = (files: File[]) => {
    const validFiles = files.slice(0, maxFiles).filter(file => {
      if (type === 'image' && !file.type.startsWith('image/')) return false;
      if (type === 'document' && file.type !== 'application/pdf') return false;
      if (file.size > maxSize) return false;
      return true;
    });

    if (validFiles.length > 0) {
      onFilesSelected?.(validFiles);
    }
  };

  const Icon = type === 'image' ? Image : FileText;

  return (
    <div className={cn('space-y-4', className)}>
      <div
        className={cn(
          'relative rounded-xl border-2 border-dashed p-8 text-center transition-colors',
          dragActive && 'border-primary bg-primary/5',
          disabled || uploading
            ? 'cursor-not-allowed opacity-50'
            : 'cursor-pointer hover:border-primary/50',
          'dark:border-gray-600 dark:hover:border-primary/50'
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && !uploading && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
          disabled={disabled || uploading}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className="rounded-full bg-primary/10 p-4">
            {uploading ? (
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            ) : (
              <Upload className="h-8 w-8 text-primary" />
            )}
          </div>

          <div>
            <p className="text-sm font-medium">
              {uploading
                ? `กำลังอัพโหลด... ${progress?.progress?.toFixed?.(0) ?? 0}%`
                : dragActive
                  ? 'วางไฟล์ที่นี่'
                  : `คลิกหรือลากไฟล์มาที่นี่`}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {type === 'image'
                ? `รูปภาพ (สูงสุด ${(maxSize / 1024 / 1024).toFixed(1)} MB)`
                : `PDF เท่านั้น (สูงสุด ${(maxSize / 1024 / 1024).toFixed(1)} MB)`}
              {multiple && ` • สูงสุด ${maxFiles} ไฟล์`}
            </p>
          </div>
        </div>

        {progress?.error && (
          <p className="mt-2 text-xs text-destructive">{progress.error}</p>
        )}
      </div>

      {preview.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {preview.map((url, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-lg border bg-card"
            >
              {type === 'image' ? (
                <img
                  src={url}
                  alt={`Preview ${index + 1}`}
                  className="h-32 w-full object-cover"
                />
              ) : (
                <div className="flex h-32 items-center justify-center">
                  <FileText className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              {onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute right-1 top-1 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
