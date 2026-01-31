# Docker Setup for Local Development

This guide explains how to set up and run the SchooliAt backend services using Docker for local development.

## Prerequisites

- Docker Desktop installed and running (or Docker Engine + Docker Compose)
- Node.js 20.19.0 or higher (for running the backend application)
- npm 10.0.0 or higher

## Services

The Docker setup includes:

1. **PostgreSQL 16** - Database server
2. **Redis 7** - Caching and session storage
3. **MinIO** - S3-compatible object storage

## Quick Start

### 1. Start Docker Services

```bash
# Start all services in the background
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f
```

### 2. Configure Environment Variables

Copy the example environment file and update it:

```bash
cp .env.example .env
```

The `.env.example` file is already configured for local Docker development. You may need to adjust values based on your setup.

### 3. Run Database Migrations

```bash
# Install dependencies (if not already done)
npm install

# Run migrations
npm run prisma:migrate
```

### 4. Start the Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start
```

## Service Details

### PostgreSQL

- **Host**: `localhost`
- **Port**: `5432`
- **Database**: `schooliat_db`
- **Username**: `schooliat`
- **Password**: `schooliat_dev_password`

Connection string:
```
postgresql://schooliat:schooliat_dev_password@localhost:5432/schooliat_db
```

### Redis

- **Host**: `localhost`
- **Port**: `6379`
- **Password**: `schooliat_redis_password`

Connection details:
```
Host: localhost
Port: 6379
Password: schooliat_redis_password
```

### MinIO

- **API Endpoint**: `http://localhost:9000`
- **Console**: `http://localhost:9001`
- **Access Key**: `minioadmin`
- **Secret Key**: `minioadmin123`
- **Bucket**: `schooliat-files` (created automatically)

Access the MinIO console at: http://localhost:9001

## Docker Commands

### Start Services

```bash
# Start in background
docker-compose up -d

# Start with logs
docker-compose up
```

### Stop Services

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop and remove containers + volumes (⚠️ deletes data)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f postgres
docker-compose logs -f redis
docker-compose logs -f minio
```

### Check Service Health

```bash
# Check all services
docker-compose ps

# Check specific service
docker inspect schooliat-postgres | grep Health -A 10
```

### Access Service Shells

```bash
# PostgreSQL
docker exec -it schooliat-postgres psql -U schooliat -d schooliat_db

# Redis CLI
docker exec -it schooliat-redis redis-cli -a schooliat_redis_password

# MinIO Client
docker exec -it schooliat-minio mc alias set myminio http://localhost:9000 minioadmin minioadmin123
```

## Data Persistence

All data is persisted in Docker volumes:

- `postgres_data` - PostgreSQL database files
- `redis_data` - Redis data files
- `minio_data` - MinIO object storage

To backup data:

```bash
# Backup PostgreSQL
docker exec schooliat-postgres pg_dump -U schooliat schooliat_db > backup.sql

# Backup Redis
docker exec schooliat-redis redis-cli -a schooliat_redis_password --rdb /data/dump.rdb
```

## Troubleshooting

### Services Won't Start

1. Check if ports are already in use:
   ```bash
   # Windows
   netstat -ano | findstr :5432
   netstat -ano | findstr :6379
   netstat -ano | findstr :9000
   
   # Linux/Mac
   lsof -i :5432
   lsof -i :6379
   lsof -i :9000
   ```

2. Check Docker logs:
   ```bash
   docker-compose logs
   ```

### Database Connection Issues

1. Ensure PostgreSQL is healthy:
   ```bash
   docker-compose ps postgres
   ```

2. Test connection:
   ```bash
   docker exec -it schooliat-postgres psql -U schooliat -d schooliat_db -c "SELECT 1;"
   ```

### MinIO Bucket Not Created

The bucket is created automatically by the `minio-setup` service. If it fails:

```bash
# Manually create bucket
docker exec -it schooliat-minio mc alias set myminio http://minio:9000 minioadmin minioadmin123
docker exec -it schooliat-minio mc mb myminio/schooliat-files
docker exec -it schooliat-minio mc anonymous set download myminio/schooliat-files
```

## Production/Staging on Hostinger VPS

For production and staging environments on Hostinger VPS:

1. **Do NOT use Docker Compose** - Install services directly on the VPS
2. Update `.env` file with production credentials:
   - Database connection string from Hostinger
   - Redis connection details
   - AWS S3 or MinIO credentials
3. Use environment-specific configuration
4. Ensure proper security settings (firewall, SSL, etc.)

## Next Steps

- [ ] Implement Redis caching in the application
- [ ] Set up database backups
- [ ] Configure production environment variables
- [ ] Set up monitoring and logging

## Additional Resources

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Redis Documentation](https://redis.io/docs/)
- [MinIO Documentation](https://min.io/docs/)

