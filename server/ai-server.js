import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MAX_BODY_BYTES = 64 * 1024;
const DEFAULT_PORT = 8787;

const loadEnvFile = (filePath) => {
  if (!existsSync(filePath)) {
    return;
  }

  const contents = readFileSync(filePath, 'utf8');
  for (const line of contents.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const [key, ...rest] = trimmed.split('=');
    if (!key) {
      continue;
    }

    const value = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadEnvFile(resolve(process.cwd(), '.env'));

const PORT = Number(process.env.AI_SERVER_PORT || DEFAULT_PORT);
const PROVIDER = (process.env.AI_PROVIDER || 'ollama').toLowerCase();
const MODEL = process.env.AI_MODEL || 'llama3.1';
const BASE_URL = process.env.AI_BASE_URL || 'http://localhost:11434';
const ALLOWED_ORIGIN = process.env.AI_ALLOWED_ORIGIN || '*';

const SYSTEM_PROMPT = [
  "You are Digrro's AI assistant for website visitors.",
  'Answer concisely and helpfully in 2-5 sentences.',
  'If pricing or timelines are requested, ask for project scope and offer a consultation.',
  'If you are unsure, say so and suggest speaking with a human.',
  'Company details:',
  '- Services: AI solutions, digital marketing, web and app development, branding and design, AI video creation, consulting, data and analytics.',
  '- Regions: Saudi Arabia, UAE, Qatar.',
  '- Email: info@digrro.com.',
  '- Phone: +966 12 345 6789.',
].join('\n');

const setCors = (res) => {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
};

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
};

const readJson = (req) =>
  new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > MAX_BODY_BYTES) {
        req.destroy();
        reject(new Error('Request too large'));
      }
    });
    req.on('end', () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });

const sanitizeMessages = (messages) => {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages
    .filter((message) => message && (message.role === 'user' || message.role === 'assistant'))
    .map((message) => ({
      role: message.role,
      content: String(message.content || '').trim(),
    }))
    .filter((message) => message.content.length > 0)
    .slice(-12);
};

const callOllama = async (messages) => {
  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      messages,
      stream: false,
      options: {
        temperature: 0.3,
        top_p: 0.9,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Ollama error');
  }

  const data = await response.json();
  const content = data?.message?.content;
  if (!content) {
    throw new Error('No response from Ollama');
  }

  return String(content).trim();
};

const callOpenAICompatible = async (messages) => {
  if (!process.env.AI_BASE_URL) {
    throw new Error('AI_BASE_URL is required for openai-compatible provider');
  }

  const headers = { 'Content-Type': 'application/json' };
  if (process.env.AI_API_KEY) {
    headers.Authorization = `Bearer ${process.env.AI_API_KEY}`;
  }

  const response = await fetch(`${BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.3,
      max_tokens: 400,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'OpenAI-compatible error');
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('No response from AI provider');
  }

  return String(content).trim();
};

const isOpenAICompatible =
  PROVIDER === 'openai' || PROVIDER === 'openai-compatible';

const generateReply = async (messages) => {
  const fullMessages = [{ role: 'system', content: SYSTEM_PROMPT }, ...messages];

  if (isOpenAICompatible) {
    return callOpenAICompatible(fullMessages);
  }

  return callOllama(fullMessages);
};

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'GET' && req.url === '/api/health') {
    sendJson(res, 200, { status: 'ok', provider: PROVIDER, model: MODEL });
    return;
  }

  if (req.method === 'POST' && req.url === '/api/chat') {
    try {
      const payload = await readJson(req);
      const messages = sanitizeMessages(payload?.messages);

      if (!messages.length) {
        sendJson(res, 400, { error: 'No messages provided' });
        return;
      }

      const reply = await generateReply(messages);
      sendJson(res, 200, { reply });
    } catch (err) {
      sendJson(res, 500, { error: err instanceof Error ? err.message : 'Server error' });
    }
    return;
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`AI server listening on http://localhost:${PORT}`);
  console.log(`Provider: ${PROVIDER}, model: ${MODEL}`);
});
