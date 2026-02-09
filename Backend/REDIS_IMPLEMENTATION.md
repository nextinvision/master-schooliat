# Redis Implementation Guide

## Current Status

✅ **Redis is now properly implemented with automatic fallback to in-memory cache**

### Implementation Details

1. **Redis Client** (`src/config/redis.client.js`)
   - Proper Redis connection management
   - Automatic reconnection handling
   - Connection health monitoring
   - Graceful error handling

2. **Cache Service** (`src/services/cache.service.js`)
   - **Redis-first approach:** Uses Redis if available
   - **Automatic fallback:** Falls back to in-memory cache if Redis fails
   - **Transparent API:** Same interface for both Redis and memory
   - **JSON serialization:** Automatically handles JSON serialization/deserialization

3. **Token Blacklist** (`src/services/token-blacklist.service.js`)
   - Updated to use async cache methods
   - Works with both Redis and in-memory cache

---

## Configuration

### Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost          # Redis server host
REDIS_PORT=6379              # Redis server port
REDIS_PASSWORD=              # Redis password (optional)
REDIS_DB=0                   # Redis database number (0-15)
```

### Environment-Specific Configuration

**Staging:**
```env
REDIS_DB=0
```

**Production:**
```env
REDIS_DB=1
```

This allows both environments to use the same Redis instance with separate databases.

---

## Features

### 1. Automatic Fallback

If Redis is not available or connection fails:
- System automatically falls back to in-memory cache
- No errors thrown, seamless operation
- Logs warnings for monitoring

### 2. Connection Management

- **Auto-reconnect:** Automatically reconnects on connection loss
- **Health monitoring:** Tracks connection status
- **Graceful degradation:** Continues operation if Redis fails

### 3. Performance Benefits

**With Redis:**
- Shared cache across multiple server instances
- Persistent cache (survives server restarts with persistence enabled)
- Better memory management
- Distributed caching support

**Without Redis (In-Memory):**
- Fast local cache
- No network overhead
- Suitable for single-instance deployments

---

## Usage Examples

### Basic Caching

```javascript
import cacheService from "./services/cache.service.js";

// Set value
await cacheService.set("user:123", userData, 3600000); // 1 hour TTL

// Get value
const user = await cacheService.get("user:123");

// Check if exists
const exists = await cacheService.has("user:123");

// Delete
await cacheService.delete("user:123");

// Get or set pattern
const data = await cacheService.getOrSet(
  "dashboard:school:123",
  async () => {
    // Fetch function
    return await fetchDashboardData();
  },
  5 * 60 * 1000 // 5 minutes TTL
);
```

### Current Usage in Codebase

1. **Role Service:**
   - Caches role lookups (1 hour TTL)
   - Key format: `role:${roleName}`

2. **Dashboard Service:**
   - Caches dashboard statistics (5 minutes TTL)
   - Key formats:
     - `dashboard:super_admin`
     - `dashboard:school_admin:${schoolId}`
     - `dashboard:teacher:${teacherId}`
     - `dashboard:staff:${staffId}`
     - `dashboard:student:${studentId}`
     - `dashboard:parent:${parentId}`

3. **Token Blacklist:**
   - Stores blacklisted JWT tokens
   - Key format: `blacklist:${token}`
   - TTL matches token expiration

---

## Redis Setup

### Using Docker Compose

The project includes `docker-compose.yml` with Redis:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
  command: redis-server --appendonly yes --requirepass your_password
```

### Manual Setup

1. **Install Redis:**
   ```bash
   # Ubuntu/Debian
   sudo apt-get install redis-server
   
   # macOS
   brew install redis
   ```

2. **Start Redis:**
   ```bash
   redis-server
   ```

3. **Configure Password (Optional):**
   ```bash
   redis-cli
   CONFIG SET requirepass your_password
   ```

4. **Set Environment Variables:**
   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   REDIS_PASSWORD=your_password
   REDIS_DB=0
   ```

---

## Monitoring

### Check Redis Connection

The system logs Redis connection status:
- ✅ `Redis client connected` - Successfully connected
- ⚠️ `Redis not configured` - Redis not enabled
- ❌ `Redis client error` - Connection failed

### Cache Statistics

```javascript
const stats = await cacheService.getStats();
console.log(stats);
// Redis: { type: "redis", size: 150, connected: true, info: "..." }
// Memory: { type: "memory", size: 50, keys: [...], connected: false }
```

### Health Check

Redis connection status is checked on:
- Server startup
- Each cache operation
- Automatic reconnection on failure

---

## Migration from In-Memory to Redis

The implementation is **backward compatible**. No code changes needed:

1. **Current State:** Using in-memory cache
2. **Enable Redis:** Set `REDIS_HOST` environment variable
3. **Automatic Switch:** System automatically uses Redis
4. **Fallback:** If Redis fails, falls back to memory

---

## Best Practices

### 1. Key Naming

Use consistent key naming patterns:
- `role:${roleName}`
- `dashboard:${role}:${id}`
- `blacklist:${token}`
- `user:${userId}`

### 2. TTL Management

Set appropriate TTLs:
- **Short-lived data:** 5 minutes (dashboard stats)
- **Medium-lived data:** 1 hour (role lookups)
- **Long-lived data:** 24 hours (static configurations)

### 3. Error Handling

The cache service handles errors gracefully:
- Redis errors → Fallback to memory
- Memory errors → Return null
- Never throws errors that break the application

### 4. Cache Invalidation

Invalidate cache when data changes:
```javascript
// After updating user
await cacheService.delete(`user:${userId}`);
await dashboardService.invalidateDashboardCache(schoolId);
```

---

## Production Recommendations

### 1. Redis Persistence

Enable Redis persistence for production:
```bash
redis-server --appendonly yes --save 60 1000
```

### 2. Redis Clustering

For high availability, consider:
- Redis Sentinel (master-slave with failover)
- Redis Cluster (sharding)

### 3. Memory Management

Configure Redis max memory:
```bash
redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

### 4. Monitoring

Monitor Redis:
- Memory usage
- Connection count
- Hit/miss ratio
- Slow queries

---

## Troubleshooting

### Redis Not Connecting

1. **Check Redis is running:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

2. **Check environment variables:**
   ```bash
   echo $REDIS_HOST
   echo $REDIS_PORT
   ```

3. **Check firewall:**
   ```bash
   # Ensure port 6379 is open
   ```

4. **Check logs:**
   - Look for Redis connection errors in application logs

### Performance Issues

1. **Check Redis memory:**
   ```bash
   redis-cli info memory
   ```

2. **Check slow queries:**
   ```bash
   redis-cli slowlog get 10
   ```

3. **Monitor hit rate:**
   ```bash
   redis-cli info stats
   ```

---

## Testing

### Test Redis Connection

```javascript
import { isRedisConnected, getRedisClient } from "./config/redis.client.js";

if (isRedisConnected()) {
  const client = getRedisClient();
  const pong = await client.ping();
  console.log("Redis:", pong); // Should be "PONG"
}
```

### Test Cache Service

```javascript
import cacheService from "./services/cache.service.js";

// Test set/get
await cacheService.set("test:key", { data: "value" }, 60000);
const value = await cacheService.get("test:key");
console.log("Cached value:", value);

// Test stats
const stats = await cacheService.getStats();
console.log("Cache stats:", stats);
```

---

## Summary

✅ **Redis is properly implemented:**
- Redis client with connection management
- Cache service with Redis support
- Automatic fallback to in-memory
- Transparent API (no code changes needed)
- Production-ready with error handling

**Current Status:** Redis is configured and ready to use. Simply set `REDIS_HOST` environment variable to enable it. The system will automatically use Redis if available, or fall back to in-memory cache if not.

---

**End of Redis Implementation Guide**

