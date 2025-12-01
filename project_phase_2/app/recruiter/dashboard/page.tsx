'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';

export default function RecruiterDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [recruiterId, setRecruiterId] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants' | 'interviews' | 'offers'>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.UserType !== 'Recruiter') {
          router.push('/login');
          return;
        }
        setUser(data.user);
        setLoading(false);
      });
  }, [router]);

  const loadJobs = async () => {
    try {
      const res = await fetch(`/api/recruiter/jobs${recruiterId ? `?recruiterId=${recruiterId}` : ''}`);
      const data = await res.json();
      if (res.ok) {
        setJobs(data.jobs);
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
    }
  };

  const loadApplicants = async (jobId?: number) => {
    try {
      const url = `/api/recruiter/applicants${jobId ? `?jobId=${jobId}` : ''}`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setApplicants(data.applicants);
      }
    } catch (err) {
      console.error('Failed to load applicants:', err);
    }
  };

  const loadApplications = async (jobId: number) => {
    try {
      const res = await fetch(`/api/recruiter/applications?jobId=${jobId}`);
      const data = await res.json();
      if (res.ok) {
        setApplications(data.applications);
      }
    } catch (err) {
      console.error('Failed to load applications:', err);
    }
  };

  const loadInterviews = async () => {
    try {
      const res = await fetch('/api/recruiter/interviews');
      const data = await res.json();
      if (res.ok) {
        setInterviews(data.interviews);
      }
    } catch (err) {
      console.error('Failed to load interviews:', err);
    }
  };

  const loadOffers = async () => {
    try {
      const res = await fetch('/api/recruiter/offers');
      const data = await res.json();
      if (res.ok) {
        setOffers(data.offers);
      }
    } catch (err) {
      console.error('Failed to load offers:', err);
    }
  };

  useEffect(() => {
    if (activeTab === 'jobs') loadJobs();
    if (activeTab === 'applicants') loadApplicants(selectedJobId || undefined);
    if (activeTab === 'interviews') loadInterviews();
    if (activeTab === 'offers') loadOffers();
  }, [activeTab, selectedJobId]);

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
        <h1>Recruiter Dashboard</h1>
        
        <div className="card alert alert-info" style={{ marginBottom: '24px' }}>
          <label style={{ marginBottom: '8px', display: 'block' }}>Your RecruiterID (optional, for filtering):</label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <input
              type="number"
              value={recruiterId}
              onChange={(e) => setRecruiterId(e.target.value)}
              placeholder="Enter RecruiterID"
              style={{ width: '200px', marginBottom: '0' }}
            />
            <span style={{ fontSize: '14px', color: '#666' }}>Leave empty to see all jobs</span>
          </div>
        </div>

        <div className="tab-container">
          <button
            className={`btn ${activeTab === 'jobs' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('jobs')}
            style={{ minWidth: '150px' }}
          >
            Job Postings
          </button>
          <button
            className={`btn ${activeTab === 'applicants' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('applicants')}
            style={{ minWidth: '150px' }}
          >
            Applicants
          </button>
          <button
            className={`btn ${activeTab === 'interviews' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('interviews')}
            style={{ minWidth: '150px' }}
          >
            Interviews
          </button>
          <button
            className={`btn ${activeTab === 'offers' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('offers')}
            style={{ minWidth: '150px' }}
          >
            Offers
          </button>
        </div>

        {activeTab === 'jobs' && (
          <div className="card">
            <h2>Job Postings</h2>
            <button onClick={loadJobs} className="btn btn-primary" style={{ marginBottom: '20px' }}>
              Refresh
            </button>
            <JobPostingForm recruiterId={recruiterId} onSuccess={loadJobs} />
            <table>
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Title</th>
                  <th>Department</th>
                  <th>Location</th>
                  <th>Status</th>
                  <th>Posted</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.JobID}>
                    <td>{job.JobID}</td>
                    <td>{job.Title}</td>
                    <td>{job.Department || 'N/A'}</td>
                    <td>{job.Location || 'N/A'}</td>
                    <td>{job.Status}</td>
                    <td>{new Date(job.PostedDate).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => { setSelectedJobId(job.JobID); loadApplications(job.JobID); setActiveTab('applicants'); }}
                        style={{ marginRight: '5px' }}
                      >
                        View Applicants
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleDeleteJob(job.JobID)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'applicants' && (
          <div className="card">
            <h2>Applicants {selectedJobId && `for Job #${selectedJobId}`}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label>Filter by Job ID:</label>
              <input
                type="number"
                value={selectedJobId || ''}
                onChange={(e) => setSelectedJobId(e.target.value ? parseInt(e.target.value) : null)}
                placeholder="Job ID (leave empty for all)"
                style={{ width: '200px', marginRight: '10px' }}
              />
              <button onClick={() => loadApplicants(selectedJobId || undefined)} className="btn btn-primary">
                Filter
              </button>
            </div>
            {selectedJobId && (
              <div>
                <h3>Applications for Job #{selectedJobId}</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Application ID</th>
                      <th>Applicant</th>
                      <th>Status</th>
                      <th>Applied</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {applications.map((app) => (
                      <tr key={app.ApplicationID}>
                        <td>{app.ApplicationID}</td>
                        <td>{app.FirstName} {app.LastName} ({app.Email})</td>
                        <td>{app.Status}</td>
                        <td>{new Date(app.AppliedAt).toLocaleDateString()}</td>
                        <td>
                          <select
                            onChange={(e) => handleUpdateStatus(app.ApplicationID, e.target.value)}
                            value={app.Status}
                            style={{ width: '150px', marginRight: '5px' }}
                          >
                            <option value="Submitted">Submitted</option>
                            <option value="Under Review">Under Review</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Offer">Offer</option>
                            <option value="Rejected">Rejected</option>
                          </select>
                          {app.Status === 'Under Review' && (
                            <button
                              className="btn btn-success"
                              onClick={() => handleScheduleInterview(app.ApplicationID)}
                            >
                              Schedule Interview
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
        )}

        {activeTab === 'interviews' && (
          <div className="card">
            <h2>Interviews</h2>
            <button onClick={loadInterviews} className="btn btn-primary" style={{ marginBottom: '20px' }}>
              Refresh
            </button>
            <table>
              <thead>
                <tr>
                  <th>Interview ID</th>
                  <th>Applicant</th>
                  <th>Job Title</th>
                  <th>Date & Time</th>
                  <th>Mode</th>
                  <th>Round</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {interviews.map((interview) => (
                  <tr key={interview.InterviewID}>
                    <td>{interview.InterviewID}</td>
                    <td>{interview.FirstName} {interview.LastName}</td>
                    <td>{interview.JobTitle}</td>
                    <td>{new Date(interview.InterviewDateTime).toLocaleString()}</td>
                    <td>{interview.Mode}</td>
                    <td>{interview.RoundNumber}</td>
                    <td>
                      <button
                        className="btn btn-primary"
                        onClick={() => handleRescheduleInterview(interview.InterviewID)}
                        style={{ marginRight: '5px' }}
                      >
                        Reschedule
                      </button>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleCancelInterview(interview.InterviewID)}
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="card">
            <h2>Offers</h2>
            <button onClick={loadOffers} className="btn btn-primary" style={{ marginBottom: '20px' }}>
              Refresh
            </button>
            <table>
              <thead>
                <tr>
                  <th>Application ID</th>
                  <th>Applicant</th>
                  <th>Job Title</th>
                  <th>Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.ApplicationID}>
                    <td>{offer.ApplicationID}</td>
                    <td>{offer.FirstName} {offer.LastName} ({offer.Email})</td>
                    <td>{offer.JobTitle}</td>
                    <td>{new Date(offer.AppliedAt).toLocaleDateString()}</td>
                    <td>
                      <button
                        className="btn btn-danger"
                        onClick={() => handleWithdrawOffer(offer.ApplicationID)}
                      >
                        Withdraw Offer
                      </button>
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

  async function handleDeleteJob(jobId: number) {
    if (!confirm('Delete this job posting?')) return;
    try {
      const res = await fetch(`/api/recruiter/jobs?jobId=${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Job deleted');
        loadJobs();
      }
    } catch (err) {
      alert('Failed to delete job');
    }
  }

  async function handleUpdateStatus(applicationId: number, status: string) {
    try {
      const res = await fetch('/api/recruiter/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, status }),
      });
      if (res.ok) {
        if (status === 'Offer') {
          loadOffers();
        }
        if (selectedJobId) {
          loadApplications(selectedJobId);
        }
      }
    } catch (err) {
      alert('Failed to update status');
    }
  }

  async function handleScheduleInterview(applicationId: number) {
    const dateTime = prompt('Enter interview date and time (YYYY-MM-DD HH:MM:SS):');
    const mode = prompt('Enter interview mode (Onsite/Remote/Phone):');
    if (!dateTime || !mode) return;
    try {
      const res = await fetch('/api/recruiter/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, interviewDateTime: dateTime, mode }),
      });
      if (res.ok) {
        alert('Interview scheduled');
        loadInterviews();
        if (selectedJobId) loadApplications(selectedJobId);
      } else {
        const data = await res.json();
        alert(data.error);
      }
    } catch (err) {
      alert('Failed to schedule interview');
    }
  }

  async function handleRescheduleInterview(interviewId: number) {
    const dateTime = prompt('Enter new interview date and time (YYYY-MM-DD HH:MM:SS):');
    if (!dateTime) return;
    try {
      const res = await fetch('/api/recruiter/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, interviewDateTime: dateTime }),
      });
      if (res.ok) {
        alert('Interview rescheduled');
        loadInterviews();
      }
    } catch (err) {
      alert('Failed to reschedule');
    }
  }

  async function handleCancelInterview(interviewId: number) {
    if (!confirm('Cancel this interview?')) return;
    try {
      const res = await fetch(`/api/recruiter/interviews?interviewId=${interviewId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Interview cancelled');
        loadInterviews();
      }
    } catch (err) {
      alert('Failed to cancel interview');
    }
  }

  async function handleWithdrawOffer(applicationId: number) {
    if (!confirm('Withdraw this offer?')) return;
    try {
      const res = await fetch(`/api/recruiter/offers?applicationId=${applicationId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Offer withdrawn');
        loadOffers();
      }
    } catch (err) {
      alert('Failed to withdraw offer');
    }
  }
}

function JobPostingForm({ recruiterId, onSuccess }: { recruiterId: string; onSuccess: () => void }) {
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [postedDate, setPostedDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState('Open');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recruiterId) {
      setMessage('Please enter RecruiterID first');
      return;
    }
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/recruiter/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiterId: parseInt(recruiterId),
          title,
          department,
          location,
          employmentType,
          postedDate,
          status,
        }),
      });
      if (res.ok) {
        setMessage('Job posting created successfully!');
        setTitle('');
        setDepartment('');
        setLocation('');
        setTimeout(() => setMessage(''), 3000);
        onSuccess();
      } else {
        const data = await res.json();
        setMessage(data.error || 'Failed to create job posting');
      }
    } catch (err) {
      setMessage('Failed to create job posting');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '24px', padding: '24px', background: '#f8f9ff', borderRadius: '12px' }}>
      <h3>Create New Job Posting</h3>
      <label htmlFor="jobTitle">Job Title *</label>
      <input type="text" id="jobTitle" placeholder="e.g., Software Engineer" value={title} onChange={(e) => setTitle(e.target.value)} required />
      <label htmlFor="jobDept">Department</label>
      <input type="text" id="jobDept" placeholder="e.g., Engineering" value={department} onChange={(e) => setDepartment(e.target.value)} />
      <label htmlFor="jobLoc">Location</label>
      <input type="text" id="jobLoc" placeholder="e.g., Remote, NYC" value={location} onChange={(e) => setLocation(e.target.value)} />
      <label htmlFor="jobType">Employment Type</label>
      <select id="jobType" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
        <option value="Full-time">Full-time</option>
        <option value="Part-time">Part-time</option>
        <option value="Intern">Intern</option>
        <option value="Contract">Contract</option>
      </select>
      <label htmlFor="jobDate">Posted Date *</label>
      <input type="date" id="jobDate" value={postedDate} onChange={(e) => setPostedDate(e.target.value)} required />
      <label htmlFor="jobStatus">Status</label>
      <select id="jobStatus" value={status} onChange={(e) => setStatus(e.target.value)}>
        <option value="Open">Open</option>
        <option value="Closed">Closed</option>
        <option value="On Hold">On Hold</option>
      </select>
      {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
      <button type="submit" className="btn btn-primary" disabled={loading || !recruiterId}>
        {loading ? 'Creating...' : 'Create Job Posting'}
      </button>
    </form>
  );
}

