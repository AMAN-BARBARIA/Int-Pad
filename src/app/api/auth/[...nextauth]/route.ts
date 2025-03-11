import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { Adapter, AdapterAccount } from "next-auth/adapters";
import { AuthOptions } from "next-auth";
import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

// Fix TypeScript errors by using type assertion
type PrismaWithModels = PrismaClient & {
  tenant: unknown;
  tenantUser: unknown;
  userSettings: unknown;
  user: unknown;
};

// Use the typed prisma client
const typedPrisma = prisma as PrismaWithModels;

// Define an interface that includes the extra field from Google
interface GoogleOAuthAccount extends AdapterAccount {
  refresh_token_expires_in?: number;
}

// Create a custom adapter that handles the refresh_token_expires_in field
const customAdapter = {
  ...PrismaAdapter(prisma),
  async linkAccount(account: GoogleOAuthAccount) {
    // Filter out the refresh_token_expires_in field if it's not needed
    // or include it if the schema supports it
    const { refresh_token_expires_in, ...accountData } = account;
    
    // Create the account with the filtered data
    const createdAccount = await typedPrisma.account.create({
      data: {
        ...accountData,
        // Only include refresh_token_expires_in if it exists
        ...(refresh_token_expires_in ? { refresh_token_expires_in } : {})
      },
    });
    
    return createdAccount;
  }
};

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      authorization: {
        params: {
          scope: "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/calendar",
          prompt: "consent",
          access_type: "offline",
          response_type: "code",
        },
      },
      httpOptions: {
        timeout: 10000, // 10 seconds
      },
    }),
  ],
  adapter: customAdapter as Adapter,
  callbacks: {
    async session({ session, token, user }) {
      if (!session.user) {
        return session;
      }

      try {
        // When using JWT strategy, user might be undefined, so use token instead
        const userId = user?.id || token?.sub;
        
        if (!userId) {
          console.error("No user ID found in session or token");
          return session;
        }
        
        // Set the user ID in the session
        session.user.id = userId;
        
        // Get the user's tenant info
        const userWithTenants = await typedPrisma.user.findUnique({
          where: { id: userId },
          include: {
            tenants: {
              include: { tenant: true },
              take: 1 // Get only the first tenant association
            }
          }
        });
        
        // Add tenant info to the session if available
        if (userWithTenants?.tenants && userWithTenants.tenants.length > 0) {
          const tenantUser = userWithTenants.tenants[0];
          session.user.tenantId = tenantUser.tenantId;
          session.user.role = tenantUser.role;
          session.user.tenantName = tenantUser.tenant.name;
        }
      } catch (error) {
        console.error("Error in session callback:", error);
        // Continue with the session even if there's an error
      }
      
      return session;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = account.expires_at ? account.expires_at * 1000 : undefined;
        token.id = user.id;
      }
      return token;
    }
  },
  events: {
    async signIn({ user }) {
      try {
        // Check if the user already has tenant associations (handles repeated sign-ins)
        const existingUserTenants = await typedPrisma.tenantUser.findMany({
          where: { userId: user.id },
        });
        
        // Early return if user already has tenant associations
        if (existingUserTenants.length > 0) {
          console.log("User already has tenant associations, skipping tenant setup");
          return;
        }
        
        // Check if any tenants exist in the system (more reliable than counting users)
        const tenantCount = await typedPrisma.tenant.count();
        
        // Case 1: No tenants exist - this is the first user/system initialization
        if (tenantCount === 0) {
          // Create default tenant for first user
          const defaultTenant = await typedPrisma.tenant.create({
            data: {
              name: "Default Tenant",
              domain: user.email?.split('@')[1] || null,
              active: true,
            },
          });
          
          // Assign the user to the tenant as an ADMIN
          await typedPrisma.tenantUser.create({
            data: {
              userId: user.id,
              tenantId: defaultTenant.id,
              role: "ADMIN",
              isActive: true,
            },
          });
          
          // Create default user settings for this user in the tenant
          await typedPrisma.userSettings.create({
            data: {
              userId: user.id,
              tenantId: defaultTenant.id,
              maxSchedulesPerDay: 3,
              advanceBookingDays: 30,
              meetingDuration: 30,
              bufferBetweenEvents: 15,
            },
          });
          
          console.log("Created first tenant and assigned user as ADMIN");
          return;
        }
        
        // Case 2: Tenants exist - check organization policy for new users
        const assignToExistingTenant = process.env.ASSIGN_NEW_USERS_TO_EXISTING_TENANT === "true";
        
        if (assignToExistingTenant) {
          // Find the first active tenant
          const firstTenant = await typedPrisma.tenant.findFirst({
            where: { active: true }
          });
          
          if (firstTenant) {
            // Assign the user to the tenant as a USER
            await typedPrisma.tenantUser.create({
              data: {
                userId: user.id,
                tenantId: firstTenant.id,
                role: "USER",
                isActive: true,
              },
            });
            
            // Create default user settings for this user in the tenant
            await typedPrisma.userSettings.create({
              data: {
                userId: user.id,
                tenantId: firstTenant.id,
                maxSchedulesPerDay: 3,
                advanceBookingDays: 30,
                meetingDuration: 30,
                bufferBetweenEvents: 15,
              },
            });
            
            console.log("Assigned user to existing tenant as USER");
            return;
          }
        }
        
        // Case 3: Create a new tenant for this user
        const newTenant = await typedPrisma.tenant.create({
          data: {
            name: `${user.name || 'New'}'s Tenant`,
            domain: user.email?.split('@')[1] || null,
            active: true,
          },
        });
        
        // Assign the user to the tenant as an ADMIN
        await typedPrisma.tenantUser.create({
          data: {
            userId: user.id,
            tenantId: newTenant.id,
            role: "ADMIN",
            isActive: true,
          },
        });
        
        // Create default user settings for this user in the tenant
        await typedPrisma.userSettings.create({
          data: {
            userId: user.id,
            tenantId: newTenant.id,
            maxSchedulesPerDay: 3,
            advanceBookingDays: 30,
            meetingDuration: 30,
            bufferBetweenEvents: 15,
          },
        });
        
        console.log("Created new tenant for this user and assigned as ADMIN");
      } catch (error) {
        console.error("Error in tenant association logic:", error);
      }
    }
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  debug: process.env.NODE_ENV === "development",
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST }; 