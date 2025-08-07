# Vercel Deployment Guide for PlayerZero

## 🚀 Quick Deploy

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

## ⚙️ Environment Variables Setup

### Required Environment Variables:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_SERVICE_ROLE_KEY`

### How to Set Environment Variables in Vercel:

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** > **Environment Variables**
4. Add each variable:
   - **Name**: `VITE_SUPABASE_URL`
   - **Value**: Your Supabase URL
   - **Environment**: Production, Preview, Development
5. Repeat for all required variables
6. Click **Save**

## 🔧 Configuration Files

### vercel.json
This file handles SPA routing and security headers:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## 🐛 Troubleshooting

### Issue: 404 Error on Admin Login
**Solution**: The `vercel.json` file with rewrites should fix this. Make sure:
1. The file is in your project root
2. You've redeployed after adding the file
3. Environment variables are set correctly

### Issue: Environment Variables Not Working
**Solution**:
1. Check Vercel dashboard for environment variables
2. Ensure variables start with `VITE_`
3. Redeploy after adding variables

### Issue: Build Failures
**Solution**:
1. Check build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript compilation

## 📝 Deployment Commands

```bash
# Build and deploy
npm run deploy

# Build only
npm run build

# Preview deployment
vercel

# Production deployment
vercel --prod
```

## 🔍 Debugging

### Check Environment Variables:
```javascript
// In browser console
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL)
```

### Check Vercel Environment:
```javascript
// In browser console
console.log('VERCEL:', import.meta.env.VERCEL)
console.log('VERCEL_ENV:', import.meta.env.VERCEL_ENV)
```

## 📞 Support

If you're still having issues:
1. Check Vercel deployment logs
2. Verify environment variables are set
3. Ensure `vercel.json` is in project root
4. Try redeploying with `vercel --prod --force` 