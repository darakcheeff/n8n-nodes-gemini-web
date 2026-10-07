# n8n-nodes-gemini-web

An [n8n](https://n8n.io) community node for Google Gemini Web API using browser cookies — **no API key required**.

This node reverse-engineers the Gemini web interface to send prompts and receive responses, using your browser cookies for authentication. It works similarly to the [gemini-web-to-api](https://github.com/ntthanh2603/gemini-web-to-api) project but as a native n8n node.

## Features

- **No API Key Required** — Uses your Google browser cookies for authentication
- **Multiple Models** — Supports Gemini 3 Pro, Flash, Thinking, Plus, and Advanced models
- **Multi-turn Chat** — Continue conversations using metadata from previous responses
- **Gemini Gems Support** — List, create, update, delete, and use Gems as system prompts
- **Temporary Mode** — Send messages without saving to Gemini history
- **Full Cookie JSON Support** — Paste the entire cookie array exported from your browser
- **Proxy Support** — Route requests through HTTP/HTTPS/SOCKS proxies

## Installation

### In n8n (Community Nodes)

1. Go to **Settings** > **Community Nodes**
2. Select **Install a community node**
3. Enter `n8n-nodes-gemini-web` as the npm package name
4. Click **Install**

### Manual Installation

For self-hosted n8n installations:

```bash
# Navigate to your n8n custom nodes directory
cd ~/.n8n/custom

# Install the package
npm install n8n-nodes-gemini-web
```

Restart n8n after installation.

## Getting Your Google Cookies

### Method 1: Full Cookie Export (Recommended)

1. Install a browser cookie export extension (e.g., [Cookie-Editor](https://cookie-editor.cgagnier.ca/) or [EditThisCookie](https://chrome.google.com/webstore/detail/editthiscookie/fngmhnnpilhplaeedifhccceomclgfbg))
2. Go to [gemini.google.com](https://gemini.google.com) and log in
3. Click the cookie extension icon and export all cookies as JSON
4. In n8n, create a **Gemini Web API** credential
5. Select **Full Cookie JSON** as the authentication mode
6. Paste the exported cookie array into the **Cookie JSON** field

### Method 2: Individual Cookies

1. Go to [gemini.google.com](https://gemini.google.com) and log in
2. Open DevTools (F12) → **Application** → **Cookies** → `https://gemini.google.com`
3. Copy the value of `__Secure-1PSID`
4. Optionally copy `__Secure-1PSIDTS`
5. In n8n, create a **Gemini Web API** credential
6. Select **Individual Cookies** as the authentication mode
7. Paste the cookie values

## Usage

### Generate Content

Send a single prompt to Gemini:

1. Add the **Gemini Web** node to your workflow
2. Select **Generate Content** as the operation
3. Choose a model (or use Default)
4. Enter your prompt
5. Execute

### Chat (Multi-turn)

Continue a conversation:

1. Use **Generate Content** first to start a conversation
2. Set **Response Format** to **Full Response**
3. In the output, you'll find a `metadata` field — copy it
4. Add another **Gemini Web** node, select **Chat** operation
5. Paste the metadata JSON into **Conversation Metadata**
6. Enter your follow-up prompt

### Using Gems (System Prompts)

Gems are custom AI assistants with predefined system prompts. You can use them to give Gemini specific personalities or instructions.

#### List Available Gems

1. Select **List Gems** as the operation
2. Optionally enable **Include Hidden Gems** to see predefined system Gems
3. Execute — returns a list of all Gems with their IDs, names, descriptions, and prompts

#### Use a Gem in Conversation

1. First, run **List Gems** to get the Gem ID you want to use
2. Select **Generate Content** or **Chat** as the operation
3. Enter the Gem ID in the **Gem ID** field
4. Enter your prompt and execute — Gemini will respond using the Gem's system prompt

#### Create a Custom Gem

1. Select **Create Gem** as the operation
2. Enter a **Gem Name** (e.g., "Python Tutor")
3. Enter the **Gem System Prompt** (e.g., "You are a helpful Python programming tutor")
4. Optionally enter a **Gem Description**
5. Execute — returns the created Gem with its ID

#### Update a Gem

1. Select **Update Gem** as the operation
2. Enter the **Gem ID to Update/Delete**
3. Provide the new name, system prompt, and description
4. Execute

#### Delete a Gem

1. Select **Delete Gem** as the operation
2. Enter the **Gem ID to Update/Delete**
3. Execute

## Available Models

| Model | Description | Tier |
|-------|-------------|------|
| Gemini 3 Pro | Most capable general model | Basic |
| Gemini 3 Flash | Fast and capable | Basic |
| Gemini 3 Flash Thinking | Extended reasoning with thinking | Basic |
| Gemini 3 Pro Plus | Enhanced Pro with higher limits | Plus |
| Gemini 3 Flash Plus | Enhanced Flash with higher limits | Plus |
| Gemini 3 Flash Thinking Plus | Extended reasoning with higher limits | Plus |
| Gemini 3 Pro Advanced | Top-tier Pro model | Advanced |
| Gemini 3 Flash Advanced | Top-tier Flash model | Advanced |
| Gemini 3 Flash Thinking Advanced | Top-tier thinking model | Advanced |

> **Note**: Plus and Advanced tier models require a Google One AI Premium subscription or equivalent.

## Important Notes

- **Cookie Expiration**: Google cookies expire periodically. If you get authentication errors, re-export your cookies.
- **Rate Limits**: Gemini web has rate limits. Excessive requests may temporarily block your IP.
- **Terms of Service**: This project uses reverse engineering to access Gemini's web interface. This may violate Google's Terms of Service. Use at your own risk.
- **Privacy**: Your cookies provide full access to your Google account. Never share them.

## License

MIT
