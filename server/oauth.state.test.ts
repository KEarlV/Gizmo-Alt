import { describe, expect, it } from "vitest";
import { OAUTH_STATE_COOKIE, encodeOAuthState } from "@shared/const";
import { isValidOAuthState, renderOAuthCallbackLoadingPage } from "./_core/oauth";

describe("OAuth callback state validation", () => {
  it("accepts a matching nonce for a production callback redirect", () => {
    const nonce = "nonce-production-123";
    const state = encodeOAuthState({
      redirectUri: "https://mochistudy-jkf2mcra.manus.space/api/oauth/callback",
      nonce,
    });

    expect(isValidOAuthState(state, `${OAUTH_STATE_COOKIE}=${nonce}`)).toBe(true);
  });

  it("rejects a missing or mismatched browser cookie", () => {
    const state = encodeOAuthState({ redirectUri: "https://mochistudy-jkf2mcra.manus.space/api/oauth/callback", nonce: "expected" });

    expect(isValidOAuthState(state, "")).toBe(false);
    expect(isValidOAuthState(state, `${OAUTH_STATE_COOKIE}=different`)).toBe(false);
  });

  it("fails closed for malformed state", () => {
    expect(isValidOAuthState("not-valid-state", `${OAUTH_STATE_COOKIE}=anything`)).toBe(false);
  });

  it("renders an accessible callback loading state", () => {
    const page = renderOAuthCallbackLoadingPage();
    expect(page).toContain("Signing you in");
    expect(page).toContain('role="status"');
    expect(page).toContain("preparing Mochi");
  });
});

