import { describe, expect, it } from "vitest";
import { buildAuthPortalUrl } from "../client/src/const";

describe("OAuth sign-up URL", () => {
  it("targets the secure sign-up portal flow with callback state", () => {
    const url = new URL(buildAuthPortalUrl({
      oauthPortalUrl: "https://manus.im",
      appId: "mochi-app",
      redirectUri: "https://mochi.example/api/oauth/callback",
      state: "encoded-nonce-state",
      type: "signUp",
    }));
    expect(url.pathname).toBe("/app-auth");
    expect(url.searchParams.get("type")).toBe("signUp");
    expect(url.searchParams.get("state")).toBe("encoded-nonce-state");
    expect(url.searchParams.get("redirectUri")).toBe("https://mochi.example/api/oauth/callback");
  });
});
