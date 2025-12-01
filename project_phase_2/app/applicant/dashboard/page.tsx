'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useDialog } from '@/components/Dialog';
import ReportChart from '@/components/ReportChart';

export default function ApplicantDashboard() {
  const router = useRouter();
  const { showAlert, showConfirm, DialogComponent } = useDialog();
  const [user, setUser] = useState<any>(null);
  const [applicantId, setApplicantId] = useState('');
  const [applicantInfo, setApplicantInfo] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'jobs' | 'applications' | 'reports' | 'settings'>('profile');
  const [loading, setLoading] = useState(true);
  const [showCreateRecord, setShowCreateRecord] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);

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
        // Also load applications to check which jobs are already applied to
        if (applicantId) {
          loadApplications();
        }
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
    if (activeTab === 'jobs') {
      loadJobs();
      // Also load applications to check applied status
      if (applicantId) {
        loadApplications();
      }
    }
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
      <DialogComponent />
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

        {applicantId && applicantInfo && (
          <div className="alert alert-success">
            <strong style={{ fontSize: '18px' }}>Welcome, {applicantInfo.FirstName} {applicantInfo.LastName}!</strong>
            <div style={{ marginTop: '8px', fontSize: '14px', opacity: 0.8 }}>
              {applicantInfo.Email} • Applicant ID: {applicantId}
            </div>
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
          <button
            className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('reports')}
            style={{ minWidth: '150px' }}
          >
            Reports
          </button>
          <button
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('settings')}
            style={{ minWidth: '150px' }}
          >
            Account Settings
          </button>
        </div>

        {activeTab === 'profile' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>My Profile</h2>
              {profile && (
                <button
                  onClick={() => setEditingProfile(!editingProfile)}
                  className="btn btn-secondary"
                  style={{ padding: '8px 16px', fontSize: '14px' }}
                >
                  {editingProfile ? '✕ Cancel' : '✏️ Edit'}
                </button>
              )}
            </div>
            {profile && !editingProfile ? (
              <div style={{ padding: '24px', background: '#f8f9ff', borderRadius: '12px', marginBottom: '24px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                  <div>
                    <strong style={{ color: '#667eea', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Location</strong>
                    <p style={{ marginTop: '8px', fontSize: '16px', color: '#333' }}>{profile.Location || 'Not specified'}</p>
                  </div>
                  <div>
                    <strong style={{ color: '#667eea', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>LinkedIn</strong>
                    <p style={{ marginTop: '8px', fontSize: '16px' }}>
                      {profile.LinkedInURL ? (
                        <a href={profile.LinkedInURL} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                          {profile.LinkedInURL} ↗
                        </a>
                      ) : (
                        <span style={{ color: '#999' }}>Not specified</span>
                      )}
                    </p>
                  </div>
                  <div>
                    <strong style={{ color: '#667eea', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Portfolio</strong>
                    <p style={{ marginTop: '8px', fontSize: '16px' }}>
                      {profile.PortfolioURL ? (
                        <a href={profile.PortfolioURL} target="_blank" rel="noopener noreferrer" style={{ color: '#667eea', textDecoration: 'none' }}>
                          {profile.PortfolioURL} ↗
                        </a>
                      ) : (
                        <span style={{ color: '#999' }}>Not specified</span>
                      )}
                    </p>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong style={{ color: '#667eea', fontSize: '14px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Professional Summary</strong>
                    <p style={{ marginTop: '8px', fontSize: '16px', lineHeight: '1.6', color: '#333', whiteSpace: 'pre-wrap' }}>
                      {profile.Summary || <span style={{ color: '#999' }}>Not specified</span>}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              !profile && (
                <div className="alert alert-info" style={{ marginBottom: '24px' }}>
                  No profile found. Please create one below.
                </div>
              )
            )}
            {(editingProfile || !profile) && (
              <ProfileForm 
                applicantId={applicantId} 
                onSuccess={() => {
                  loadProfile();
                  setEditingProfile(false);
                }}
                initialData={profile}
              />
            )}
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
                        {(() => {
                          // Check if applicant has already applied to this job
                          const hasApplied = applicantId && applications.some((app: any) => app.JobID === job.JobID);
                          
                          if (!applicantId) {
                            return (
                              <button
                                className="btn btn-secondary"
                                disabled
                                title="Create your applicant record first"
                              >
                                Apply (Setup Required)
                              </button>
                            );
                          }
                          
                          if (hasApplied) {
                            return (
                              <button
                                className="btn btn-secondary"
                                disabled
                                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                              >
                                Applied
                              </button>
                            );
                          }
                          
                          return (
                            <button
                              className="btn btn-success"
                              onClick={() => handleApply(job.JobID)}
                            >
                              Apply
                            </button>
                          );
                        })()}
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

        {activeTab === 'reports' && (
          <ApplicantReports applicantId={applicantId} />
        )}

        {activeTab === 'settings' && (
          <AccountSettings />
        )}
      </div>
    </>
  );

  async function handleApply(jobId: number) {
    if (!applicantId) {
      await showAlert('Please create your applicant record first. Go to the Profile tab to set up your account.', 'Setup Required');
      setActiveTab('profile');
      return;
    }
    
    const confirmed = await showConfirm('Apply to this job?', 'Confirm Application');
    if (!confirmed) {
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
        await showAlert('Application submitted successfully!', 'Success');
        loadApplications();
        // Refresh jobs to show updated status
        loadJobs();
      } else {
        await showAlert(`Failed to apply: ${data.error || 'Unknown error'}`, 'Error');
      }
    } catch (err: any) {
      await showAlert(`Failed to apply: ${err.message || 'Network error'}`, 'Error');
    }
  }

  async function handleWithdraw(applicationId: number) {
    const confirmed = await showConfirm('Are you sure you want to withdraw this application?', 'Confirm Withdrawal');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/applicant/applications?applicationId=${applicationId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await showAlert('Application withdrawn successfully', 'Success');
        loadApplications();
      } else {
        const data = await res.json();
        await showAlert(data.error || 'Failed to withdraw', 'Error');
      }
    } catch (err) {
      await showAlert('Failed to withdraw', 'Error');
    }
  }

  async function handleAcceptOffer(applicationId: number) {
    const confirmed = await showConfirm('Accept this offer?', 'Confirm Acceptance');
    if (!confirmed) return;
    try {
      const res = await fetch('/api/applicant/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId }),
      });
      if (res.ok) {
        await showAlert('Offer accepted! Congratulations!', 'Success');
        loadApplications();
      } else {
        const data = await res.json();
        await showAlert(data.error || 'Failed to accept offer', 'Error');
      }
    } catch (err) {
      await showAlert('Failed to accept offer', 'Error');
    }
  }
}

function ProfileForm({ applicantId, onSuccess, initialData }: { applicantId: string; onSuccess: () => void; initialData?: any }) {
  const [location, setLocation] = useState(initialData?.Location || '');
  const [linkedIn, setLinkedIn] = useState(initialData?.LinkedInURL || '');
  const [portfolio, setPortfolio] = useState(initialData?.PortfolioURL || '');
  const [summary, setSummary] = useState(initialData?.Summary || '');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      setLocation(initialData.Location || '');
      setLinkedIn(initialData.LinkedInURL || '');
      setPortfolio(initialData.PortfolioURL || '');
      setSummary(initialData.Summary || '');
    }
  }, [initialData]);

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
      <h3>{initialData ? 'Update Profile' : 'Create Profile'}</h3>
      <label htmlFor="location">Location</label>
      <input type="text" id="location" placeholder="City, State" value={location} onChange={(e) => setLocation(e.target.value)} />
      <label htmlFor="linkedin">LinkedIn URL</label>
      <input type="url" id="linkedin" placeholder="https://linkedin.com/in/yourprofile" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)} />
      <label htmlFor="portfolio">Portfolio URL</label>
      <input type="url" id="portfolio" placeholder="https://yourportfolio.com" value={portfolio} onChange={(e) => setPortfolio(e.target.value)} />
      <label htmlFor="summary">Professional Summary</label>
      <textarea id="summary" placeholder="Tell us about yourself, your skills, and experience..." value={summary} onChange={(e) => setSummary(e.target.value)} rows={5} />
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      <div style={{ display: 'flex', gap: '12px' }}>
        <button type="submit" className="btn btn-primary" disabled={loading || !applicantId} style={{ flex: 1 }}>
          {loading ? 'Saving...' : initialData ? 'Update Profile' : 'Create Profile'}
        </button>
        {initialData && (
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => {
              // Reset form to original values
              if (initialData) {
                setLocation(initialData.Location || '');
                setLinkedIn(initialData.LinkedInURL || '');
                setPortfolio(initialData.PortfolioURL || '');
                setSummary(initialData.Summary || '');
              }
              onSuccess();
            }} 
            style={{ flex: 1 }}
          >
            Cancel
          </button>
        )}
      </div>
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

function ApplicantReports({ applicantId }: { applicantId: string }) {
  const [selectedReport, setSelectedReport] = useState<string>('1');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reports = [
    { id: '1', name: 'Total Applications Submitted', description: 'Count of all job applications' },
    { id: '2', name: 'Average Days Since Application by Status', description: 'Average days since application grouped by status' },
    { id: '3', name: 'Month with Most Applications', description: 'The month with maximum applications' },
    { id: '4', name: 'Days Analysis for Offers', description: 'Min, max, and average days for offer applications' },
    { id: '5', name: 'Application Status Summary', description: 'Total count breakdown by application status' },
  ];

  const loadReport = async () => {
    if (!applicantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/applicant/reports?type=${selectedReport}&applicantId=${applicantId}`);
      const data = await res.json();
      if (res.ok) {
        setReportData(data);
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Statistical Reports</h2>
      {!applicantId ? (
        <div className="alert alert-warning">
          Please create your applicant record first to view reports.
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '24px' }}>
            <label htmlFor="reportSelect">Select Report:</label>
            <select
              id="reportSelect"
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
              style={{ width: '100%', marginBottom: '12px' }}
            >
              {reports.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>
              {reports.find(r => r.id === selectedReport)?.description}
            </p>
            <button onClick={loadReport} className="btn btn-primary" disabled={loading}>
              {loading ? 'Loading...' : 'Generate Report'}
            </button>
          </div>

          {reportData && (
            <div style={{ padding: '24px', background: '#f8f9ff', borderRadius: '12px' }}>
              <h3>{reportData.report}</h3>
              <p style={{ color: '#666', marginBottom: '16px' }}>{reportData.description}</p>
              {reportData.data && (
                <div style={{ marginTop: '24px' }}>
                  <ReportChart 
                    data={reportData.data} 
                    reportType={selectedReport}
                    chartType={reportData.chartType || 'stat'}
                  />
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function AccountSettings() {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { showAlert } = useDialog();

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!oldPassword || !newPassword || !confirmPassword) {
      setMessage('All fields are required');
      return;
    }

    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        await showAlert('Password changed successfully!', 'Success');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setMessage('');
      } else {
        setMessage(data.error || 'Failed to change password');
      }
    } catch (err) {
      setMessage('Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Account Settings</h2>
      <form onSubmit={handleChangePassword} style={{ maxWidth: '500px' }}>
        <h3 style={{ marginBottom: '16px' }}>Change Password</h3>
        <label htmlFor="oldPassword">Current Password</label>
        <input
          type="password"
          id="oldPassword"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <label htmlFor="newPassword">New Password</label>
        <input
          type="password"
          id="newPassword"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
        />
        <label htmlFor="confirmPassword">Confirm New Password</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
        {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Changing Password...' : 'Change Password'}
        </button>
      </form>
    </div>
  );
}

