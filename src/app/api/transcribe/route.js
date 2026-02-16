import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const body = await request.json();
    const { audio, filename } = body;

    if (!audio) {
      return NextResponse.json(
        { success: false, error: 'No audio data provided' },
        { status: 400 }
      );
    }

    // Forward to Python backend
    const response = await fetch(`${PYTHON_BACKEND_URL}/api/transcribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audio, filename }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, error: data.error || 'Transcription failed' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      text: data.text,
    });
  } catch (error) {
    console.error('Transcribe API error:', error);
    return NextResponse.json(
      { success: false, error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }
}