#!/bin/bash
# Bash script to start Docker services for SchooliAt Backend
# Usage: ./docker-start.sh

echo "Starting Docker services for SchooliAt Backend..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "Error: Docker is not running. Please start Docker."
    exit 1
fi

# Start services
echo ""
echo "Starting PostgreSQL, Redis, and MinIO..."
docker-compose up -d

# Wait a moment for services to initialize
sleep 5

# Check service status
echo ""
echo "Service Status:"
docker-compose ps

# Display connection information
echo ""
echo "=== Service Connection Details ==="
echo "PostgreSQL:"
echo "  Host: localhost"
echo "  Port: 5432"
echo "  Database: schooliat_db"
echo "  Username: schooliat"
echo "  Password: schooliat_dev_password"
echo "  Connection: postgresql://schooliat:schooliat_dev_password@localhost:5432/schooliat_db"

echo ""
echo "Redis:"
echo "  Host: localhost"
echo "  Port: 6379"
echo "  Password: schooliat_redis_password"

echo ""
echo "MinIO:"
echo "  API Endpoint: http://localhost:9000"
echo "  Console: http://localhost:9001"
echo "  Access Key: minioadmin"
echo "  Secret Key: minioadmin123"
echo "  Bucket: schooliat-files"

echo ""
echo "=== Next Steps ==="
echo "1. Copy .env.example to .env (if not already done)"
echo "2. Run database migrations: npm run prisma:migrate"
echo "3. Start the backend server: npm run dev"
echo ""
echo "To view logs: docker-compose logs -f"
echo "To stop services: docker-compose down"

