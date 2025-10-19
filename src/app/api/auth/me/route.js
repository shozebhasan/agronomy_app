
import { NextResponse } from "next/server";

const PYTHON_BACKEND_URL =
  process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://localhost:8000";

export async function GET(req) {
  try {
    //  Read cookie 
    const cookieHeader = req.headers.get("cookie") || "";
    const emailMatch = cookieHeader.match(/userEmail=([^;]+)/);
    const email = emailMatch ? decodeURIComponent(emailMatch[1]) : null;

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Not logged in" },
        { status: 401 }
      );
    }

    // Calls FastAPI 
    const res = await fetch(
      `${PYTHON_BACKEND_URL}/api/auth/me?email=${encodeURIComponent(email)}`
    );
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status });
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (err) {
    console.error("Error in /api/auth/me:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
