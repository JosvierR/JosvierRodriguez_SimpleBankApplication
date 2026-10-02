# Final presentation checklist

Complete this before sharing the screen. Keep passwords in a private note, not in this file.

- [x] Staging frontend responds at https://simple-bank-staging.vercel.app
- [x] Staging backend liveness returns 200
- [x] Readiness is `UP` for staging
- [ ] Demo or staging usernames are available in a private note
- [ ] Postman imported the collection and the local environment, with passwords typed locally
- [ ] Atlas page is open on the database you will show
- [ ] GitHub Actions is open on the canonical CI workflow
- [x] Screenshot folder is available at `docs/screenshots/final-staging/`
- [x] English, Spanish, and French have been checked in the browser
- [x] Responsive browser validation passed at 1440, 1280, 1024, 768, 430, 390, and 360
- [ ] The browser starts signed out
- [ ] Tabs are in presentation order: landing, app, Atlas, Actions, C4 doc

Do not open production. `deploy/vercel-production` is not the live bank.
