export interface ToastState {
    text: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}
