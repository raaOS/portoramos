'use client';

interface UploadDropzoneProps {
  isDragOver: boolean;
  disabled: boolean;
  accept: string;
  multiple: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onClick: () => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

export function UploadDropzone({
  isDragOver,
  disabled,
  accept,
  multiple,
  onDragOver,
  onDragLeave,
  onDrop,
  onClick,
  onFileInput,
  fileInputRef,
}: UploadDropzoneProps) {
  return (
    <div
      className={`relative cursor-pointer rounded-lg border-2 border-dashed p-6 text-center transition-colors ${isDragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'} ${disabled ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'} `}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={onClick}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label="File upload area"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={onFileInput}
        className="hidden"
        disabled={disabled}
      />

      <div className="space-y-4">
        <div className="mx-auto h-12 w-12 text-gray-400">
          <svg className="h-full w-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-gray-900">
            {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-xs text-gray-500">
            {accept.includes('image') && accept.includes('video')
              ? 'Video (up to 100MB, auto-compressed) / Images'
              : 'Files up to 10MB'}
          </p>
        </div>
      </div>
    </div>
  );
}
