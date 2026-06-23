// Web stub — uses browser download instead of native gallery

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
  quality?: number;
  maxDimension?: number;
  saveToGallery?: boolean;
  addWatermark?: boolean;
}

class ExportServiceWeb {
  async requestGalleryPermission(): Promise<boolean> { return true; }

  async export(sourceUri: string, options: ExportOptions = {}): Promise<ExportOutput> {
    const filename = `erick_${Date.now()}.${options.format ?? 'jpeg'}`;

    // Trigger browser download
    const a = document.createElement('a');
    a.href = sourceUri;
    a.download = filename;
    a.click();

    return { uri: sourceUri, filename, width: 1080, height: 1920, savedToGallery: false, assetId: null };
  }

  async share(uri: string, filename?: string): Promise<void> {
    if (navigator.share) {
      try {
        const res = await fetch(uri);
        const blob = await res.blob();
        const file = new File([blob], filename ?? 'erick_photo.jpg', { type: blob.type });
        await navigator.share({ files: [file], title: 'Erick Photo Editor' });
        return;
      } catch {}
    }
    // Fallback: copy URI to clipboard
    await navigator.clipboard.writeText(uri).catch(() => {});
    alert('Link copied to clipboard!');
  }

  async saveToGallery(uri: string): Promise<string> {
    const a = document.createElement('a');
    a.href = uri;
    a.download = `erick_${Date.now()}.jpg`;
    a.click();
    return 'web-download';
  }
}

export const exportService = new ExportServiceWeb();
