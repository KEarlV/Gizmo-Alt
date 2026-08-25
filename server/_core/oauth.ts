import { COOKIE_NAME, ONE_YEAR_MS, OAUTH_STATE_COOKIE, decodeOAuthState } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

function getQueryParam(req: Request, key: string): string | undefined {
  const value = req.query[key];
  return typeof value === "string" ? value : undefined;
}

export function isValidOAuthState(state: string, cookieHeader: string): boolean {
  const { nonce } = decodeOAuthState(state);
  const expectedNonce = parseCookieHeader(cookieHeader)[OAUTH_STATE_COOKIE];
  return Boolean(nonce && expectedNonce && nonce === expectedNonce);
}

export function renderOAuthCallbackLoadingPage(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Signing you in · Mochi Study</title><style>
    :root{color-scheme:light;background:#f7f2e8;color:#202321;font-family:Arial,sans-serif}*{box-sizing:border-box}body{margin:0;min-height:100vh;display:grid;place-items:center;background:radial-gradient(circle at 20% 15%,#fffaf0 0,transparent 34%),#f7f2e8}.card{width:min(92vw,460px);padding:48px 34px;text-align:center;background:#fffdf8;border:1px solid #e3d9c9;border-radius:22px;box-shadow:0 22px 60px #42382b18}.mark{width:64px;height:64px;margin:0 auto 22px;border-radius:18px;background:#f2b4a0;display:grid;place-items:center;font-size:32px}.spinner{width:34px;height:34px;margin:24px auto;border:3px solid #eadfd0;border-top-color:#e76f51;border-radius:50%;animation:spin .8s linear infinite}@keyframes spin{to{transform:rotate(360deg)}}h1{margin:0;font:600 30px Georgia,serif}p{margin:12px 0 0;color:#716b61;line-height:1.6}.status{margin-top:24px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#e76f51}@media(prefers-reduced-motion:reduce){.spinner{animation:none}}
  </style></head><body><main class="card" aria-live="polite"><div class="mark" aria-hidden="true">◉</div><h1>Setting up your study desk</h1><div class="spinner" role="status" aria-label="Signing you in"></div><p>We’re securely confirming your account and preparing Mochi.</p><div class="status">Almost there · please keep this tab open</div></main><script>fetch('/api/oauth/callback/complete'+window.location.search,{credentials:'same-origin',headers:{accept:'application/json'}}).then(async response=>{if(!response.ok)throw new Error((await response.json().catch(()=>({}))).error||'Sign-in could not be completed');window.location.replace('/')}).catch(error=>{document.querySelector('.status').textContent=error.message;document.querySelector('.status').style.color='#b94b3d';document.querySelector('.spinner').style.animation='none';document.querySelector('.spinner').style.borderTopColor='#b94b3d';});</script></body></html>`;
}

async function completeOAuthCallback(req: Request, res: Response) {
  const code = getQueryParam(req, "code");
  const state = getQueryParam(req, "state");

  if (!code || !state) {
    res.status(400).json({ error: "code and state are required" });
    return;
  }

  // CSRF guard: the nonce in `state` must match the one-time cookie that
  // startLogin set in the browser that began this login.
  if (!isValidOAuthState(state, req.headers.cookie ?? "")) {
    console.warn("[OAuth] Callback rejected: state nonce did not match the browser cookie");
    res.status(403).json({ error: "invalid oauth state" });
    return;
  }
  res.clearCookie(OAUTH_STATE_COOKIE, { path: "/", secure: true, sameSite: "lax" });

  try {
    const tokenResponse = await sdk.exchangeCodeForToken(code, state);
    const userInfo = await sdk.getUserInfo(tokenResponse.accessToken);

    if (!userInfo.openId) {
      res.status(400).json({ error: "openId missing from user info" });
      return;
    }

    await db.upsertUser({
      openId: userInfo.openId,
      name: userInfo.name || null,
      email: userInfo.email ?? null,
      loginMethod: userInfo.loginMethod ?? userInfo.platform ?? null,
      lastSignedIn: new Date(),
    });

    const sessionToken = await sdk.createSessionToken(userInfo.openId, {
      name: userInfo.name || "",
      expiresInMs: ONE_YEAR_MS,
    });

    const cookieOptions = getSessionCookieOptions(req);
    res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
    res.json({ ok: true });
  } catch (error) {
    console.error("[OAuth] Callback failed", error);
    res.status(500).json({ error: "OAuth callback failed" });
  }
}

export function registerOAuthRoutes(app: Express) {
  app.get("/api/oauth/callback", (req: Request, res: Response) => {
    if (!getQueryParam(req, "code") || !getQueryParam(req, "state")) {
      res.status(400).send("code and state are required");
      return;
    }
    res.type("html").send(renderOAuthCallbackLoadingPage());
  });

  app.get("/api/oauth/callback/complete", completeOAuthCallback);
}
