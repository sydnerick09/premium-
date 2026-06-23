import { formatFileSize, formatResolution, formatMegapixels, truncateText } from '../../utils/formatters';

describe('formatters', () => {
  describe('formatFileSize', () => {
    it('formats bytes correctly', () => {
      expect(formatFileSize(512)).toBe('512 B');
    });
    it('formats KB correctly', () => {
      expect(formatFileSize(1024)).toBe('1.0 KB');
    });
    it('formats MB correctly', () => {
      expect(formatFileSize(1024 * 1024 * 2.5)).toBe('2.5 MB');
    });
    it('formats GB correctly', () => {
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1.0 GB');
    });
  });

  describe('formatResolution', () => {
    it('formats resolution as WxH', () => {
      expect(formatResolution(1920, 1080)).toBe('1920 × 1080');
    });
  });

  describe('formatMegapixels', () => {
    it('formats megapixels', () => {
      expect(formatMegapixels(3000, 2000)).toBe('6.0 MP');
    });
  });

  describe('truncateText', () => {
    it('does not truncate short strings', () => {
      expect(truncateText('Hello', 10)).toBe('Hello');
    });
    it('truncates long strings', () => {
      expect(truncateText('Hello World', 5)).toBe('Hello...');
    });
    it('uses custom suffix', () => {
      expect(truncateText('Hello World', 5, ' [more]')).toBe('Hello [more]');
    });
  });
});
