'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useDialog } from '@/components/Dialog';
import ReportChart from '@/components/ReportChart';

export default function RecruiterDashboard() {
  const router = useRouter();
  const { showAlert, showConfirm, showPrompt, DialogComponent } = useDialog();
  const [user, setUser] = useState<any>(null);
  const [recruiterId, setRecruiterId] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [applicants, setApplicants] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [offers, setOffers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'applicants' | 'interviews' | 'offers' | 'reports' | 'settings'>('jobs');
  const [selectedJobId, setSelectedJobId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserAndRecruiter = async () => {
      try {
        // Load user
        const userRes = await fetch('/api/auth/me');
        const userData = await userRes.json();
        if (!userData.user || userData.user.UserType !== 'Recruiter') {
          router.push('/login');
          return;
        }
        setUser(userData.user);

        // Load or create recruiter record
        const recruiterRes = await fetch('/api/recruiter/profile');
        const recruiterData = await recruiterRes.json();
        if (recruiterRes.ok && recruiterData.recruiter) {
          setRecruiterId(recruiterData.recruiter.RecruiterID.toString());
          // Save to localStorage for persistence
          localStorage.setItem('recruiterId', recruiterData.recruiter.RecruiterID.toString());
        } else {
          console.error('Failed to load recruiter profile:', recruiterData.error);
        }

        setLoading(false);
      } catch (err) {
        console.error('Failed to load user/recruiter:', err);
        setLoading(false);
      }
    };

    // Check localStorage first
    const savedRecruiterId = localStorage.getItem('recruiterId');
    if (savedRecruiterId) {
      setRecruiterId(savedRecruiterId);
    }

    loadUserAndRecruiter();
  }, [router]);

  const loadJobs = async () => {
    try {
      const res = await fetch(`/api/recruiter/jobs${recruiterId ? `?recruiterId=${recruiterId}` : ''}`);
      const data = await res.json();
      if (res.ok && data.jobs && Array.isArray(data.jobs)) {
        setJobs(data.jobs);
      } else {
        console.error('Failed to load jobs:', data.error || 'Invalid response');
        // Don't clear existing jobs on error - preserve current state
      }
    } catch (err) {
      console.error('Failed to load jobs:', err);
      // Don't clear existing jobs on error - preserve current state
    }
  };

  const loadApplicants = async (jobId?: number, status?: string) => {
    try {
      let url = '/api/recruiter/applicants';
      const params = new URLSearchParams();
      if (jobId) params.append('jobId', jobId.toString());
      if (status) params.append('status', status);
      if (params.toString()) url += `?${params.toString()}`;
      
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok) {
        setApplicants(data.applicants || []);
      } else {
        console.error('Failed to load applicants:', data.error);
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
      console.log('Interviews API response:', { status: res.status, data });
      if (res.ok) {
        const interviewsList = Array.isArray(data.interviews) ? data.interviews : [];
        console.log('Setting interviews:', interviewsList);
        setInterviews(interviewsList);
      } else {
        console.error('Failed to load interviews:', data.error);
        await showAlert(data.error || 'Failed to load interviews', 'Error');
        setInterviews([]);
      }
    } catch (err) {
      console.error('Failed to load interviews:', err);
      await showAlert('Failed to load interviews. Please check the console for details.', 'Error');
      setInterviews([]);
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
    if (activeTab === 'applicants') {
      loadApplicants(selectedJobId || undefined);
    }
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
      <DialogComponent />
      <div className="container">
        <h1>Recruiter Dashboard</h1>
        
        {recruiterId && (
          <div className="alert alert-success" style={{ marginBottom: '24px' }}>
            <strong>Recruiter ID: {recruiterId}</strong> - Your profile is set up and ready to use.
          </div>
        )}

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

        {activeTab === 'jobs' && (
          <div className="card">
            <h2>Job Postings</h2>
            <button onClick={loadJobs} className="btn btn-primary" style={{ marginBottom: '20px' }}>
              Refresh
            </button>
            <JobPostingForm recruiterId={recruiterId} onSuccess={(newJob) => {
              // Optimistically add the new job to the list immediately
              if (newJob) {
                setJobs(prevJobs => [newJob, ...prevJobs]);
              }
              // Then refresh to ensure consistency
              loadJobs();
            }} />
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ margin: 0 }}>All Applicants</h2>
              <button onClick={() => loadApplicants(selectedJobId || undefined)} className="btn btn-primary">
                Refresh
              </button>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label htmlFor="filterJob">Filter by Job:</label>
                <select
                  id="filterJob"
                  value={selectedJobId || ''}
                  onChange={(e) => {
                    const jobId = e.target.value ? parseInt(e.target.value) : null;
                    setSelectedJobId(jobId);
                    loadApplicants(jobId || undefined);
                  }}
                  style={{ marginBottom: '0' }}
                >
                  <option value="">All Jobs</option>
                  {jobs.map((job) => (
                    <option key={job.JobID} value={job.JobID}>
                      {job.Title} (ID: {job.JobID})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="filterStatus">Filter by Status:</label>
                <select
                  id="filterStatus"
                  value={''}
                  onChange={(e) => {
                    const status = e.target.value || undefined;
                    loadApplicants(selectedJobId || undefined, status);
                  }}
                  style={{ marginBottom: '0' }}
                >
                  <option value="">All Statuses</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Interview Scheduled">Interview Scheduled</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            {applicants.length === 0 ? (
              <div className="alert alert-info">
                {selectedJobId 
                  ? `No applicants found for the selected job.`
                  : 'No applicants found. Applicants will appear here once they apply to jobs.'}
              </div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Contact</th>
                    <th>Location</th>
                    <th>Application Status</th>
                    <th>Applied Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applicants.map((applicant: any, idx: number) => (
                    <tr key={`${applicant.ApplicantID}-${idx}`}>
                      <td>
                        <strong>{applicant.FirstName} {applicant.LastName}</strong>
                        {applicant.Summary && (
                          <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                            {applicant.Summary.substring(0, 100)}...
                          </div>
                        )}
                      </td>
                      <td>
                        <div>{applicant.Email}</div>
                        {applicant.Phone && <div style={{ fontSize: '12px', color: '#666' }}>{applicant.Phone}</div>}
                      </td>
                      <td>{applicant.Location || 'N/A'}</td>
                      <td>
                        <select
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            if (!applicant.ApplicationID) {
                              await showAlert('Application ID not found', 'Error');
                              return;
                            }
                            if (newStatus === 'Interview Scheduled' && applicant.ApplicationStatus !== 'Interview Scheduled') {
                              const confirmed = await showConfirm(
                                'Would you like to schedule an interview now?',
                                'Schedule Interview'
                              );
                              if (confirmed) {
                                handleScheduleInterview(applicant.ApplicationID);
                                return;
                              }
                            }
                            handleUpdateStatus(applicant.ApplicationID, newStatus);
                          }}
                          value={applicant.ApplicationStatus || 'Submitted'}
                          style={{ width: '180px' }}
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Interview Scheduled">Interview Scheduled</option>
                          <option value="Offer">Offer</option>
                          <option value="Rejected">Rejected</option>
                        </select>
                      </td>
                      <td>{applicant.AppliedAt ? new Date(applicant.AppliedAt).toLocaleDateString() : 'N/A'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                          {applicant.ApplicationStatus === 'Under Review' && (
                            <button
                              className="btn btn-success"
                              onClick={() => applicant.ApplicationID && handleScheduleInterview(applicant.ApplicationID)}
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              Schedule Interview
                            </button>
                          )}
                          {applicant.ApplicationStatus === 'Interview Scheduled' && (
                            <button
                              className="btn btn-primary"
                              onClick={async () => {
                                if (!applicant.ApplicationID) return;
                                const intRes = await fetch('/api/recruiter/interviews');
                                const intData = await intRes.json();
                                if (intRes.ok && intData.interviews) {
                                  const interview = intData.interviews.find((i: any) => i.ApplicationID === applicant.ApplicationID);
                                  if (interview) {
                                    handleRescheduleInterview(interview.InterviewID);
                                  } else {
                                    handleScheduleInterview(applicant.ApplicationID);
                                  }
                                }
                              }}
                              style={{ fontSize: '12px', padding: '6px 12px' }}
                            >
                              View Interview
                            </button>
                          )}
                          {applicant.JobTitle && (
                            <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                              Job: {applicant.JobTitle}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'interviews' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Interviews</h2>
              <button onClick={loadInterviews} className="btn btn-primary">
                Refresh
              </button>
            </div>
            {interviews.length === 0 ? (
              <div className="alert alert-info">
                No interviews scheduled. Change an application status to "Interview Scheduled" and schedule an interview to see them here.
              </div>
            ) : (
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
            )}
          </div>
        )}

        {activeTab === 'offers' && (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0 }}>Offers</h2>
              <button onClick={loadOffers} className="btn btn-primary">
                Refresh
              </button>
            </div>
            {offers.length === 0 ? (
              <div className="alert alert-info">
                No offers sent. Change an application status to "Offer" to see them here.
              </div>
            ) : (
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
            )}
          </div>
        )}

        {activeTab === 'reports' && (
          <RecruiterReports recruiterId={recruiterId} />
        )}

        {activeTab === 'settings' && (
          <AccountSettings />
        )}
      </div>
    </>
  );

  async function handleDeleteJob(jobId: number) {
    const confirmed = await showConfirm('Delete this job posting?', 'Confirm Delete');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/recruiter/jobs?jobId=${jobId}`, { method: 'DELETE' });
      if (res.ok) {
        await showAlert('Job deleted successfully', 'Success');
        loadJobs();
      } else {
        await showAlert('Failed to delete job', 'Error');
      }
    } catch (err) {
      await showAlert('Failed to delete job', 'Error');
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
        // Refresh relevant tabs based on status change
        if (status === 'Offer') {
          loadOffers();
        } else if (status === 'Interview Scheduled') {
          // If status changed to Interview Scheduled, refresh interviews tab
          loadInterviews();
        }
        
        // Always refresh applications list and applicants
        loadApplicants(selectedJobId || undefined);
        if (selectedJobId) {
          loadApplications(selectedJobId);
        }
        
        // If we're currently viewing interviews or offers tab, refresh them
        if (activeTab === 'interviews') {
          loadInterviews();
        } else if (activeTab === 'offers') {
          loadOffers();
        }
      } else {
        const data = await res.json();
        await showAlert(data.error || 'Failed to update status', 'Error');
      }
    } catch (err) {
      await showAlert('Failed to update status', 'Error');
    }
  }

  async function handleScheduleInterview(applicationId: number) {
    // Better input method - use dialogs
    const dateInput = await showPrompt(
      'Enter interview date (YYYY-MM-DD):',
      'Schedule Interview - Date',
      'YYYY-MM-DD',
      new Date().toISOString().split('T')[0]
    );
    if (!dateInput) return;
    
    const timeInput = await showPrompt(
      'Enter interview time (HH:MM:SS, e.g., 14:30:00):',
      'Schedule Interview - Time',
      'HH:MM:SS',
      '14:00:00'
    );
    if (!timeInput) return;
    
    const dateTime = `${dateInput} ${timeInput}`;
    
    const mode = await showPrompt(
      'Enter interview mode (Onsite/Remote/Phone):',
      'Schedule Interview - Mode',
      'Onsite/Remote/Phone',
      'Remote'
    );
    if (!mode) return;
    
    const roundInput = await showPrompt(
      'Enter round number (1, 2, 3, etc.) or leave empty for Round 1:',
      'Schedule Interview - Round',
      'Round number',
      '1'
    );
    const roundNumber = roundInput ? parseInt(roundInput) : 1;
    
    try {
      const res = await fetch('/api/recruiter/interviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, interviewDateTime: dateTime, mode, roundNumber }),
      });
      if (res.ok) {
        await showAlert('Interview scheduled successfully!', 'Success');
        // Refresh all relevant data
        loadInterviews();
        loadApplicants(selectedJobId || undefined);
        if (selectedJobId) {
          loadApplications(selectedJobId);
        }
        // If currently on interviews tab, stay there; otherwise switch to it
        if (activeTab !== 'interviews') {
          setActiveTab('interviews');
        }
      } else {
        const data = await res.json();
        await showAlert(data.error || 'Failed to schedule interview', 'Error');
      }
    } catch (err) {
      await showAlert('Failed to schedule interview', 'Error');
    }
  }

  async function handleRescheduleInterview(interviewId: number) {
    const dateTime = await showPrompt(
      'Enter new interview date and time (YYYY-MM-DD HH:MM:SS):',
      'Reschedule Interview',
      'YYYY-MM-DD HH:MM:SS',
      new Date().toISOString().slice(0, 19).replace('T', ' ')
    );
    if (!dateTime) return;
    try {
      const res = await fetch('/api/recruiter/interviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ interviewId, interviewDateTime: dateTime }),
      });
      if (res.ok) {
        await showAlert('Interview rescheduled successfully', 'Success');
        // Refresh all relevant data
        loadInterviews();
        loadApplicants(selectedJobId || undefined);
        if (selectedJobId) {
          loadApplications(selectedJobId);
        }
      } else {
        const data = await res.json();
        await showAlert(data.error || 'Failed to reschedule', 'Error');
      }
    } catch (err) {
      await showAlert('Failed to reschedule', 'Error');
    }
  }

  async function handleCancelInterview(interviewId: number) {
    const confirmed = await showConfirm('Cancel this interview?', 'Confirm Cancel');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/recruiter/interviews?interviewId=${interviewId}`, { method: 'DELETE' });
      const data = await res.json();
      if (res.ok) {
        await showAlert('Interview cancelled successfully. Application status updated to "Under Review".', 'Success');
        // Refresh all relevant data to reflect status changes
        loadInterviews();
        loadApplicants(selectedJobId || undefined);
        if (selectedJobId) {
          loadApplications(selectedJobId);
        }
        // If we're on applicants tab, refresh it
        if (activeTab === 'applicants') {
          loadApplicants(selectedJobId || undefined);
        }
      } else {
        await showAlert(data.error || 'Failed to cancel interview', 'Error');
      }
    } catch (err) {
      await showAlert('Failed to cancel interview', 'Error');
    }
  }

  async function handleWithdrawOffer(applicationId: number) {
    const confirmed = await showConfirm('Withdraw this offer?', 'Confirm Withdraw');
    if (!confirmed) return;
    try {
      const res = await fetch(`/api/recruiter/offers?applicationId=${applicationId}`, { method: 'DELETE' });
      if (res.ok) {
        await showAlert('Offer withdrawn successfully', 'Success');
        loadOffers();
      } else {
        await showAlert('Failed to withdraw offer', 'Error');
      }
    } catch (err) {
      await showAlert('Failed to withdraw offer', 'Error');
    }
  }
}

function JobPostingForm({ recruiterId, onSuccess }: { recruiterId: string; onSuccess: (newJob?: any) => void }) {
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
        const responseData = await res.json();
        setMessage('Job posting created successfully!');
        
        // Create optimistic job object for immediate display
        const newJob = {
          JobID: responseData.jobId,
          RecruiterID: parseInt(recruiterId),
          Title: title,
          Department: department || null,
          Location: location || null,
          EmploymentType: employmentType,
          PostedDate: postedDate,
          Status: status || 'Open'
        };
        
        setTitle('');
        setDepartment('');
        setLocation('');
        setTimeout(() => setMessage(''), 3000);
        onSuccess(newJob);
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

function RecruiterReports({ recruiterId }: { recruiterId: string }) {
  const [selectedReport, setSelectedReport] = useState<string>('1');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reports = [
    { id: '1', name: 'Total Job Postings', description: 'Total count of job postings created' },
    { id: '2', name: 'Average Applications per Job', description: 'Average, min, and max applications received per job' },
    { id: '3', name: 'Total Interviews Scheduled', description: 'Total sum of interviews broken down by mode' },
    { id: '4', name: 'Days to Fill Positions', description: 'Min, max, and average days from posting to offer' },
    { id: '5', name: 'Application Status Distribution', description: 'Count and percentage distribution by status' },
  ];

  const loadReport = async () => {
    if (!recruiterId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/recruiter/reports?type=${selectedReport}&recruiterId=${recruiterId}`);
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
      {!recruiterId ? (
        <div className="alert alert-warning">
          Recruiter profile not found. Please set up your profile first.
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

