import { NextResponse } from 'next/server';

const PYTHON_BACKEND_URL = process.env.NEXT_PUBLIC_PYTHON_BACKEND_URL || 'http://localhost:8000';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ 
        success: false, 
        error: 'Email and password are required' 
      }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ 
        success: false, 
        error: 'Password must be at least 6 characters long' 
      }, { status: 400 });
    }

    // Call Python backend for user registration
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(`${PYTHON_BACKEND_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email,
        password: password
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Handle specific HTTP errors
      if (response.status === 409) {
        return NextResponse.json({
          success: false,
          error: 'User already exists with this email'
        }, { status: 409 });
      }
      
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.success) {
      return NextResponse.json({
        success: true,
        message: 'Account created successfully. Please login.'
      });
    } else {
      return NextResponse.json({
        success: false,
        error: data.error || 'Registration failed'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Signup API error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json({
        success: false,
        error: 'Registration timeout. Please try again.'
      }, { status: 408 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Registration service unavailable. Please try again later.'
    }, { status: 503 });
  }
}