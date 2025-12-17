# 🚀 Deployment Guide - Online Voting System

This guide covers deploying the backend and frontend to various platforms.

---

## 📋 Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Firebase project created and configured
- [ ] Firestore security rules deployed
- [ ] Database indexes deployed
- [ ] Production secrets generated
- [ ] CORS configured for production domains
- [ ] Rate limits adjusted for production
- [ ] Tested locally with production build

---

## 🏗️ Project Structure

```
Online_Voting_System_dummy/
├── backend/          # Node.js + Express API
└── frontend/         # React + Vite app
```

**Benefit**: Backend and frontend can be deployed independently!

---

## 🔥 Firebase Hosting (Frontend)

### Step 1: Build Frontend
```bash
cd frontend
npm run build
# Output: frontend/dist/
```

### Step 2: Deploy
```bash
# From project root
firebase deploy --only hosting
```

### Step 3: Configure Production API URL
Update `frontend/.env.production`:
```env
VITE_API_URL=https://your-backend-domain.com/api
```

Rebuild and redeploy:
```bash
cd frontend
npm run build
cd ..
firebase deploy --only hosting
```

**Result**: `https://your-project.web.app`

---

## ☁️ Backend Deployment Options

### Option 1: Firebase Cloud Functions (Recommended)

**Setup:**
1. Install Firebase Functions:
```bash
cd backend
npm install firebase-functions firebase-admin
```

2. Create `backend/index.js`:
```javascript
const functions = require('firebase-functions');
const app = require('./server');

exports.api = functions.https.onRequest(app);
```

3. Deploy:
```bash
firebase deploy --only functions
```

**API URL**: `https://us-central1-your-project.cloudfunctions.net/api`

---

### Option 2: Heroku

**Steps:**
```bash
cd backend

# Create Heroku app
heroku create your-voting-api

# Set environment variables
heroku config:set FIREBASE_PROJECT_ID=your-project-id
heroku config:set FIREBASE_PRIVATE_KEY="your-private-key"
heroku config:set FIREBASE_CLIENT_EMAIL=your-email
heroku config:set JWT_SECRET=your-secret
heroku config:set ALLOWED_ORIGINS=https://your-frontend.web.app

# Create Procfile
echo "web: node server.js" > Procfile

# Deploy
git init
git add .
git commit -m "Deploy backend"
git push heroku main
```

**API URL**: `https://your-voting-api.herokuapp.com`

---

### Option 3: Google Cloud Run

**Steps:**
```bash
cd backend

# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["node", "server.js"]
EOF

# Build and push
gcloud builds submit --tag gcr.io/your-project/voting-api

# Deploy
gcloud run deploy voting-api \
  --image gcr.io/your-project/voting-api \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="FIREBASE_PROJECT_ID=your-project-id,NODE_ENV=production"
```

**API URL**: `https://voting-api-xxxxx-uc.a.run.app`

---

### Option 4: DigitalOcean App Platform

1. Connect GitHub repository
2. Select `backend` folder as source
3. Set environment variables in dashboard
4. Deploy automatically on git push

---

### Option 5: AWS Elastic Beanstalk

```bash
cd backend

# Install EB CLI
pip install awsebcli

# Initialize
eb init -p node.js-18 voting-api

# Create environment
eb create voting-api-env

# Set environment variables
eb setenv FIREBASE_PROJECT_ID=your-project-id JWT_SECRET=your-secret

# Deploy
eb deploy
```

---

## 🔧 Production Configuration

### Backend Environment Variables

**Required:**
```env
PORT=5000
NODE_ENV=production
FIREBASE_PROJECT_ID=your-production-project
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
JWT_SECRET=use-strong-random-secret-min-32-chars
ALLOWED_ORIGINS=https://your-frontend.web.app,https://your-custom-domain.com
```

**Generate Strong Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Frontend Environment Variables

```env
VITE_FIREBASE_API_KEY=your-production-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_URL=https://your-backend-domain.com/api
```

---

## 🔒 Security for Production

### 1. Environment Variables
- Never commit `.env` files
- Use platform-specific secrets management
- Rotate secrets regularly

### 2. CORS Configuration
Update `backend/server.js` with production origins:
```javascript
const allowedOrigins = [
  'https://your-project.web.app',
  'https://your-custom-domain.com'
];
```

### 3. Rate Limiting
Adjust for production traffic in `backend/server.js`:
```javascript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000 // Adjust based on expected traffic
});
```

### 4. Firebase Security
- Deploy Firestore security rules
- Deploy database indexes
- Enable App Check
- Configure authorized domains

---

## 🌐 Custom Domain Setup

### Frontend (Firebase Hosting)
1. Firebase Console → Hosting → Add custom domain
2. Add DNS records as shown
3. Wait for SSL certificate (automatic)

### Backend (Varies by platform)
- **Cloud Run**: Add custom domain in GCP Console
- **Heroku**: `heroku domains:add api.yourdomain.com`
- **Others**: Follow platform documentation

---

## 📊 Monitoring & Logging

### Frontend
- Firebase Analytics
- Google Analytics
- Sentry for error tracking

### Backend
- Cloud Logging (GCP/Firebase)
- Heroku logs: `heroku logs --tail`
- Custom logging service (Datadog, New Relic)

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example

**Frontend Deploy (`.github/workflows/deploy-frontend.yml`):**
```yaml
name: Deploy Frontend
on:
  push:
    branches: [ main ]
    paths: [ 'frontend/**' ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: cd frontend && npm ci && npm run build
      - uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          projectId: your-project-id
```

**Backend Deploy (varies by platform)**

---

## 🧪 Testing Production Deployment

### 1. Backend Health Check
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-12-17T...",
  "service": "Online Voting System API"
}
```

### 2. Frontend Loading
Visit your frontend URL and check:
- [ ] Page loads correctly
- [ ] No console errors
- [ ] Can login
- [ ] Can register

### 3. End-to-End Test
1. Register a new user
2. Admin verifies user
3. Admin creates election
4. User casts vote
5. Admin views results

---

## 🆘 Troubleshooting

### Backend Issues

**CORS Error:**
```bash
# Check ALLOWED_ORIGINS includes your frontend URL
# Redeploy with correct origins
```

**Firebase Auth Error:**
```bash
# Verify service account credentials
# Check Firebase project ID matches
```

**Rate Limit Too Low:**
```bash
# Increase max in rate limiter
# Or implement Redis-based rate limiting
```

### Frontend Issues

**API Connection Failed:**
```bash
# Check VITE_API_URL points to correct backend
# Rebuild: npm run build
# Redeploy: firebase deploy --only hosting
```

**Firebase Config Error:**
```bash
# Verify all VITE_FIREBASE_* variables set correctly
# Check Firebase Authentication is enabled
```

---

## 📈 Scaling Considerations

### Backend
- Use load balancer for multiple instances
- Implement Redis for session storage
- Enable CDN for static assets
- Use connection pooling for Firestore

### Frontend
- Firebase Hosting auto-scales
- Enable caching headers
- Optimize bundle size
- Lazy load routes

### Database
- Firestore auto-scales
- Monitor quota usage
- Optimize queries with indexes
- Implement pagination

---

## 💰 Cost Estimation

### Firebase (Free Tier)
- Authentication: 10k phone auth/month
- Firestore: 1GB storage, 50k reads, 20k writes
- Hosting: 10GB storage, 360MB/day transfer

### Paid Options (Estimated Monthly)
- **Heroku**: $7-$25/month (Hobby/Standard)
- **Cloud Run**: ~$5-$20/month (based on usage)
- **DigitalOcean**: $5-$12/month (Basic/Professional)
- **AWS**: $10-$30/month (t2.micro/t2.small)

---

## 🎯 Deployment Workflow

**Recommended Flow:**

1. **Development**: Local testing
2. **Staging**: Deploy to test environment
3. **Testing**: Run full test suite
4. **Production**: Deploy to production
5. **Monitoring**: Watch logs and metrics
6. **Rollback**: If issues, revert deployment

---

## 📞 Support

For deployment issues:
- Check platform-specific documentation
- Review error logs
- Test locally with production config
- See main README.md for general help

---

**Last Updated**: December 17, 2024  
**Deployment Difficulty**: Intermediate  
**Estimated Time**: 30-60 minutes  

---

🎉 **Your Online Voting System is ready for the world!**

