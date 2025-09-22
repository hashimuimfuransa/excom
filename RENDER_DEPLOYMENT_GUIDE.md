# Render Deployment Guide for Excom Frontend

## Issues Fixed

The white blank screen issue was caused by several configuration problems:

1. **Custom build directory**: Removed `distDir: 'build'` from Next.js config
2. **Missing environment variables**: Added proper API base URL configuration
3. **Port configuration**: Updated start script to use `$PORT` environment variable
4. **Error handling**: Added ErrorBoundary component to catch and display errors
5. **API configuration**: Made API base URL dynamic for production vs development

## Deployment Steps

### 1. Environment Variables in Render

In your Render dashboard, add these environment variables:

```
NODE_ENV=production
NEXT_PUBLIC_API_BASE=https://your-backend-url.onrender.com/api
NEXT_PUBLIC_APP_URL=https://your-frontend-url.onrender.com
```

### 2. Build Settings

- **Build Command**: `cd frontend && npm install && npm run build`
- **Start Command**: `cd frontend && npm start`
- **Node Version**: 20.x

### 3. Important Notes

- Make sure your backend is deployed and accessible
- Update the `NEXT_PUBLIC_API_BASE` URL to match your actual backend URL
- The frontend will now gracefully handle API errors instead of showing a white screen

### 4. Troubleshooting

If you still see issues:

1. Check the Render logs for any build errors
2. Verify that all environment variables are set correctly
3. Ensure your backend API is running and accessible
4. Check the browser console for any JavaScript errors

### 5. Testing Locally

To test the production build locally:

```bash
cd frontend
npm run build
npm start
```

This will help you identify any issues before deploying to Render.

## Files Modified

- `frontend/next.config.mjs` - Removed custom distDir, added standalone output
- `frontend/utils/api.ts` - Made API base URL dynamic
- `frontend/package.json` - Updated start script to use $PORT
- `frontend/components/ErrorBoundary.tsx` - Added error boundary component
- `frontend/app/layout.tsx` - Wrapped app with error boundary
- `frontend/app/page.tsx` - Added better error handling
- `render.yaml` - Added Render configuration template
