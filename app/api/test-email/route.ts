import { NextRequest, NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { sendWorkspaceCreatedEmail } from "@/lib/email-service";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await currentUser();
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { type = "welcome" } = await request.json();

    let result;
    const userEmail = user.primaryEmailAddress?.emailAddress || "";
    const userName = user.firstName || user.username || "Utilisateur";

    switch (type) {
      case "welcome":
        result = await sendWorkspaceCreatedEmail(
          userEmail,
          userName,
          "Test Workspace"
        );
        break;
      
      default:
        return NextResponse.json(
          { error: "Type d'email non supporté" },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: "Email de test envoyé avec succès",
      emailId: result.id,
      service: process.env.RESEND_API_KEY ? "resend" : "mock"
    });

  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json(
      { 
        error: "Erreur lors de l'envoi de l'email de test",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 