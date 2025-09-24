# AR/3D Model Integration Setup

This document explains how to set up the Augmented Reality (AR) and 3D model functionality in your Excom marketplace.

## Features Implemented

### ✅ Backend Features
- **Product Model Updates**: Added 3D model fields to Product schema
- **Meshy.ai Integration**: AI-powered 2D to 3D model generation
- **Cloudinary 3D Storage**: Support for GLTF, GLB, and USDZ files
- **API Endpoints**: Complete CRUD operations for 3D models
- **File Upload**: Support for custom 3D model uploads

### ✅ Frontend Features
- **AR Viewer Component**: Interactive 3D model viewer with AR support
- **Vendor Management**: 3D model management in vendor dashboard
- **Product Page Integration**: AR viewer on product detail pages
- **Model Viewer**: Google's model-viewer integration
- **Responsive Design**: Works on desktop and mobile devices

## Setup Instructions

### 1. Backend Configuration

#### Install Dependencies
```bash
cd backend
npm install axios multer uuid @types/multer @types/uuid
```

#### Environment Variables
Add these to your `.env` file:
```env
# Meshy.ai API Configuration
MESHY_API_KEY=your_meshy_api_key_here

# Optional: Configure 3D model generation settings
MESHY_GENERATION_MODE=preview+texture
MESHY_STYLE=realistic
MESHY_ART_STYLE=realistic
```

#### Get Meshy.ai API Key
1. Visit [Meshy.ai](https://meshy.ai/)
2. Sign up for an account
3. Get your API key from the dashboard
4. Add it to your environment variables

### 2. Frontend Configuration

#### Install Dependencies
```bash
cd frontend
npm install @google/model-viewer
```

#### Model Viewer Script
The model-viewer script is automatically loaded in the layout.tsx file.

### 3. Database Migration

The Product model has been updated with new fields:
- `modelUrl`: URL to the 3D model file
- `modelType`: Type of 3D model (gltf, glb, usdz)
- `modelStatus`: Status of generation (none, generating, ready, failed)
- `modelGeneratedAt`: When the model was generated
- `modelGenerationId`: Meshy.ai generation ID

No manual migration is needed - MongoDB will handle the schema updates automatically.

## Usage Guide

### For Vendors

#### Upload Custom 3D Model
1. Go to Vendor Dashboard → Products
2. Click the expand button (▼) on any product card
3. In the 3D Model Management section:
   - Click "Choose File" to upload GLTF, GLB, or USDZ files
   - Maximum file size: 50MB

#### Generate AI 3D Model
1. Ensure your product has at least one image
2. In the 3D Model Management section:
   - Click "Generate Model" to create 3D model from product image
   - Wait 2-5 minutes for AI generation
   - Status updates automatically

#### Manage Existing Models
- **Preview**: View the 3D model in browser
- **Download**: Download the model file
- **Regenerate**: Create a new AI-generated model
- **Delete**: Remove the 3D model

### For Customers

#### Viewing 3D Models
1. Visit any product page with a 3D model
2. Scroll to the "View in 3D & AR" section
3. Interact with the 3D model:
   - **Rotate**: Click and drag
   - **Zoom**: Mouse wheel or pinch
   - **Pan**: Right-click and drag
   - **Auto-rotate**: Toggle in controls

#### AR Experience
1. Click "View in AR" button (mobile devices)
2. Point camera at a flat surface
3. Place the 3D model in your environment
4. Walk around and interact with the model

## API Endpoints

### 3D Model Management
- `POST /api/ar/:id/generate-3d` - Generate 3D model from image
- `GET /api/ar/:id/3d-status` - Check generation status
- `POST /api/ar/:id/upload-3d` - Upload custom 3D model
- `DELETE /api/ar/:id/3d-model` - Delete 3D model
- `POST /api/ar/:id/regenerate-3d` - Regenerate 3D model

### Authentication Required
All endpoints require seller/admin authentication.

## Supported File Formats

### Input Formats
- **Images**: JPG, PNG (for AI generation)
- **3D Models**: GLTF, GLB, USDZ

### Output Formats
- **GLB**: Recommended for web viewing
- **USDZ**: Required for iOS AR Quick Look
- **GLTF**: Standard web format

## Browser Support

### 3D Model Viewing
- **Chrome**: Full support
- **Firefox**: Full support
- **Safari**: Full support
- **Edge**: Full support

### AR Features
- **iOS Safari**: AR Quick Look (USDZ)
- **Android Chrome**: WebXR AR
- **Desktop**: Model viewer only

## Troubleshooting

### Common Issues

#### 3D Model Not Loading
- Check file format (GLTF, GLB, USDZ)
- Verify file size (< 50MB)
- Check browser console for errors

#### AR Not Working
- Ensure device supports AR
- Use HTTPS (required for AR)
- Try on mobile device

#### Generation Failed
- Verify Meshy.ai API key
- Check product has valid image
- Retry generation

### Performance Tips
- Use GLB format for best performance
- Optimize 3D models before upload
- Consider file size for mobile users

## Future Enhancements

### Planned Features
- **AR Size Guide**: Scale objects to real-life size
- **AR Bundle Preview**: Multiple products in one scene
- **Premium Features**: Gold/Platinum vendor benefits
- **Cookie-based Sessions**: Save AR preferences
- **Advanced Controls**: More interaction options

### Integration Opportunities
- **Product Customization**: AR color/material changes
- **Virtual Try-On**: Fashion and accessories
- **Room Planning**: Furniture placement
- **Technical Visualization**: Complex product demos

## Support

For technical support or questions about the AR integration:
1. Check this documentation
2. Review browser console for errors
3. Verify API key configuration
4. Test with different file formats

## Cost Considerations

### Meshy.ai Pricing
- Check current pricing at [Meshy.ai](https://meshy.ai/)
- Consider usage limits for your application
- Monitor API usage in dashboard

### Storage Costs
- Cloudinary charges for 3D model storage
- Consider file size optimization
- Monitor storage usage

---

**Note**: This AR integration enhances the shopping experience by allowing customers to visualize products in their own space before purchasing, leading to higher conversion rates and reduced returns.
