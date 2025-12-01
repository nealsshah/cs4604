import { NextRequest, NextResponse } from 'next/server';
import { signup, generateToken } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { username, password, userType } = await request.json();

    if (!username || !password || !userType) {
      return NextResponse.json(
        { error: 'Username, password, and user type are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    if (userType !== 'JobApplicant' && userType !== 'Recruiter') {
      return NextResponse.json(
        { error: 'Invalid user type' },
        { status: 400 }
      );
    }

    // Prevent admin creation through signup
    if (userType === 'Admin') {
      return NextResponse.json(
        { error: 'Admin accounts cannot be created through signup. Only existing admins can create other admins.' },
        { status: 403 }
      );
    }

    const user = await signup(username, password, userType);
    const token = generateToken(user);

    const cookieStore = await cookies();
    cookieStore.set('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        UserID: user.UserID,
        Username: user.Username,
        UserType: user.UserType
      }
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Signup failed' },
      { status: 400 }
    );
  }
}

