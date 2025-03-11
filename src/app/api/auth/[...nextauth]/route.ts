import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import { Adapter, AdapterAccount } from "next-auth/adapters";
import { AuthOptions } from "next-auth";
import { prisma } from "@/lib/prisma";

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
    const createdAccount = await prisma.account.create({
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
        
        // Try to fetch user data from the database
        const dbUser = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            organizations: {
              include: { organization: true },
            },
          },
        });
        
        if (dbUser?.organizations && dbUser.organizations.length > 0) {
          const primaryOrgUser = dbUser.organizations[0];
          session.user.organizationId = primaryOrgUser.organizationId;
          session.user.role = primaryOrgUser.role;
          session.user.organizationName = primaryOrgUser.organization.name;
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
      // Check if this is a new user
      const userCount = await prisma.user.count();
      
      if (userCount === 1) {
        try {
          // This is the first user, create a default organization
          const defaultOrg = await prisma.organization.create({
            data: {
              name: "Default Organization",
              description: "This is a default organization. You can update its details later.",
            },
          });
          
          // Assign the user to the organization as an ADMIN
          await prisma.organizationUser.create({
            data: {
              userId: user.id,
              organizationId: defaultOrg.id,
              role: "ADMIN",
            },
          });
          
          console.log("Created default organization and assigned user as ADMIN");
        } catch (error) {
          console.error("Error creating organization:", error);
        }
      } else {
        // Check if the user already has an organization
        const orgUsers = await prisma.organizationUser.findMany({
          where: { userId: user.id },
        });
        
        if (orgUsers.length === 0) {
          try {
            // Find the first organization
            const firstOrg = await prisma.organization.findFirst();
            
            if (firstOrg) {
              // Assign the user to the organization as a MEMBER
              await prisma.organizationUser.create({
                data: {
                  userId: user.id,
                  organizationId: firstOrg.id,
                  role: "MEMBER",
                },
              });
              
              console.log("Assigned user to existing organization as MEMBER");
            } else {
              // Create a new organization for this user
              const newOrg = await prisma.organization.create({
                data: {
                  name: `${user.name || 'New'}'s Organization`,
                  description: "This is your organization. You can update its details later.",
                },
              });
              
              // Assign the user to the organization as an ADMIN
              await prisma.organizationUser.create({
                data: {
                  userId: user.id,
                  organizationId: newOrg.id,
                  role: "ADMIN",
                },
              });
              
              console.log("Created new organization for user and assigned as ADMIN");
            }
          } catch (error) {
            console.error("Error assigning user to organization:", error);
          }
        }
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