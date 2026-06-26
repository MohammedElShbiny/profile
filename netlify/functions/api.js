const path = require('path');

function loadHandler(name) {
  return require(path.join(__dirname, '..', '..', 'api', name));
}

function findHandler(method, reqPath) {
  const p = reqPath.replace(/\/+$/, '') || '/api';

  if (p === '/api/projects' || p.match(/^\/api\/projects\/\d+$/)) return loadHandler('projects.js');
  if (p === '/api/services' || p.match(/^\/api\/services\/\d+$/)) return loadHandler('services.js');
  if (p === '/api/contact') return loadHandler('contact.js');
  if (p === '/api/lookup') return loadHandler('lookup.js');
  if (p === '/api/init') return loadHandler('init.js');
  if (p.match(/^\/api\/admin\b/)) return loadHandler('admin.js');
  if (p.match(/^\/api\/chat\b/)) return loadHandler('chat.js');

  return null;
}

exports.handler = async (event) => {
  try {
    const url = new URL(event.path, `https://${event.headers.host || 'localhost'}`);
    if (event.queryStringParameters) {
      for (const [k, v] of Object.entries(event.queryStringParameters)) {
        url.searchParams.set(k, v);
      }
    }

    const request = new Request(url.toString(), {
      method: event.httpMethod,
      headers: new Headers(event.headers),
      body: event.httpMethod !== 'GET' && event.httpMethod !== 'HEAD' && event.body
        ? event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body
        : undefined,
    });

    const handler = findHandler(event.httpMethod, event.path);
    if (!handler) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Not found' }), headers: { 'Content-Type': 'application/json' } };
    }

    const response = await handler(request);
    const body = await response.text();
    const headers = {};
    response.headers.forEach((v, k) => { headers[k] = v; });

    return { statusCode: response.status, body, headers };
  } catch {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }), headers: { 'Content-Type': 'application/json' } };
  }
};
