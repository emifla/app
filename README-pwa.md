# Emifla PWA

This is a React + Vite PWA implementation of the Emifla app (To‑Do + Budgeting) added to the repository.

How to run locally:

1. Install dependencies:
   npm install
2. Run development server:
   npm run dev
3. Build for production:
   npm run build
   npm run preview

The PWA uses localStorage for persistence and a small service worker to cache the app shell. It performs the same daily (budget) and weekly (favorite todo reset) updates as the native SwiftUI version.
