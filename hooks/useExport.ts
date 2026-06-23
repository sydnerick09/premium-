import { useState } from 'react';
import { Alert } from 'react-native';
import { exportService, ExportOptions } from '../services/image/exportService';
import { haptic } from '../utils/haptics';

interface UseExportResult {
  isExporting: boolean;
  isSharing: boolean;
  exportImage: (uri: string, options: ExportOptions) => Promise<void>;
  shareImage: (uri: string, filename?: string) => Promise<void>;
}

export function useExport(): UseExportResult {
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  const exportImage = async (uri: string, options: ExportOptions) => {
    setIsExporting(true);
    haptic.medium();
    try {
      const result = await exportService.export(uri, options);
      haptic.success();
      Alert.alert(
        'Exported!',
        `${result.filename}\n${result.width}×${result.height}px${result.savedToGallery ? '\nSaved to Gallery ✓' : ''}`,
      );
    } catch (e: any) {
      haptic.error();
      Alert.alert('Export Failed', e?.message ?? 'Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const shareImage = async (uri: string, filename?: string) => {
    setIsSharing(true);
    haptic.light();
    try {
      await exportService.share(uri, filename);
    } catch (e: any) {
      Alert.alert('Share Failed', e?.message ?? 'Please try again.');
    } finally {
      setIsSharing(false);
    }
  };

  return { isExporting, isSharing, exportImage, shareImage };
}
