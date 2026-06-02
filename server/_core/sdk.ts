import { SignJWT, jwtVerify } from "jose";
import { ENV } from "./env";

const secret = new TextEncoder().encode(ENV.sessionSecret);

export const sdk = {
  async createSessionToken(
    openId: string,
    opts: { name?: string; expiresInMs?: number } = {},
  ): Promise<string> {
    const expiresIn = opts.expiresInMs ?? 1000 * 60 * 60 * 24 * 365;
    return new SignJWT({ sub: openId, name: opts.name ?? "" })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(Math.floor((Date.now() + expiresIn) / 1000))
      .sign(secret);
  },

  async verifySessionToken(token: string): Promise<{ sub: string; name: string } | null> {
    try {
      const { payload } = await jwtVerify(token, secret);
      return { sub: payload.sub as string, name: (payload.name as string) ?? "" };
    } catch {
      return null;
    }
  },
};
