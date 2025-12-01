import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicantId, fileURL } = await request.json();

    if (!applicantId || !fileURL) {
      return NextResponse.json({ error: 'ApplicantID and fileURL required' }, { status: 400 });
    }

    // Set previous resumes to inactive
    await query(
      'UPDATE Resume SET IsActive = 0 WHERE ApplicantID = ?',
      [applicantId]
    );

    // Insert new resume
    const result = await query(
      'INSERT INTO Resume (ApplicantID, FileURL, IsActive) VALUES (?, ?, 1)',
      [applicantId, fileURL]
    ) as any;

    return NextResponse.json({ 
      success: true, 
      resumeId: result.insertId 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicantId = searchParams.get('applicantId');

    if (!applicantId) {
      return NextResponse.json({ error: 'ApplicantID required' }, { status: 400 });
    }

    const resumes = await query(
      'SELECT * FROM Resume WHERE ApplicantID = ? AND IsActive = 1',
      [applicantId]
    ) as any[];

    return NextResponse.json({ resumes });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

