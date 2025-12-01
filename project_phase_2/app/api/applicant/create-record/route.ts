import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// Create JobApplicant record for the logged-in user
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { firstName, lastName, email, phone } = await request.json();

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: 'First name, last name, and email are required' }, { status: 400 });
    }

    // Check if applicant already exists with this email
    const existing = await query(
      'SELECT ApplicantID, FirstName, LastName, Email, Phone FROM JobApplicant WHERE Email = ?',
      [email]
    ) as any[];

    if (existing.length > 0) {
      return NextResponse.json({ 
        success: true,
        applicantId: existing[0].ApplicantID,
        applicant: existing[0],
        message: 'Applicant record already exists'
      });
    }

    // Create new JobApplicant record
    const result = await query(
      'INSERT INTO JobApplicant (FirstName, LastName, Email, Phone) VALUES (?, ?, ?, ?)',
      [firstName, lastName, email, phone || null]
    ) as any;

    // Get the created applicant record
    const newApplicant = await query(
      'SELECT ApplicantID, FirstName, LastName, Email, Phone FROM JobApplicant WHERE ApplicantID = ?',
      [result.insertId]
    ) as any[];

    return NextResponse.json({ 
      success: true, 
      applicantId: result.insertId,
      applicant: newApplicant[0]
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Email already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Get ApplicantID by email
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email required' }, { status: 400 });
    }

    const applicants = await query(
      'SELECT ApplicantID, FirstName, LastName, Email, Phone FROM JobApplicant WHERE Email = ?',
      [email]
    ) as any[];

    if (applicants.length === 0) {
      return NextResponse.json({ error: 'Applicant not found' }, { status: 404 });
    }

    return NextResponse.json({ applicant: applicants[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

