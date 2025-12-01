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
          description: 'Total counts across all major entities in the system',
          chartType: 'stat'
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
        const report2Data = result[0] || { avgApplicationsPerJob: null, minApplicationsPerJob: null, maxApplicationsPerJob: null, totalApplications: 0 };
        return NextResponse.json({ 
          report: 'Application Statistics per Job',
          data: {
            avgApplicationsPerJob: report2Data.avgApplicationsPerJob ? Number(report2Data.avgApplicationsPerJob).toFixed(2) : '0.00',
            minApplicationsPerJob: report2Data.minApplicationsPerJob ? Number(report2Data.minApplicationsPerJob) : 0,
            maxApplicationsPerJob: report2Data.maxApplicationsPerJob ? Number(report2Data.maxApplicationsPerJob) : 0,
            totalApplications: Number(report2Data.totalApplications || 0)
          },
          description: 'Average, minimum, maximum, and total applications across all job postings',
          chartType: 'bar'
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
        const formattedData3 = (result || []).map((row: any) => ({
          month: row.month,
          userCount: Number(row.userCount),
          applicantCount: Number(row.applicantCount),
          recruiterCount: Number(row.recruiterCount),
          adminCount: Number(row.adminCount),
          value: Number(row.userCount),
          label: row.month
        }));
        return NextResponse.json({ 
          report: 'User Registration Trends',
          data: formattedData3,
          description: 'Sum of user registrations by month, broken down by user type',
          chartType: 'bar'
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
        const report4Data = result[0] || { totalInterviews: 0, interviewsLeadingToOffer: 0, avgInterviewRounds: null, minRounds: null, maxRounds: null, successRate: 0 };
        return NextResponse.json({ 
          report: 'Interview Success Analysis',
          data: {
            totalInterviews: Number(report4Data.totalInterviews),
            interviewsLeadingToOffer: Number(report4Data.interviewsLeadingToOffer),
            avgInterviewRounds: report4Data.avgInterviewRounds ? Number(report4Data.avgInterviewRounds).toFixed(2) : '0.00',
            minRounds: report4Data.minRounds ? Number(report4Data.minRounds) : 0,
            maxRounds: report4Data.maxRounds ? Number(report4Data.maxRounds) : 0,
            successRate: Number(report4Data.successRate || 0).toFixed(2)
          },
          description: 'Statistics on interviews including success rates and round analysis',
          chartType: 'stat'
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
        const formattedData5 = (result || []).map((row: any) => ({
          Status: row.Status,
          jobCount: Number(row.jobCount),
          jobsWithApplications: Number(row.jobsWithApplications),
          avgApplicationsPerJob: row.avgApplicationsPerJob ? Number(row.avgApplicationsPerJob).toFixed(2) : '0.00',
          minApplications: row.minApplications ? Number(row.minApplications) : 0,
          maxApplications: row.maxApplications ? Number(row.maxApplications) : 0,
          value: Number(row.jobCount),
          label: row.Status
        }));
        return NextResponse.json({ 
          report: 'Job Posting Performance by Status',
          data: formattedData5,
          description: 'Comprehensive statistics on job postings grouped by status',
          chartType: 'bar'
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

