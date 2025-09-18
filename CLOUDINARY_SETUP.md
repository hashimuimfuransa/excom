# Cloudinary Setup Guide

This application uses Cloudinary for image hosting and management. Follow these steps to set up Cloudinary for your deployment.

## For Development/Testing (Current Setup)

The application is currently configured to use Cloudinary's demo cloud for testing purposes:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=demo
```

This allows you to:
- Test image uploads during development
- Use placeholder images from the demo cloud
- Not worry about API limits during development

## For Production Setup

### Step 1: Create a Cloudinary Account

1. Go to [Cloudinary](https://cloudinary.com)
2. Sign up for a free account
3. Note down your:
   - Cloud Name
   - API Key  
   - API Secret

### Step 2: Create an Upload Preset

1. Go to your Cloudinary dashboard
2. Navigate to Settings > Upload
3. Scroll down to "Upload presets"
4. Click "Add upload preset"
5. Configure the preset:
   - **Preset name**: `excom_uploads` (or any name you prefer)
   - **Signing Mode**: `Unsigned` (for direct uploads from frontend)
   - **Use filename or externally defined Public ID**: Enable
   - **Unique filename**: Enable
   - **Folder**: `excom` (organizes uploads)
   - **Auto-optimize delivery**: Enable
   - **Auto-format delivery**: Enable
   - **Quality**: Auto
6. Save the preset

### Step 3: Update Environment Variables

Update your `.env.local` file:

```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_actual_cloud_name
```

If you used a different upload preset name, also update the cloudinary utility:

```typescript
// In utils/cloudinary.ts
const UPLOAD_PRESET = 'your_preset_name'; // Change from 'ml_default'
```

### Step 4: Configure Transformations (Optional)

For better performance, you can set up automatic transformations:

1. In your upload preset, add transformations:
   - **Format**: Auto
   - **Quality**: Auto
   - **Width**: 1200 (max width)
   - **Crop**: Limit

## Security Considerations

### For Production:

1. **Use Signed Uploads**: Consider switching to signed uploads for better security
2. **Restrict Upload Sources**: Configure allowed domains in Cloudinary settings
3. **Set Upload Limits**: Configure file size and count limits
4. **Enable Moderation**: Set up auto-moderation for inappropriate content

### Environment Variables:

```env
# Public (safe to expose in frontend)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name

# Private (keep secret, use for signed uploads)
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## Features Enabled

The current implementation provides:

✅ **Direct Frontend Uploads**: Users can upload images directly to Cloudinary  
✅ **Automatic Optimization**: Images are automatically optimized for web  
✅ **Format Conversion**: Images are automatically converted to the best format  
✅ **Error Handling**: Comprehensive error handling with user-friendly messages  
✅ **File Validation**: File type and size validation before upload  
✅ **Multiple File Support**: Batch upload multiple images  
✅ **Progress Indication**: Loading states during upload  
✅ **Fallback Images**: High-quality stock images when no images are uploaded

## Troubleshooting

### Common Issues:

1. **401 Unauthorized**
   - Check that `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` is set correctly
   - Verify the upload preset exists and is unsigned
   - Make sure the preset name in code matches Cloudinary

2. **Network Error**  
   - Check internet connection
   - Verify Cloudinary service status

3. **File Too Large**
   - Default limit is 10MB per file
   - Check Cloudinary account limits
   - Adjust file size validation if needed

4. **Upload Preset Not Found**
   - Verify preset name in Cloudinary dashboard
   - Ensure preset is set to "unsigned" mode
   - Check spelling of preset name in code

### Debug Information:

You can enable debug mode by adding console logs in the Cloudinary utility:

```typescript
// Add to utils/cloudinary.ts
console.log('Cloud Name:', CLOUDINARY_CLOUD_NAME);
console.log('Upload Preset:', UPLOAD_PRESET);
```

## Migration Notes

If migrating from picsum or other image services:

1. Existing images will continue to work with the new image helper system
2. New uploads will use Cloudinary
3. The application will automatically detect real vs stock images
4. Stock images will be clearly labeled in the UI

## Support

For issues with Cloudinary:
- Check [Cloudinary Documentation](https://cloudinary.com/documentation)  
- Contact Cloudinary Support for account-specific issues
- File issues in the project repository for application-specific problems