// Web stub — expo-image-manipulator uses native APIs
// On web, operations are passed through (no actual processing)

export interface ProcessingResult {
  uri: string;
  width: number;
  height: number;
}

class ImageProcessorWeb {
  async resize(uri: string, _width: number, _height?: number): Promise<string> { return uri; }
  async crop(uri: string, _region: any): Promise<string> { return uri; }
  async rotate(uri: string, _degrees: number): Promise<string> { return uri; }
  async flip(uri: string, _direction: 'horizontal' | 'vertical'): Promise<string> { return uri; }
  async exportAs(uri: string, _format: string, _quality: number, _maxDim?: number): Promise<string> { return uri; }
  async generateThumbnail(uri: string, _size?: number): Promise<string> { return uri; }
  async applyOperations(uri: string, _ops: any[]): Promise<string> { return uri; }
  async getImageSize(_uri: string): Promise<{ width: number; height: number }> { return { width: 1080, height: 1920 }; }
  async getFileInfo(_uri: string) { return { size: 1024 * 500, exists: true }; }
  async copyToCache(uri: string): Promise<string> { return uri; }
  async deleteFile(_uri: string): Promise<void> {}
  buildColorMatrixFromAdjustments(_adj: any) { return [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0]; }
}

export const imageProcessor = new ImageProcessorWeb();
