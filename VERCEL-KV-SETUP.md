# Vercel KV Setup Guide

## 🔴 CRITICAL: Fix Vercel Storage Issue

Your visitor counter resets because Vercel's `/tmp` storage is **ephemeral** (temporary). It gets deleted when:
- Function restarts
- Server sleeps
- New deployment
- Traffic shifts to another region

## ✅ SOLUTION: Use Vercel KV (Redis)

### Step 1: Create Vercel KV Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **KV** (Redis)
6. Choose a name (e.g., `hsbte-kv`)
7. Select region closest to your users
8. Click **Create**

### Step 2: Get Connection Details

After creating KV database:

1. Go to **Storage** → Your KV database
2. Click **.env.local** tab
3. Copy these environment variables:
   ```
   KV_REST_API_URL=https://your-kv-url.upstash.io
   KV_REST_API_TOKEN=your-token-here
   ```

### Step 3: Add Environment Variables to Vercel

1. Go to your project **Settings**
2. Click **Environment Variables**
3. Add these two variables:
   - `KV_REST_API_URL` = (from Step 2)
   - `KV_REST_API_TOKEN` = (from Step 2)
4. Select **Production**, **Preview**, and **Development**
5. Click **Save**

### Step 4: Redeploy

1. Go to **Deployments** tab
2. Click **Redeploy** on latest deployment
3. Or push a new commit to trigger deployment

## ✅ How It Works Now

### Before (Broken):
```
Visitor visits → Count = 4001 → Saved to /tmp
Server restarts → /tmp deleted → Count = 4000 again ❌
```

### After (Fixed):
```
Visitor visits → Count = 4001 → Saved to Vercel KV (Redis)
Server restarts → Data persists in KV → Count = 4001 ✅
```

## 📊 Storage Comparison

| Storage Type | Persistent? | Cost | Speed |
|-------------|-------------|------|-------|
| `/tmp` (file system) | ❌ No | Free | Fast |
| **Vercel KV** | ✅ Yes | Free tier: 10K reads/day | Very Fast |
| External DB | ✅ Yes | Varies | Medium |

## 🎯 Free Tier Limits

Vercel KV Free Tier:
- **10,000 commands/day** (reads + writes)
- **256 MB storage**
- Perfect for visitor counter!

## 🔧 Fallback System

The code automatically:
1. **Tries Vercel KV first** (if env vars are set)
2. **Falls back to file system** (for local dev)
3. **Works on both** Vercel and local development

## ✅ Verification

After setup, test:

1. Visit your website
2. Check visitor counter (should show number)
3. Wait 5 minutes
4. Visit again
5. Counter should **NOT reset** ✅

## 🐛 Troubleshooting

### Counter still resets?
- ✅ Check environment variables are set in Vercel
- ✅ Check KV database is created
- ✅ Check deployment logs for errors
- ✅ Verify `KV_REST_API_URL` and `KV_REST_API_TOKEN` are correct

### Dashboard shows 0000?
- ✅ This is fixed! Dashboard now shows real data
- ✅ Check browser console for errors
- ✅ Verify password is correct: `Nishant@089`

## 📝 Files Updated

1. ✅ `lib/kv-storage.js` - New persistent storage library
2. ✅ `api/visitor-track/index.js` - Uses KV storage
3. ✅ `api/analytics/index.js` - Uses KV storage
4. ✅ `api/analytics/update.js` - Uses KV storage
5. ✅ `package.json` - Added @vercel/kv dependency

## 🚀 Next Steps

1. **Create Vercel KV database** (5 minutes)
2. **Add environment variables** (2 minutes)
3. **Redeploy** (automatic)
4. **Test** - Counter should persist! ✅

---

**Status:** Ready to deploy after KV setup
**Last Updated:** 2025-01-21
