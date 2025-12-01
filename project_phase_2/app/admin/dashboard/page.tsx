'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useDialog } from '@/components/Dialog';
import ReportChart from '@/components/ReportChart';

export default function AdminDashboard() {
  const router = useRouter();
  const { showAlert, showConfirm, showPrompt, DialogComponent } = useDialog();
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'reports' | 'create-admin' | 'settings'>('reports');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        if (!data.user || data.user.UserType !== 'Admin') {
          router.push('/login');
          return;
        }
        setUser(data.user);
        setLoading(false);
      });
  }, [router]);

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
        <h1>Admin Dashboard</h1>
        
        <div className="alert alert-info" style={{ marginBottom: '24px' }}>
          <strong>Administrator Access</strong> - You have full system access and can view managerial reports and create other admin accounts.
        </div>

        <div className="tab-container">
          <button
            className={`btn ${activeTab === 'reports' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('reports')}
            style={{ minWidth: '150px' }}
          >
            Managerial Reports
          </button>
          <button
            className={`btn ${activeTab === 'create-admin' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('create-admin')}
            style={{ minWidth: '150px' }}
          >
            Create Admin
          </button>
          <button
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('settings')}
            style={{ minWidth: '150px' }}
          >
            Account Settings
          </button>
        </div>

        {activeTab === 'reports' && (
          <AdminReports />
        )}

        {activeTab === 'create-admin' && (
          <CreateAdminForm />
        )}

        {activeTab === 'settings' && (
          <AccountSettings />
        )}
      </div>
    </>
  );
}

function AdminReports() {
  const [selectedReport, setSelectedReport] = useState<string>('1');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const reports = [
    { id: '1', name: 'System Overview Statistics', description: 'Total counts across all major entities' },
    { id: '2', name: 'Application Statistics per Job', description: 'Average, min, max, and total applications' },
    { id: '3', name: 'User Registration Trends', description: 'Sum of user registrations by month by type' },
    { id: '4', name: 'Interview Success Analysis', description: 'Statistics on interviews and success rates' },
    { id: '5', name: 'Job Posting Performance by Status', description: 'Comprehensive statistics on job postings' },
  ];

  const loadReport = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/reports?type=${selectedReport}`);
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
      <h2>Managerial Reports</h2>
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
    </div>
  );
}

function CreateAdminForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { showAlert } = useDialog();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');

    if (!username || !password || !confirmPassword) {
      setMessage('All fields are required');
      return;
    }

    if (password.length < 6) {
      setMessage('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/admin/create-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        await showAlert(`Admin '${username}' created successfully!`, 'Success');
        setUsername('');
        setPassword('');
        setConfirmPassword('');
        setMessage('');
      } else {
        setMessage(data.error || 'Failed to create admin');
      }
    } catch (err) {
      setMessage('Failed to create admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2>Create Admin Account</h2>
      <p style={{ marginBottom: '24px', color: '#666' }}>
        Create a new administrator account. Only existing admins can create other admins.
      </p>
      <form onSubmit={handleSubmit} style={{ maxWidth: '500px' }}>
        <label htmlFor="adminUsername">Username</label>
        <input
          type="text"
          id="adminUsername"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <label htmlFor="adminPassword">Password</label>
        <input
          type="password"
          id="adminPassword"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        <label htmlFor="adminConfirmPassword">Confirm Password</label>
        <input
          type="password"
          id="adminConfirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />
        {message && <div className={message.includes('success') ? 'success' : 'error'}>{message}</div>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Creating...' : 'Create Admin'}
        </button>
      </form>
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

