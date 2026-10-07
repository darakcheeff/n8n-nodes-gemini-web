"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiWeb = void 0;
const n8n_workflow_1 = require("n8n-workflow");
const axios_1 = __importDefault(require("axios"));
const https = __importStar(require("https"));
const http = __importStar(require("http"));
const zlib = __importStar(require("zlib"));
// ============================================================================
// Constants & Types
// ============================================================================
const ENDPOINTS = {
    GOOGLE: 'https://www.google.com',
    INIT: 'https://gemini.google.com/app',
    GENERATE: 'https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate',
    BATCH_EXEC: 'https://gemini.google.com/_/BardChatUi/data/batchexecute',
    UPLOAD: 'https://content-push.googleapis.com/upload/',
};
const GEMINI_HEADERS = {
    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
    'Origin': 'https://gemini.google.com',
    'Referer': 'https://gemini.google.com/',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
    'X-Same-Domain': '1',
};
const MODEL_HEADER_KEY = 'x-goog-ext-525001261-jspb';
const GEM_FLAG_INDEX = 19;
const GRPC = {
    LIST_GEMS: 'CNgdBe',
    CREATE_GEM: 'oMH3Zd',
    UPDATE_GEM: 'kHv0Vd',
    DELETE_GEM: 'UXcSJb',
    LIST_CONVERSATIONS: 'MaZiqc',
    DELETE_CONVERSATION: 'GzXR5e',
    GET_CONVERSATION: 'hNvQHb',
};
const BATCH_EXEC_HEADERS = {
    [MODEL_HEADER_KEY]: '[1,null,null,null,null,null,null,null,[4,5,6,8],null,null,null,null,null,null,null]',
    'x-goog-ext-73010989-jspb': '[0]',
};
function buildModelHeader(modelId, capacityTail, modelNumber) {
    return {
        [MODEL_HEADER_KEY]: `[1,null,null,null,"${modelId}",null,null,0,[4,5,6,8],null,null,${capacityTail}, null,null,${modelNumber}]`,
        'x-goog-ext-73010989-jspb': '[0]',
        'x-goog-ext-73010990-jspb': '[0,0,0]',
    };
}
const MODELS = {
    'default': {
        name: 'default',
        displayName: 'Default (Account Model)',
        header: null,
        advancedOnly: false,
    },
    'gemini-3.6-flash': {
        name: 'gemini-3.6-flash',
        displayName: 'Gemini Flash',
        header: buildModelHeader('fbb127bbb056c959', 1, 1),
        advancedOnly: false,
    },
    'gemini-flash': {
        name: 'gemini-flash',
        displayName: 'Gemini Flash',
        header: buildModelHeader('fbb127bbb056c959', 1, 1),
        advancedOnly: false,
    },
    'gemini-flash-lite': {
        name: 'gemini-flash-lite',
        displayName: 'Gemini Flash Lite',
        header: buildModelHeader('cf41b0e0dd7d53e5', 1, 6),
        advancedOnly: false,
    },
    'gemini-3.1-pro-preview': {
        name: 'gemini-3.1-pro-preview',
        displayName: 'Gemini Pro',
        header: buildModelHeader('9d8ca3786ebdfbea', 1, 3),
        advancedOnly: false,
    },
    'gemini-pro': {
        name: 'gemini-pro',
        displayName: 'Gemini Pro',
        header: buildModelHeader('9d8ca3786ebdfbea', 1, 3),
        advancedOnly: false,
    },
};
function parseCookieJson(cookieJsonStr) {
    const cookies = {};
    try {
        const arr = JSON.parse(cookieJsonStr);
        if (!Array.isArray(arr)) {
            throw new Error('Cookie JSON must be an array of cookie objects');
        }
        for (const item of arr) {
            if (item && item.name && item.value) {
                cookies[item.name] = item.value;
            }
        }
    }
    catch (error) {
        throw new n8n_workflow_1.NodeOperationError({}, `Failed to parse cookie JSON: ${error.message}. Make sure you paste a valid JSON array of cookie objects.`);
    }
    return cookies;
}
function cookieStr(cookies) {
    return Object.entries(cookies)
        .map(([k, v]) => `${k}=${v}`)
        .join('; ');
}
function parseSetCookieHeaders(headers, base = {}) {
    const out = { ...base };
    const raw = headers?.['set-cookie'] || headers?.['Set-Cookie'];
    const arr = Array.isArray(raw) ? raw : raw ? [raw] : [];
    for (const s of arr) {
        const p = String(s).split(';')[0].trim();
        const eq = p.indexOf('=');
        if (eq !== -1) {
            out[p.slice(0, eq).trim()] = p.slice(eq + 1).trim();
        }
    }
    return out;
}
function parseProxy(proxyStr) {
    if (!proxyStr)
        return undefined;
    try {
        const u = new URL(proxyStr);
        const config = {
            protocol: u.protocol.replace(':', ''),
            host: u.hostname,
            port: parseInt(u.port, 10),
        };
        if (u.username)
            config.auth = { username: u.username, password: u.password };
        return config;
    }
    catch {
        return undefined;
    }
}
/**
 * Uses Node.js native https module to bypass follow-redirects,
 * which doesn't pass maxHeaderSize to the HTTP parser.
 * Falls back to axios when a proxy is configured.
 */
async function nativeHttpsGet(url, options = {}) {
    // If proxy is configured, fall back to axios (follow-redirects handles proxy tunneling)
    if (options.proxy) {
        const res = await axios_1.default.get(url, {
            headers: options.headers || {},
            timeout: options.timeout || 120000,
            maxRedirects: options.maxRedirects ?? 5,
            validateStatus: null,
            proxy: options.proxy,
            maxHeaderSize: 65536,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
        });
        return {
            status: res.status,
            data: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
            headers: res.headers,
        };
    }
    const maxRedirects = options.maxRedirects ?? 5;
    const timeout = options.timeout ?? 120000;
    return new Promise((resolve, reject) => {
        const doRequest = (targetUrl, redirectsLeft) => {
            const parsedUrl = new URL(targetUrl);
            const isHttps = parsedUrl.protocol === 'https:';
            const transport = isHttps ? https : http;
            const reqOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port || (isHttps ? 443 : 80),
                path: parsedUrl.pathname + parsedUrl.search,
                method: 'GET',
                maxHeaderSize: 65536,
                headers: {
                    'Accept-Encoding': 'gzip, deflate, br',
                    ...options.headers,
                },
                timeout,
            };
            const req = transport.request(reqOptions, (res) => {
                // Handle redirects
                if ((res.statusCode === 301 || res.statusCode === 302 ||
                    res.statusCode === 307 || res.statusCode === 308) &&
                    redirectsLeft > 0 && res.headers.location) {
                    res.resume();
                    const redirectUrl = new URL(res.headers.location, targetUrl).href;
                    doRequest(redirectUrl, redirectsLeft - 1);
                    return;
                }
                const chunks = [];
                res.on('data', (chunk) => chunks.push(chunk));
                res.on('end', () => {
                    let body = Buffer.concat(chunks);
                    const encoding = res.headers['content-encoding'];
                    try {
                        if (encoding === 'gzip') {
                            body = zlib.gunzipSync(body);
                        }
                        else if (encoding === 'deflate') {
                            body = zlib.inflateSync(body);
                        }
                        else if (encoding === 'br') {
                            body = zlib.brotliDecompressSync(body);
                        }
                    }
                    catch {
                        // If decompression fails, use raw body
                    }
                    resolve({
                        status: res.statusCode || 0,
                        data: body.toString('utf-8'),
                        headers: res.headers,
                    });
                });
            });
            req.on('error', (err) => {
                reject(err);
            });
            req.on('timeout', () => {
                req.destroy(new Error('Request timed out'));
            });
            req.end();
        };
        doRequest(url, maxRedirects);
    });
}
// ============================================================================
// Native HTTPS POST (properly handles streaming responses from Gemini)
// ============================================================================
/**
 * Uses Node.js native https module for POST requests.
 * Properly buffers ALL streaming response chunks before resolving.
 * This is critical for Gemini Web API: when images are uploaded, Gemini
 * sends the response incrementally — the first chunk may contain only
 * an acknowledgment ("Ready!"), while subsequent chunks contain the
 * full generated content. Axios may resolve prematurely after the first
 * chunk; this function guarantees the complete response is collected.
 */
async function nativeHttpsPost(url, body, options = {}) {
    // If proxy is configured, fall back to axios with streaming disabled
    if (options.proxy) {
        const res = await axios_1.default.post(url, body, {
            headers: options.headers || {},
            timeout: options.timeout || 300000,
            maxRedirects: 0,
            validateStatus: null,
            proxy: options.proxy,
            maxHeaderSize: 65536,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            responseType: 'text',
            transformResponse: [(data) => data], // Prevent axios from parsing
        });
        return {
            status: res.status,
            data: typeof res.data === 'string' ? res.data : JSON.stringify(res.data),
            headers: res.headers,
        };
    }
    const timeout = options.timeout ?? 300000;
    const bodyBuffer = typeof body === 'string' ? Buffer.from(body, 'utf-8') : body;
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(url);
        const isHttps = parsedUrl.protocol === 'https:';
        const transport = isHttps ? https : http;
        const reqOptions = {
            hostname: parsedUrl.hostname,
            port: parsedUrl.port || (isHttps ? 443 : 80),
            path: parsedUrl.pathname + parsedUrl.search,
            method: 'POST',
            maxHeaderSize: 65536,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8',
                'Content-Length': Buffer.byteLength(bodyBuffer),
                'Accept-Encoding': 'gzip, deflate, br',
                ...options.headers,
            },
            timeout,
        };
        const req = transport.request(reqOptions, (res) => {
            // Handle redirects (unlikely for POST, but just in case)
            if ((res.statusCode === 301 || res.statusCode === 302 ||
                res.statusCode === 307 || res.statusCode === 308) &&
                res.headers.location) {
                res.resume();
                const redirectUrl = new URL(res.headers.location, url).href;
                nativeHttpsPost(redirectUrl, body, options).then(resolve).catch(reject);
                return;
            }
            // Collect ALL response data chunks
            // This is the critical part: we must wait for 'end' event,
            // not resolve after the first chunk of data.
            const chunks = [];
            res.on('data', (chunk) => chunks.push(chunk));
            res.on('end', () => {
                let responseBody = Buffer.concat(chunks);
                const encoding = res.headers['content-encoding'];
                try {
                    if (encoding === 'gzip') {
                        responseBody = zlib.gunzipSync(responseBody);
                    }
                    else if (encoding === 'deflate') {
                        responseBody = zlib.inflateSync(responseBody);
                    }
                    else if (encoding === 'br') {
                        responseBody = zlib.brotliDecompressSync(responseBody);
                    }
                }
                catch {
                    // If decompression fails, use raw body
                }
                resolve({
                    status: res.statusCode || 0,
                    data: responseBody.toString('utf-8'),
                    headers: res.headers,
                });
            });
            res.on('error', (err) => {
                reject(err);
            });
        });
        req.on('error', (err) => {
            reject(err);
        });
        req.on('timeout', () => {
            req.destroy(new Error('Request timed out (Gemini generation took too long)'));
        });
        // Write the request body
        req.write(bodyBuffer);
        req.end();
    });
}
// ============================================================================
// Gemini Web API Client
// ============================================================================
class GeminiWebClient {
    constructor(cookies, proxy) {
        this.accessToken = null;
        this.buildLabel = null;
        this.sessionId = null;
        this.language = 'en';
        this.timeout = 300000; // 5 minutes — image processing + content generation takes time
        this.cookies = cookies;
        this.proxy = proxy;
        this.reqId = Math.floor(Math.random() * 90000) + 10000;
        this.clientSessionUuid = generateUUID().toUpperCase();
    }
    get http() {
        const config = {
            timeout: this.timeout,
            maxRedirects: 5,
            validateStatus: null,
            maxHeaderSize: 65536,
            maxBodyLength: Infinity,
            maxContentLength: Infinity,
            ...(this.proxy ? { proxy: this.proxy } : {}),
        };
        return axios_1.default.create(config);
    }
    async init() {
        await this.testConnection();
    }
    async testConnection() {
        let extraCookies = {};
        try {
            const r = await nativeHttpsGet(ENDPOINTS.GOOGLE, {
                timeout: this.timeout,
                proxy: this.proxy,
            });
            if (r.status === 200) {
                extraCookies = parseSetCookieHeaders(r.headers);
            }
        } catch {}
        const allCookies = { ...extraCookies, ...this.cookies };
        if (!allCookies['__Secure-1PSID']) {
            throw new n8n_workflow_1.NodeOperationError({}, '__Secure-1PSID cookie is required. Please check your cookie input.');
        }
        console.log('[GeminiWebClient] COOKIE INFO:', {
            sid_prefix: (this.cookies['__Secure-1PSID'] || '').substring(0, 15) + '...',
            sid_len: (this.cookies['__Secure-1PSID'] || '').length,
            sidts_prefix: (this.cookies['__Secure-1PSIDTS'] || '').substring(0, 15) + '...',
            sidts_len: (this.cookies['__Secure-1PSIDTS'] || '').length,
            has_sidcc: !!this.cookies['__Secure-1PSIDCC'],
        });

        // Test RotateCookies endpoint
        try {
            const rotateRes = await nativeHttpsPost('https://accounts.google.com/RotateCookies', '[000,"-0000000000000000000"]', {
                headers: {
                    'Content-Type': 'application/json',
                    Cookie: cookieStr(this.cookies),
                },
                timeout: 10000,
                proxy: this.proxy,
            });
            console.log('[GeminiWebClient] RotateCookies status:', rotateRes.status, 'set-cookie:', rotateRes.headers['set-cookie'] || rotateRes.headers['Set-Cookie']);
            if (rotateRes.status === 200) {
                const rotated = parseSetCookieHeaders(rotateRes.headers);
                console.log('[GeminiWebClient] Rotated keys:', Object.keys(rotated));
                if (rotated['__Secure-1PSIDTS']) {
                    this.cookies['__Secure-1PSIDTS'] = rotated['__Secure-1PSIDTS'];
                    console.log('[GeminiWebClient] Updated __Secure-1PSIDTS from RotateCookies successfully!');
                }
            }
        } catch (rotateErr) {
            console.log('[GeminiWebClient] RotateCookies error:', rotateErr.message);
        }

        // Get access token from gemini.google.com/app (uses native https with maxHeaderSize: 65536)
        const res = await nativeHttpsGet(ENDPOINTS.INIT, {
            headers: {
                ...GEMINI_HEADERS,
                Cookie: cookieStr(this.cookies),
            },
            timeout: this.timeout,
            proxy: this.proxy,
        });
        if (res.status !== 200) {
            throw new n8n_workflow_1.NodeOperationError({}, `Failed to connect to Gemini: HTTP ${res.status}. Your cookies may be expired or invalid.`);
        }
        let html = typeof res.data === 'string' ? res.data : String(res.data);
        let snlm0e = (html.match(/"SNlM0e":\s*"(.*?)"/) || [])[1] || null;
        let cfb2h = (html.match(/"cfb2h":\s*"(.*?)"/) || [])[1] || null;
        let fdrfje = (html.match(/"FdrFJe":\s*"(.*?)"/) || [])[1] || null;
        let language = (html.match(/"TuX5cc":\s*"(.*?)"/) || [])[1] || null;
        let usedCookies = allCookies;

        // If SNlM0e was not found with extraCookies, try with this.cookies directly (without anonymous extraCookies)
        if (!snlm0e && Object.keys(extraCookies).length > 0) {
            try {
                const resDirect = await nativeHttpsGet(ENDPOINTS.INIT, {
                    headers: {
                        ...GEMINI_HEADERS,
                        Cookie: cookieStr(this.cookies),
                    },
                    timeout: this.timeout,
                    proxy: this.proxy,
                });
                if (resDirect.status === 200) {
                    const htmlDirect = typeof resDirect.data === 'string' ? resDirect.data : String(resDirect.data);
                    const snlm0eDirect = (htmlDirect.match(/"SNlM0e":\s*"(.*?)"/) || [])[1] || null;
                    if (snlm0eDirect) {
                        console.log('[GeminiWebClient] Direct cookies (without extraCookies) succeeded!');
                        html = htmlDirect;
                        snlm0e = snlm0eDirect;
                        cfb2h = (htmlDirect.match(/"cfb2h":\s*"(.*?)"/) || [])[1] || cfb2h;
                        fdrfje = (htmlDirect.match(/"FdrFJe":\s*"(.*?)"/) || [])[1] || fdrfje;
                        language = (htmlDirect.match(/"TuX5cc":\s*"(.*?)"/) || [])[1] || language;
                        usedCookies = this.cookies;
                    }
                }
            } catch (directErr) {
                console.log('[GeminiWebClient] Direct cookie retry error:', directErr.message);
            }
        }

        console.log('[GeminiWebClient] INIT DIAGNOSTIC:', {
            hasAccessToken: !!snlm0e,
            accessTokenPrefix: snlm0e ? snlm0e.substring(0, 8) + '...' : 'NULL',
            buildLabel: cfb2h,
            hasSNlM0eInHtml: html.includes('SNlM0e'),
            hasWIZInHtml: html.includes('WIZ_global_data'),
            htmlLength: html.length,
            title: (html.match(/<title>([^<]+)<\/title>/) || [])[1],
            cookieKeys: Object.keys(usedCookies),
        });

        if (!snlm0e && !cfb2h && !language) {
            throw new n8n_workflow_1.NodeOperationError({}, 'Failed to extract access token from Gemini. Your cookies may be expired or invalid. Please re-export cookies from your browser.');
        }
        this.accessToken = snlm0e;
        this.buildLabel = cfb2h;
        this.sessionId = fdrfje;
        this.language = language || 'en';
        this.cookies = parseSetCookieHeaders(res.headers, usedCookies);
        this.reqId = Math.floor(Math.random() * 90000) + 10000;
        return {
            success: true,
            hasAccessToken: !!snlm0e,
            hasBuildLabel: !!cfb2h,
            hasSessionId: !!fdrfje,
            language: this.language,
            cookieCount: Object.keys(this.cookies).length,
            message: snlm0e
                ? 'Cookie is valid. Access token successfully extracted from Gemini.'
                : 'Connected but access token not found. Some features may not work.',
        };
    }
    async uploadFile(fileBuffer, mimeType = 'application/octet-stream', fileName = 'file.bin') {
        const safeFileName = fileName
            .replace(/[^\x20-\x7E]/g, '_')
            .replace(/[^\w.\-]/g, '_')
            .substring(0, 200) || 'file.bin';
        const boundary = '----WebKitFormBoundary' + generateUUID().replace(/-/g, '').substring(0, 16);
        const header = Buffer.from(
            `--${boundary}\r\n` +
            `Content-Disposition: form-data; name="file"; filename="${safeFileName}"\r\n` +
            `Content-Type: ${mimeType}\r\n\r\n`,
            'utf-8'
        );
        const footer = Buffer.from(`\r\n--${boundary}--\r\n`, 'utf-8');
        const bodyBuffer = Buffer.concat([header, fileBuffer, footer]);

        const res = await nativeHttpsPost('https://content-push.googleapis.com/upload/', bodyBuffer, {
            headers: {
                'Push-ID': 'feeds/mcudyrk2a4khkz',
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
            },
            timeout: this.timeout,
            proxy: this.proxy,
        });

        if (res.status !== 200) {
            throw new n8n_workflow_1.NodeOperationError({}, `Failed to upload file (${fileName}). Status: ${res.status}, response: ${res.data}`);
        }
        const fileUrl = String(res.data).trim();
        if (!fileUrl) {
            throw new n8n_workflow_1.NodeOperationError({}, `Failed to upload file (${fileName}). Empty response from upload service.`);
        }
        return fileUrl;
    }
    async uploadImage(imageBuffer, mimeType = 'image/jpeg') {
        return this.uploadFile(imageBuffer, mimeType, 'image.jpg');
    }
    async generateContent(params) {
        if (!this.accessToken) {
            await this.init();
        }
        const model = MODELS[params.model || 'gemini-3.6-flash'] || MODELS['gemini-3.6-flash'];
        // Ensure metadata is always a normalized 10-element array
        let metadataInput = params.metadata;
        if (typeof metadataInput === 'string' && metadataInput.trim()) {
            try {
                metadataInput = JSON.parse(metadataInput);
            } catch {}
        }
        const reqMetadata = ['', '', '', null, null, null, null, null, null, ''];
        if (Array.isArray(metadataInput)) {
            for (let j = 0; j < 10 && j < metadataInput.length; j++) {
                if (metadataInput[j] !== undefined && metadataInput[j] !== null) {
                    reqMetadata[j] = metadataInput[j];
                }
            }
        } else if (metadataInput && typeof metadataInput === 'object') {
            if (metadataInput.conversationId || metadataInput.cid) {
                reqMetadata[0] = metadataInput.conversationId || metadataInput.cid;
            }
            if (metadataInput.responseId || metadataInput.rid) {
                reqMetadata[1] = metadataInput.responseId || metadataInput.rid;
            }
            if (metadataInput.candidateId || metadataInput.rcid) {
                reqMetadata[2] = metadataInput.candidateId || metadataInput.rcid;
            }
            if (metadataInput.context) {
                reqMetadata[9] = metadataInput.context;
            }
            if (Array.isArray(metadataInput.metadata)) {
                for (let j = 0; j < 10 && j < metadataInput.metadata.length; j++) {
                    if (metadataInput.metadata[j] !== undefined && metadataInput.metadata[j] !== null) {
                        reqMetadata[j] = metadataInput.metadata[j];
                    }
                }
            }
        }
        // If conversation ID is present but responseId or candidateId is missing,
        // recover them from chat history
        if (reqMetadata[0] && (!reqMetadata[1] || !reqMetadata[2])) {
            try {
                const lastTurn = await this.getChatLastTurn(reqMetadata[0]);
                if (lastTurn) {
                    if (!reqMetadata[1] && lastTurn.rid) reqMetadata[1] = lastTurn.rid;
                    if (!reqMetadata[2] && lastTurn.rcid) reqMetadata[2] = lastTurn.rcid;
                }
            } catch {}
        }
        const metadata = reqMetadata;
        const temporary = params.temporary || false;
        const gemId = params.gemId || null;
        const reqId = this.reqId;
        this.reqId += 100000;
        // Generate UUID for this request
        const uid = generateUUID();
        // Build the inner request array (81 elements)
        const inner = new Array(81).fill(null);
        let fileList = null;
        if (params.files && params.files.length > 0) {
            fileList = params.files.map(f => [[f.url], f.fileName || 'file.bin']);
        }
        else if (params.imageUrls && params.imageUrls.length > 0) {
            fileList = params.imageUrls.map(url => [[url], 'image.jpg']);
        }
        inner[0] = [params.prompt, 0, null, fileList, null, null, 0];
        inner[1] = [this.language];
        inner[2] = metadata;
        inner[6] = [1];
        inner[7] = 1; // streaming flag
        inner[10] = 1;
        inner[11] = 0;
        inner[17] = [[0]];
        inner[18] = 0;
        inner[27] = 1;
        inner[30] = [4];
        inner[41] = [1];
        if (temporary)
            inner[45] = 1;
        if (gemId)
            inner[GEM_FLAG_INDEX] = gemId;
        inner[53] = 0;
        inner[59] = uid;
        inner[61] = [];
        inner[68] = 1;
        inner[79] = 1;
        inner[80] = 1;
        // Build URL params
        const urlParams = new URLSearchParams({
            hl: this.language,
            _reqid: String(reqId),
            rt: 'c',
        });
        if (this.buildLabel)
            urlParams.set('bl', this.buildLabel);
        if (this.sessionId)
            urlParams.set('f.sid', this.sessionId);
        // Send request with dynamic model header and automatic retry fallback for error 1097
        let attempt = 0;
        let currentModel = model;
        while (attempt < 2) {
            attempt++;
            const modelHeaders = (currentModel && currentModel.header) ? { ...currentModel.header } : {};
            if (modelHeaders[MODEL_HEADER_KEY]) {
                try {
                    const headerArray = JSON.parse(modelHeaders[MODEL_HEADER_KEY]);
                    const modelNumber = headerArray[headerArray.length - 1];
                    if (typeof modelNumber === 'number') {
                        inner[79] = modelNumber;
                    }
                    if (params.extendedThinking) {
                        headerArray.push(1); // extended_thinking flag
                    }
                    headerArray.push(this.clientSessionUuid);
                    modelHeaders[MODEL_HEADER_KEY] = JSON.stringify(headerArray);
                } catch {}
            }
            const body = new URLSearchParams({
                at: this.accessToken || '',
                'f.req': JSON.stringify([null, JSON.stringify(inner)]),
            });
            const headers = {
                ...GEMINI_HEADERS,
                ...modelHeaders,
                'x-goog-ext-525005358-jspb': `["${uid}",1]`,
                Cookie: cookieStr(this.cookies),
            };
            const generateUrl = `${ENDPOINTS.GENERATE}?${urlParams.toString()}`;
            const res = await nativeHttpsPost(generateUrl, body.toString(), {
                headers,
                timeout: this.timeout,
                proxy: this.proxy,
            });
            this.cookies = parseSetCookieHeaders(res.headers, this.cookies);
            if (res.status !== 200) {
                throw new n8n_workflow_1.NodeOperationError({}, `Gemini API request failed with status ${res.status}`);
            }
            try {
                return this.parseResponse(res.data, currentModel ? currentModel.name : 'default');
            } catch (err) {
                if (err.message && err.message.includes('1097') && attempt < 2) {
                    // Fast fallback: reset model to default and reset metadata to clean generation
                    currentModel = MODELS['default'];
                    if (inner[2] && inner[2][0]) {
                        inner[2] = ['', '', '', null, null, null, null, null, null, ''];
                    }
                    inner[79] = 1;
                    continue;
                }
                throw err;
            }
        }
    }
    parseResponse(text, modelName) {
        const parts = extractJsonArrays(text);
        let result = {
            text: '',
            conversationId: '',
            responseId: '',
            candidateId: '',
            metadata: ['', '', '', null, null, null, null, null, null, ''],
            images: [],
            done: false,
        };
        const metaArray = ['', '', '', null, null, null, null, null, null, ''];
        let fatalErrorCode = null;
        let fatalErrorDetail = null;
        for (const part of parts) {
            // Check for numeric error codes (path [0,5,2,0,1,0])
            const errorCode = getNestedValue(part, [0, 5, 2, 0, 1, 0]);
            if (errorCode) {
                // Do not throw immediately! Google streams multiple chunks where some
                // chunks contain intermediate status codes (e.g. 1096 for session history state,
                // 1185 for web search grounding events), while subsequent chunks contain the generated text.
                fatalErrorCode = errorCode;
                fatalErrorDetail = getNestedValue(part, [0, 5, 2, 0, 1, 1]);
            }
            // Check for string-based error codes (used by HanaokaYuzu/Gemini-API)
            const errorString = getNestedValue(part, [0, 3]);
            if (typeof errorString === 'string' && errorString) {
                const knownErrors = {
                    'USAGE_LIMIT_EXCEEDED': 'Usage limit exceeded (model quota exhausted)',
                    'MODEL_INCONSISTENT': 'Model inconsistent with conversation history',
                    'MODEL_HEADER_INVALID': 'Invalid model header — the model may be deprecated or the request format outdated',
                    'IP_TEMPORARILY_BLOCKED': 'IP temporarily blocked by Google (rate limited)',
                };
                if (knownErrors[errorString]) {
                    throw new n8n_workflow_1.NodeOperationError({}, `Gemini API error: ${knownErrors[errorString]}\n\nDebug info: model=${modelName}`);
                }
            }
            // Extract the inner JSON string
            const innerStr = getNestedValue(part, [0, 2]);
            if (!innerStr || typeof innerStr !== 'string')
                continue;
            let pj;
            try {
                pj = JSON.parse(innerStr);
            }
            catch {
                continue;
            }
            // Extract conversation metadata
            const metaData = getNestedValue(pj, [1]);
            if (metaData && Array.isArray(metaData)) {
                if (metaData[0]) {
                    result.conversationId = metaData[0];
                    metaArray[0] = metaData[0];
                }
                if (metaData[1]) {
                    result.responseId = metaData[1];
                    metaArray[1] = metaData[1];
                }
                if (metaData[2]) {
                    metaArray[2] = metaData[2];
                }
            }
            // Extract context string (for continuing conversation)
            const ctx = getNestedValue(pj, [25]);
            if (typeof ctx === 'string' && ctx) {
                metaArray[9] = ctx;
            }
            // Extract candidates
            const candidates = getNestedValue(pj, [4], []);
            if (!candidates || !Array.isArray(candidates) || candidates.length === 0)
                continue;
            for (const cd of candidates) {
                const rcid = getNestedValue(cd, [0]);
                if (!rcid)
                    continue;
                result.candidateId = rcid;
                metaArray[2] = rcid;
                // Extract text
                let text = getNestedValue(cd, [1, 0], '');
                if (typeof text !== 'string')
                    text = String(text || '');
                // Remove card content URLs and artifacts
                text = text.replace(/^http:\/\/googleusercontent\.com\/card_content\/\d+/g, '');
                text = text.replace(/http:\/\/googleusercontent\.com\/\w+\/\d+\n*/g, '');
                // Extract completion indicator
                const indicator = getNestedValue(cd, [8, 0]);
                result.done = indicator === 2;
                // Extract images (web images)
                const webImages = getNestedValue(cd, [12, 1], []) || [];
                for (const wi of webImages) {
                    const url = getNestedValue(wi, [0, 0, 0]);
                    if (url) {
                        result.images.push({
                            url,
                            title: '',
                            alt: getNestedValue(wi, [0, 4], ''),
                            generated: false,
                        });
                    }
                }
                // Extract generated images
                const genImgSources1 = getNestedValue(cd, [12, 7, 0], []) || [];
                for (const gi of genImgSources1) {
                    const url = getNestedValue(gi, [0, 3, 3]);
                    if (url) {
                        result.images.push({
                            url,
                            title: 'Generated Image',
                            alt: getNestedValue(gi, [0, 3, 2], ''),
                            generated: true,
                        });
                    }
                }
                // Gemini streaming sends progressive text: each chunk contains
                // the FULL text up to that point. Keep the longest text to
                // ensure we have the complete generated content.
                if (text.length > result.text.length) {
                    result.text = text;
                }
            }
        }
        if (!result.text && (!result.images || result.images.length === 0)) {
            if (fatalErrorCode && fatalErrorCode !== 1096 && fatalErrorCode !== 1185) {
                const detailStr = fatalErrorDetail ? ` Detail: ${String(fatalErrorDetail)}` : '';
                throw new n8n_workflow_1.NodeOperationError({}, `Gemini API error code: ${fatalErrorCode}. ${getErrorMessage(fatalErrorCode)}${detailStr}\n\nDebug info: model=${modelName}, response snippet: ${text.substring(0, 500)}`);
            }
            throw new n8n_workflow_1.NodeOperationError({}, `Failed to parse Gemini response: no text or images found in response.\n\nDebug info: model=${modelName}, response snippet: ${text.substring(0, 500)}`);
        }
        // Format images in text: replace Gemini <Image .../> tags with Markdown ![alt](url)
        if (result.text && typeof result.text === 'string') {
            const usedImageUrls = new Set();
            let imgSeq = 0;
            result.text = result.text.replace(/<Image\s+([^>]*)\/?>/gi, (match, attrsStr) => {
                const altMatch = attrsStr.match(/alt=["']([^"']*)["']/i);
                const captionMatch = attrsStr.match(/caption=["']([^"']*)["']/i);
                const alt = altMatch ? altMatch[1] : '';
                const caption = captionMatch ? captionMatch[1] : '';
                const label = caption || alt || 'Image';

                let matched = null;
                if (alt && result.images) {
                    matched = result.images.find(img => img.alt === alt && !usedImageUrls.has(img.url));
                }
                if (!matched && caption && result.images) {
                    matched = result.images.find(img => img.title === caption && !usedImageUrls.has(img.url));
                }
                if (!matched && result.images && imgSeq < result.images.length) {
                    matched = result.images[imgSeq++];
                }
                if (matched && matched.url) {
                    usedImageUrls.add(matched.url);
                    return `\n\n![${label}](${matched.url})\n\n`;
                }
                return label ? `\n\n*${label}*\n\n` : '';
            });

            // If any images from result.images were not referenced in <Image> tags, append them at the end
            if (result.images && result.images.length > 0) {
                const unreferenced = result.images.filter(img => !usedImageUrls.has(img.url));
                if (unreferenced.length > 0) {
                    const extraMarkdown = unreferenced.map(img => `![${img.title || img.alt || 'Image'}](${img.url})`).join('\n\n');
                    result.text = `${result.text.trim()}\n\n${extraMarkdown}`;
                }
            }
        }
        result.metadata = metaArray;
        return result;
    }
    // ========================================================================
    // Batch Execute (for Gems management and other RPC calls)
    // ========================================================================
    async batchExecute(payloads) {
        if (!this.accessToken) {
            await this.init();
        }
        const reqId = this.reqId;
        this.reqId += 100000;
        const rpcids = payloads.map(p => p.rpcid).join(',');
        const serialized = payloads.map(p => [p.rpcid, p.payload, null, p.identifier || 'generic']);
        const urlParams = new URLSearchParams({
            'rpcids': rpcids,
            hl: this.language,
            _reqid: String(reqId),
            rt: 'c',
            'source-path': '/app',
        });
        if (this.buildLabel)
            urlParams.set('bl', this.buildLabel);
        if (this.sessionId)
            urlParams.set('f.sid', this.sessionId);
        const body = new URLSearchParams({
            at: this.accessToken || '',
            'f.req': JSON.stringify([serialized]),
        });
        const batchHeaders = { ...BATCH_EXEC_HEADERS };
        if (batchHeaders[MODEL_HEADER_KEY]) {
            try {
                const parsed = JSON.parse(batchHeaders[MODEL_HEADER_KEY]);
                parsed.push(this.clientSessionUuid);
                batchHeaders[MODEL_HEADER_KEY] = JSON.stringify(parsed);
            } catch {}
        }
        const headers = {
            ...GEMINI_HEADERS,
            ...batchHeaders,
            Cookie: cookieStr(this.cookies),
        };
        const res = await this.http.post(`${ENDPOINTS.BATCH_EXEC}?${urlParams.toString()}`, body.toString(), { headers });
        this.cookies = parseSetCookieHeaders(res.headers, this.cookies);
        if (res.status !== 200) {
            throw new n8n_workflow_1.NodeOperationError({}, `Batch execute failed with status ${res.status}`);
        }
        const responseText = typeof res.data === 'string' ? res.data : String(res.data);
        return extractJsonArrays(responseText);
    }
    async fetchGems(includeHidden = false) {
        const payloads = [
            {
                rpcid: GRPC.LIST_GEMS,
                payload: includeHidden
                    ? `[4,['${this.language}'],0]`
                    : `[3,['${this.language}'],0]`,
                identifier: 'system',
            },
            {
                rpcid: GRPC.LIST_GEMS,
                payload: `[2,['${this.language}'],0]`,
                identifier: 'custom',
            },
        ];
        const parts = await this.batchExecute(payloads);
        const gems = [];
        for (const part of parts) {
            const identifier = getNestedValue(part, [-1]);
            const partBodyStr = getNestedValue(part, [2]);
            if (!partBodyStr || typeof partBodyStr !== 'string')
                continue;
            let partBody;
            try {
                partBody = JSON.parse(partBodyStr);
            }
            catch {
                continue;
            }
            const gemList = getNestedValue(partBody, [2], []);
            if (!Array.isArray(gemList))
                continue;
            const isPredefined = identifier === 'system';
            for (const gem of gemList) {
                const id = getNestedValue(gem, [0]);
                const name = getNestedValue(gem, [1, 0], 'Unknown');
                const description = getNestedValue(gem, [1, 1], null);
                const promptData = getNestedValue(gem, [2], null);
                const prompt = (promptData && promptData[0]) || null;
                if (id) {
                    gems.push({ id, name, description, prompt, predefined: isPredefined });
                }
            }
        }
        return gems;
    }
    async createGem(name, prompt, description = '') {
        const payload = JSON.stringify([[
                name, description, prompt,
                null, null, null, null, null, 0, null, 1, null, null, null, [],
            ]]);
        const parts = await this.batchExecute([{
                rpcid: GRPC.CREATE_GEM,
                payload,
            }]);
        let gemId = null;
        for (const part of parts) {
            const partBodyStr = getNestedValue(part, [2]);
            if (!partBodyStr || typeof partBodyStr !== 'string')
                continue;
            try {
                const partBody = JSON.parse(partBodyStr);
                gemId = getNestedValue(partBody, [0]);
                if (gemId)
                    break;
            }
            catch {
                continue;
            }
        }
        if (!gemId) {
            throw new n8n_workflow_1.NodeOperationError({}, 'Failed to create gem. Unexpected response from Gemini.');
        }
        return { id: gemId, name, description, prompt, predefined: false };
    }
    async updateGem(gemId, name, prompt, description = '') {
        const payload = JSON.stringify([
            gemId,
            [name, description, prompt, null, null, null, null, null, 0, null, 1, null, null, null, [], 0],
        ]);
        await this.batchExecute([{
                rpcid: GRPC.UPDATE_GEM,
                payload,
            }]);
        return { id: gemId, name, description, prompt, predefined: false };
    }
    async deleteGem(gemId) {
        const payload = JSON.stringify([gemId]);
        await this.batchExecute([{
                rpcid: GRPC.DELETE_GEM,
                payload,
            }]);
    }
    async listChats(limit = 50) {
        const partsPinned = await this.batchExecute([{
            rpcid: GRPC.LIST_CONVERSATIONS,
            payload: JSON.stringify([limit, null, [1, null, 1]]),
            identifier: 'pinned',
        }]);
        const partsRecent = await this.batchExecute([{
            rpcid: GRPC.LIST_CONVERSATIONS,
            payload: JSON.stringify([limit, null, [0, null, 1]]),
            identifier: 'recent',
        }]);
        const parts = [...partsPinned, ...partsRecent];
        const chats = [];
        const seenIds = new Set();
        for (const part of parts) {
            const partBodyStr = getNestedValue(part, [2]);
            if (!partBodyStr || typeof partBodyStr !== 'string')
                continue;
            let partBody;
            try {
                partBody = JSON.parse(partBodyStr);
            }
            catch {
                continue;
            }
            const chatList = getNestedValue(partBody, [2]);
            if (Array.isArray(chatList)) {
                for (const chatData of chatList) {
                    if (Array.isArray(chatData) && chatData.length > 1) {
                        const id = getNestedValue(chatData, [0], '');
                        if (!id || seenIds.has(id))
                            continue;
                        seenIds.add(id);
                        const title = getNestedValue(chatData, [1], '');
                        const isPinned = Boolean(getNestedValue(chatData, [2]));
                        const timestampData = getNestedValue(chatData, [5]);
                        let updatedAt = null;
                        if (Array.isArray(timestampData) && timestampData.length >= 1) {
                            const seconds = timestampData[0];
                            if (seconds) {
                                updatedAt = new Date(seconds * 1000).toISOString();
                            }
                        }
                        chats.push({
                            id,
                            title,
                            isPinned,
                            updatedAt,
                        });
                    }
                }
            }
        }
        return chats;
    }
    async deleteChat(chatId) {
        const normalizedChatId = normalizeChatId(chatId);
        const payload = JSON.stringify([normalizedChatId]);
        await this.batchExecute([{
                rpcid: GRPC.DELETE_CONVERSATION,
                payload,
            }]);
        return {
            success: true,
            id: normalizedChatId,
            message: `Chat ${normalizedChatId} has been deleted.`,
        };
    }
    async getChatLastTurn(chatId) {
        const normalizedChatId = normalizeChatId(chatId);
        const payload = JSON.stringify([normalizedChatId, 1, null, 1, [0], [4], null, 1]);
        const parts = await this.batchExecute([{
            rpcid: GRPC.GET_CONVERSATION,
            payload,
        }]);
        for (const part of parts) {
            const partBodyStr = getNestedValue(part, [2]);
            if (partBodyStr && typeof partBodyStr === 'string') {
                try {
                    const parsedPayload = JSON.parse(partBodyStr);
                    const records = Array.isArray(parsedPayload[0]) ? parsedPayload[0] : [];
                    if (records.length > 0) {
                        const lastTurn = records[0];
                        const rid = getNestedValue(lastTurn, [0, 1]) || '';
                        const candidates = (Array.isArray(lastTurn[3]) && lastTurn[3][0]) || [];
                        const rcid = (candidates[0] && Array.isArray(candidates[0]) && candidates[0][0]) || '';
                        return { rid, rcid };
                    }
                } catch {}
            }
        }
        return null;
    }
    async getChatMessages(chatId, maxTurns = 500) {
        const normalizedChatId = normalizeChatId(chatId);
        const pageSize = Math.min(maxTurns, 100);
        let cursor = null;
        const rawTurns = [];
        const seenTurnIds = new Set();
        for (let page = 0; page < 50; page++) {
            const payload = JSON.stringify([normalizedChatId, pageSize, cursor, 1, [0], [4], null, 1]);
            const parts = await this.batchExecute([{
                    rpcid: GRPC.GET_CONVERSATION,
                    payload,
                }]);
            let parsedPayload = null;
            for (const part of parts) {
                const partBodyStr = getNestedValue(part, [2]);
                if (partBodyStr && typeof partBodyStr === 'string') {
                    try {
                        parsedPayload = JSON.parse(partBodyStr);
                        break;
                    }
                    catch {
                        continue;
                    }
                }
            }
            if (!parsedPayload) {
                break;
            }
            const records = Array.isArray(parsedPayload[0]) ? parsedPayload[0] : [];
            let addedCount = 0;
            for (const record of records) {
                const turnId = getNestedValue(record, [0, 1]) || JSON.stringify(getNestedValue(record, [0]));
                if (turnId && !seenTurnIds.has(turnId)) {
                    seenTurnIds.add(turnId);
                    rawTurns.push(record);
                    addedCount++;
                }
            }
            cursor = typeof parsedPayload[1] === 'string' && parsedPayload[1] ? parsedPayload[1] : null;
            if (!cursor || !addedCount || rawTurns.length >= maxTurns) {
                break;
            }
        }
        // Records come newest first: restore chronological order
        rawTurns.reverse();
        // Extract chosen responses for branched/regenerated turns
        const chosen = {};
        for (const turn of rawTurns) {
            if (Array.isArray(turn[1]) && typeof turn[1][2] === 'string') {
                chosen[turn[1][2]] = true;
            }
        }
        const messages = [];
        let index = 0;
        for (const turn of rawTurns) {
            // User message
            const userPart = (Array.isArray(turn[2]) && turn[2][0]) || [];
            const userText = typeof userPart[0] === 'string' ? userPart[0].trim() : '';
            const attachments = extractUserAttachments(userPart);
            if (userText || attachments.length > 0) {
                index++;
                messages.push({
                    index,
                    role: 'user',
                    text: userText,
                    attachments: attachments.length > 0 ? attachments : undefined,
                });
            }
            // Assistant response
            const candidates = (Array.isArray(turn[3]) && turn[3][0]) || [];
            const pick = candidates.find((c) => Array.isArray(c) && chosen[c[0]]) || candidates[0];
            if (pick && Array.isArray(pick[1])) {
                let responseText = typeof pick[1][0] === 'string' ? pick[1][0].trim() : '';
                responseText = responseText.replace(/^http:\/\/googleusercontent\.com\/card_content\/\d+/g, '');
                responseText = responseText.replace(/http:\/\/googleusercontent\.com\/\w+\/\d+\n*/g, '');
                const images = extractCandidateImages(pick);
                if (responseText || images.length > 0) {
                    index++;
                    messages.push({
                        index,
                        role: 'assistant',
                        text: responseText,
                        images: images.length > 0 ? images : undefined,
                    });
                }
            }
        }
        return messages;
    }
}
// ============================================================================
// Utility Functions
// ============================================================================
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16).toUpperCase();
    });
}
function normalizeChatId(chatId) {
    let id = String(chatId || '').trim();
    if (id.startsWith('http://') || id.startsWith('https://')) {
        const match = id.match(/\/app\/([a-zA-Z0-9_-]+)/);
        if (match) {
            id = match[1];
        }
    }
    if (id && !id.startsWith('c_')) {
        id = `c_${id}`;
    }
    return id;
}
function extractUserAttachments(userPart) {
    const attachments = [];
    const rawAttachments = getNestedValue(userPart, [4]);
    if (rawAttachments) {
        const collect = (node) => {
            if (typeof node === 'string') {
                if (/^https?:\/\//i.test(node) || /^[^/\\:*?"<>|$]{1,120}\.[a-z0-9]{2,6}$/i.test(node)) {
                    if (!attachments.includes(node)) {
                        attachments.push(node);
                    }
                }
            }
            else if (Array.isArray(node)) {
                for (const item of node) {
                    collect(item);
                }
            }
        };
        collect(rawAttachments);
    }
    return attachments;
}
function extractCandidateImages(candidate) {
    const images = [];
    const webImages = getNestedValue(candidate, [12, 1], []) || [];
    if (Array.isArray(webImages)) {
        for (const wi of webImages) {
            const url = getNestedValue(wi, [0, 0, 0]);
            if (url && typeof url === 'string') {
                images.push(url);
            }
        }
    }
    return images;
}
function getExtensionFromMime(mimeType) {
    const map = {
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/webp': 'webp',
        'image/gif': 'gif',
        'application/pdf': 'pdf',
        'text/plain': 'txt',
        'text/markdown': 'md',
        'text/csv': 'csv',
        'text/html': 'html',
        'application/json': 'json',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/msword': 'doc',
    };
    return map[mimeType] || mimeType.split('/')[1] || 'bin';
}
function parseUrlList(input) {
    if (!input)
        return [];
    if (Array.isArray(input)) {
        return input.map(u => String(u).trim()).filter(Boolean);
    }
    if (typeof input === 'string') {
        const trimmed = input.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.map(u => String(u).trim()).filter(Boolean);
                }
            }
            catch {
                // Not JSON, continue to string splitting
            }
        }
        return trimmed.split(/[\r\n,]+/).map(u => u.trim()).filter(Boolean);
    }
    return [];
}
async function downloadFileFromUrl(url) {
    const res = await axios_1.default.get(url, {
        responseType: 'arraybuffer',
        timeout: 30000,
        maxContentLength: 100 * 1024 * 1024,
    });
    const buffer = Buffer.from(res.data);
    const contentType = (res.headers['content-type'] || 'application/octet-stream').split(';')[0].trim();
    let fileName = '';
    const cd = res.headers['content-disposition'];
    if (cd) {
        const match = cd.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?/i);
        if (match && match[1]) {
            try {
                fileName = decodeURIComponent(match[1]);
            }
            catch {
                fileName = match[1];
            }
        }
    }
    if (!fileName) {
        try {
            const urlObj = new URL(url);
            const pathname = urlObj.pathname;
            fileName = pathname.split('/').filter(Boolean).pop() || '';
        }
        catch {
            fileName = url.split('/').pop().split('?')[0];
        }
    }
    if (!fileName || !fileName.includes('.')) {
        const ext = getExtensionFromMime(contentType);
        fileName = fileName ? `${fileName}.${ext}` : `attachment.${ext}`;
    }
    return { buffer, mimeType: contentType, fileName };
}
function getNestedValue(obj, path, defaultValue = undefined) {
    let current = obj;
    for (const key of path) {
        if (current === null || current === undefined)
            return defaultValue;
        current = current[key];
    }
    return current === undefined ? defaultValue : current;
}
function getErrorMessage(code) {
    const messages = {
        // Content generation errors (extracted from response path [0,5,2,0,1,0])
        1013: 'Temporary error, please retry',
        1037: 'Usage limit exceeded (model quota exhausted)',
        1050: 'Model inconsistent with conversation history',
        1052: 'Model unavailable or request structure outdated',
        1060: 'IP temporarily blocked by Google',
        1096: 'Notice: Session history disabled or background session flag',
        1097: 'Feature not available for your account plan',
        1185: 'Notice: Web search grounding event',
        // Account status codes (from GetUserStatus RPC)
        1014: 'Access temporarily unavailable (regional or session restrictions)',
        1016: 'Unauthenticated — session expired or cookies invalid',
        1021: 'Account rejected via Google Account settings',
        1033: 'Account untrusted — failed safety/trust checks',
        1040: 'Terms of Service acceptance required',
        1042: 'Terms of Service out of date',
        1054: 'Account blocked by parent or guardian',
        1057: 'Parent/guardian approval required',
        // Extended error codes
        1115: 'Request rejected by Gemini — possible causes: content safety filter, invalid image attachment, or unsupported model/feature combination. Try: (1) simplify the prompt, (2) remove image attachments, (3) switch to Default model, (4) start a new conversation.',
    };
    return messages[code] || 'Unknown error';
}
/**
 * Extract all top-level JSON arrays from the StreamGenerate response text.
 * The response format is: )]}'\n\n<length>\n[[...]]\n<length>\n[[...]]\n...
 * This function uses a bracket-matching approach to reliably extract each JSON array.
 */
function extractJsonArrays(text) {
    // Remove XSSI prefix
    let cleaned = text;
    if (cleaned.startsWith(")]}'")) {
        cleaned = cleaned.substring(4);
    }
    cleaned = cleaned.trim();
    const results = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escape = false;
    for (let i = 0; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (escape) {
            escape = false;
            continue;
        }
        if (ch === '\\') {
            escape = true;
            continue;
        }
        if (ch === '"') {
            inString = !inString;
            continue;
        }
        if (inString)
            continue;
        if (ch === '[') {
            if (depth === 0)
                start = i;
            depth++;
        }
        else if (ch === ']') {
            depth--;
            if (depth === 0 && start >= 0) {
                const jsonStr = cleaned.substring(start, i + 1);
                try {
                    const parsed = JSON.parse(jsonStr);
                    if (Array.isArray(parsed) && parsed.length > 0) {
                        results.push(parsed);
                    }
                }
                catch {
                    // Skip malformed JSON
                }
                start = -1;
            }
        }
    }
    return results;
}
// ============================================================================
// n8n Node Definition
// ============================================================================
class GeminiWeb {
    constructor() {
        this.description = {
            displayName: 'Gemini Web',
            name: 'geminiWeb',
            icon: 'file:GeminiWeb.svg',
            group: ['transform'],
            version: 1.1,
            subtitle: '={{$parameter["operation"]}}',
            description: 'Google Gemini Web API using browser cookies (no API key required)',
            defaults: {
                name: 'Gemini Web',
            },
            inputs: ['main'],
            outputs: ['main'],
            credentials: [
                {
                    name: 'geminiWebApi',
                    required: true,
                },
            ],
            properties: [
                {
                    displayName: 'Operation',
                    name: 'operation',
                    type: 'options',
                    options: [
                        {
                            name: 'Generate Content',
                            value: 'generate',
                            description: 'Send a prompt to Gemini and receive a response',
                            action: 'Generate content',
                        },
                        {
                            name: 'Chat',
                            value: 'chat',
                            description: 'Send a message in an existing conversation (requires metadata from previous response)',
                            action: 'Send chat message',
                        },
                        {
                            name: 'Test Connection',
                            value: 'testConnection',
                            description: 'Verify that your cookies are valid and can authenticate with Gemini',
                            action: 'Test connection',
                        },
                        {
                            name: 'List Gems',
                            value: 'listGems',
                            description: 'Fetch all available Gems (system predefined and user-created custom Gems)',
                            action: 'List gems',
                        },
                        {
                            name: 'Create Gem',
                            value: 'createGem',
                            description: 'Create a new custom Gem with a system prompt',
                            action: 'Create gem',
                        },
                        {
                            name: 'Update Gem',
                            value: 'updateGem',
                            description: 'Update an existing custom Gem',
                            action: 'Update gem',
                        },
                        {
                            name: 'Delete Gem',
                            value: 'deleteGem',
                            description: 'Delete a custom Gem by its ID',
                            action: 'Delete gem',
                        },
                        {
                            name: 'List Chats',
                            value: 'listChats',
                            description: 'Fetch the list of recent conversations / chats',
                            action: 'List chats',
                        },
                        {
                            name: 'Get All Messages in Chat',
                            value: 'getAllMessagesInChat',
                            description: 'Get all messages and turns from a specific chat by ID',
                            action: 'Get all messages in chat',
                        },
                        {
                            name: 'Delete Chat',
                            value: 'deleteChat',
                            description: 'Delete a conversation by its ID',
                            action: 'Delete chat',
                        },
                    ],
                    default: 'generate',
                },
                {
                    displayName: 'Model',
                    name: 'model',
                    type: 'options',
                    options: Object.entries(MODELS).map(([value, model]) => ({
                        name: model.displayName,
                        value,
                    })),
                    default: 'gemini-3.6-flash',
                    description: 'Choose the Gemini model to use (Advanced models require Google One AI Premium)',
                    displayOptions: {
                        show: {
                            operation: ['generate', 'chat'],
                        },
                    },
                },
                {
                    displayName: 'Prompt',
                    name: 'prompt',
                    type: 'string',
                    typeOptions: {
                        rows: 5,
                    },
                    default: '',
                    description: 'The text prompt to send to Gemini',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['generate', 'chat'],
                        },
                    },
                },
                {
                    displayName: 'Conversation Metadata',
                    name: 'conversationMetadata',
                    type: 'json',
                    default: '',
                    description: 'The metadata JSON from a previous Gemini response (conversationId, responseId, etc.) to continue a conversation. Leave empty to start a new conversation.',
                    displayOptions: {
                        show: {
                            operation: ['chat'],
                        },
                    },
                },
                {
                    displayName: 'Gem ID',
                    name: 'gemId',
                    type: 'string',
                    default: '',
                    description: 'Optional: Specify a Gem ID to use as system prompt for this conversation. You can get Gem IDs from the "List Gems" operation.',
                    displayOptions: {
                        show: {
                            operation: ['generate', 'chat'],
                        },
                    },
                },
                {
                    displayName: 'Include Hidden Gems',
                    name: 'includeHidden',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to include hidden predefined Gems in the result',
                    displayOptions: {
                        show: {
                            operation: ['listGems'],
                        },
                    },
                },
                {
                    displayName: 'Gem Name',
                    name: 'gemName',
                    type: 'string',
                    default: '',
                    description: 'Name of the custom Gem',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['createGem', 'updateGem'],
                        },
                    },
                },
                {
                    displayName: 'Gem System Prompt',
                    name: 'gemPrompt',
                    type: 'string',
                    typeOptions: {
                        rows: 5,
                    },
                    default: '',
                    description: 'System instructions for the custom Gem',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['createGem', 'updateGem'],
                        },
                    },
                },
                {
                    displayName: 'Gem Description',
                    name: 'gemDescription',
                    type: 'string',
                    typeOptions: {
                        rows: 2,
                    },
                    default: '',
                    description: 'Optional description of the Gem (has no effect on model behavior)',
                    displayOptions: {
                        show: {
                            operation: ['createGem', 'updateGem'],
                        },
                    },
                },
                {
                    displayName: 'Gem ID to Update/Delete',
                    name: 'gemIdManage',
                    type: 'string',
                    default: '',
                    description: 'The ID of the Gem to update or delete',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['updateGem', 'deleteGem'],
                        },
                    },
                },
                {
                    displayName: 'Chat Limit',
                    name: 'chatLimit',
                    type: 'number',
                    typeOptions: {
                        minValue: 1,
                        maxValue: 100,
                    },
                    default: 50,
                    description: 'Max number of chats to fetch',
                    displayOptions: {
                        show: {
                            operation: ['listChats'],
                        },
                    },
                },
                {
                    displayName: 'Chat ID',
                    name: 'chatId',
                    type: 'string',
                    default: '',
                    description: 'The conversation ID (e.g. "c_..." or Gemini URL)',
                    required: true,
                    displayOptions: {
                        show: {
                            operation: ['deleteChat', 'getAllMessagesInChat'],
                        },
                    },
                },
                {
                    displayName: 'Output Format',
                    name: 'outputFormat',
                    type: 'options',
                    options: [
                        {
                            name: 'Each Message as Item',
                            value: 'eachMessage',
                            description: 'Output each message as a separate item',
                        },
                        {
                            name: 'Single Object (Messages Array)',
                            value: 'singleItem',
                            description: 'Output one item containing an array of all messages',
                        },
                    ],
                    default: 'eachMessage',
                    description: 'How to structure the output data',
                    displayOptions: {
                        show: {
                            operation: ['getAllMessagesInChat'],
                        },
                    },
                },
                {
                    displayName: 'Temporary Mode',
                    name: 'temporary',
                    type: 'boolean',
                    default: false,
                    description: 'Whether to use temporary/incognito mode (conversation will not be saved to history)',
                    displayOptions: {
                        show: {
                            operation: ['generate', 'chat'],
                        },
                    },
                },
                {
                    displayName: 'Attachments / Files',
                    name: 'imageInput',
                    type: 'options',
                    options: [
                        {
                            name: 'None',
                            value: 'none',
                            description: 'Text only, no attachments',
                        },
                        {
                            name: 'Binary: Auto-Detect (All Files)',
                            value: 'auto',
                            description: 'Automatically scan and upload all binary files from the input item (images, PDFs, documents, text)',
                        },
                        {
                            name: 'Binary: Specific Properties',
                            value: 'binary',
                            description: 'Manually specify which binary property names contain files',
                        },
                        {
                            name: 'File URLs (Array or List)',
                            value: 'urls',
                            description: 'Provide URLs of files to download and attach',
                        },
                        {
                            name: 'Combined (Binary + URLs)',
                            value: 'combined',
                            description: 'Attach both binary files and URLs',
                        },
                    ],
                    default: 'none',
                    description: 'Whether to attach files (images, PDFs, documents) to the prompt',
                    displayOptions: {
                        show: {
                            operation: ['generate', 'chat'],
                        },
                    },
                },
                {
                    displayName: 'Binary Property Names',
                    name: 'binaryPropertyName',
                    type: 'string',
                    default: 'data',
                    description: 'Name of the binary property containing the file(s). Comma-separated for multiple (e.g. "data,document2").',
                    displayOptions: {
                        show: {
                            operation: ['generate', 'chat'],
                            imageInput: ['binary', 'combined'],
                        },
                    },
                },
                {
                    displayName: 'File URLs',
                    name: 'fileUrls',
                    type: 'string',
                    typeOptions: {
                        rows: 3,
                    },
                    default: '',
                    description: 'Array of URLs (e.g. {{ $json.urls }}) or newline/comma-separated URLs to download and attach',
                    displayOptions: {
                        show: {
                            operation: ['generate', 'chat'],
                            imageInput: ['urls', 'combined'],
                        },
                    },
                },
                {
                    displayName: 'Response Format',
                    name: 'responseFormat',
                    type: 'options',
                    options: [
                        {
                            name: 'Text Only',
                            value: 'text',
                            description: 'Return only the text response',
                        },
                        {
                            name: 'Full Response',
                            value: 'full',
                            description: 'Return full response with metadata, images, and conversation info',
                        },
                    ],
                    default: 'text',
                    description: 'Choose the format of the response output',
                    displayOptions: {
                        show: {
                            operation: ['generate', 'chat'],
                        },
                    },
                },
            ],
        };
    }
    async execute() {
        const items = this.getInputData();
        const returnData = [];
        // Get credentials
        const credentials = await this.getCredentials('geminiWebApi');
        // Parse cookies based on auth mode
        let cookies = {};
        if (credentials.authMode === 'cookieJson') {
            cookies = parseCookieJson(credentials.cookieJson);
        }
        else {
            if (credentials.secure1Psid) {
                cookies['__Secure-1PSID'] = credentials.secure1Psid;
            }
            if (credentials.secure1Psidts) {
                cookies['__Secure-1PSIDTS'] = credentials.secure1Psidts;
            }
        }
        if (!cookies['__Secure-1PSID']) {
            throw new n8n_workflow_1.NodeOperationError(this.getNode(), '__Secure-1PSID cookie is required. Please provide it in the credentials.');
        }
        const proxyUrl = credentials.proxyUrl || '';
        const proxy = parseProxy(proxyUrl);
        // Create Gemini client
        const client = new GeminiWebClient(cookies, proxy);
        const operation = this.getNodeParameter('operation', 0);
        // ====================================================================
        // Gem Management Operations (single execution, not per-item)
        // ====================================================================
        if (operation === 'testConnection') {
            try {
                const result = await client.testConnection();
                returnData.push({
                    json: result,
                    pairedItem: { item: 0 },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            success: false,
                            hasAccessToken: false,
                            message: error.message,
                        },
                        pairedItem: { item: 0 },
                    });
                }
                else {
                    throw error;
                }
            }
            return [returnData];
        }
        if (operation === 'listGems') {
            try {
                const includeHidden = this.getNodeParameter('includeHidden', 0);
                const gems = await client.fetchGems(includeHidden);
                for (const gem of gems) {
                    returnData.push({
                        json: {
                            id: gem.id,
                            name: gem.name,
                            description: gem.description,
                            prompt: gem.prompt,
                            predefined: gem.predefined,
                            type: gem.predefined ? 'system' : 'custom',
                        },
                        pairedItem: { item: 0 },
                    });
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: 0 },
                    });
                }
                else {
                    throw error;
                }
            }
            return [returnData];
        }
        if (operation === 'createGem') {
            try {
                const name = this.getNodeParameter('gemName', 0);
                const prompt = this.getNodeParameter('gemPrompt', 0);
                const description = this.getNodeParameter('gemDescription', 0) || '';
                const gem = await client.createGem(name, prompt, description);
                returnData.push({
                    json: {
                        success: true,
                        id: gem.id,
                        name: gem.name,
                        description: gem.description,
                        prompt: gem.prompt,
                        predefined: false,
                    },
                    pairedItem: { item: 0 },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: 0 },
                    });
                }
                else {
                    throw error;
                }
            }
            return [returnData];
        }
        if (operation === 'updateGem') {
            try {
                const gemId = this.getNodeParameter('gemIdManage', 0);
                const name = this.getNodeParameter('gemName', 0);
                const prompt = this.getNodeParameter('gemPrompt', 0);
                const description = this.getNodeParameter('gemDescription', 0) || '';
                const gem = await client.updateGem(gemId, name, prompt, description);
                returnData.push({
                    json: {
                        success: true,
                        id: gem.id,
                        name: gem.name,
                        description: gem.description,
                        prompt: gem.prompt,
                        predefined: false,
                    },
                    pairedItem: { item: 0 },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: 0 },
                    });
                }
                else {
                    throw error;
                }
            }
            return [returnData];
        }
        if (operation === 'deleteGem') {
            try {
                const gemId = this.getNodeParameter('gemIdManage', 0);
                await client.deleteGem(gemId);
                returnData.push({
                    json: {
                        success: true,
                        id: gemId,
                        message: `Gem ${gemId} has been deleted.`,
                    },
                    pairedItem: { item: 0 },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: 0 },
                    });
                }
                else {
                    throw error;
                }
            }
            return [returnData];
        }
        if (operation === 'listChats') {
            try {
                const limit = this.getNodeParameter('chatLimit', 0, 50);
                const chats = await client.listChats(limit);
                for (const chat of chats) {
                    returnData.push({
                        json: chat,
                        pairedItem: { item: 0 },
                    });
                }
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: { error: error.message },
                        pairedItem: { item: 0 },
                    });
                }
                else {
                    throw error;
                }
            }
            return [returnData];
        }
        if (operation === 'deleteChat') {
            for (let i = 0; i < items.length; i++) {
                try {
                    const chatId = this.getNodeParameter('chatId', i);
                    const res = await client.deleteChat(chatId);
                    returnData.push({
                        json: res,
                        pairedItem: { item: i },
                    });
                }
                catch (error) {
                    if (this.continueOnFail()) {
                        returnData.push({
                            json: { error: error.message },
                            pairedItem: { item: i },
                        });
                    }
                    else {
                        throw error;
                    }
                }
            }
            return [returnData];
        }
        if (operation === 'getAllMessagesInChat') {
            for (let i = 0; i < items.length; i++) {
                try {
                    const chatId = this.getNodeParameter('chatId', i);
                    const outputFormat = this.getNodeParameter('outputFormat', i, 'eachMessage');
                    const messages = await client.getChatMessages(chatId);
                    const normalizedId = normalizeChatId(chatId);
                    if (outputFormat === 'singleItem') {
                        returnData.push({
                            json: {
                                chatId: normalizedId,
                                totalMessages: messages.length,
                                messages,
                            },
                            pairedItem: { item: i },
                        });
                    }
                    else {
                        for (const msg of messages) {
                            returnData.push({
                                json: {
                                    chatId: normalizedId,
                                    ...msg,
                                },
                                pairedItem: { item: i },
                            });
                        }
                    }
                }
                catch (error) {
                    if (this.continueOnFail()) {
                        returnData.push({
                            json: { error: error.message },
                            pairedItem: { item: i },
                        });
                    }
                    else {
                        throw error;
                    }
                }
            }
            return [returnData];
        }
        // ====================================================================
        // Content Generation Operations (per-item processing)
        // ====================================================================
        const model = this.getNodeParameter('model', 0);
        const temporary = this.getNodeParameter('temporary', 0);
        const responseFormat = this.getNodeParameter('responseFormat', 0);
        const gemId = this.getNodeParameter('gemId', 0) || null;
        const imageInput = this.getNodeParameter('imageInput', 0) || 'none';
        for (let i = 0; i < items.length; i++) {
            try {
                const prompt = this.getNodeParameter('prompt', i);
                let metadata = null;
                if (operation === 'chat') {
                    const metadataStr = this.getNodeParameter('conversationMetadata', i);
                    if (metadataStr) {
                        if (typeof metadataStr === 'object') {
                            metadata = metadataStr;
                        } else {
                            try {
                                metadata = JSON.parse(metadataStr);
                            }
                            catch (e) {
                                throw new n8n_workflow_1.NodeOperationError(this.getNode(), `Invalid conversation metadata JSON: ${e.message}`, { itemIndex: i });
                            }
                        }
                    }
                }
                // Upload attachments (images, PDFs, documents) from binary data or URLs
                const files = [];
                const uploadErrors = [];
                // 1. Process Binary Data
                if (imageInput === 'auto' || imageInput === 'combined') {
                    const binaryData = items[i].binary;
                    if (binaryData && typeof binaryData === 'object') {
                        for (const propName of Object.keys(binaryData)) {
                            const bd = binaryData[propName];
                            if (!bd)
                                continue;
                            try {
                                const buffer = await this.helpers.getBinaryDataBuffer(i, propName);
                                const mimeType = bd.mimeType || 'application/octet-stream';
                                const fileName = bd.fileName || `${propName}.${getExtensionFromMime(mimeType)}`;
                                const isImage = mimeType.startsWith('image/');
                                const url = await client.uploadFile(buffer, mimeType, fileName);
                                files.push({ url, fileName, isImage });
                            }
                            catch (uploadError) {
                                const errMsg = `[Binary: ${propName}] ${uploadError.message}`;
                                uploadErrors.push(errMsg);
                                if (!this.continueOnFail()) {
                                    throw uploadError;
                                }
                            }
                        }
                    }
                }
                else if (imageInput === 'binary') {
                    const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) || 'data';
                    const propNames = binaryPropertyName.split(',').map(s => s.trim()).filter(Boolean);
                    for (const propName of propNames) {
                        try {
                            const binaryData = items[i].binary?.[propName];
                            if (!binaryData) {
                                continue;
                            }
                            const buffer = await this.helpers.getBinaryDataBuffer(i, propName);
                            const mimeType = binaryData.mimeType || 'application/octet-stream';
                            const fileName = binaryData.fileName || `${propName}.${getExtensionFromMime(mimeType)}`;
                            const isImage = mimeType.startsWith('image/');
                            const url = await client.uploadFile(buffer, mimeType, fileName);
                            files.push({ url, fileName, isImage });
                        }
                        catch (uploadError) {
                            const errMsg = `[Binary: ${propName}] ${uploadError.message}`;
                            uploadErrors.push(errMsg);
                            if (!this.continueOnFail()) {
                                throw uploadError;
                            }
                        }
                    }
                }
                // 2. Process URLs
                if (imageInput === 'urls' || imageInput === 'combined') {
                    let fileUrlsRaw = '';
                    try {
                        fileUrlsRaw = this.getNodeParameter('fileUrls', i);
                    }
                    catch {
                        fileUrlsRaw = '';
                    }
                    const urlList = parseUrlList(fileUrlsRaw);
                    for (const fileUrl of urlList) {
                        try {
                            const downloaded = await downloadFileFromUrl(fileUrl);
                            const isImage = downloaded.mimeType.startsWith('image/');
                            const url = await client.uploadFile(downloaded.buffer, downloaded.mimeType, downloaded.fileName);
                            files.push({ url, fileName: downloaded.fileName, isImage });
                        }
                        catch (downloadError) {
                            const errMsg = `[URL: ${fileUrl}] ${downloadError.message}`;
                            uploadErrors.push(errMsg);
                            if (!this.continueOnFail()) {
                                throw downloadError;
                            }
                        }
                    }
                }
                const response = await client.generateContent({
                    prompt,
                    model,
                    metadata,
                    temporary,
                    gemId,
                    files,
                });
                let output;
                const uploadedUrls = files.map(f => f.url);
                if (responseFormat === 'full') {
                    output = {
                        text: response.text,
                        conversationId: response.conversationId,
                        responseId: response.responseId,
                        candidateId: response.candidateId,
                        metadata: response.metadata,
                        images: response.images,
                        inputFiles: files.length > 0 ? files : undefined,
                        inputImages: uploadedUrls.length > 0 ? uploadedUrls : undefined,
                        uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
                        done: response.done,
                        model,
                        gemId: gemId || undefined,
                    };
                }
                else {
                    output = {
                        text: response.text,
                        images: response.images,
                        model,
                        conversationId: response.conversationId,
                        responseId: response.responseId,
                        candidateId: response.candidateId,
                        metadata: response.metadata,
                        gemId: gemId || undefined,
                        inputFiles: files.length > 0 ? files : undefined,
                        inputImages: uploadedUrls.length > 0 ? uploadedUrls : undefined,
                        uploadErrors: uploadErrors.length > 0 ? uploadErrors : undefined,
                    };
                }
                returnData.push({
                    json: output,
                    pairedItem: { item: i },
                });
            }
            catch (error) {
                if (this.continueOnFail()) {
                    returnData.push({
                        json: {
                            error: error.message,
                        },
                        pairedItem: { item: i },
                    });
                    continue;
                }
                throw error;
            }
        }
        return [returnData];
    }
}
exports.GeminiWeb = GeminiWeb;
