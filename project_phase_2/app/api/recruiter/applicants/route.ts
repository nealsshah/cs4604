import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Get applicants with filtering
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const experience = searchParams.get('experience'); // years of experience filter

    let sql = `
      SELECT DISTINCT 
        ja.ApplicantID, ja.FirstName, ja.LastName, ja.Email, ja.Phone,
        cp.Location, cp.Summary,
        af.Status as ApplicationStatus, af.AppliedAt, af.ApplicationID, af.JobID,
        jp.Title as JobTitle
      FROM JobApplicant ja
      LEFT JOIN CandidateProfile cp ON ja.ApplicantID = cp.ApplicantID
      LEFT JOIN ApplicationForm af ON ja.ApplicantID = af.ApplicantID
      LEFT JOIN JobPosting jp ON af.JobID = jp.JobID
      WHERE af.ApplicationID IS NOT NULL
    `;
    const params: any[] = [];

    if (jobId) {
      sql += ' AND af.JobID = ?';
      params.push(jobId);
    }

    if (status) {
      sql += ' AND af.Status = ?';
      params.push(status);
    }

    sql += ' ORDER BY af.AppliedAt DESC, ja.LastName, ja.FirstName';

    const applicants = await query(sql, params) as any[];

    return NextResponse.json({ applicants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

