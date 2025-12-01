'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function ApplicantDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [applicantId, setApplicantId] = useState('');
  const [applicantInfo, setApplicantInfo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'jobs' | 'applications'>('profile');
  const [loading, setLoading] = useState(true);
  const [showCreateRecord, setShowCreateRecord] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.UserType !== 'JobApplicant') {
          router.push('/login');
          return;
        }
        setUser(data.user);
        setLoading(false);
      });
  }, [router]);

  const loadProfile = async () => {
    if (!applicantId) return;
    try {
      const res = await fetch(`/api/applicant/profile?applicantId=${applicantId}`);
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    }
  };

  const loadJobs = async () => {
    try {
      const res = await fetch('/api/applicant/jobs');
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const loadApplications = async () => {
    if (!applicantId) return;
    try {
      const res = await fetch(`/api/applicant/applications?applicantId=${applicantId}`);
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  const findApplicantByEmail = async (email: string) => {
    try {
      const res = await fetch(`/api/applicant/create-record?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      if (res.ok && data.applicant) {
        const id = data.applicant.ApplicantID.toString();
        setApplicantId(id);
        setApplicantInfo(data.applicant);
        // Save to localStorage
        localStorage.setItem('applicantId', id);
        return data.applicant.ApplicantID;
      }
    } catch (err) {
      console.error('Failed to find applicant:', err);
    }
    return null;
  };

  useEffect(() => {
    if (!user) return;

    const loadApplicantRecord = async () => {
      // Check localStorage first
      const savedApplicantId = localStorage.getItem('applicantId');
      
      if (savedApplicantId) {
        // Verify applicant record exists
        try {
          const verifyRes = await fetch(`/api/applicant/verify?applicantId=${savedApplicantId}`);
          if (verifyRes.ok) {
            const verifyData = await verifyRes.json();
            if (verifyData.applicant) {
              setApplicantId(savedApplicantId);
              setApplicantInfo(verifyData.applicant);
              return; // Found and verified, exit early
            }
          }
          // If verification failed, clear localStorage
          localStorage.removeItem('applicantId');
        } catch (err) {
          console.error('Error verifying applicant:', err);
          localStorage.removeItem('applicantId');
        }
      }
      
      // If no saved ID or verification failed, try to find by email
      if (user.Username) {
        await findApplicantByEmail(user.Username);
      }
    };

    loadApplicantRecord();
  }, [user]);

  useEffect(() => {
    if (activeTab === 'profile' && applicantId) loadProfile();
    if (activeTab === 'jobs') loadJobs();
    if (activeTab === 'applications' && applicantId) loadApplications();
  }, [activeTab, applicantId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="container">Loading...</div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <h1>Applicant Dashboard</h1>
        
        {!applicantId && (
          <div className="card alert alert-warning">
            <h3 style={{ marginBottom: '12px', color: '#856404' }}>Setup Required</h3>
            <p style={{ marginBottom: '16px', color: '#856404' }}>You need to create your applicant record first. This links your account to the job application system.</p>
            <button onClick={() => setShowCreateRecord(true)} className="btn btn-primary">
              Create My Applicant Record
            </button>
          </div>
        )}

        {showCreateRecord && (
          <CreateApplicantRecord 
            onSuccess={(id, info) => {
              const idStr = id.toString();
              setApplicantId(idStr);
              setApplicantInfo(info);
              setShowCreateRecord(false);
              // Save to localStorage
              localStorage.setItem('applicantId', idStr);
            }}
            onCancel={() => setShowCreateRecord(false)}
          />
        )}

        {applicantId && (
          <div className="alert alert-success">
            <strong style={{ fontSize: '16px' }}>✓ Your ApplicantID: {applicantId}</strong>
            {applicantInfo && (
              <div style={{ marginTop: '8px', fontSize: '14px' }}>
                {applicantInfo.FirstName} {applicantInfo.LastName} • {applicantInfo.Email}
              </div>
            )}
          </div>
        )}

        <div className="tab-container">
          <button
            className={`btn ${activeTab === 'profile' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('profile')}
            style={{ minWidth: '150px' }}
          >
            My Profile
          </button>
          <button
            className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('jobs')}
            style={{ minWidth: '150px' }}
          >
            Browse Jobs
          </button>
          <button
            className={`btn ${activeTab === 'applications' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('applications')}
            style={{ minWidth: '150px' }}
          >
            My Applications
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="card">
            <h2>My Profile</h2>
            {profile ? (
              <div style={{ padding: '20px', background: '#f8f9ff', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                  <div>
                    <strong style={{ color: '#667eea' }}>Location:</strong>
                    <p style={{ marginTop: '4px' }}>{profile.Location || 'Not specified'}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#667eea' }}>LinkedIn:</strong>
                    <p style={{ marginTop: '4px' }}>
                      {profile.LinkedInURL ? (
                        <a href={profile.LinkedInURL} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                          {profile.LinkedInURL}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#667eea' }}>Portfolio:</strong>
                    <p style={{ marginTop: '4px' }}>
                      {profile.PortfolioURL ? (
                        <a href={profile.PortfolioURL} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea' }}>
                          {profile.PortfolioURL}
                        </a>
                      ) : (
                        'Not specified'
                      )}
                    </p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong style={{ color: '#667eea' }}>Summary:</strong>
                    <p style={{ marginTop: '4px', lineHeight: '1.6' }}>{profile.Summary || 'Not specified'}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="alert alert-info" style={{ marginBottom: '24px' }}>
                No profile found. Please create one below.
              </div>
            )}
            <ProfileForm applicantId={applicantId} onSuccess={loadProfile} />
            <ResumeUpload applicantId={applicantId} />
          </div>
        )}

        {activeTab === 'jobs' && (
          <div className="card">
            <h2>Browse Jobs</h2>
            {!applicantId && (
              <div className="alert alert-warning" style={{ marginBottom: '24px' }}>
                <strong>⚠️ Setup Required:</strong> You need to create your applicant record before you can apply to jobs. 
                Go to the "My Profile" tab to get started.
              </div>
            )}
            <button onClick={loadJobs} className="btn btn-primary" style={{ marginBottom: '20px' }}>
              Refresh Jobs
            </button>
            {jobs.length === 0 ? (
              <p>No open jobs available at this time.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Job ID</th>
                    <th>Title</th>
                    <th>Department</th>
                    <th>Location</th>
                    <th>Type</th>
                    <th>Posted</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.JobID}>
                      <td>{job.JobID}</td>
                      <td>{job.Title}</td>
                      <td>{job.Department || 'N/A'}</td>
                      <td>{job.Location || 'N/A'}</td>
                      <td>{job.EmploymentType}</td>
                      <td>{new Date(job.PostedDate).toLocaleDateString()}</td>
                      <td>
                        {applicantId ? (
                          <button
                            className="btn btn-success"
                            onClick={() => handleApply(job.JobID)}
                          >
                            Apply
                          </button>
                        ) : (
                          <button
                            className="btn btn-secondary"
                            disabled
                            title="Create your applicant record first"
                          >
                            Apply (Setup Required)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'applications' && (
          <div className="card">
            <h2>My Applications</h2>
            <button onClick={loadApplications} className="btn btn-primary" style={{ marginBottom: '20px' }}>
              Refresh
            </button>
            <table>
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Job Title</th>
                  <th>Status</th>
                  <th>Applied Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.ApplicationID}>
                    <td>{app.ApplicationID}</td>
                    <td>{app.Title}</td>
                    <td>{app.Status}</td>
                    <td>{new Date(app.AppliedAt).toLocaleDateString()}</td>
                    <td>
                      {app.Status === 'Offer' && (
                        <button
                          className="btn btn-success"
                          onClick={() => handleAcceptOffer(app.ApplicationID)}
                        >
                          Accept Offer
                        </button>
                      )}
                      {app.Status !== 'Offer' && app.Status !== 'Rejected' && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleWithdraw(app.ApplicationID)}
                        >
                          Withdraw
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );

  async function handleApply(jobId: number) {
    if (!applicantId) {
      alert('Please create your applicant record first. Go to the Profile tab to set up your account.');
      setActiveTab('profile');
      return;
    }
    
    if (!confirm(`Apply to this job?`)) {
      return;
    }

    try {
      const res = await fetch('/api/applicant/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId: parseInt(applicantId), jobId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Application submitted successfully!');
        loadApplications();
        // Refresh jobs to show updated status
        loadJobs();
      } else {
        alert(`Failed to apply: ${data.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Failed to apply: ${err.message || 'Network error'}`);
    }
  }

  async function handleWithdraw(applicationId: number) {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      const res = await fetch(`/api/applicant/applications?applicationId=${applicationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        alert('Application withdrawn');
        loadApplications();
      }
    } catch (err) {
      alert('Failed to withdraw');
    }
  }

  async function handleAcceptOffer(applicationId: number) {
    if (!confirm('Accept this offer?')) return;
    try {
      const res = await fetch('/api/applicant/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      if (res.ok) {
        alert('Offer accepted!');
        loadApplications();
      }
    } catch (err) {
      alert('Failed to accept offer');
    }
  }
}

function ProfileForm({ applicantId, onSuccess }: { applicantId: string; onSuccess: () => void }) {
  const [location, setLocation] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantId) {
      setMessage('Please create your applicant record first');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/applicant/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId: parseInt(applicantId), location, linkedInURL: linkedIn, portfolioURL: portfolio, summary }),
      });
      if (res.ok) {
        setMessage('Profile saved successfully!');
        setTimeout(() => setMessage(''), 3000);
        onSuccess();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to save profile');
      }
    } catch (err) {
      setMessage('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '24px', padding: '24px', background: '#f8f9ff', borderRadius: '12px' }}>
      <h3>Create/Update Profile</h3>
      <label htmlFor="location">Location</label>
      <input type="text" id="location" placeholder="City, State" value={location} onChange={(e) => setLocation(e.target.value)} />
      <label htmlFor="linkedin">LinkedIn URL</label>
      <input type="url" id="linkedin" placeholder="https://linkedin.com/in/yourprofile" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} />
      <label htmlFor="portfolio">Portfolio URL</label>
      <input type="url" id="portfolio" placeholder="https://yourportfolio.com" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
      <label htmlFor="summary">Professional Summary</label>
      <textarea id="summary" placeholder="Tell us about yourself, your skills, and experience..." value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} />
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      <button type="submit" className="btn btn-primary" disabled={loading || !applicantId}>
        {loading ? 'Saving...' : 'Save Profile'}
      </button>
    </form>
  );
}

function ResumeUpload({ applicantId }: { applicantId: string }) {
  const [fileURL, setFileURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantId) {
      setMessage('Please create your applicant record first');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/applicant/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicantId: parseInt(applicantId), fileURL }),
      });
      if (res.ok) {
        setMessage('Resume uploaded successfully!');
        setFileURL('');
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to upload resume');
      }
    } catch (err) {
      setMessage('Failed to upload resume');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '24px', padding: '24px', background: '#f8f9ff', borderRadius: '12px' }}>
      <h3>Upload Resume</h3>
      <label htmlFor="resumeUrl">Resume File URL</label>
      <input 
        type="url" 
        id="resumeUrl"
        placeholder="https://example.com/resume.pdf" 
        value={fileURL} 
        onChange={(e) => setFileURL(e.target.value)} 
        required 
      />
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      <button type="submit" className="btn btn-primary" disabled={!applicantId || loading}>
        {loading ? 'Uploading...' : 'Upload Resume'}
      </button>
    </form>
  );
}

function CreateApplicantRecord({ onSuccess, onCancel }: { onSuccess: (id: number, info: any) => void; onCancel: () => void }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!firstName || !lastName || !email) {
      setError('First name, last name, and email are required');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/applicant/create-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create applicant record');
        setLoading(false);
        return;
      }

      // Success - applicant record created or found
      onSuccess(data.applicantId, { FirstName: firstName, LastName: lastName, Email: email, Phone: phone });
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Applicant Record</h2>
      <p style={{ marginBottom: '24px', color: '#666', lineHeight: '1.6' }}>
        Create your applicant record to start applying for jobs. This links your account to the job application system.
      </p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="firstName">First Name *</label>
        <input
          type="text"
          id="firstName"
          placeholder="Enter your first name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
        />
        <label htmlFor="lastName">Last Name *</label>
        <input
          type="text"
          id="lastName"
          placeholder="Enter your last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
        />
        <label htmlFor="email">Email *</label>
        <input
          type="email"
          id="email"
          placeholder="Enter your email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="phone">Phone (optional)</label>
        <input
          type="tel"
          id="phone"
          placeholder="Enter your phone number"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        {error && <div className="error">{error}</div>}
        <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 1 }}>
            {loading ? 'Creating...' : 'Create Record'}
          </button>
          <button type="button" className="btn btn-secondary" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

