import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const recruiterId = searchParams.get('recruiterId');

    if (!recruiterId) {
      return NextResponse.json({ error: 'RecruiterID required' }, { status: 400 });
    }

    let result: any;

    switch (reportType) {
      case '1': // Total number of job postings
        result = await query(`
          SELECT COUNT(*) as totalJobPostings
          FROM JobPosting
          WHERE RecruiterID = ?
        `, [recruiterId]);
        return NextResponse.json({ 
          report: 'Total Job Postings',
          data: result[0],
          description: 'Total count of job postings created by this recruiter'
        });

      case '2': // Average number of applications per job
        result = await query(`
          SELECT 
            AVG(applicationCount) as avgApplicationsPerJob,
            MIN(applicationCount) as minApplicationsPerJob,
            MAX(applicationCount) as maxApplicationsPerJob
          FROM (
            SELECT jp.JobID, COUNT(af.ApplicationID) as applicationCount
            FROM JobPosting jp
            LEFT JOIN ApplicationForm af ON jp.JobID = af.JobID
            WHERE jp.RecruiterID = ?
            GROUP BY jp.JobID
          ) as jobApplications
        `, [recruiterId]);
        return NextResponse.json({ 
          report: 'Average Applications per Job',
          data: result[0] || { avgApplicationsPerJob: 0, minApplicationsPerJob: 0, maxApplicationsPerJob: 0 },
          description: 'Average, minimum, and maximum number of applications received per job posting'
        });

      case '3': // Total interviews scheduled (sum)
        result = await query(`
          SELECT 
            COUNT(*) as totalInterviews,
            SUM(CASE WHEN i.Mode = 'Remote' THEN 1 ELSE 0 END) as remoteInterviews,
            SUM(CASE WHEN i.Mode = 'Onsite' THEN 1 ELSE 0 END) as onsiteInterviews
          FROM Interview i
          JOIN ApplicationForm af ON i.ApplicationID = af.ApplicationID
          JOIN JobPosting jp ON af.JobID = jp.JobID
          WHERE jp.RecruiterID = ?
        `, [recruiterId]);
        return NextResponse.json({ 
          report: 'Total Interviews Scheduled',
          data: result[0] || { totalInterviews: 0, remoteInterviews: 0, onsiteInterviews: 0 },
          description: 'Total sum of interviews scheduled, broken down by interview mode'
        });

      case '4': // Minimum and maximum days to fill positions
        result = await query(`
          SELECT 
            MIN(DATEDIFF(af.AppliedAt, jp.PostedDate)) as minDaysToApplication,
            MAX(DATEDIFF(af.AppliedAt, jp.PostedDate)) as maxDaysToApplication,
            AVG(DATEDIFF(af.AppliedAt, jp.PostedDate)) as avgDaysToApplication
          FROM JobPosting jp
          JOIN ApplicationForm af ON jp.JobID = af.JobID
          WHERE jp.RecruiterID = ? AND af.Status = 'Offer'
        `, [recruiterId]);
        return NextResponse.json({ 
          report: 'Days to Fill Positions',
          data: result[0] || { minDaysToApplication: 0, maxDaysToApplication: 0, avgDaysToApplication: 0 },
          description: 'Minimum, maximum, and average days from job posting to offer'
        });

      case '5': // Application status distribution with counts
        result = await query(`
          SELECT 
            af.Status,
            COUNT(*) as statusCount,
            COUNT(*) * 100.0 / (SELECT COUNT(*) FROM ApplicationForm af2 
                                JOIN JobPosting jp2 ON af2.JobID = jp2.JobID 
                                WHERE jp2.RecruiterID = ?) as percentage
          FROM ApplicationForm af
          JOIN JobPosting jp ON af.JobID = jp.JobID
          WHERE jp.RecruiterID = ?
          GROUP BY af.Status
        `, [recruiterId, recruiterId]);
        return NextResponse.json({ 
          report: 'Application Status Distribution',
          data: result,
          description: 'Count and percentage distribution of applications by status'
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

