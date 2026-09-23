import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/contexts/ToastContext';

interface FileHandlersDeps {
  disabled: boolean;
  maxFiles: number;
  accept: string;
  maxSize: number;
  enableCrop: boolean;
  enableVideoTrim: boolean;
  customValidator?: (files: File[]) => Promise<string | null> | string | null;
  validateFiles: (files: File[]) => string[];
  executeUpload: (
    files: File[],
    trimOptions?: {
      start: number;
      end: number;
      crop?: { x: number; y: number; width: number; height: number } | null;
    }
  ) => void;
}

export function useFileHandlers(deps: FileHandlersDeps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [activeCrop, setActiveCrop] = useState<{ src: string; file: File } | null>(null);
  const [activeTrim, setActiveTrim] = useState<{ file: File } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showError } = useToast();

  const handleFiles = useCallback(
    async (files: FileList) => {
      if (deps.disabled) return;
      const fileArray = Array.from(files);

      if (fileArray.length > deps.maxFiles) {
        showError(`Too many files. Maximum ${deps.maxFiles} files allowed`);
        return;
      }

      const validationErrors = deps.validateFiles(fileArray);
      if (validationErrors.length > 0) {
        showError(`Invalid files: ${validationErrors.join(', ')}`);
        return;
      }

      if (deps.customValidator) {
        try {
          const customError = await deps.customValidator(fileArray);
          if (customError) {
            showError(customError);
            return;
          }
        } catch (err) {
          console.error('customValidator threw', err);
          showError(err instanceof Error ? err.message : 'Validasi file gagal');
          return;
        }
      }

      // Handle crop for single image
      if (deps.enableCrop && fileArray.length === 1 && fileArray[0].type.startsWith('image/')) {
        const file = fileArray[0];
        const reader = new FileReader();
        reader.onload = () => {
          setActiveCrop({ src: reader.result as string, file });
        };
        reader.readAsDataURL(file);
        return;
      }

      // Handle trim for single video
      if (deps.enableVideoTrim && fileArray.length === 1 && fileArray[0].type.startsWith('video/')) {
        setActiveTrim({ file: fileArray[0] });
        return;
      }

      deps.executeUpload(fileArray);
    },
    [deps, showError]
  );

  // Crop handlers
  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!activeCrop) return;
    const croppedFile = new File([croppedBlob], activeCrop.file.name, {
      type: activeCrop.file.type,
      lastModified: Date.now(),
    });
    setActiveCrop(null);
    deps.executeUpload([croppedFile]);
  };

  const handleCropCancel = () => setActiveCrop(null);

  // Trim handlers
  const handleTrimConfirm = (
    start: number,
    end: number,
    crop?: { x: number; y: number; width: number; height: number } | null
  ) => {
    if (!activeTrim) return;
    const file = activeTrim.file;
    setActiveTrim(null);
    deps.executeUpload([file], { start, end, crop });
  };

  const handleTrimCancel = () => setActiveTrim(null);

  // Drag & drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (!deps.disabled) setIsDragOver(true);
    },
    [deps.disabled]
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (!deps.disabled && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [deps.disabled, handleFiles]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  const handleClick = useCallback(() => {
    if (!deps.disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [deps.disabled]);

  return {
    isDragOver,
    activeCrop,
    activeTrim,
    fileInputRef,
    handleCropComplete,
    handleCropCancel,
    handleTrimConfirm,
    handleTrimCancel,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleFileInput,
    handleClick,
  };
}
