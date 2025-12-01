import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, createAdminByAdmin } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Only admins can create other admins' },
        { status: 401 }
      );
    }

    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    await createAdminByAdmin(user.UserID, username, password);

    return NextResponse.json({ success: true, message: `Admin '${username}' created successfully` });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create admin' },
      { status: 400 }
    );
  }
}

