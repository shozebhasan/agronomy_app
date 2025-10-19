import { NextResponse } from "next/server";

const PYTHON_BACKEND_URL =
  process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://localhost:8000";

export async function POST(req) {
  try {
    // get user email from cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const emailMatch = cookieHeader.match(/userEmail=([^;]+)/);
    const email = emailMatch ? decodeURIComponent(emailMatch[1]) : null;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "User not logged in" },
        { status: 401 }
      );
    }

    // call backend
    const res = await fetch(`${PYTHON_BACKEND_URL}/api/chat/new`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      return NextResponse.json(
        { success: false, error: data.error || "Failed to start new chat" },
        { status: res.status || 500 }
      );
    }

    return NextResponse.json({
      success: true,
      conversation_id: data.conversation_id,
    });
  } catch (err) {
    console.error("Error in /api/chat/new:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
