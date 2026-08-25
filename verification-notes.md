# Verification Notes

The live preview renders the Mochi dashboard with a visible sign-in action when no session cookie is present. The `/admin` route renders a branded sign-in gate instead of leaking admin data or throwing an authorization error. TypeScript, unit tests, and the production build pass. Full authenticated admin and user-specific database verification still depends on signing in through the OAuth flow with a real session.
