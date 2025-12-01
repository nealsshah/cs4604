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
    const applicantId = searchParams.get('applicantId');

    if (!applicantId) {
      return NextResponse.json({ error: 'ApplicantID required' }, { status: 400 });
    }

    const profiles = await query(
      'SELECT * FROM CandidateProfile WHERE ApplicantID = ?',
      [applicantId]
    ) as any[];

    if (profiles.length === 0) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    return NextResponse.json({ profile: profiles[0] });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { applicantId, location, linkedInURL, portfolioURL, summary } = await request.json();

    if (!applicantId) {
      return NextResponse.json({ error: 'ApplicantID required' }, { status: 400 });
    }

    const result = await query(
      'INSERT INTO CandidateProfile (ApplicantID, Location, LinkedInURL, PortfolioURL, Summary) VALUES (?, ?, ?, ?, ?)',
      [applicantId, location || null, linkedInURL || null, portfolioURL || null, summary || null]
    ) as any;

    return NextResponse.json({ 
      success: true, 
      profileId: result.insertId 
    });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json({ error: 'Profile already exists for this applicant' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user || user.UserType !== 'JobApplicant') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { profileId, location, linkedInURL, portfolioURL, summary } = await request.json();

    if (!profileId) {
      return NextResponse.json({ error: 'ProfileID required' }, { status: 400 });
    }

    await query(
      'UPDATE CandidateProfile SET Location = ?, LinkedInURL = ?, PortfolioURL = ?, Summary = ? WHERE ProfileID = ?',
      [location || null, linkedInURL || null, portfolioURL || null, summary || null, profileId]
    );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

