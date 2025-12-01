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
        af.Status as ApplicationStatus, af.AppliedAt
      FROM JobApplicant ja
      LEFT JOIN CandidateProfile cp ON ja.ApplicantID = cp.ApplicantID
      LEFT JOIN ApplicationForm af ON ja.ApplicantID = af.ApplicantID
      WHERE 1=1
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

    // Note: Experience filtering would require parsing the Summary field
    // or adding an Experience field to CandidateProfile
    // For now, we'll just return all applicants

    sql += ' ORDER BY ja.LastName, ja.FirstName';

    const applicants = await query(sql, params) as any[];

    return NextResponse.json({ applicants });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

