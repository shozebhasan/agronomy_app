import { NextResponse } from "next/server";

const PYTHON_BACKEND_URL =
  process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || "http://localhost:8000";

export async function POST(request) {
  try {
    const body = await request.json();
    const { message, email, conversation_id, language, images } = body || {};

    if (!message || !email) {
      return NextResponse.json(
        {
          success: false,
          error: "Message and user email are required",
        },
        { status: 400 }
      );
    }

    // Validate images if present
    if (images && Array.isArray(images)) {
      if (images.length > 4) {
        return NextResponse.json(
          {
            success: false,
            error: "Maximum 4 images allowed per message",
          },
          { status: 400 }
        );
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 180000);

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        email,
        conversation_id, // forward conversation_id 
        language: language || "en",
        images: images || [], // Include images array
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || "Backend processing failed",
          response: data.response,
        },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      response: data.response,
      conversation_id: data.conversation_id,
    });
  } catch (error) {
    console.error("Chat API error:", error);

    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: "Request timeout",
          response: "The request took too long. Please try again.",
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Service temporarily unavailable",
        response: "I'm currently experiencing high demand. Please try again.",
      },
      { status: 503 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("userEmail"); // frontend passes userEmail in query
    const lang = searchParams.get("lang");

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          error: "userEmail parameter is required",
        },
        { status: 400 }
      );
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);

    const historyUrl = `${PYTHON_BACKEND_URL}/api/history/${encodeURIComponent(
      email
    )}?limit=20`;

    const response = await fetch(historyUrl, { signal: controller.signal });

    clearTimeout(timeoutId);

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return NextResponse.json({
        success: false,
        error: data.error || "Failed to fetch history",
        history: [],
        conversations: [],
      });
    }

    return NextResponse.json({
      success: true,
      history: data.history || [],
      conversations: data.conversations || [],
    });
  } catch (error) {
    console.error("History API error:", error);

    if (error.name === "AbortError") {
      return NextResponse.json(
        {
          success: false,
          error: "Request timeout",
          history: [],
          conversations: [],
        },
        { status: 408 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch history",
        history: [],
        conversations: [],
      },
      { status: 500 }
    );
  }
}