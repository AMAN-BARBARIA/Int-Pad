import { DefaultSession } from "next-auth";

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      /** The user's unique identifier */
      id: string;
      /** The user's tenant ID */
      tenantId?: string;
      /** The user's role in the tenant */
      role?: string;
      /** The user's tenant name */
      tenantName?: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** The user's unique identifier */
    id?: string;
    /** The OAuth access token */
    accessToken?: string;
    /** The OAuth refresh token */
    refreshToken?: string;
    /** When the access token expires */
    accessTokenExpires?: number;
    /** Error refreshing the token */
    error?: string;
  }
} 