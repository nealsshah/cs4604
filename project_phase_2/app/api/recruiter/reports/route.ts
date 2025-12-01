import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

function formatNumber(num: any): number {
  if (num === null || num === undefined || num === '') return 0;
  const n = typeof num === 'string' ? parseFloat(num) : num;
  return isNaN(n) ? 0 : n;
}

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
          description: 'Total count of job postings created by this recruiter',
          chartType: 'stat'
        });

      case '2': // Average number of applications per job
        result = await query(`
          SELECT 
            COALESCE(AVG(applicationCount), 0) as avgApplicationsPerJob,
            COALESCE(MIN(applicationCount), 0) as minApplicationsPerJob,
            COALESCE(MAX(applicationCount), 0) as maxApplicationsPerJob,
            COUNT(*) as totalJobs
          FROM (
            SELECT jp.JobID, COUNT(af.ApplicationID) as applicationCount
            FROM JobPosting jp
            LEFT JOIN ApplicationForm af ON jp.JobID = af.JobID
            WHERE jp.RecruiterID = ?
            GROUP BY jp.JobID
          ) as jobApplications
        `, [recruiterId]);
        const report2Data = result[0] || { avgApplicationsPerJob: 0, minApplicationsPerJob: 0, maxApplicationsPerJob: 0, totalJobs: 0 };
        
        return NextResponse.json({ 
          report: 'Average Applications per Job',
          data: {
            avgApplicationsPerJob: formatNumber(report2Data.avgApplicationsPerJob),
            minApplicationsPerJob: formatNumber(report2Data.minApplicationsPerJob),
            maxApplicationsPerJob: formatNumber(report2Data.maxApplicationsPerJob),
            totalJobs: formatNumber(report2Data.totalJobs)
          },
          description: 'Average, minimum, and maximum number of applications received per job posting',
          chartType: 'bar'
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
        const report3Data = result[0] || { totalInterviews: 0, remoteInterviews: 0, onsiteInterviews: 0 };
        return NextResponse.json({ 
          report: 'Total Interviews Scheduled',
          data: {
            totalInterviews: Number(report3Data.totalInterviews),
            remoteInterviews: Number(report3Data.remoteInterviews),
            onsiteInterviews: Number(report3Data.onsiteInterviews)
          },
          description: 'Total sum of interviews scheduled, broken down by interview mode',
          chartType: 'bar'
        });

      case '4': // Minimum and maximum days to fill positions
        result = await query(`
          SELECT 
            COALESCE(MIN(DATEDIFF(af.AppliedAt, jp.PostedDate)), 0) as minDaysToApplication,
            COALESCE(MAX(DATEDIFF(af.AppliedAt, jp.PostedDate)), 0) as maxDaysToApplication,
            COALESCE(AVG(DATEDIFF(af.AppliedAt, jp.PostedDate)), 0) as avgDaysToApplication,
            COUNT(*) as offerCount
          FROM JobPosting jp
          JOIN ApplicationForm af ON jp.JobID = af.JobID
          WHERE jp.RecruiterID = ? AND af.Status = 'Offer'
        `, [recruiterId]);
        const report4Data = result[0] || { minDaysToApplication: 0, maxDaysToApplication: 0, avgDaysToApplication: 0, offerCount: 0 };
        return NextResponse.json({ 
          report: 'Days to Fill Positions',
          data: {
            minDaysToApplication: formatNumber(report4Data.minDaysToApplication),
            maxDaysToApplication: formatNumber(report4Data.maxDaysToApplication),
            avgDaysToApplication: formatNumber(report4Data.avgDaysToApplication),
            offerCount: formatNumber(report4Data.offerCount)
          },
          description: 'Minimum, maximum, and average days from job posting to offer',
          chartType: 'bar'
        });

      case '5': // Application status distribution with counts
        result = await query(`
          SELECT 
            af.Status,
            COUNT(*) as statusCount,
            COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM ApplicationForm af2 
                                JOIN JobPosting jp2 ON af2.JobID = jp2.JobID 
                                WHERE jp2.RecruiterID = ?), 0) as percentage
          FROM ApplicationForm af
          JOIN JobPosting jp ON af.JobID = jp.JobID
          WHERE jp.RecruiterID = ?
          GROUP BY af.Status
        `, [recruiterId, recruiterId]);
        const formattedData = (result || []).map((row: any) => ({
          Status: row.Status,
          statusCount: Number(row.statusCount),
          percentage: Number(row.percentage || 0).toFixed(2),
          value: Number(row.statusCount),
          label: row.Status
        }));
        return NextResponse.json({ 
          report: 'Application Status Distribution',
          data: formattedData,
          description: 'Count and percentage distribution of applications by status',
          chartType: 'pie'
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

