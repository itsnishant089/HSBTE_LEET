# Visitor Counter - How It Works

## ✅ Is the Counter Working?

**YES!** The visitor counter is working and will increase when someone visits your website.

### How It Works:

1. **First Visit**: When someone visits your site for the first time (or hasn't visited in 24 hours), the counter increases by 1.

2. **Returning Visitors**: If the same person visits again within 24 hours, they are NOT counted again (prevents fake counts from refreshing).

3. **After 24 Hours**: If the same person visits after 24 hours, they are counted as a new visitor again.

### Current Behavior:

- **Starting Count**: 4000 (as requested)
- **Increment Logic**: Only new visitors (not visited in last 24 hours) increase the count
- **Display**: Shows in footer with medal-style design (green circles)

## 🔧 How to Test:

1. **Open your website** in a browser
2. **Check the footer** - you should see "04000" (displayed as 4000)
3. **Open in a different browser or incognito mode** - counter should increase to 4001
4. **Refresh the same browser** - counter stays the same (same visitor within 24h)
5. **Wait 24 hours or use a different device** - counter increases again

## 📊 Dashboard:

Access the analytics dashboard at:
- URL: `/html/analytics-dashboard.html`
- Password: `Nishant@089`

The dashboard shows:
- Total visitors
- Today/Week/Month visitors
- Most viewed pages
- Time spent on pages
- Click analytics

## ⚠️ About 404 Errors:

The 404 errors you're seeing are likely:
1. **Favicon.ico** - This is normal, browsers request it automatically
2. **API endpoints** - Should work on Vercel. If not, check:
   - API files are in `/api/visitor-track/index.js` and `/api/analytics/index.js`
   - Vercel deployment includes the `api` folder
   - Check Vercel function logs for errors

## 🐛 Troubleshooting:

### Counter Not Updating?
1. Check browser console for errors
2. Verify API endpoint is accessible: `https://yourdomain.com/api/visitor-track`
3. Check Vercel function logs
4. Make sure the visitor tracker script is loading (check Network tab)

### API 404 Errors?
1. Ensure `api` folder is in the root directory
2. Files should be: `api/visitor-track/index.js` (not `api/visitor-track.js`)
3. Redeploy to Vercel
4. Check Vercel dashboard → Functions tab

## 📝 Notes:

- Counter starts at **4000** (not 0)
- Uses **24-hour window** to prevent duplicate counts
- Data stored in `/tmp` on Vercel (ephemeral - resets on cold start)
- For persistent storage, consider using a database (MongoDB, PostgreSQL, etc.)
