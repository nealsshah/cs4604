import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type');
    const applicantId = searchParams.get('applicantId');

    if (!applicantId) {
      return NextResponse.json({ error: 'ApplicantID required' }, { status: 400 });
    }

    let result: any;

    switch (reportType) {
      case '1': // Total number of applications submitted
        result = await query(`
          SELECT COUNT(*) as totalApplications
          FROM ApplicationForm
          WHERE ApplicantID = ?
        `, [applicantId]);
        return NextResponse.json({ 
          report: 'Total Applications Submitted',
          data: result[0],
          description: 'Count of all job applications submitted by this applicant'
        });

      case '2': // Average days since application per status
        result = await query(`
          SELECT 
            Status,
            AVG(DATEDIFF(CURDATE(), DATE(AppliedAt))) as avgDaysSinceApplication
          FROM ApplicationForm
          WHERE ApplicantID = ?
          GROUP BY Status
        `, [applicantId]);
        return NextResponse.json({ 
          report: 'Average Days Since Application by Status',
          data: result,
          description: 'Average number of days since application grouped by application status'
        });

      case '3': // Maximum applications in a single month
        result = await query(`
          SELECT 
            DATE_FORMAT(AppliedAt, '%Y-%m') as month,
            COUNT(*) as applicationCount
          FROM ApplicationForm
          WHERE ApplicantID = ?
          GROUP BY DATE_FORMAT(AppliedAt, '%Y-%m')
          ORDER BY applicationCount DESC
          LIMIT 1
        `, [applicantId]);
        return NextResponse.json({ 
          report: 'Month with Most Applications',
          data: result[0] || { month: 'N/A', applicationCount: 0 },
          description: 'The month with the maximum number of applications submitted'
        });

      case '4': // Minimum and maximum days for offer applications
        result = await query(`
          SELECT 
            MIN(DATEDIFF(CURDATE(), DATE(AppliedAt))) as minDaysSinceApplication,
            MAX(DATEDIFF(CURDATE(), DATE(AppliedAt))) as maxDaysSinceApplication,
            AVG(DATEDIFF(CURDATE(), DATE(AppliedAt))) as avgDaysSinceApplication,
            COUNT(*) as offerCount
          FROM ApplicationForm
          WHERE ApplicantID = ? AND Status = 'Offer'
        `, [applicantId]);
        return NextResponse.json({ 
          report: 'Days Analysis for Offers',
          data: result[0] || { minDaysSinceApplication: 0, maxDaysSinceApplication: 0, avgDaysSinceApplication: 0, offerCount: 0 },
          description: 'Minimum, maximum, and average days since application for offer status applications'
        });

      case '5': // Sum of applications by job status
        result = await query(`
          SELECT 
            Status,
            COUNT(*) as statusCount,
            SUM(CASE WHEN Status = 'Offer' THEN 1 ELSE 0 END) as offerCount,
            SUM(CASE WHEN Status = 'Rejected' THEN 1 ELSE 0 END) as rejectedCount
          FROM ApplicationForm
          WHERE ApplicantID = ?
          GROUP BY Status
        `, [applicantId]);
        return NextResponse.json({ 
          report: 'Application Status Summary',
          data: result,
          description: 'Total count and sum breakdown of applications by status'
        });

      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

