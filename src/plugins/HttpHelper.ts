declare global {
  interface Window { NB?: { req(method: string, url: string, body: string, cookie: string): string; updateWidget?(scheduleJson: string): void; updateWidgetSettings?(settings: string): void; }; }
}

const BASE = 'http://newjwxt.bjfu.edu.cn';

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url.startsWith('http') ? url : BASE + url);
    return u.hostname === 'newjwxt.bjfu.edu.cn';
  } catch {
    return false;
  }
}

function b64ToBytes(b64: string): Uint8Array {
  if (!b64 || b64.length === 0) return new Uint8Array(0);
  const cleaned = b64.replace(/[\r\n\s]/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(cleaned)) {
    throw new Error('无效base64: ' + b64.substring(0, 50));
  }
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function parseResponse(raw: string): NetResult {
  if (!raw) throw new Error('空响应');
  if (raw.startsWith('ERR:')) throw new Error(raw.substring(4));
  
  let status = 0;
  let cookie = '';
  let b64 = raw;
  
  if (raw.startsWith('STATUS:')) {
    const nl = raw.indexOf('\n');
    if (nl > 0) {
      status = parseInt(raw.substring(7, nl)) || 0;
      b64 = raw.substring(nl + 1);
    }
  }
  
  if (b64.startsWith('COOKIE:')) {
    const nl = b64.indexOf('\n');
    if (nl > 0) {
      cookie = b64.substring(7, nl);
      b64 = b64.substring(nl + 1);
    }
  }
  return { cookie, data: b64ToBytes(b64), status };
}

export function rawRequest(method: string, url: string, body: string, cookie: string): string {
  if (!window.NB) throw new Error('Java桥接未初始化');
  const fullUrl = url.startsWith('http') ? url : BASE + url;
  if (!isValidUrl(fullUrl)) throw new Error('无效请求URL');
  return window.NB.req(method, fullUrl, body, cookie);
}

function mergeCookies(jar: string, newCook: string): string {
  if (!newCook) return jar;
  const name = newCook.split('=')[0];
  if (!name) return jar;
  const parts = jar.split(';').map(p => p.trim()).filter(p => p && !p.startsWith(name + '='));
  parts.push(newCook);
  return parts.join('; ');
}

export interface NetResult {
  cookie: string;
  data: Uint8Array;
  status: number;
}

export function doGet(url: string, cookie?: string): NetResult {
  if (!window.NB) throw new Error('Java桥接未初始化');
  const fullUrl = url.startsWith('http') ? url : BASE + url;
  if (!isValidUrl(fullUrl)) throw new Error('无效请求URL');
  const raw = window.NB.req('GET', fullUrl, '', cookie || '');
  return parseResponse(raw);
}

export function doPost(url: string, body: string, cookie?: string): NetResult {
  if (!window.NB) throw new Error('Java桥接未初始化');
  const fullUrl = url.startsWith('http') ? url : BASE + url;
  if (!isValidUrl(fullUrl)) throw new Error('无效请求URL');
  const raw = window.NB.req('POST', fullUrl, body, cookie || '');
  return parseResponse(raw);
}

export function updateWidget(scheduleJson: string): void {
  if (window.NB) {
    window.NB.updateWidget(scheduleJson);
  }
}

export function mergeJar(jar: string, newCook: string): string {
  return mergeCookies(jar, newCook);
}

export function isNetworkError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes('超时') || msg.includes('timeout') || msg.includes('Timeout')
    || msg.includes('连接') || msg.includes('Connect') || msg.includes('resolve')
    || msg.includes('ENOTFOUND') || msg.includes('Network') || msg.includes('ERR_NAME');
}
