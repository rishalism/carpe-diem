import { API_URL } from "./constants";

// Backend origin (API base minus the trailing /api), used to resolve locally
// stored attachment URLs like "/uploads/abc.png".
const BACKEND_ORIGIN = API_URL.replace(/\/api\/?$/, "");

export function resolveFileUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path; // already absolute (e.g. Supabase)
  return `${BACKEND_ORIGIN}${path}`;
}

export function isImage(fileType?: string | null): boolean {
  return !!fileType && fileType.startsWith("image/");
}

export function formatBytes(bytes?: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
