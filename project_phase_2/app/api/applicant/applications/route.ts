import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Get applications for an applicant
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

    const applications = await query(
      `SELECT af.ApplicationID, af.JobID, af.Status, af.AppliedAt, 
       jp.Title, jp.Department, jp.Location
       FROM ApplicationForm af
       JOIN JobPosting jp ON af.JobID = jp.JobID
       WHERE af.ApplicantID = ?
       ORDER BY af.AppliedAt DESC`,
      [applicantId]
    ) as any[];

    return NextResponse.json({ applications });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Apply to a job
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicantId, jobId } = await request.json();

    if (!applicantId || !jobId) {
      return NextResponse.json({ error: 'ApplicantID and JobID required' }, { status: 400 });
    }

    // Verify applicant exists
    const applicants = await query(
      'SELECT ApplicantID FROM JobApplicant WHERE ApplicantID = ?',
      [applicantId]
    ) as any[];

    if (applicants.length === 0) {
      return NextResponse.json({ error: 'Applicant record not found. Please create your applicant record first.' }, { status: 404 });
    }

    // Check if job exists and is open
    const jobs = await query(
      'SELECT Status FROM JobPosting WHERE JobID = ?',
      [jobId]
    ) as any[];

    if (jobs.length === 0) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    if (jobs[0].Status !== 'Open') {
      return NextResponse.json({ error: 'Job is not open for applications' }, { status: 400 });
    }

    // Check if already applied
    const existing = await query(
      'SELECT ApplicationID FROM ApplicationForm WHERE ApplicantID = ? AND JobID = ?',
      [applicantId, jobId]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 400 });
    }

    // Create application
    const result = await query(
      'INSERT INTO ApplicationForm (ApplicantID, JobID, Status) VALUES (?, ?, "Submitted")',
      [applicantId, jobId]
    ) as any;

    return NextResponse.json({ 
      success: true, 
      applicationId: result.insertId,
      message: 'Application submitted successfully'
    });
  } catch (error: any) {
    console.error('Apply error:', error);
    return NextResponse.json({ error: error.message || 'Failed to submit application' }, { status: 500 });
  }
}

// Withdraw application
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');

    if (!applicationId) {
      return NextResponse.json({ error: 'ApplicationID required' }, { status: 400 });
    }

    await query(
      'DELETE FROM ApplicationForm WHERE ApplicationID = ?',
      [applicationId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Accept offer
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicationId } = await request.json();

    if (!applicationId) {
      return NextResponse.json({ error: 'ApplicationID required' }, { status: 400 });
    }

    // Check if application status is "Offer"
    const applications = await query(
      'SELECT Status FROM ApplicationForm WHERE ApplicationID = ?',
      [applicationId]
    ) as any[];

    if (applications.length === 0) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (applications[0].Status !== 'Offer') {
      return NextResponse.json({ error: 'Application is not in Offer status' }, { status: 400 });
    }

    // Update status to accepted (you might want to add an "Accepted" status)
    // For now, we'll just confirm the offer acceptance
    return NextResponse.json({ 
      success: true, 
      message: 'Offer accepted successfully' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

