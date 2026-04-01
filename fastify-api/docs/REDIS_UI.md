# Redis Commander UI Guide

## Overview

Redis Commander is a web-based management tool for Redis that provides a user-friendly interface to view, manage, and monitor your Redis data.

## Access

### Development Environment

**URL:** http://localhost:8081

**Credentials:**
- Username: `admin`
- Password: `admin`

### Production Environment

**URL:** http://localhost:8081

**Credentials:**
- Username: Set via `REDIS_UI_USER` environment variable
- Password: Set via `REDIS_UI_PASSWORD` environment variable

## Quick Start

### 1. Start Redis Commander

Redis Commander starts automatically with your Docker environment:

```bash
# Start development environment (includes Redis Commander)
make dev

# Or using docker-compose
docker-compose up -d
```

### 2. Access the UI

Open your browser and navigate to:
```
http://localhost:8081
```

Login with:
- **Username:** admin
- **Password:** admin

### 3. View Redis Data

Once logged in, you can:
- Browse all Redis keys
- View key values and types
- Edit key values
- Delete keys
- Monitor Redis statistics
- Execute Redis commands

## Features

### 📊 Key Management
- **Browse Keys:** Navigate through all keys in your Redis instance
- **Search Keys:** Filter keys by pattern
- **View Values:** See the content of any key
- **Edit Values:** Modify key values directly
- **Delete Keys:** Remove keys individually or in bulk
- **Set TTL:** Configure key expiration times

### 🔍 Data Types Support
- **Strings:** Simple key-value pairs
- **Hashes:** Field-value pairs
- **Lists:** Ordered collections
- **Sets:** Unordered unique collections
- **Sorted Sets:** Ordered unique collections with scores
- **Streams:** Log-like data structures

### 📈 Monitoring
- **Server Info:** View Redis server statistics
- **Memory Usage:** Monitor memory consumption
- **Connected Clients:** See active connections
- **Command Statistics:** Track command usage
- **Keyspace Info:** Database statistics

### 🛠️ CLI Console
- **Execute Commands:** Run Redis commands directly
- **Command History:** Access previously executed commands
- **Auto-complete:** Command suggestions

## Common Use Cases

### 1. View OTP Codes (Development)

Navigate to the `otp_verifications` keys to see generated OTP codes:

1. Click on **Keys** in the sidebar
2. Search for `otp_verifications`
3. Click on a key to view the OTP code and user data

### 2. Monitor Queue Jobs

View background job queue status:

1. Search for `queue:*` keys
2. View job details, status, and payloads
3. Monitor pending, processing, and completed jobs

### 3. Check Cache Data

Inspect cached data:

1. Browse cache keys (if implemented)
2. View cache hit/miss statistics
3. Clear cache entries when needed

### 4. Debug Session Data

View user sessions (if stored in Redis):

1. Search for `session:*` keys
2. View session data
3. Delete expired sessions

## Configuration

### Environment Variables

**Development (`.env`):**
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=

# Redis UI
REDIS_UI_USER=admin
REDIS_UI_PASSWORD=admin
```

**Production (`.env.production`):**
```env
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=your_secure_password

# Redis UI - Change these!
REDIS_UI_USER=your_username
REDIS_UI_PASSWORD=your_secure_password
```

### Docker Compose Configuration

**Development (`docker-compose.yml`):**
```yaml
redis-commander:
  image: rediscommander/redis-commander:latest
  container_name: pushmycv-redis-ui
  ports:
    - "8081:8081"
  environment:
    - REDIS_HOSTS=local:redis:6379
    - HTTP_USER=admin
    - HTTP_PASSWORD=admin
```

**Production (`docker-compose.prod.yml`):**
```yaml
redis-commander:
  image: rediscommander/redis-commander:latest
  container_name: pushmycv-redis-ui-prod
  ports:
    - "8081:8081"
  environment:
    - REDIS_HOSTS=local:redis:6379
    - REDIS_PASSWORD=${REDIS_PASSWORD}
    - HTTP_USER=${REDIS_UI_USER}
    - HTTP_PASSWORD=${REDIS_UI_PASSWORD}
```

## Security Best Practices

### Development
- ✅ Default credentials are acceptable
- ✅ Accessible only on localhost
- ✅ Not exposed to internet

### Production
- ⚠️ **Change default credentials immediately**
- ⚠️ **Use strong passwords**
- ⚠️ **Restrict network access**
- ⚠️ **Enable HTTPS via Nginx**
- ⚠️ **Use firewall rules**
- ⚠️ **Consider VPN access only**

### Recommended Production Setup

1. **Change Credentials:**
```env
REDIS_UI_USER=your_secure_username
REDIS_UI_PASSWORD=your_very_secure_password_here
```

2. **Restrict Access via Nginx:**

Add to `nginx/nginx.conf`:
```nginx
location /redis-ui {
    auth_basic "Restricted Access";
    auth_basic_user_file /etc/nginx/.htpasswd;
    
    proxy_pass http://redis-commander:8081;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

3. **Use IP Whitelisting:**
```nginx
location /redis-ui {
    allow 192.168.1.0/24;  # Your office network
    deny all;
    
    proxy_pass http://redis-commander:8081;
}
```

## Troubleshooting

### Cannot Access Redis Commander

**Check if container is running:**
```bash
docker-compose ps redis-commander
```

**View logs:**
```bash
docker-compose logs redis-commander
```

**Restart the service:**
```bash
docker-compose restart redis-commander
```

### Connection Refused

**Verify Redis is running:**
```bash
docker-compose ps redis
```

**Check Redis connectivity:**
```bash
docker-compose exec redis redis-cli ping
# Should return: PONG
```

### Authentication Failed

**Verify credentials in `.env`:**
```bash
cat .env | grep REDIS_UI
```

**Reset to defaults:**
```env
REDIS_UI_USER=admin
REDIS_UI_PASSWORD=admin
```

Then restart:
```bash
docker-compose restart redis-commander
```

### Port Already in Use

**Change the port in `docker-compose.yml`:**
```yaml
ports:
  - "8082:8081"  # Use 8082 instead
```

## Keyboard Shortcuts

- **Ctrl + F:** Search keys
- **Ctrl + K:** Focus on key input
- **Esc:** Close dialogs
- **Enter:** Execute command in CLI

## Alternative Redis UIs

If you prefer other tools:

### 1. RedisInsight (Official)
```yaml
redisinsight:
  image: redislabs/redisinsight:latest
  ports:
    - "8001:8001"
  volumes:
    - redisinsight:/db
```

### 2. Redis Desktop Manager
- Desktop application (not Docker)
- Available for Windows, macOS, Linux
- Download: https://resp.app/

### 3. redis-cli (Command Line)
```bash
# Access Redis CLI
docker-compose exec redis redis-cli

# Common commands
KEYS *                    # List all keys
GET key_name             # Get value
SET key_name value       # Set value
DEL key_name             # Delete key
TTL key_name             # Check expiration
FLUSHDB                  # Clear database
INFO                     # Server info
```

## Make Commands

```bash
# View Redis UI info
make redis-ui

# Start development (includes Redis UI)
make dev

# View Redis Commander logs
docker-compose logs -f redis-commander

# Restart Redis Commander
docker-compose restart redis-commander

# Stop Redis Commander only
docker-compose stop redis-commander
```

## Useful Redis Commands via UI

### View All Keys
```redis
KEYS *
```

### Search for OTP Keys
```redis
KEYS otp:*
```

### Get Key Value
```redis
GET key_name
```

### Check Key Type
```redis
TYPE key_name
```

### View Hash Fields
```redis
HGETALL hash_key
```

### Monitor Real-time Commands
```redis
MONITOR
```

### Get Server Info
```redis
INFO
```

### Check Memory Usage
```redis
INFO memory
```

## Data Visualization

Redis Commander provides visual representations for:

- **Key Distribution:** See how keys are distributed across databases
- **Memory Usage:** Visual breakdown of memory consumption
- **Command Statistics:** Charts showing command frequency
- **Connection Stats:** Active connections over time

## Export/Import Data

### Export Keys
1. Select keys to export
2. Click **Export** button
3. Choose format (JSON, CSV, Redis protocol)
4. Download file

### Import Keys
1. Click **Import** button
2. Upload file (JSON, CSV, Redis protocol)
3. Confirm import
4. Keys are added to Redis

## Performance Tips

- **Limit Key Scans:** Use specific patterns instead of `KEYS *`
- **Use Search:** Filter keys before viewing
- **Paginate Results:** Don't load all keys at once
- **Monitor Memory:** Keep an eye on Redis memory usage
- **Set TTLs:** Configure expiration for temporary data

## Integration with PushMyCV

### OTP Verification Keys
- **Pattern:** `otp_verifications:*`
- **Type:** Hash
- **Fields:** email, otp, user_data, expires_at, attempts, verified

### Queue Jobs
- **Pattern:** `queue:jobs:*`
- **Type:** Hash
- **Fields:** id, type, payload, status, priority, created_at

### Session Data (if implemented)
- **Pattern:** `session:*`
- **Type:** String or Hash
- **TTL:** Session expiration time

## Resources

- **Redis Commander GitHub:** https://github.com/joeferner/redis-commander
- **Redis Documentation:** https://redis.io/documentation
- **Redis Commands:** https://redis.io/commands

## Support

For issues or questions:
- Check Redis Commander logs
- Verify Redis connectivity
- Ensure correct credentials
- Review Docker network configuration

Happy Redis management! 🔍
