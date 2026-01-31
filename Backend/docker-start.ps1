# PowerShell script to start Docker services for SchooliAt Backend
# Usage: .\docker-start.ps1

Write-Host "Starting Docker services for SchooliAt Backend..." -ForegroundColor Green

# Check if Docker is running
$dockerRunning = docker info 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error: Docker is not running. Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Start services
Write-Host "`nStarting PostgreSQL, Redis, and MinIO..." -ForegroundColor Yellow
docker-compose up -d

# Wait a moment for services to initialize
Start-Sleep -Seconds 5

# Check service status
Write-Host "`nService Status:" -ForegroundColor Cyan
docker-compose ps

# Display connection information
Write-Host "`n=== Service Connection Details ===" -ForegroundColor Green
Write-Host "PostgreSQL:" -ForegroundColor Yellow
Write-Host "  Host: localhost"
Write-Host "  Port: 5432"
Write-Host "  Database: schooliat_db"
Write-Host "  Username: schooliat"
Write-Host "  Password: schooliat_dev_password"
Write-Host "  Connection: postgresql://schooliat:schooliat_dev_password@localhost:5432/schooliat_db"

Write-Host "`nRedis:" -ForegroundColor Yellow
Write-Host "  Host: localhost"
Write-Host "  Port: 6379"
Write-Host "  Password: schooliat_redis_password"

Write-Host "`nMinIO:" -ForegroundColor Yellow
Write-Host "  API Endpoint: http://localhost:9000"
Write-Host "  Console: http://localhost:9001"
Write-Host "  Access Key: minioadmin"
Write-Host "  Secret Key: minioadmin123"
Write-Host "  Bucket: schooliat-files"

Write-Host "`n=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Copy .env.example to .env (if not already done)"
Write-Host "2. Run database migrations: npm run prisma:migrate"
Write-Host "3. Start the backend server: npm run dev"
Write-Host "`nTo view logs: docker-compose logs -f"
Write-Host "To stop services: docker-compose down"

