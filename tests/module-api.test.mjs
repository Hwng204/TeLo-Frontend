import assert from 'node:assert/strict';
import { after, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { createServer as createHttpServer } from 'node:http';
import { createServer } from 'vite';

// Load the real API module; intercept transport so no database is touched.
globalThis.localStorage = { getItem: () => null };
const server = await createServer({
  root: fileURLToPath(new URL('..', import.meta.url)),
  server: { middlewareMode: true },
  appType: 'custom',
});
after(() => server.close());
const { api } = await server.ssrLoadModule('/src/services/api.ts');
const { apiClient } = await server.ssrLoadModule('/src/services/apiClient.ts');
const requests = [];
apiClient.defaults.adapter = async config => {
  requests.push({ method: config.method, url: new URL(apiClient.getUri(config), 'http://localhost') });
  return { data: { success: true, data: true }, status: 200, statusText: 'OK', headers: {}, config };
};

test('module delete omits a missing revision from older DB v2 responses', async () => {
  assert.equal(await api.modules.remove(42, undefined), true);
  const request = requests.at(-1);
  assert.equal(request.method, 'delete');
  assert.equal(request.url.pathname, '/api/modules/42');
  assert.equal(request.url.search, '');
});

test('module delete preserves the supplied revision for concurrency checks', async () => {
  for (const version of [0, 1, 4294967295]) {
    assert.equal(await api.modules.remove(42, version), true);
    assert.equal(requests.at(-1).url.searchParams.get('version'), String(version));
  }
});

test('module delete propagates conflicts instead of reporting success', async () => {
  const originalAdapter = apiClient.defaults.adapter;
  const conflict = Object.assign(new Error('STALE_VERSION'), { response: { status: 409 } });
  apiClient.defaults.adapter = async () => { throw conflict; };
  try {
    await assert.rejects(api.modules.remove(42, 7), error => error === conflict);
  } finally {
    apiClient.defaults.adapter = originalAdapter;
  }
});

test('module delete sends a valid URL over real loopback HTTP transport', async () => {
  const urls = [];
  const transport = createHttpServer((request, response) => {
    assert.equal(request.method, 'DELETE');
    urls.push(request.url);
    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ success: true, data: true }));
  });
  await new Promise((resolve, reject) => {
    transport.once('error', reject);
    transport.listen(0, '127.0.0.1', resolve);
  });
  const original = {
    adapter: apiClient.defaults.adapter,
    baseURL: apiClient.defaults.baseURL,
    proxy: apiClient.defaults.proxy,
  };
  Object.assign(apiClient.defaults, {
    adapter: 'http',
    baseURL: `http://127.0.0.1:${transport.address().port}/api`,
    proxy: false,
  });
  try {
    assert.equal(await api.modules.remove(42), true);
    assert.equal(await api.modules.remove(42, 7), true);
    assert.deepEqual(urls, ['/api/modules/42', '/api/modules/42?version=7']);
  } finally {
    Object.assign(apiClient.defaults, original);
    transport.closeAllConnections();
    await new Promise(resolve => transport.close(resolve));
  }
});
