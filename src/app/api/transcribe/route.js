import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('audio');

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 }
      );
    }

    console.log('📤 Forwarding audio to Python backend');
    console.log('   - File size:', audioFile.size, 'bytes');
    console.log('   - File type:', audioFile.type);

    // Get user email from cookie for authentication
    const cookieHeader = req.headers.get('cookie') || '';
    const emailMatch = cookieHeader.match(/userEmail=([^;]+)/);
    const email = emailMatch ? decodeURIComponent(emailMatch[1]) : null;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Forward to Python backend
    const backendFormData = new FormData();
    backendFormData.append('audio', audioFile);
    backendFormData.append('email', email);

    console.log('🔄 Calling:', `${PYTHON_BACKEND_URL}/api/transcribe`);

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/transcribe`, {
      method: 'POST',
      body: backendFormData,
    });

    console.log('📥 Backend response status:', response.status);

    // Get response as text first to handle both JSON and non-JSON responses
    const responseText = await response.text();
    console.log('📥 Backend response (first 200 chars):', responseText.substring(0, 200));

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse backend response as JSON');
      console.error('Response was:', responseText.substring(0, 500));
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Backend error: Invalid response format. Check Python backend logs.' 
        },
        { status: 500 }
      );
    }

    if (!response.ok) {
      console.error('❌ Backend error:', data.error);
      return NextResponse.json(
        { success: false, error: data.error || 'Transcription failed' },
        { status: response.status }
      );
    }

    console.log('✅ Transcription successful:', data.transcript?.substring(0, 100));

    return NextResponse.json({
      success: true,
      transcript: data.transcript,
      language: data.language
    });
  } catch (error) {
    console.error('❌ Transcription API error:', error);
    return NextResponse.json(
      { success: false, error: 'Service temporarily unavailable: ' + error.message },
      { status: 503 }
    );
  }
}