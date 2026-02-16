import { NextResponse } from "next/server";

const PYTHON_BACKEND_URL =
  process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://localhost:8000";

export async function POST(req) {
  try {
    const body = await req.json();
    const { message_id, feedback_type, comment } = body;

    if (!message_id || !feedback_type) {
      return NextResponse.json(
        { success: false, error: "Message ID and feedback type required" },
        { status: 400 }
      );
    }

    // Get user email from cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const emailMatch = cookieHeader.match(/userEmail=([^;]+)/);
    const email = emailMatch ? decodeURIComponent(emailMatch[1]) : null;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/message/feedback`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `userEmail=${email}`,
      },
      body: JSON.stringify({ message_id, feedback_type, comment }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("Feedback API error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}