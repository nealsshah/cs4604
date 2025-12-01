import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Update application status (shortlist, reject, etc.)
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId, status } = await request.json();

    if (!applicationId || !status) {
      return NextResponse.json({ error: 'ApplicationID and Status are required' }, { status: 400 });
    }

    const validStatuses = ['Submitted', 'Under Review', 'Interview Scheduled', 'Offer', 'Rejected'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    // Get old status for StatusUpdate
    const applications = await query(
      'SELECT Status FROM ApplicationForm WHERE ApplicationID = ?',
      [applicationId]
    ) as any[];

    if (applications.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const oldStatus = applications[0].Status;

    // Update application status
    await query(
      'UPDATE ApplicationForm SET Status = ? WHERE ApplicationID = ?',
      [status, applicationId]
    );

    // Record status update
    await query(
      'INSERT INTO StatusUpdate (ApplicationID, OldStatus, NewStatus, Note) VALUES (?, ?, ?, ?)',
      [applicationId, oldStatus, status, `Status changed to ${status}`]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get applications for a job
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');

    if (!jobId) {
      return NextResponse.json({ error: 'JobID required' }, { status: 400 });
    }

    const applications = await query(
      `SELECT af.*, ja.FirstName, ja.LastName, ja.Email, cp.Summary
       FROM ApplicationForm af
       JOIN JobApplicant ja ON af.ApplicantID = ja.ApplicantID
       LEFT JOIN CandidateProfile cp ON ja.ApplicantID = cp.ApplicantID
       WHERE af.JobID = ?
       ORDER BY af.AppliedAt DESC`,
      [jobId]
    ) as any[];

    return NextResponse.json({ applications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

