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
                        name: 'Full Cookie JSON',
                        value: 'cookieJson',
                        description: 'Paste the full cookie array exported from browser (e.g. EditThisCookie extension)',
                    },
                    {
                        name: 'Individual Cookies',
                        value: 'individual',
                        description: 'Enter __Secure-1PSID and __Secure-1PSIDTS values directly',
                    },
                ],
                default: 'cookieJson',
                description: 'Choose how to provide Google cookies',
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
                description: 'The __Secure-1PSIDTS cookie value (optional but recommended for session stability)',
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
