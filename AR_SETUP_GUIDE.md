# AR Generation Setup Guide

## Overview
The AR generation feature automatically creates 3D models from product images using Meshy.ai API. This guide will help you set up the required API key and configure the system.

## Prerequisites
- A Meshy.ai account
- Valid Meshy API key
- **Paid Meshy.ai subscription** (Free plan no longer supports 3D model generation)

## Setup Steps

### 1. Get Meshy API Key and Subscription
1. Visit [Meshy.ai](https://meshy.ai)
2. Sign up for an account
3. **Upgrade to a paid plan** (required for 3D model generation)
4. Navigate to your API dashboard
5. Generate a new API key
6. Copy the API key

### 2. Configure Environment Variables
Create a `.env` file in your backend directory with the following:

```env
# Existing environment variables
PORT=4000
MONGO_URI=mongodb://127.0.0.1:27017/excom
JWT_SECRET=change_me
GEMINI_API_KEY=your_key

# Add this line for AR generation
MESHY_API_KEY=your_meshy_api_key_here
```

### 3. Test the Setup
Run the AR system test to verify everything is working:

```bash
cd backend
npm run test:ar
```

Or manually test by creating a product with images in the vendor dashboard.

## How It Works

### Automatic AR Generation
- When you create a new product with images, AR generation starts automatically
- The system uses the first uploaded image to generate a 3D model
- Generation status is tracked and displayed in the vendor dashboard

### Manual AR Generation
- You can also manually trigger AR generation from the vendor dashboard
- Click the expand button on any product card to access AR management tools
- Use the "Generate 3D Model" button to start generation

### AR Generation Process
1. **Image Upload**: Product images are uploaded to Cloudinary
2. **API Call**: First image is sent to Meshy.ai for 3D model generation
3. **Status Tracking**: System polls Meshy.ai for generation progress
4. **Model Upload**: Completed 3D model is uploaded to Cloudinary
5. **Product Update**: Product is updated with 3D model URL and status

## Troubleshooting

### Common Issues

#### "MESHY_API_KEY not found"
- Ensure the API key is set in your `.env` file
- Restart your backend server after adding the key
- Check that the `.env` file is in the correct location

#### "NoMatchingRoute" Error
- Verify your Meshy API key is valid and active
- Check that you're using the correct API version
- Ensure your account has sufficient credits

#### "NoMorePendingTasks" Error (402 Status)
- **Cause**: Meshy.ai free plan no longer supports 3D model generation
- **Solution**: Upgrade your Meshy.ai subscription at [https://www.meshy.ai/settings/subscription](https://www.meshy.ai/settings/subscription)
- **Note**: This is a Meshy.ai policy change, not a system error

### Debug Mode
Enable detailed logging by checking the backend console for:
- API request/response details
- Error messages and status codes
- Generation progress updates

## API Endpoints

The following AR-related endpoints are available:

- `POST /api/ar/:id/generate-3d` - Start 3D model generation
- `GET /api/ar/:id/3d-status` - Check generation status
- `POST /api/ar/:id/upload-3d` - Upload custom 3D model
- `DELETE /api/ar/:id/3d-model` - Delete 3D model
- `POST /api/ar/:id/regenerate-3d` - Regenerate 3D model

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the backend console logs
3. Verify your Meshy API key and account status
4. Contact support with specific error messages
