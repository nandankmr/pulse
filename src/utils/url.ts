// src/utils/url.ts

import config from '../config';

/**
 * Ensure the given URL is absolute by prefixing with the backend base URL when necessary.
 */
export const ensureAbsoluteUrl = (url?: string | null): string | undefined => {
  if (!url) {
    return undefined;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  const socketBase = config.SOCKET_URL?.replace(/\/$/, '');
  const apiBase = config.API_URL.replace(/\/api$/, '').replace(/\/$/, '');
  const baseUrl = socketBase || apiBase;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;

  return `${baseUrl}${normalizedPath}`;
};
