# Local Development Setup

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the local development server:**
   ```bash
   npm run dev
   ```

3. **Access the website:**
   - Main site: http://localhost:3000
   - Dashboard: http://localhost:3000/html/analytics-dashboard.html

## Why?

The API endpoints are Vercel serverless functions that don't work with simple file servers (like Live Server). This local Express server allows you to test the visitor counter and analytics dashboard locally.

## Production

When deployed to Vercel, the serverless functions in the `/api` folder will automatically work - no server.js needed!
