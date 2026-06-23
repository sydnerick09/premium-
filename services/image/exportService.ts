import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import { imageProcessor } from './imageProcessor.service';
import { ExportSettings } from '../../types';
import { generateFilename } from '../../utils/formatters';

const QUALITY_MAP = { low: 0.6, medium: 0.8, high: 0.95, maximum: 1.0 };
const RESOLUTION_MAP: Record<string, number | undefined> = {
  original: undefined,
  hd: 1280,
  fullhd: 1920,
  '4k': 3840,
};

export interface ExportOutput {
  uri: string;
  filename: string;
  width: number;
  height: number;
  savedToGallery: boolean;
  assetId: string | null;
}

export interface ExportOptions {
  format?: 'jpeg' | 'png' | 'webp';
  quality?: number;         // 0-1
  maxDimension?: number;
  saveToGallery?: boolean;
  addWatermark?: boolean;
}

class ExportService {
  async requestGalleryPermission(): Promise<boolean> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    return status === 'granted';
  }

  async export(
    sourceUri: string,
    options: ExportOptions | ExportSettings
  ): Promise<ExportOutput> {
    let quality: number;
    let maxDim: number | undefined;
    let fmt: string;
    let saveToGal: boolean;

    if ('resolution' in options) {
      // Legacy ExportSettings
      quality = QUALITY_MAP[options.quality];
      maxDim = RESOLUTION_MAP[options.resolution];
      fmt = options.format;
      saveToGal = options.saveToGallery;
    } else {
      quality = options.quality ?? 0.9;
      maxDim = options.maxDimension;
      fmt = options.format ?? 'jpeg';
      saveToGal = options.saveToGallery ?? true;
    }

    const exportedUri = await imageProcessor.exportAs(
      sourceUri,
      fmt as any,
      quality * 100,
      maxDim
    );

    const { width, height } = await imageProcessor.getImageSize(exportedUri);
    const ext = fmt === 'jpeg' ? 'jpg' : fmt;
    const filename = generateFilename('erick', ext);

    const destUri = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.copyAsync({ from: exportedUri, to: destUri });

    let savedToGallery = false;
    let assetId: string | null = null;

    if (saveToGal) {
      const hasPermission = await this.requestGalleryPermission();
      if (hasPermission) {
        const asset = await MediaLibrary.createAssetAsync(destUri);
        assetId = asset.id;
        savedToGallery = true;
        await MediaLibrary.createAlbumAsync('Erick', asset, false).catch(() => {});
      }
    }

    return { uri: destUri, filename, width, height, savedToGallery, assetId };
  }

  async share(uri: string, _filename?: string): Promise<void> {
    const canShare = await Sharing.isAvailableAsync();
    if (!canShare) throw new Error('Sharing is not available on this device.');
    await Sharing.shareAsync(uri, {
      mimeType: 'image/jpeg',
      dialogTitle: 'Share via Erick Photo Editor',
    });
  }

  async shareToInstagram(uri: string): Promise<void> {
    await this.share(uri);
  }

  async saveToGallery(uri: string): Promise<string> {
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') throw new Error('Gallery permission denied.');
    const asset = await MediaLibrary.createAssetAsync(uri);
    await MediaLibrary.createAlbumAsync('Erick', asset, false).catch(() => {});
    return asset.id;
  }
}

export const exportService = new ExportService();
