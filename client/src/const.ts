import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";

export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

// Start the Manus OAuth login. Call this from an event handler or effect at the
// moment you want to navigate, e.g. `onClick={() => startLogin()}`.
//
// It has SIDE EFFECTS — it mints a one-time nonce, writes the __Host- state
// cookie, and navigates immediately — so the cookie nonce always matches the
// `state` it sends. Do NOT call it during render (no `href={startLogin()}` /
// `loginUrl={...}`): each call overwrites the cookie, so a stray render-phase
// call would desync it from an in-flight login and the callback would reject it
// with "invalid oauth state". It returns void by design, so there is no URL to
// stash across renders.
export function buildAuthPortalUrl(input: { oauthPortalUrl: string; appId: string; redirectUri: string; state: string; type: "signIn" | "signUp" }): string {
  const url = new URL(`${input.oauthPortalUrl}/app-auth`);
  url.searchParams.set("appId", input.appId);
  url.searchParams.set("redirectUri", input.redirectUri);
  url.searchParams.set("state", input.state);
  url.searchParams.set("type", input.type);
  return url.toString();
}

export const startAuth = (type: "signIn" | "signUp" = "signIn") => {
  const oauthPortalUrl = import.meta.env.VITE_OAUTH_PORTAL_URL;
  const appId = import.meta.env.VITE_APP_ID;
  const redirectUri = `${window.location.origin}/api/oauth/callback`;

  const nonce = crypto.randomUUID();
  document.cookie = `${OAUTH_STATE_COOKIE}=${nonce}; Path=/; Max-Age=600; SameSite=Lax; Secure`;
  const state = encodeOAuthState({ redirectUri, nonce });

  window.location.href = buildAuthPortalUrl({ oauthPortalUrl, appId, redirectUri, state, type });
};

export const startLogin = () => startAuth("signIn");
export const startSignUp = () => startAuth("signUp");
