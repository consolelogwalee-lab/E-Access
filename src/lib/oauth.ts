/**
 * Social sign-in via the standard OAuth 2.0 authorization-code flow.
 * A provider's button only appears when its credentials exist in the environment,
 * so nothing on the site is ever a dead end.
 *
 * Env vars: GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET
 *           FACEBOOK_CLIENT_ID / FACEBOOK_CLIENT_SECRET
 *           MICROSOFT_CLIENT_ID / MICROSOFT_CLIENT_SECRET
 */

export type Provider = "google" | "facebook" | "microsoft";

type ProviderConfig = {
  authUrl: string;
  tokenUrl: string;
  userUrl: string;
  scope: string;
  clientId: string;
  clientSecret: string;
  /** Maps the provider's profile payload to { email, name } */
  profile: (data: Record<string, unknown>) => { email: string | null; name: string | null };
};

function cfg(provider: Provider): ProviderConfig | null {
  const defs: Record<Provider, Omit<ProviderConfig, "clientId" | "clientSecret">> = {
    google: {
      authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      userUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
      scope: "openid email profile",
      profile: (d) => ({ email: (d.email as string) ?? null, name: (d.name as string) ?? null }),
    },
    facebook: {
      authUrl: "https://www.facebook.com/v19.0/dialog/oauth",
      tokenUrl: "https://graph.facebook.com/v19.0/oauth/access_token",
      userUrl: "https://graph.facebook.com/me?fields=id,name,email",
      scope: "email public_profile",
      profile: (d) => ({ email: (d.email as string) ?? null, name: (d.name as string) ?? null }),
    },
    microsoft: {
      authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
      tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
      userUrl: "https://graph.microsoft.com/oidc/userinfo",
      scope: "openid profile email",
      profile: (d) => ({
        email: ((d.email as string) ?? (d.preferred_username as string)) ?? null,
        name: (d.name as string) ?? null,
      }),
    },
  };
  const id = process.env[`${provider.toUpperCase()}_CLIENT_ID`] ?? "";
  const secret = process.env[`${provider.toUpperCase()}_CLIENT_SECRET`] ?? "";
  if (!id || !secret) return null;
  return { ...defs[provider], clientId: id, clientSecret: secret };
}

export function enabledProviders(): Provider[] {
  return (["google", "facebook", "microsoft"] as Provider[]).filter((p) => cfg(p) !== null);
}

export function isProvider(p: string): p is Provider {
  return ["google", "facebook", "microsoft"].includes(p);
}

export function authRedirectUrl(provider: Provider, redirectUri: string, state: string): string | null {
  const c = cfg(provider);
  if (!c) return null;
  const params = new URLSearchParams({
    client_id: c.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: c.scope,
    state,
  });
  if (provider === "google") params.set("prompt", "select_account");
  return `${c.authUrl}?${params.toString()}`;
}

export async function exchangeProfile(
  provider: Provider,
  code: string,
  redirectUri: string
): Promise<{ email: string | null; name: string | null } | null> {
  const c = cfg(provider);
  if (!c) return null;
  try {
    const tokenRes = await fetch(c.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: new URLSearchParams({
        client_id: c.clientId,
        client_secret: c.clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: redirectUri,
      }),
    });
    if (!tokenRes.ok) return null;
    const token = (await tokenRes.json()) as { access_token?: string };
    if (!token.access_token) return null;
    const userRes = await fetch(c.userUrl, { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!userRes.ok) return null;
    return c.profile((await userRes.json()) as Record<string, unknown>);
  } catch {
    return null;
  }
}
