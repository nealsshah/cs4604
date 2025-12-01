import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Create/Update offer (by updating application status to "Offer")
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'ApplicationID required' }, { status: 400 });
    }

    // Get old status
    const applications = await query(
      'SELECT Status FROM ApplicationForm WHERE ApplicationID = ?',
      [applicationId]
    ) as any[];

    if (applications.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const oldStatus = applications[0].Status;

    // Update application status to "Offer"
    await query(
      'UPDATE ApplicationForm SET Status = "Offer" WHERE ApplicationID = ?',
      [applicationId]
    );

    // Record status update
    await query(
      'INSERT INTO StatusUpdate (ApplicationID, OldStatus, NewStatus, Note) VALUES (?, ?, ?, ?)',
      [applicationId, oldStatus, 'Offer', 'Offer letter sent']
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get offers
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const offers = await query(
      `SELECT af.*, ja.FirstName, ja.LastName, ja.Email, jp.Title as JobTitle
       FROM ApplicationForm af
       JOIN JobApplicant ja ON af.ApplicantID = ja.ApplicantID
       JOIN JobPosting jp ON af.JobID = jp.JobID
       WHERE af.Status = "Offer"
       ORDER BY af.AppliedAt DESC`
    ) as any[];

    return NextResponse.json({ offers });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Withdraw offer
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'ApplicationID required' }, { status: 400 });
    }

    // Change status back to "Under Review" or "Rejected"
    await query(
      'UPDATE ApplicationForm SET Status = "Rejected" WHERE ApplicationID = ? AND Status = "Offer"',
      [applicationId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

