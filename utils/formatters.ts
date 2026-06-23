import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy');
};

export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'MMM d, yyyy h:mm a');
};

export const formatRelativeTime = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

export const formatResolution = (width: number, height: number): string =>
  `${width} × ${height}`;

export const formatMegapixels = (width: number, height: number): string => {
  const mp = (width * height) / 1_000_000;
  return `${mp.toFixed(1)} MP`;
};

export const formatPercentage = (value: number, decimals = 0): string =>
  `${value.toFixed(decimals)}%`;

export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

export const formatStorageUsed = (
  usedBytes: number,
  limitBytes: number
): string => `${formatFileSize(usedBytes)} / ${formatFileSize(limitBytes)}`;

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength - 3)}...`;
};

export const generateFilename = (prefix = 'erick', ext = 'jpg'): string => {
  const now = new Date();
  const ts = format(now, 'yyyyMMdd_HHmmss');
  return `${prefix}_${ts}.${ext}`;
};
