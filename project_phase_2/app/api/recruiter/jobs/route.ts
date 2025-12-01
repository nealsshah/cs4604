import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Get all jobs (for recruiters)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const recruiterId = searchParams.get('recruiterId');

    let jobs;
    if (recruiterId) {
      jobs = await query(
        'SELECT * FROM JobPosting WHERE RecruiterID = ? ORDER BY PostedDate DESC',
        [recruiterId]
      ) as any[];
    } else {
      jobs = await query(
        'SELECT * FROM JobPosting ORDER BY PostedDate DESC'
      ) as any[];
    }

    return NextResponse.json({ jobs });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create job posting
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { recruiterId, title, department, location, employmentType, postedDate, status } = await request.json();

    if (!recruiterId || !title || !postedDate) {
      return NextResponse.json({ error: 'RecruiterID, Title, and PostedDate are required' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO JobPosting (RecruiterID, Title, Department, Location, EmploymentType, PostedDate, Status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [recruiterId, title, department || null, location || null, employmentType || 'Full-time', postedDate, status || 'Open']
    ) as any;

    return NextResponse.json({ 
      success: true, 
      jobId: result.insertId 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Update job posting
export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'Recruiter') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId, title, department, location, employmentType, postedDate, status } = await request.json();

    if (!jobId || !title) {
      return NextResponse.json({ error: 'JobID and Title are required' }, { status: 400 });
    }

    await query(
      'UPDATE JobPosting SET Title = ?, Department = ?, Location = ?, EmploymentType = ?, PostedDate = ?, Status = ? WHERE JobID = ?',
      [title, department || null, location || null, employmentType || 'Full-time', postedDate, status || 'Open', jobId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Delete job posting
export async function DELETE(request: NextRequest) {
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

    await query('DELETE FROM JobPosting WHERE JobID = ?', [jobId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

