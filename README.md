# Stock Viewer — Yahoo (No API Key)

This is a **static single-page application** that fetches price data from Yahoo Finance's public chart endpoint and displays a line chart using Chart.js.

**Limitations (by choice B):**
- Uses unofficial Yahoo Finance endpoint — may be rate-limited or blocked by CORS in some environments.
- No candlestick charts, no technical indicators.
- Best for demo / learning / quick deployment.

## Files
- `index.html` — main page
- `styles.css` — styling (light/dark)
- `script.js` — logic and fetch calls
- `README.md` — this file

## Deploy
1. Upload this folder to GitHub (or drag-and-drop ZIP to Vercel).
2. On Vercel, import the repository and deploy as a static site (no build command required).
3. If CORS blocks requests, consider option C (serverless proxy) or use RapidAPI.

## Notes
This project was generated automatically. If you want a React/Next.js version or serverless backend to avoid CORS, ask me and I'll generate that.

