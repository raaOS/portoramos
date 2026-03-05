export interface AdminFileUploadProps {
    onUpload: (urls: string[]) => void;
    onUploadStart?: () => void;
    onUploadEnd?: () => void;
    accept?: string;
    multiple?: boolean;
    maxFiles?: number;
    maxSize?: number; // in MB
    className?: string;
    disabled?: boolean;
    folder?: string;
    customFilename?: string;
    enableCrop?: boolean;
    enableVideoTrim?: boolean;
    autoUpload?: boolean;
    onFileSelect?: (file: File) => void;
}
