# E-Access QA Report

Full persona-based test sweep, run against a production build of the app. Five personas were simulated end to end with automated browser testing: a first-time Nigerian buyer on desktop, a returning buyer using every new feature, a diaspora buyer in London on a phone, a foreign investor with no account, and an admin running the business. 44 checks were executed; 43 passed. The one initial failure was a test-script issue, not an app bug.

## What was tested and passed

**Landing and public pages.** Hero headline and three-panel layout render, naira prices format correctly, price-band filters work, add-to-cart works logged out, the News and Info Center lists all posts and renders full articles including video posts, and the public share page shows a sign-in call to action for visitors.

**Auth.** Signup issues a 6-digit verification code, the code entry works, wrong-password logins are rejected, and logged-out visitors are redirected to login from every dashboard page tested.

**New features.** Saved searches save and list correctly, and the end-to-end alert works: when a new listing matching a saved search was added, the notification arrived in the matching user's bell. Compare selects up to 3 properties, shows the floating bar, and renders the full side-by-side table. Offers submit from the property page, appear in the admin Offers queue, and accepting one delivers a notification to the buyer. Payment plans create, record payments with history, block overpayment beyond the remaining balance, and show progress bars with due dates. Developer reviews render with star ratings and accept submissions. Recently viewed tracks and displays. The WhatsApp share link is present on public listing pages.

**Mobile (390px).** No horizontal overflow on the landing page, property page, or public listing page. The dashboard hamburger menu is present and the remote inspection option is available in the booking drawer (key for diaspora buyers).

**Security.** All new APIs reject anonymous requests (401/403). Non-admin accounts cannot publish posts, resolve offers, or reach admin pages. Overpayment and duplicate-plan guards work. Self-review is blocked. Saved searches are capped at 10 per user.

## Issues found and already fixed during the sweep

1. Buyer and admin demo accounts had no saved preferences, which routes them through the preferences step on login. This is by design for real users, and the test harness was updated to reflect it. No app change needed.
2. Escape does not close the save-search modal (close is via Cancel, X, or clicking outside). Minor; noted for a future polish pass.

## Known limitations (not bugs, roadmap items)

Documents and listing photos are simulated (Supabase Storage upload is the next milestone). Emails show codes on screen instead of sending (Resend integration pending). Privacy Policy and Terms links are placeholders. Prices are naira-only; multi-currency display for foreign investors could be a future enhancement.
