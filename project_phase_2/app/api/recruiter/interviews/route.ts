import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Schedule interview
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, interviewDateTime, mode, roundNumber } = await request.json();

    if (!applicationId || !interviewDateTime || !mode) {
      return NextResponse.json({ error: 'ApplicationID, InterviewDateTime, and Mode are required' }, { status: 400 });
    }

    // Verify application exists
    const applications = await query(
      'SELECT ApplicationID FROM ApplicationForm WHERE ApplicationID = ?',
      [applicationId]
    ) as any[];

    if (applications.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const result = await query(
      'INSERT INTO InterviewSchedule (ApplicationID, InterviewDateTime, Mode, RoundNumber) VALUES (?, ?, ?, ?)',
      [applicationId, interviewDateTime, mode, roundNumber || 1]
    ) as any;

    // Update application status to "Interview Scheduled"
    await query(
      'UPDATE ApplicationForm SET Status = "Interview Scheduled" WHERE ApplicationID = ?',
      [applicationId]
    );

    return NextResponse.json({ 
      success: true, 
      interviewId: result.insertId 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get interviews
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    let interviews;
    if (applicationId) {
      interviews = await query(
        'SELECT * FROM InterviewSchedule WHERE ApplicationID = ? ORDER BY InterviewDateTime',
        [applicationId]
      ) as any[];
    } else {
      interviews = await query(
        `SELECT is.*, af.ApplicantID, ja.FirstName, ja.LastName, jp.Title as JobTitle
         FROM InterviewSchedule is
         JOIN ApplicationForm af ON is.ApplicationID = af.ApplicationID
         JOIN JobApplicant ja ON af.ApplicantID = ja.ApplicantID
         JOIN JobPosting jp ON af.JobID = jp.JobID
         ORDER BY is.InterviewDateTime`
      ) as any[];
    }

    return NextResponse.json({ interviews });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update interview (reschedule)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId, interviewDateTime, mode } = await request.json();

    if (!interviewId) {
      return NextResponse.json({ error: 'InterviewID required' }, { status: 400 });
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (interviewDateTime) {
      updates.push('InterviewDateTime = ?');
      params.push(interviewDateTime);
    }
    if (mode) {
      updates.push('Mode = ?');
      params.push(mode);
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    params.push(interviewId);
    await query(
      `UPDATE InterviewSchedule SET ${updates.join(', ')} WHERE InterviewID = ?`,
      params
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Cancel interview
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const interviewId = searchParams.get('interviewId');

    if (!interviewId) {
      return NextResponse.json({ error: 'InterviewID required' }, { status: 400 });
    }

    await query('DELETE FROM InterviewSchedule WHERE InterviewID = ?', [interviewId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

