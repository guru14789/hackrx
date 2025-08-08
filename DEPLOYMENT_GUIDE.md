# Deployment Guide

This guide explains how to deploy your LLM-powered document analysis system across three platforms:
- **Frontend**: Vercel
- **Backend**: Render
- **Database**: Firebase Firestore

## Prerequisites

1. OpenAI API Key
2. Firebase project configured (hackrx-4d649)
3. Vercel account
4. Render account

## 1. Backend Deployment on Render

### Step 1: Push Code to GitHub
```bash
git add .
git commit -m "Deploy ready configuration"
git push origin main
```

### Step 2: Create Render Service
1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure service:
   - **Name**: `hackrx-backend`
   - **Environment**: `Node`
   - **Region**: `Oregon (US West)`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build:server`
   - **Start Command**: `npm run start:server`

### Step 3: Environment Variables
Add these environment variables in Render:
```
NODE_ENV=production
OPENAI_API_KEY=your_openai_api_key_here
PORT=10000
FIREBASE_PROJECT_ID=hackrx-4d649
```

### Step 4: Deploy
- Click "Create Web Service"
- Wait for deployment (5-10 minutes)
- Note your backend URL: `https://your-app-name.onrender.com`

## 2. Frontend Deployment on Vercel

### Step 1: Update vercel.json
Update the `vercel.json` file with your Render backend URL:
```json
{
  "buildCommand": "npm run build:client",
  "outputDirectory": "client/dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://YOUR-RENDER-BACKEND.onrender.com/api/$1" }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://YOUR-RENDER-BACKEND.onrender.com"
  }
}
```

### Step 2: Deploy to Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Or connect via GitHub:
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Import your GitHub repository
   - Configure build settings:
     - **Framework**: Vite
     - **Build Command**: `npm run build:client`
     - **Output Directory**: `client/dist`

### Step 3: Environment Variables
Set in Vercel dashboard:
```
VITE_API_BASE_URL=https://your-render-backend.onrender.com
```

## 3. Firebase Configuration

Your Firebase project is already configured:
- **Project ID**: `hackrx-4d649`
- **Collections**: 
  - `processing_requests`
  - `processing_results` 
  - `processing_status`

The system automatically uses Firebase Firestore in production and memory storage in development.

## 4. Testing Deployment

### Health Check
```bash
curl https://your-render-backend.onrender.com/api/v1/health
```

### Webhook Test
```bash
curl -X POST https://your-render-backend.onrender.com/api/v1/webhook/document-process \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://example.com/document.pdf",
    "questions": ["What is this document about?"],
    "webhook_id": "test_deployment"
  }'
```

### Frontend Test
Visit your Vercel URL and test document upload functionality.

## 5. Post-Deployment Configuration

### Update CORS (if needed)
If you encounter CORS issues, update your Render backend to allow your Vercel domain:

```javascript
// In server/index.ts
app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app',
    'http://localhost:5173' // For local development
  ],
  credentials: true
}));
```

### Monitor Logs
- **Render**: Check logs in Render dashboard for backend issues
- **Vercel**: Check function logs in Vercel dashboard for frontend issues
- **Firebase**: Monitor Firestore usage in Firebase console

## 6. Scaling Considerations

### Backend (Render)
- Free tier: Limited to 750 hours/month
- Upgrade to paid plans for production usage
- Consider implementing rate limiting for webhook endpoints

### Frontend (Vercel)
- Free tier: 100GB bandwidth
- Automatic scaling and CDN distribution

### Database (Firebase)
- Free tier: 1GB storage, 50K reads/day
- Monitor usage in Firebase console
- Upgrade to Blaze plan for production

## 7. Security Notes

1. **API Keys**: Never expose API keys in frontend code
2. **Bearer Token**: Consider implementing proper authentication in production
3. **File Uploads**: Current limit is 50MB - monitor for abuse
4. **Rate Limiting**: Implement rate limiting for production use

## 8. Maintenance

### Regular Updates
- Update dependencies monthly
- Monitor OpenAI API usage and costs
- Check Firebase quotas and usage
- Review logs for errors and optimization opportunities

### Backup Strategy
- Firebase data is automatically backed up
- Keep environment variables documented
- Maintain deployment configuration files in version control

## 9. Troubleshooting

### Common Issues
1. **Build Failures**: Check package.json scripts and dependencies
2. **API Connectivity**: Verify environment variables and CORS settings
3. **File Upload Issues**: Check file size limits and supported formats
4. **Firebase Permissions**: Ensure service account has proper permissions

### Debug Commands
```bash
# Check backend health
curl https://your-backend.onrender.com/api/v1/health

# Test webhook locally
npm run dev
curl -X POST http://localhost:5000/api/v1/webhook/document-process -H "Content-Type: application/json" -d '{"document_url":"test","questions":["test"]}'

# Check Firebase connectivity
# Review logs in Firebase console under Firestore section
```

Your document analysis system is now ready for production deployment!