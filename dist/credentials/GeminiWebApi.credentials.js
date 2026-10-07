"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiWebApi = void 0;
class GeminiWebApi {
    constructor() {
        this.name = 'geminiWebApi';
        this.displayName = 'Gemini Web API';
        this.documentationUrl = 'https://github.com/n8n-nodes-gemini-web/n8n-nodes-gemini-web';
        this.properties = [
            {
                displayName: 'Authentication Mode',
                name: 'authMode',
                type: 'options',
                options: [
                    {
                        name: 'Raw Cookie Header / String',
                        value: 'cookieString',
                        description: 'Paste the full Cookie header string copied from browser DevTools (e.g. __Secure-1PSID=...; __Secure-1PSIDTS=...)',
                    },
                    {
                        name: 'Full Cookie JSON',
                        value: 'cookieJson',
                        description: 'Paste the full cookie array exported from browser (e.g. EditThisCookie extension)',
                    },
                    {
                        name: 'Individual Cookies',
                        value: 'individual',
                        description: 'Enter __Secure-1PSID, __Secure-1PSIDTS, and __Secure-1PSIDCC values directly',
                    },
                ],
                default: 'cookieString',
                description: 'Choose how to provide Google cookies',
            },
            {
                displayName: 'Cookie Header String',
                name: 'cookieString',
                type: 'string',
                typeOptions: {
                    rows: 5,
                },
                default: '',
                description: 'Paste the complete Cookie header string copied from DevTools -> Network -> any gemini.google.com request (starts with __Secure-1PSID=... or AEC=...)',
                displayOptions: {
                    show: {
                        authMode: ['cookieString'],
                    },
                },
                placeholder: '__Secure-1PSID=g.a000...; __Secure-1PSIDTS=sidts-...; __Secure-1PSIDCC=AKEyX...',
            },
            {
                displayName: 'Cookie JSON',
                name: 'cookieJson',
                type: 'string',
                typeOptions: {
                    rows: 10,
                },
                default: '',
                description: 'Paste the full cookie array JSON exported from your browser (e.g. from EditThisCookie / Cookie-Editor extension). The node will automatically extract __Secure-1PSID and other required cookies.',
                displayOptions: {
                    show: {
                        authMode: ['cookieJson'],
                    },
                },
                placeholder: '[{"domain":".google.com","name":"__Secure-1PSID","value":"g.a000..."}, ...]',
            },
            {
                displayName: '__Secure-1PSID',
                name: 'secure1Psid',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                description: 'The __Secure-1PSID cookie value from gemini.google.com',
                displayOptions: {
                    show: {
                        authMode: ['individual'],
                    },
                },
            },
            {
                displayName: '__Secure-1PSIDTS',
                name: 'secure1Psidts',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                description: 'The __Secure-1PSIDTS cookie value (timestamp / freshness token)',
                displayOptions: {
                    show: {
                        authMode: ['individual'],
                    },
                },
            },
            {
                displayName: '__Secure-1PSIDCC',
                name: 'secure1Psidcc',
                type: 'string',
                typeOptions: {
                    password: true,
                },
                default: '',
                description: 'The __Secure-1PSIDCC cookie value (client verification token)',
                displayOptions: {
                    show: {
                        authMode: ['individual'],
                    },
                },
            },
            {
                displayName: 'Proxy URL',
                name: 'proxyUrl',
                type: 'string',
                default: '',
                description: 'Optional HTTP/HTTPS/SOCKS proxy URL (e.g. http://user:pass@host:port)',
                placeholder: 'http://127.0.0.1:7890',
            },
        ];
    }
}
exports.GeminiWebApi = GeminiWebApi;
