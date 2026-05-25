'use client';

import { useState, RefObject } from 'react';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/contexts/ToastContext';

interface UseCvExportProps {
  cvRef: RefObject<HTMLDivElement | null>;
  displayName: string;
}

export function useCvExport({ cvRef, displayName }: UseCvExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { trackEvent } = useAnalytics();
  const { showError } = useToast();

  const handlePrint = () => {
    trackEvent('CV_PRINT', { source: 'CvPage' });
    if (typeof window === 'undefined') return;
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!cvRef.current) return;

    try {
      setIsExporting(true);
      trackEvent('CV_DOWNLOAD_PREMIUM', { source: 'CvPage' });

      // Generate high quality PNG
      const dataUrl = await toPng(cvRef.current, {
        quality: 1,
        pixelRatio: 2, // 300 DPI equivalent
        backgroundColor: '#ffffff',
        filter: (node) => {
          const el = node as HTMLElement;
          if (el.classList) {
            return !el.classList.contains('no-print') && !el.classList.contains('print:hidden');
          }
          return true;
        },
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`CV_${displayName}_${new Date().getFullYear()}.pdf`);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      showError('Gagal mengunduh PDF. Coba pakai Ctrl+P sebagai cadangan.');
    } finally {
      setIsExporting(false);
    }
  };

  return {
    isExporting,
    handlePrint,
    handleDownloadPDF,
  };
}
