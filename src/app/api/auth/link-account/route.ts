import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "../[...nextauth]/route";

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Find the user by email
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { accounts: true },
    });
    
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    
    // Get the account data from the request body
    const accountData = await req.json();
    
    // Check if this account already exists
    const existingAccount = await prisma.account.findFirst({
      where: {
        provider: accountData.provider,
        providerAccountId: accountData.providerAccountId,
      },
    });
    
    if (existingAccount) {
      return NextResponse.json({ error: "Account already linked" }, { status: 400 });
    }
    
    // Create the account link
    const account = await prisma.account.create({
      data: {
        ...accountData,
        userId: user.id,
      },
    });
    
    return NextResponse.json({ success: true, account });
  } catch (error) {
    console.error("Error linking account:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
} 