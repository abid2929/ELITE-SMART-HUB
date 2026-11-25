# Elite Smart Hub

Premium digital subscription shop for Bangladesh: Netflix, YouTube Premium, Spotify, ChatGPT Plus, Gemini, Canva Pro, CapCut Pro, Meta Verified, VPN, game top-up and more.

**Elite Access · Premium Experience**

## What's inside
- **Storefront** (`index.html`, `assets/`): Bangla-first, dark red / gold brand, top banner slider, today's offer, popular row, 45 services in 9 categories, search, order sheet (plan → name → WhatsApp → email/ID → bKash / Nagad / Rocket + TrxID or pay on WhatsApp), order tracking, reviews, FAQ, phone tab bar, installable as an app.
- **Admin panel** (`/admin`): Bangla (EN button), password-only login with eye button, products & plans, categories, collections, orders (status, invoice, CSV), customers, reviews, hero banners, homepage CMS (today's offer), reports, admins & roles, settings (store, payment numbers, SMS, Meta Pixel + CAPI, SEO, Gemini AI writer).
- **Server** (PHP 8, no database): `shop-api.php` (orders, tracking, reviews, visits, order email), `admin/api.php`, data in `data/*.json`; private data in `data/private/` (never on GitHub).

## Demo
On GitHub Pages the shop runs as a demo: orders go straight to WhatsApp and `/admin` opens without a password with sample data saved in your browser.

## Install on cPanel
Upload the zip to `public_html`, extract, open `/admin` and set the admin password. Then set WhatsApp number and bKash / Nagad / Rocket numbers in Site Settings.

Service names and trademarks belong to their owners. Elite Smart Hub is an independent reseller.

Designed & developed by [Abid Islam](https://www.linkedin.com/in/abid-islam-a926ab2b5/).
