# CORS Fix for Vercel Frontend

## Problem
The frontend at `https://excom-ten.vercel.app` is being blocked by CORS when trying to access the backend at `https://excombackend.onrender.com`.

## Solution Applied
Updated the backend CORS configuration to include the Vercel URL and made it more flexible with environment variables.

## Changes Made
1. Added `https://excom-ten.vercel.app` to allowed origins
2. Created a flexible `allowedOrigins` array that can be extended via environment variables
3. Both Socket.io and Express CORS now use the same configuration

## Next Steps

### Option 1: Redeploy Backend (Recommended)
1. Push the changes to your repository
2. Redeploy your backend on Render
3. The new CORS configuration will take effect

### Option 2: Use Environment Variable (Alternative)
If you can't redeploy immediately, you can add this environment variable in your Render dashboard:

```
ADDITIONAL_ORIGINS=https://excom-ten.vercel.app
```

## Current Allowed Origins
- `http://localhost:3000` (local development)
- `http://127.0.0.1:3000` (local development)
- `https://excom-tyry.onrender.com` (current production)
- `https://excom-ten.vercel.app` (new Vercel deployment) ✅
- `process.env.FRONTEND_URL` (environment variable)
- `process.env.ADDITIONAL_ORIGINS` (comma-separated list)

## Testing
After deployment, test by:
1. Opening `https://excom-ten.vercel.app` in your browser
2. Check the browser console for CORS errors
3. Verify that API calls to `https://excombackend.onrender.com` work properly

## Files Modified
- `backend/src/index.ts` - Updated CORS configuration
