# ImageKit Setup Guide

## Why Placeholder Images?
Your ImageKit private key is currently masked with `**********`. You need to provide the **complete** private key to enable image uploads.

## How to Get Your ImageKit Credentials

1. **Login to ImageKit Dashboard**: https://imagekit.io/dashboard
2. **Go to Developer Options** → **API Credentials**
3. **Copy your Private Key** (the full key, not masked)
4. **Update the .env file** in the backend directory

## Backend .env File Setup

Create or update `backend/.env` with:

```env
IMAGEKIT_PUBLIC_KEY=public_iQC/A+7kCdKzHy7zBYmkC3ZVDqU=
IMAGEKIT_PRIVATE_KEY=your_complete_private_key_here
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/lejhn0bpzf
```

## Alternative: Use Base64 Encoding (Recommended)

You can also upload images as base64 and send them as JSON instead of multipart/form-data:

### Option 1: Update Frontend to Send Base64

Instead of FormData, convert images to base64 and send as JSON.

### Option 2: Store Images Locally (Development Only)

For development/testing without ImageKit:
- Save images to `backend/uploads/` folder
- Return local file paths
- Set up static file serving

## Current Status

✅ ImageKit is configured  
✅ Multer upload middleware is set up  
⚠️ Missing complete private key → Placeholder URLs are returned  

## To Enable Real Image Uploads

1. **Option A**: Add your complete ImageKit private key to `.env`
2. **Option B**: Modify the backend to store images locally for development
3. **Option C**: Update the frontend to send base64 encoded images

## Quick Fix for Testing

Until ImageKit is fully configured, the system will:
- ✅ Accept image uploads
- ✅ Save shop data to database
- ⚠️ Use placeholder image URLs instead of ImageKit URLs

This allows testing the shop registration flow without ImageKit credentials.

