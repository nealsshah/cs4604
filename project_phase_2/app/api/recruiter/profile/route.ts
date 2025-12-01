import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Get or create recruiter record for the logged-in user
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to find recruiter by email (username might be email)
    const recruiters = await query(
      'SELECT RecruiterID, FullName, Email FROM Recruiter WHERE Email = ?',
      [user.Username]
    ) as any[];

    if (recruiters.length > 0) {
      return NextResponse.json({ recruiter: recruiters[0] });
    }

    // If not found, create a new recruiter record
    // Use username as email, and username as full name (or split if possible)
    const fullName = user.Username; // Could be improved to parse name from username
    const email = user.Username;

    const result = await query(
      'INSERT INTO Recruiter (FullName, Email) VALUES (?, ?)',
      [fullName, email]
    ) as any;

    // Get the created recruiter
    const newRecruiters = await query(
      'SELECT RecruiterID, FullName, Email FROM Recruiter WHERE RecruiterID = ?',
      [result.insertId]
    ) as any[];

    return NextResponse.json({ recruiter: newRecruiters[0] });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      // If duplicate entry, try to fetch again
      const user = await getCurrentUser();
      if (user) {
        const recruiters = await query(
          'SELECT RecruiterID, FullName, Email FROM Recruiter WHERE Email = ?',
          [user.Username]
        ) as any[];
        if (recruiters.length > 0) {
          return NextResponse.json({ recruiter: recruiters[0] });
        }
      }
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update recruiter profile
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fullName, email } = await request.json();

    // Find recruiter by user's email/username
    const recruiters = await query(
      'SELECT RecruiterID FROM Recruiter WHERE Email = ?',
      [user.Username]
    ) as any[];

    if (recruiters.length === 0) {
      return NextResponse.json({ error: 'Recruiter not found' }, { status: 404 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (fullName) {
      updates.push('FullName = ?');
      params.push(fullName);
    }
    if (email) {
      updates.push('Email = ?');
      params.push(email);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    params.push(recruiters[0].RecruiterID);
    await query(
      `UPDATE Recruiter SET ${updates.join(', ')} WHERE RecruiterID = ?`,
      params
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

