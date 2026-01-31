# API Integration Documentation

## Overview
The dashboard is fully integrated with the production backend API at `https://schooliat-backend.onrender.com`.

## Configuration

### Environment Variables
The API base URL is configured via the `.env.local` file:

```env
NEXT_PUBLIC_API_URL=https://schooliat-backend.onrender.com
```

**Note:** For local development, you can override this in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### API Client
The API client is located at `lib/api/client.ts` and handles:
- Base URL configuration
- Authentication token management
- Error handling
- Request/response formatting

### Authentication
Authentication is handled in `lib/api/auth.ts` and uses the same base URL configuration.

## API Endpoints

The backend API uses direct route mounting (no `/api/v1` prefix). All endpoints are relative to the base URL:

- **Auth**: `/auth/authenticate`
- **Users**: `/users/*`
- **Schools**: `/schools/*`
- **Students**: `/users/students`
- **Teachers**: `/users/teachers`
- **Transport**: `/transports`
- **Calendar**: `/calendar`
- **Circulars/Notices**: `/notices`
- **Fees**: `/fees`
- **ID Cards**: `/id-cards`
- **Exams/Results**: `/exams`
- **Settings**: `/settings`
- **Statistics**: `/statistics/*`
- **Files**: `/files`
- **Letterhead**: `/letterhead`
- **Grievances**: `/grievances`
- **Licenses**: `/licenses`
- **Receipts**: `/receipts`
- **Vendors**: `/vendors`
- **Regions**: `/regions`
- **Locations**: `/locations`
- **Salary**: `/salary-structures`, `/salary-payments`, `/salaries`

## Request Format

All POST/PATCH requests wrap the payload in a `request` object:

```typescript
{
  request: {
    // actual data
  }
}
```

## Response Format

All API responses follow this structure:

```typescript
{
  message: string;
  data: any;
}
```

## Error Handling

The API client automatically handles:
- **401 Unauthorized**: Triggers logout and redirects to login
- **403 Forbidden**: Shows access denied message
- **500+ Server Errors**: Shows server error message
- **Network Errors**: Shows connection error message

## Testing

To test the API integration:

1. Ensure `.env.local` is configured with the production API URL
2. Start the development server: `npm run dev`
3. Test login functionality
4. Verify API calls in the browser Network tab

## Health Check

The backend health endpoint is available at:
```
https://schooliat-backend.onrender.com/health
```

## Documentation

API documentation is available at:
```
https://schooliat-backend.onrender.com/docs
```

