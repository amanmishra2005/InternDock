// Simple high-performance in-memory TTL Cache to prevent MongoDB query overload during heavy traffic spikes.

const cacheStore = new Map();

function getCache(key) {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiry) {
    cacheStore.delete(key);
    return null;
  }
  return item.value;
}

function setCache(key, value, ttlSeconds = 600) {
  cacheStore.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

function clearCache(key) {
  if (key) {
    cacheStore.delete(key);
  } else {
    cacheStore.clear();
  }
}

module.exports = { getCache, setCache, clearCache };
