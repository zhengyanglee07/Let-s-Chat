import { NextResponse } from "next/server";
import { auth } from "@/lib/services/firebaseAdmin";

export async function GET() {
  try {
    const listUsersResult = await auth.listUsers();

    const verifiedUsers = listUsersResult.users
      .filter((user) => user.emailVerified)
      .map((m) => {
        const userProfiles = m.providerData;
        return {
          uid: m.uid,
          email: m.email,
          displayName: userProfiles[0].displayName ?? '-',
        };
      });

    return NextResponse.json({ verifiedUsers });
  } catch (error) {
    console.error("Error fetching verified users:", error);
    return NextResponse.json(
      { error: "Failed to retrieve users" },
      { status: 500 }
    );
  }
}
