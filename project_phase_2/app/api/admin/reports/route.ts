import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Admin') {
      return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');

    let result: any;

    switch (reportType) {
      case '1': // Total system statistics
        result = await query(`
          SELECT 
            (SELECT COUNT(*) FROM Users) as totalUsers,
            (SELECT COUNT(*) FROM JobApplicant) as totalApplicants,
            (SELECT COUNT(*) FROM Recruiter) as totalRecruiters,
            (SELECT COUNT(*) FROM JobPosting) as totalJobPostings,
            (SELECT COUNT(*) FROM ApplicationForm) as totalApplications,
            (SELECT COUNT(*) FROM Interview) as totalInterviews
        `);
        return NextResponse.json({ 
          report: 'System Overview Statistics',
          data: result[0],
          description: 'Total counts across all major entities in the system'
        });

      case '2': // Average applications per job posting
        result = await query(`
          SELECT 
            AVG(applicationCount) as avgApplicationsPerJob,
            MIN(applicationCount) as minApplicationsPerJob,
            MAX(applicationCount) as maxApplicationsPerJob,
            SUM(applicationCount) as totalApplications
          FROM (
            SELECT jp.JobID, COUNT(af.ApplicationID) as applicationCount
            FROM JobPosting jp
            LEFT JOIN ApplicationForm af ON jp.JobID = af.JobID
            GROUP BY jp.JobID
          ) as jobApplications
        `);
        return NextResponse.json({ 
          report: 'Application Statistics per Job',
          data: result[0] || { avgApplicationsPerJob: 0, minApplicationsPerJob: 0, maxApplicationsPerJob: 0, totalApplications: 0 },
          description: 'Average, minimum, maximum, and total applications across all job postings'
        });

      case '3': // User registration trends (sum by month)
        result = await query(`
          SELECT 
            DATE_FORMAT(CreatedAt, '%Y-%m') as month,
            COUNT(*) as userCount,
            SUM(CASE WHEN UserType = 'JobApplicant' THEN 1 ELSE 0 END) as applicantCount,
            SUM(CASE WHEN UserType = 'Recruiter' THEN 1 ELSE 0 END) as recruiterCount,
            SUM(CASE WHEN UserType = 'Admin' THEN 1 ELSE 0 END) as adminCount
          FROM Users
          GROUP BY DATE_FORMAT(CreatedAt, '%Y-%m')
          ORDER BY month DESC
        `);
        return NextResponse.json({ 
          report: 'User Registration Trends',
          data: result,
          description: 'Sum of user registrations by month, broken down by user type'
        });

      case '4': // Interview success rate analysis
        result = await query(`
          SELECT 
            COUNT(*) as totalInterviews,
            SUM(CASE WHEN af.Status = 'Offer' THEN 1 ELSE 0 END) as interviewsLeadingToOffer,
            AVG(i.RoundNumber) as avgInterviewRounds,
            MIN(i.RoundNumber) as minRounds,
            MAX(i.RoundNumber) as maxRounds,
            (SUM(CASE WHEN af.Status = 'Offer' THEN 1 ELSE 0 END) * 100.0 / COUNT(*)) as successRate
          FROM Interview i
          JOIN ApplicationForm af ON i.ApplicationID = af.ApplicationID
        `);
        return NextResponse.json({ 
          report: 'Interview Success Analysis',
          data: result[0] || { totalInterviews: 0, interviewsLeadingToOffer: 0, avgInterviewRounds: 0, minRounds: 0, maxRounds: 0, successRate: 0 },
          description: 'Statistics on interviews including success rates and round analysis'
        });

      case '5': // Job posting performance by status
        result = await query(`
          SELECT 
            jp.Status,
            COUNT(*) as jobCount,
            SUM(CASE WHEN af.ApplicationID IS NOT NULL THEN 1 ELSE 0 END) as jobsWithApplications,
            AVG(applicationCount) as avgApplicationsPerJob,
            MIN(applicationCount) as minApplications,
            MAX(applicationCount) as maxApplications
          FROM JobPosting jp
          LEFT JOIN (
            SELECT JobID, COUNT(*) as applicationCount
            FROM ApplicationForm
            GROUP BY JobID
          ) af ON jp.JobID = af.JobID
          GROUP BY jp.Status
        `);
        return NextResponse.json({ 
          report: 'Job Posting Performance by Status',
          data: result,
          description: 'Comprehensive statistics on job postings grouped by status'
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

