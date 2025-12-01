import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Verify applicant record exists
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

    // Check if applicant exists
    const applicants = await query(
      'SELECT ApplicantID, FirstName, LastName, Email, Phone FROM JobApplicant WHERE ApplicantID = ?',
      [applicantId]
    ) as any[];

    if (applicants.length === 0) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    return NextResponse.json({ applicant: applicants[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

