import { NextResponse } from "next/server";

const PYTHON_BACKEND_URL =
  process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://localhost:8000";

export async function POST(req) {
  try {
    const body = await req.json();

    // Calls FastAPI 
    const res = await fetch(`${PYTHON_BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      //  Set a cookie with the logged-in user's email
      const response = NextResponse.json(data);
      response.cookies.set("userEmail", data.user.email, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });
      return response;
    }

    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("Error in /api/auth/login:", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}
