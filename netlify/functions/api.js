const path = require('path');

const handlers = {};

function loadHandler(relativePath) {
  const fullPath = path.join(__dirname, '..', '..', 'api', relativePath);
  try {
    return require(fullPath);
  } catch {
    return null;
  }
}

const routeMap = [
  ['GET /api/projects', 'projects.js'],
  ['PUT /api/projects', 'projects/[id].js'],
  ['DELETE /api/projects', 'projects/[id].js'],
  ['GET /api/services', 'services.js'],
  ['PUT /api/services', 'services/[id].js'],
  ['DELETE /api/services', 'services/[id].js'],
  ['POST /api/contact', 'contact.js'],
  ['GET /api/lookup', 'lookup.js'],
  ['POST /api/init', 'init.js'],
  ['GET /api/chat', 'chat/[token].js'],
  ['POST /api/chat', 'chat/[token].js'],
  ['GET /api/chat unread', 'chat/[token]/unread.js'],
  ['GET /api/admin/stats', 'admin/stats.js'],
  ['GET /api/admin/inquiries', 'admin/inquiries.js'],
  ['PUT /api/admin/inquiries', 'admin/inquiries/[id].js'],
  ['GET /api/admin/messages', 'admin/messages.js'],
  ['GET /api/admin/messages/', 'admin/messages/[inquiryId].js'],
  ['POST /api/admin/messages/', 'admin/messages/[inquiryId].js'],
];

function findHandler(method, path) {
  const cleanPath = path.replace(/\/+$/, '') || '/api';

  if (cleanPath === '/api/projects') return loadHandler('projects.js');
  if (cleanPath.match(/^\/api\/projects\/\d+$/)) return loadHandler('projects/[id].js');
  if (cleanPath === '/api/services') return loadHandler('services.js');
  if (cleanPath.match(/^\/api\/services\/\d+$/)) return loadHandler('services/[id].js');
  if (cleanPath === '/api/contact') return loadHandler('contact.js');
  if (cleanPath === '/api/lookup') return loadHandler('lookup.js');
  if (cleanPath === '/api/init') return loadHandler('init.js');

  if (cleanPath.match(/^\/api\/chat\/[^/]+\/unread$/)) return loadHandler('chat/[token]/unread.js');
  if (cleanPath.match(/^\/api\/chat\/[^/]+$/)) return loadHandler('chat/[token].js');

  if (cleanPath === '/api/admin/stats') return loadHandler('admin/stats.js');
  if (cleanPath === '/api/admin/inquiries') return loadHandler('admin/inquiries.js');
  if (cleanPath.match(/^\/api\/admin\/inquiries\/\d+$/)) return loadHandler('admin/inquiries/[id].js');
  if (cleanPath === '/api/admin/messages') return loadHandler('admin/messages.js');
  if (cleanPath.match(/^\/api\/admin\/messages\/\d+$/)) return loadHandler('admin/messages/[inquiryId].js');

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
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }), headers: { 'Content-Type': 'application/json' } };
  }
};
