# Live Deployment Steps - Get Your Project Online

Follow these exact steps to deploy your document analysis system live on the internet.

## 📋 Prerequisites

Before starting, ensure you have:
- [ ] OpenAI API Key
- [ ] GitHub account 
- [ ] Vercel account (free)
- [ ] Render account (free)
- [ ] Your Firebase project: `hackrx-4d649`

## 🚀 Step 1: Prepare Code for Deployment

### 1.1 Create GitHub Repository
```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit changes
git commit -m "Initial deployment ready commit"

# Create repository on GitHub and connect
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

## 🖥️ Step 2: Deploy Backend to Render

### 2.1 Create Render Service
1. Go to [render.com](https://render.com) and sign up/login
2. Click **"New"** → **"Web Service"**
3. Connect your GitHub account
4. Select your repository
5. Configure the service:

**Service Configuration:**
- **Name**: `hackrx-backend`
- **Environment**: `Node`
- **Region**: `Oregon (US West)` 
- **Branch**: `main`
- **Build Command**: `npm install`
- **Start Command**: `npm run dev`

### 2.2 Add Environment Variables
In the Render dashboard, add these environment variables:

```env
NODE_ENV=production
OPENAI_API_KEY=sk-your-openai-api-key-here
PORT=10000
FIREBASE_PROJECT_ID=hackrx-4d649
```

### 2.3 Deploy Backend
1. Click **"Create Web Service"**
2. Wait 5-10 minutes for deployment
3. Copy your backend URL: `https://your-app-name.onrender.com`
4. Test it: `https://your-app-name.onrender.com/api/v1/health`

## 🌐 Step 3: Deploy Frontend to Vercel

### 3.1 Update Configuration
First, update your `vercel.json` with your actual Render backend URL:

```json
{
  "buildCommand": "npm run build:client",
  "outputDirectory": "client/dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "https://YOUR-ACTUAL-RENDER-URL.onrender.com/api/$1" }
  ],
  "env": {
    "VITE_API_BASE_URL": "https://YOUR-ACTUAL-RENDER-URL.onrender.com"
  }
}
```

### 3.2 Deploy to Vercel

**Option A: Vercel CLI (Recommended)**
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

**Option B: GitHub Integration**
1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build:client`
   - **Output Directory**: `client/dist`
5. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://your-render-backend.onrender.com`
6. Click **"Deploy"**

### 3.3 Update CORS Configuration
After deployment, update your backend CORS settings:

1. Edit `server/index.ts` in your repository
2. Replace the CORS origins with your actual URLs:

```javascript
app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app',  // Replace with your actual Vercel URL
    'http://localhost:5173',              // Keep for local development
    'http://localhost:5000'               // Keep for local development
  ],
  credentials: true
}));
```

3. Commit and push changes:
```bash
git add .
git commit -m "Update CORS for production"
git push
```

4. Render will automatically redeploy

## 🔥 Step 4: Test Your Live Application

### 4.1 Test Backend Webhooks
```bash
# Test health endpoint
curl https://your-render-backend.onrender.com/api/v1/health

# Test document processing webhook
curl -X POST https://your-render-backend.onrender.com/api/v1/webhook/document-process \
  -H "Content-Type: application/json" \
  -d '{
    "document_url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "questions": ["What is this document about?"],
    "webhook_id": "live_test"
  }'
```

### 4.2 Test Frontend Application
1. Visit your Vercel URL: `https://your-vercel-app.vercel.app`
2. Try uploading a PDF document
3. Ask questions about the document
4. Verify the responses are generated

## 📊 Step 5: Monitor Your Application

### 5.1 Check Logs
- **Render Logs**: Visit your Render dashboard → Service → Logs
- **Vercel Logs**: Visit your Vercel dashboard → Project → Functions
- **Firebase Console**: Check Firestore collections for stored data

### 5.2 Monitor Usage
- **OpenAI Usage**: Check your OpenAI dashboard for API usage
- **Firebase Usage**: Monitor Firestore reads/writes in Firebase console
- **Render Resources**: Check CPU/Memory usage in Render dashboard

## 🔧 Step 6: Update Documentation

Update your webhook documentation with live URLs:

### Live API Base URL
```
https://your-render-backend.onrender.com/api/v1
```

### Live Frontend URL
```
https://your-vercel-app.vercel.app
```

## 🚨 Troubleshooting

### Common Issues and Solutions

**1. Backend Build Fails**
- Check that all dependencies are in `package.json`
- Verify Node.js version compatibility
- Check Render build logs for specific errors

**2. Frontend Can't Connect to Backend**
- Verify `VITE_API_BASE_URL` environment variable
- Check CORS configuration in backend
- Ensure both services are deployed successfully

**3. Document Processing Fails**
- Verify OpenAI API key is set correctly
- Check if the document URL is publicly accessible
- Monitor OpenAI API usage and limits

**4. Firebase Connection Issues**
- Verify Firebase project ID matches
- Check Firebase console for any service issues
- Ensure Firestore rules allow read/write

## 🎉 Success Checklist

Your deployment is successful when:
- [ ] Backend health check returns `200 OK`
- [ ] Frontend loads without errors
- [ ] Document upload works
- [ ] Questions generate AI responses
- [ ] Webhook endpoints respond correctly
- [ ] Firebase stores processing data

## 📞 Getting Help

If you encounter issues:
1. Check service logs (Render/Vercel dashboards)
2. Verify all environment variables are set
3. Test endpoints individually
4. Check network connectivity between services

---

## 🔗 Your Live URLs

After deployment, you'll have:
- **Frontend**: `https://your-vercel-app.vercel.app`
- **Backend API**: `https://your-render-backend.onrender.com`
- **Health Check**: `https://your-render-backend.onrender.com/api/v1/health`

Your document analysis system is now live and ready for production use!