# Mallannapeta Kitchen — Web App Delivery Plan

> **Document for**: Client review & sign-off
> **Version**: 1.0
> **Last updated**: 2026-05-03

---

## Project Overview

Mallannapeta Kitchen will get a **production-grade ordering website** built to the same quality standard as Swiggy/Zomato — but dedicated to a single brand. Customers visit the site, browse the menu, and place orders directly for home delivery.

### What's Included in Version 1

- **Mobile-first customer storefront** — fast, responsive, brand-styled
- **Menu browsing** with categories, search, and per-person variant pricing (1 / 2 / 4 person portions)
- **Sign-up & login** via Google (one tap) or Email + Password
- **Cart & checkout** with delivery address management, coupon codes, and order summary
- **Razorpay payments** — UPI (GPay, PhonePe, Paytm, BHIM), Cards (Visa/Mastercard/RuPay), Net Banking, Wallets
- **Cash on Delivery** (subject to pincode approval)
- **Live order tracking** — customer sees status update in real time (Confirmed → Preparing → Out for Delivery → Delivered)
- **Web push notifications** — for order updates and Sunday Special alerts (works on Android & desktop browsers)
- **Sunday Special** — flagship feature: a different dish promoted every Sunday, with hero banner, badge, and Sunday-morning push notification
- **Coupons & promotions** — flat ₹ off or percentage discount, with usage limits
- **Complete admin dashboard** for the kitchen team
- **Multi-role admin** — Owner, Manager, and Kitchen Staff with different permission levels
- **Email notifications** — order confirmation, password reset, refund processed
- **Sales & analytics reports** — daily/weekly/monthly revenue, top-selling items, customer cohorts

### What's Reserved for Version 2

| Feature | Reason |
|---|---|
| SMS OTP login | Costs ₹0.15–0.20 per OTP; v1 uses Google + Email login (faster onboarding, zero SMS cost) |
| Google Maps pin-drop | Saves Google Maps fees; v1 uses pincode-based serviceability instead |
| WhatsApp Business API automated messages | Requires Meta verification (24–48h) + per-message cost; v1 uses click-to-chat for support |
| Live GPS tracking of delivery rider | Requires rider mobile app + maps; not needed for in-house delivery |
| Customer ratings & reviews | Better launched once organic order volume exists |
| Loyalty program / referral codes | Requires marketing strategy alignment |
| Native iOS / Android apps | The web app is mobile-first and installable as a PWA — covers 95% of the value |

---

## Brand Assets — Status

| Asset | Status | Notes |
|---|---|---|
| Brand logo | ✅ Provided | Mallannapeta Telugu calligraphy of a steaming clay pot |
| Color palette | ✅ Extracted from logo | Deep red `#B8332A` (primary) · Saffron orange `#E8841F` (accent) · Warm yellow `#F4B847` (highlight) · Cream `#FFFAF0` (surface) |
| Initial menu | ✅ Provided | 5 items: Chicken & Rice, Mutton & Rice, Thali Combo, Boti, Thalakaya |
| Contact phone | ✅ Provided | +91 79930 40100 |
| Contact email | ✅ Provided | mallanapetkitchen@gmail.com |
| Instagram | ✅ Provided | @Mallanapeta_kitchen |

---

## Delivery Phases

We deliver in **7 incremental phases** over **~4 weeks**. After every phase, the client gets a working demo, a walkthrough video, and a sign-off form. Phases gate forward — we don't start the next phase until the previous one is approved.

| # | Phase | What the Client Gets | Duration |
|---|-------|---------------------|----------|
| **0** | **Project Setup & Foundation** | Project skeleton ready · Deployment pipeline live · Staging URL shared · Brand kit applied (logo, color palette, Telugu+English typography) | 1–2 days |
| **1** | **Login & Menu Browsing** | Customers can register / login (email or Google) · Browse menu by category · Search items · Admin can add/edit menu items, categories, and per-person variants (1 / 2 / 4 person pricing) · Initial menu seeded with the 5 real items | 3–4 days |
| **2** | **Cart, Checkout & Payments** | Customers can add to cart, manage delivery addresses, apply coupons · Pay via Razorpay (UPI/Card/Netbanking/Wallet) or Cash on Delivery · Receive email confirmation · Pincode-based delivery zone enforcement | 4–5 days |
| **3** | **Live Order Tracking & Notifications** | Customers see order status update live without refreshing the page · Admin gets real-time alerts for new orders with sound · Web push notifications for status changes · Audit log of every admin action | 3 days |
| **4** | **Sunday Special & Coupons** | Sunday Special banner auto-appears every Sunday with countdown · Sunday-morning push notification fan-out to opted-in customers · Admin can create/schedule next week's Sunday Special in advance · Coupon codes (flat ₹ or percentage) with usage limits and expiry dates | 2–3 days |
| **5** | **Admin Dashboard Polish & Reports** | Customer management (search, profile, lifetime value) · Pincode CRUD · Sales reports (daily/weekly/monthly) · Top-selling items · Coupon performance · Refund flow (Razorpay roundtrip) · Kitchen open/close toggle · Audit log viewer · Mobile-responsive admin UI | 3 days |
| **6** | **Hardening, Testing & Launch** | Security review · Error monitoring (Sentry) · Performance & accessibility audit · Mobile/tablet/desktop testing · Production environment setup · Razorpay live keys · Soft launch with limited pincodes · Runbook + rollback plan | 2–3 days |
| | **TOTAL** | **Production-ready web app** | **≈18–23 working days (~4 weeks)** |

---

## Phase Acceptance Criteria

After every phase, the client receives:

1. 🔗 **Demo link** — staging URL with the new functionality live
2. 🎥 **Walkthrough video** (5–10 min) — explaining what changed and how to use it
3. ✅ **Sign-off form** — checklist of acceptance criteria for that phase
4. 📋 **Phase report** — what was built, what was deferred, what's next

We do **not** start the next phase until the current phase is signed off in writing.

---

## What the Client Needs to Provide

| Item | Status | Why It's Needed | When |
|---|---|---|---|
| Brand logo | ✅ Provided | Visual identity (header, footer, emails, OG image) | Phase 0 |
| Brand color palette | ✅ Extracted | Tailwind theme, brand consistency | Phase 0 |
| Initial menu | ✅ Provided | Phase 1 seed data | Phase 1 |
| Kitchen contact phone | ✅ Provided | Footer "Call us" + Razorpay business profile | Phase 6 |
| Kitchen email | ✅ Provided | Email "from" address + support contact | Phase 1 |
| Instagram handle | ✅ Provided | Footer social link | Phase 0 |
| Domain name | ⏳ Needed | Vercel SSL, Razorpay/Resend domain verification | Phase 0 |
| Razorpay merchant account (test mode) | ⏳ Needed | Payment integration | Phase 2 |
| Razorpay live KYC | ⏳ Needed | Real payments at launch | Phase 6 |
| Cloudinary account (free tier OK) | ⏳ Needed | Dish photo storage + CDN | Phase 0 |
| Resend account + DKIM/SPF on domain | ⏳ Needed | Transactional emails | Phase 1 |
| Hi-res photos for each dish | ⏳ Needed | Menu cards, hero banners | Phase 1 |
| Serviceable pincodes + per-pincode delivery fee | ⏳ Needed | Delivery zone enforcement | Phase 2 |
| Opening hours + minimum order value | ⏳ Needed | Kitchen settings | Phase 1 |
| WhatsApp business number | ⏳ Needed | Click-to-chat support button | Phase 6 |
| Admin staff list with intended roles | ⏳ Needed | Owner / Manager / Kitchen Staff role assignment | Phase 5 |

---

## Communication & Sign-Off

| Cadence | Channel | Purpose |
|---|---|---|
| Weekly | 15-min status call (every Friday) | Progress, blockers, upcoming phase preview |
| Per phase | Email + Walkthrough video | Demo, sign-off form |
| Daily | Slack / WhatsApp group | Quick questions, photo approvals |
| Always | GitHub / Linear | Issue tracking, formal change requests |

---

## Pricing & Operating Costs (Estimated Monthly)

These are the **third-party service costs** the client should budget for once the app is live. Development costs are separate.

| Service | Free Tier Coverage | Estimated Monthly Cost (post-launch) |
|---|---|---|
| Vercel (hosting frontend) | 100 GB bandwidth, automatic SSL | **₹0** for MVP volume |
| Railway (API server + Redis) | $5 starter | **₹400–₹800** |
| MySQL (Railway / PlanetScale) | Generous free tier | **₹0–₹500** |
| Cloudinary (images) | 25 credits / month | **₹0** for typical volume |
| Resend (transactional email) | 3,000 emails / month free | **₹0** for ~500 orders/month |
| Razorpay (payment gateway) | No monthly fee | **2% per transaction** (standard rate) |
| Sentry (error tracking) | 5,000 errors / month free | **₹0** for stable app |
| Domain | — | **₹500–₹1,000 / year** |
| **Estimated total** | — | **₹400–₹1,500 / month + 2% on payments** |

These costs scale with volume. Initial launch fits comfortably within free tiers for most services.

---

*This document is confidential and prepared exclusively for Mallannapeta Kitchen.*
