'use client';

import { useState, RefObject } from 'react';
import { useAnalytics } from '@/hooks/useAnalytics';
import { useToast } from '@/contexts/ToastContext';

interface UseCvExportProps {
  cvRef: RefObject<HTMLDivElement | null>;
  displayName: string;
}

/**
 * CV Export Hook
 *
 * `jspdf` (~280KB) dan `html-to-image` (~80KB) hanya dibutuhkan saat user
 * benar-benar klik tombol "Download PDF". Sebelumnya keduanya di-import
 * statis di top-level → masuk ke /cv route bundle walaupun mayoritas visitor
 * cuma scroll-baca CV tanpa download.
 *
 * Sekarang di-load via dynamic `await import()` di dalam handler. Trade-off:
 * first-click delay ~100-300ms (download + parse chunk) yang bisa kita
 * indikasi via `isExporting` state yang sudah ada. Cumulative bundle saving
 * untuk /cv route signifikan.
 */
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

      // Lazy-load heavy export deps in parallel. Network roundtrip
      // diserialize jadi satu Promise.all supaya total wait time =
      // max(htmlToImage, jspdf) instead of sum.
      const [{ toPng }, { jsPDF }] = await Promise.all([import('html-to-image'), import('jspdf')]);

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
