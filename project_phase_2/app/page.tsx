'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          // Redirect to appropriate dashboard
          if (data.user.UserType === 'JobApplicant') {
            router.push('/applicant/dashboard');
          } else if (data.user.UserType === 'Recruiter') {
            router.push('/recruiter/dashboard');
          } else if (data.user.UserType === 'Admin') {
            router.push('/admin/dashboard');
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [router]);

  if (loading) {
    return <div className="container">Loading...</div>;
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="container" style={{ maxWidth: '600px', marginTop: '120px' }}>
      <div className="card" style={{ textAlign: 'center' }}>
        <h1 style={{ marginBottom: '16px', color: '#333', fontSize: '2.5rem' }}>Job Applicant Tracking System</h1>
        <p style={{ marginBottom: '40px', color: '#666', fontSize: '18px', lineHeight: '1.6' }}>
          Streamline your recruitment process. Manage applications, schedule interviews, and find the perfect candidates.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <Link href="/login" className="btn btn-primary" style={{ minWidth: '150px' }}>Login</Link>
          <Link href="/signup" className="btn btn-secondary" style={{ minWidth: '150px' }}>Sign Up</Link>
        </div>
      </div>
    </div>
  );
}

