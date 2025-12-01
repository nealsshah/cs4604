import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, changePassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { oldPassword, newPassword } = await request.json();

    if (!oldPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Old password and new password are required' },
        { status: 400 }
      );
    }

    await changePassword(user.UserID, oldPassword, newPassword);

    return NextResponse.json({ success: true, message: 'Password changed successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to change password' },
      { status: 400 }
    );
  }
}

