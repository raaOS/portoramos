import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export type ConfirmTone = 'danger' | 'warning' | 'info';

export interface BaseRequest {
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  tone?: ConfirmTone;
}

export type ConfirmRequest = BaseRequest;

export interface PromptRequest extends BaseRequest {
  defaultValue?: string;
  placeholder?: string;
  maxLength?: number;
  /** Sync validator. Return non-empty string to block confirm. */
  validate?: (value: string) => string | null;
  /** Trim before resolving. Defaults to true. */
  trim?: boolean;
  /** Reject empty value. Defaults to true. */
  required?: boolean;
}

export interface ConfirmContextValue {
  confirm: (request: ConfirmRequest) => Promise<boolean>;
  prompt: (request: PromptRequest) => Promise<string | null>;
}

export interface PendingState {
  kind: 'confirm' | 'prompt';
  request: ConfirmRequest | PromptRequest;
  resolve: (value: boolean | string | null) => void;
}

export const TONE_PALETTE: Record<
  ConfirmTone,
  {
    Icon: typeof AlertTriangle;
    iconWrap: string;
    iconColor: string;
    confirmBtn: string;
  }
> = {
  danger: {
    Icon: AlertTriangle,
    iconWrap: 'bg-red-50',
    iconColor: 'text-red-600',
    confirmBtn: 'bg-red-600 hover:bg-red-700 active:bg-red-800',
  },
  warning: {
    Icon: AlertCircle,
    iconWrap: 'bg-amber-50',
    iconColor: 'text-amber-600',
    confirmBtn: 'bg-amber-600 hover:bg-amber-700 active:bg-amber-800',
  },
  info: {
    Icon: Info,
    iconWrap: 'bg-blue-50',
    iconColor: 'text-blue-600',
    confirmBtn: 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800',
  },
};
