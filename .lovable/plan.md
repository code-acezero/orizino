
The user wants a comprehensive site enhancement covering UX improvements, profile/settings management, live tracking, full i18n, gamification (loyalty), and dynamic shipping with hub selection. This is a large multi-phase project. Let me structure it into clear, deliverable phases.

Key things I noted from the codebase:
- Localization exists (LanguageContext with 23 languages) but most pages use hardcoded English strings — needs systematic application
- Profile uses 6-tab UI but addresses/payments stored in `profiles.preferences` JSON (not relational)
- No loyalty/tier system exists
- Shipping methods exist but no user-side hub/zone selection or dynamic pricing per courier
- Pathao + Steadfast already integrated for admin push, but no auto-sync cron and no user-side courier selection
- Order tracking shown but not auto-refreshed

I'll group into focused phases the user can approve incrementally.
