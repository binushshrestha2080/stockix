const cache = new Map();

function get(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) { cache.delete(key); return null; }
  return item.data;
}

function set(key, data, ttlSeconds = 60) {
  cache.set(key, { data, expiresAt: Date.now() + ttlSeconds * 1000 });
}

module.exports = { get, set };