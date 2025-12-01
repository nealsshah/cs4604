import re
import hashlib
import mysql.connector as mc
from tkinter import *
from tkinter import ttk
from tkinter import messagebox

# DB connection
DB_CONFIG = dict(
    host="localhost",
    user="jat_user",         
    password="jat_pass_123",  
    database="jat_db"
)

EMAIL_RE = re.compile(r".+@.+\..+") 

# Session state
current_user = None
current_user_type = None
current_user_id = None

# Password hashing
def hash_password(password):
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()

def initialize_users_table():
    """Initialize Users table if it doesn't exist"""
    conn = connect_db()
    if not conn: return False
    try:
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS Users (
                UserID INT NOT NULL AUTO_INCREMENT,
                Username VARCHAR(50) UNIQUE NOT NULL,
                PasswordHash VARCHAR(64) NOT NULL,
                UserType ENUM('Admin', 'JobApplicant', 'Recruiter', 'Interviewer', 'HiringManager') NOT NULL,
                CreatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (UserID)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci
        """)
        conn.commit()
        
        # Check if any admin exists
        cur.execute("SELECT COUNT(*) FROM Users WHERE UserType='Admin'")
        admin_count = cur.fetchone()[0]
        
        # If no admin exists, create a default admin (first admin must be created manually)
        # For now, we'll just ensure the table exists
        return True
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Failed to initialize Users table:\n{e}")
        return False
    finally:
        conn.close()

def connect_db():
    try:
        return mc.connect(**DB_CONFIG)
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Could not connect:\n{e}")
        return None

# ==================== AUTHENTICATION FUNCTIONS ====================
def signup(username, password, user_type):
    """Sign up a new user (Admin cannot be created through signup)"""
    if not username or not password:
        return False, "Username and password are required."
    if len(password) < 6:
        return False, "Password must be at least 6 characters."
    if user_type == 'Admin':
        return False, "Admin accounts cannot be created through signup. Only existing admins can create other admins."
    
    conn = connect_db()
    if not conn: return False, "Database connection failed."
    try:
        cur = conn.cursor()
        password_hash = hash_password(password)
        cur.execute("""
            INSERT INTO Users (Username, PasswordHash, UserType)
            VALUES (%s, %s, %s)
        """, (username, password_hash, user_type))
        conn.commit()
        return True, "Sign up successful!"
    except mc.IntegrityError:
        return False, "Username already exists."
    except mc.Error as e:
        return False, f"Sign up failed: {e}"
    finally:
        conn.close()

def login(username, password):
    """Login a user"""
    if not username or not password:
        return False, "Username and password are required."
    
    conn = connect_db()
    if not conn: return False, "Database connection failed."
    try:
        cur = conn.cursor()
        password_hash = hash_password(password)
        cur.execute("""
            SELECT UserID, Username, UserType FROM Users
            WHERE Username=%s AND PasswordHash=%s
        """, (username, password_hash))
        user = cur.fetchone()
        if user:
            global current_user, current_user_type, current_user_id
            current_user_id, current_user, current_user_type = user
            return True, f"Welcome, {username}!"
        else:
            return False, "Invalid username or password."
    except mc.Error as e:
        return False, f"Login failed: {e}"
    finally:
        conn.close()

def logout():
    """Logout current user"""
    global current_user, current_user_type, current_user_id
    current_user = None
    current_user_type = None
    current_user_id = None

def change_password(username, old_password, new_password):
    """Change user password"""
    if not username or not old_password or not new_password:
        return False, "All fields are required."
    if len(new_password) < 6:
        return False, "New password must be at least 6 characters."
    
    conn = connect_db()
    if not conn: return False, "Database connection failed."
    try:
        cur = conn.cursor()
        old_password_hash = hash_password(old_password)
        # Verify old password
        cur.execute("""
            SELECT UserID FROM Users
            WHERE Username=%s AND PasswordHash=%s
        """, (username, old_password_hash))
        if not cur.fetchone():
            return False, "Current password is incorrect."
        
        # Update password
        new_password_hash = hash_password(new_password)
        cur.execute("""
            UPDATE Users SET PasswordHash=%s WHERE Username=%s
        """, (new_password_hash, username))
        conn.commit()
        return True, "Password changed successfully!"
    except mc.Error as e:
        return False, f"Password change failed: {e}"
    finally:
        conn.close()

def create_admin_by_admin(username, password):
    """Admin creates another admin (only admins can do this)"""
    if current_user_type != 'Admin':
        return False, "Only admins can create other admins."
    if not username or not password:
        return False, "Username and password are required."
    if len(password) < 6:
        return False, "Password must be at least 6 characters."
    
    conn = connect_db()
    if not conn: return False, "Database connection failed."
    try:
        cur = conn.cursor()
        password_hash = hash_password(password)
        cur.execute("""
            INSERT INTO Users (Username, PasswordHash, UserType)
            VALUES (%s, %s, 'Admin')
        """, (username, password_hash,))
        conn.commit()
        return True, f"Admin '{username}' created successfully!"
    except mc.IntegrityError:
        return False, "Username already exists."
    except mc.Error as e:
        return False, f"Failed to create admin: {e}"
    finally:
        conn.close()

# Actions
def insert_applicant():
    fname = entry_first.get().strip()
    lname = entry_last.get().strip()
    email = entry_email.get().strip()
    phone = entry_phone.get().strip()

    # validation
    if not fname or not lname:
        messagebox.showwarning("Missing data", "Enter first and last name.")
        return
    if not EMAIL_RE.match(email):
        messagebox.showwarning("Bad email", "Enter a valid email address.")
        return
    if not phone:
        messagebox.showwarning("Missing data", "Enter a phone number.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO JobApplicant (FirstName, LastName, Email, Phone)
            VALUES (%s, %s, %s, %s)
        """, (fname, lname, email, phone))
        conn.commit()
        new_id = cur.lastrowid
        messagebox.showinfo("Success", f"Inserted ApplicantID={new_id}")
        # clear fields
        for e in (entry_first, entry_last, entry_email, entry_phone):
            e.delete(0, END)
        label_msg.config(text=f"Inserted ApplicantID {new_id}", fg="green")
    except mc.IntegrityError as e:
        # likely duplicate email
        messagebox.showerror("Duplicate", "That email is already in use.")
        label_msg.config(text="Insert failed: duplicate email", fg="red")
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Insert failed:\n{e}")
        label_msg.config(text="Insert failed", fg="red")
    finally:
        conn.close()

def delete_applicant():
    id_val = entry_id.get().strip()
    if not id_val.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric ApplicantID.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM JobApplicant WHERE ApplicantID=%s", (id_val,))
        conn.commit()
        if cur.rowcount == 0:
            messagebox.showinfo("Info", f"No row with ApplicantID={id_val}")
            label_msg.config(text=f"No delete (ID {id_val} not found)", fg="orange")
        else:
            messagebox.showinfo("Success", f"Deleted ApplicantID={id_val}")
            label_msg.config(text=f"Deleted ApplicantID {id_val}", fg="green")
        entry_id.delete(0, END)
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Delete failed:\n{e}")
        label_msg.config(text="Delete failed", fg="red")
    finally:
        conn.close()

# ==================== CANDIDATE PROFILE CRUD ====================
def create_candidate_profile():
    applicant_id = entry_cp_applicant_id.get().strip()
    location = entry_cp_location.get().strip()
    linkedin = entry_cp_linkedin.get().strip()
    portfolio = entry_cp_portfolio.get().strip()
    summary = text_cp_summary.get("1.0", END).strip()

    if not applicant_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric ApplicantID.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        # Check if ApplicantID exists
        cur.execute("SELECT ApplicantID FROM JobApplicant WHERE ApplicantID=%s", (applicant_id,))
        if not cur.fetchone():
            messagebox.showerror("Invalid ID", f"ApplicantID {applicant_id} does not exist.")
            label_cp_msg.config(text=f"ApplicantID {applicant_id} not found", fg="red")
            return
        
        cur.execute("""
            INSERT INTO CandidateProfile (ApplicantID, Location, LinkedInURL, PortfolioURL, Summary)
            VALUES (%s, %s, %s, %s, %s)
        """, (applicant_id, location if location else None, linkedin if linkedin else None, portfolio if portfolio else None, summary if summary else None))
        conn.commit()
        new_id = cur.lastrowid
        messagebox.showinfo("Success", f"Created CandidateProfile with ProfileID={new_id}")
        entry_cp_applicant_id.delete(0, END)
        entry_cp_location.delete(0, END)
        entry_cp_linkedin.delete(0, END)
        entry_cp_portfolio.delete(0, END)
        text_cp_summary.delete("1.0", END)
        label_cp_msg.config(text=f"Created ProfileID {new_id}", fg="green")
    except mc.IntegrityError:
        messagebox.showerror("Duplicate", f"CandidateProfile for ApplicantID {applicant_id} already exists.")
        label_cp_msg.config(text="Profile already exists", fg="red")
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Insert failed:\n{e}")
        label_cp_msg.config(text="Insert failed", fg="red")
    finally:
        conn.close()

def read_candidate_profile():
    search_val = entry_cp_search.get().strip()
    if not search_val.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric ProfileID or ApplicantID.")
        return

    search_by = cp_search_by.get()
    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        if search_by == "ProfileID":
            cur.execute("""
                SELECT ProfileID, ApplicantID, Location, LinkedInURL, PortfolioURL, Summary 
                FROM CandidateProfile WHERE ProfileID=%s
            """, (search_val,))
        else:  # ApplicantID
            cur.execute("""
                SELECT ProfileID, ApplicantID, Location, LinkedInURL, PortfolioURL, Summary 
                FROM CandidateProfile WHERE ApplicantID=%s
            """, (search_val,))
        
        row = cur.fetchone()
        if row:
            result = f"ProfileID: {row[0]}\nApplicantID: {row[1]}\nLocation: {row[2] or 'N/A'}\n"
            result += f"LinkedIn: {row[3] or 'N/A'}\nPortfolio: {row[4] or 'N/A'}\nSummary: {row[5] or 'N/A'}"
            text_cp_result.config(state=NORMAL)
            text_cp_result.delete(1.0, END)
            text_cp_result.insert(1.0, result)
            text_cp_result.config(state=DISABLED)
            label_cp_msg.config(text=f"Found profile", fg="green")
        else:
            messagebox.showinfo("Not Found", f"No profile found with {search_by}={search_val}")
            label_cp_msg.config(text="Profile not found", fg="orange")
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Search failed:\n{e}")
        label_cp_msg.config(text="Search failed", fg="red")
    finally:
        conn.close()

def update_candidate_profile():
    profile_id = entry_cp_update_id.get().strip()
    location = entry_cp_update_location.get().strip()
    linkedin = entry_cp_update_linkedin.get().strip()
    portfolio = entry_cp_update_portfolio.get().strip()
    summary = text_cp_update_summary.get("1.0", END).strip()

    if not profile_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric ProfileID.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE CandidateProfile 
            SET Location=%s, LinkedInURL=%s, PortfolioURL=%s, Summary=%s 
            WHERE ProfileID=%s
        """, (location if location else None, linkedin if linkedin else None, portfolio if portfolio else None, summary if summary else None, profile_id))
        conn.commit()
        if cur.rowcount == 0:
            messagebox.showinfo("Info", f"No profile with ProfileID={profile_id}")
            label_cp_msg.config(text=f"ProfileID {profile_id} not found", fg="orange")
        else:
            messagebox.showinfo("Success", f"Updated ProfileID={profile_id}")
            label_cp_msg.config(text=f"Updated ProfileID {profile_id}", fg="green")
            entry_cp_update_id.delete(0, END)
            entry_cp_update_location.delete(0, END)
            entry_cp_update_linkedin.delete(0, END)
            entry_cp_update_portfolio.delete(0, END)
            text_cp_update_summary.delete("1.0", END)
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Update failed:\n{e}")
        label_cp_msg.config(text="Update failed", fg="red")
    finally:
        conn.close()

def delete_candidate_profile():
    profile_id = entry_cp_delete_id.get().strip()
    if not profile_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric ProfileID.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM CandidateProfile WHERE ProfileID=%s", (profile_id,))
        conn.commit()
        if cur.rowcount == 0:
            messagebox.showinfo("Info", f"No profile with ProfileID={profile_id}")
            label_cp_msg.config(text=f"ProfileID {profile_id} not found", fg="orange")
        else:
            messagebox.showinfo("Success", f"Deleted ProfileID={profile_id}")
            label_cp_msg.config(text=f"Deleted ProfileID {profile_id}", fg="green")
        entry_cp_delete_id.delete(0, END)
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Delete failed:\n{e}")
        label_cp_msg.config(text="Delete failed", fg="red")
    finally:
        conn.close()

# ==================== JOB POSTING CRUD ====================
def create_job_posting():
    recruiter_id = entry_jp_recruiter_id.get().strip()
    title = entry_jp_title.get().strip()
    department = entry_jp_department.get().strip()
    location = entry_jp_location.get().strip()
    employment_type = jp_employment_type.get()
    posted_date = entry_jp_posted_date.get().strip()
    status = jp_status.get()

    if not recruiter_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric RecruiterID.")
        return
    if not title:
        messagebox.showwarning("Missing data", "Job Title is required.")
        return
    if not posted_date:
        messagebox.showwarning("Missing data", "Posted Date is required (YYYY-MM-DD).")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        # Check if RecruiterID exists
        cur.execute("SELECT RecruiterID FROM Recruiter WHERE RecruiterID=%s", (recruiter_id,))
        if not cur.fetchone():
            messagebox.showerror("Invalid ID", f"RecruiterID {recruiter_id} does not exist.")
            label_jp_msg.config(text=f"RecruiterID {recruiter_id} not found", fg="red")
            return
        
        cur.execute("""
            INSERT INTO JobPosting (RecruiterID, Title, Department, Location, EmploymentType, PostedDate, Status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, (recruiter_id, title, department if department else None, location if location else None, employment_type, posted_date, status))
        conn.commit()
        new_id = cur.lastrowid
        messagebox.showinfo("Success", f"Created JobPosting with JobID={new_id}")
        entry_jp_recruiter_id.delete(0, END)
        entry_jp_title.delete(0, END)
        entry_jp_department.delete(0, END)
        entry_jp_location.delete(0, END)
        entry_jp_posted_date.delete(0, END)
        label_jp_msg.config(text=f"Created JobID {new_id}", fg="green")
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Insert failed:\n{e}")
        label_jp_msg.config(text="Insert failed", fg="red")
    finally:
        conn.close()

def browse_open_jobs():
    """Browse all open jobs (for applicants)"""
    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT JobID, Title, Department, Location, EmploymentType, PostedDate 
            FROM JobPosting 
            WHERE Status='Open'
            ORDER BY PostedDate DESC
        """)
        
        rows = cur.fetchall()
        if rows:
            result = f"Found {len(rows)} open job(s):\n\n"
            for row in rows:
                result += f"Job #{row[0]}: {row[1]}\n"
                result += f"  Department: {row[2] or 'N/A'}\n"
                result += f"  Location: {row[3] or 'N/A'}\n"
                result += f"  Type: {row[4]}\n"
                result += f"  Posted: {row[5]}\n"
                result += "-" * 40 + "\n"
            text_jp_result.config(state=NORMAL)
            text_jp_result.delete(1.0, END)
            text_jp_result.insert(1.0, result)
            text_jp_result.config(state=DISABLED)
            label_jp_msg.config(text=f"Found {len(rows)} open job(s)", fg="green")
        else:
            messagebox.showinfo("No Jobs", "No open job postings available.")
            text_jp_result.config(state=NORMAL)
            text_jp_result.delete(1.0, END)
            text_jp_result.insert(1.0, "No open job postings available.")
            text_jp_result.config(state=DISABLED)
            label_jp_msg.config(text="No open jobs", fg="orange")
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Browse failed:\n{e}")
        label_jp_msg.config(text="Browse failed", fg="red")
    finally:
        conn.close()

def apply_to_job():
    """Apply to a job (for applicants)"""
    job_id = entry_jp_apply_job_id.get().strip()
    applicant_id = entry_jp_apply_applicant_id.get().strip()
    
    if not job_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric JobID.")
        return
    if not applicant_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric ApplicantID.")
        return
    
    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        # Check if job exists and is open
        cur.execute("SELECT JobID, Status FROM JobPosting WHERE JobID=%s", (job_id,))
        job = cur.fetchone()
        if not job:
            messagebox.showerror("Invalid Job", f"JobID {job_id} does not exist.")
            return
        if job[1] != 'Open':
            messagebox.showerror("Job Closed", f"This job is {job[1]}. You can only apply to open positions.")
            return
        
        # Check if applicant exists
        cur.execute("SELECT ApplicantID FROM JobApplicant WHERE ApplicantID=%s", (applicant_id,))
        if not cur.fetchone():
            messagebox.showerror("Invalid Applicant", f"ApplicantID {applicant_id} does not exist.")
            return
        
        # Check if already applied
        cur.execute("SELECT ApplicationID FROM ApplicationForm WHERE ApplicantID=%s AND JobID=%s", 
                   (applicant_id, job_id))
        if cur.fetchone():
            messagebox.showwarning("Already Applied", "You have already applied to this job.")
            return
        
        # Create application
        cur.execute("""
            INSERT INTO ApplicationForm (ApplicantID, JobID, Status)
            VALUES (%s, %s, 'Submitted')
        """, (applicant_id, job_id))
        conn.commit()
        new_id = cur.lastrowid
        messagebox.showinfo("Success", f"Application submitted! ApplicationID={new_id}")
        entry_jp_apply_job_id.delete(0, END)
        entry_jp_apply_applicant_id.delete(0, END)
        label_jp_msg.config(text=f"Application {new_id} submitted", fg="green")
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Application failed:\n{e}")
        label_jp_msg.config(text="Application failed", fg="red")
    finally:
        conn.close()

def view_my_applications():
    """View applications for an applicant"""
    applicant_id = entry_jp_view_applicant_id.get().strip()
    
    if not applicant_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric ApplicantID.")
        return
    
    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT af.ApplicationID, af.JobID, jp.Title, af.Status, af.AppliedAt
            FROM ApplicationForm af
            JOIN JobPosting jp ON af.JobID = jp.JobID
            WHERE af.ApplicantID=%s
            ORDER BY af.AppliedAt DESC
        """, (applicant_id,))
        
        rows = cur.fetchall()
        if rows:
            result = f"Your Applications ({len(rows)} total):\n\n"
            for row in rows:
                result += f"Application #{row[0]}\n"
                result += f"  Job: {row[2]} (JobID: {row[1]})\n"
                result += f"  Status: {row[3]}\n"
                result += f"  Applied: {row[4]}\n"
                result += "-" * 40 + "\n"
            text_jp_result.config(state=NORMAL)
            text_jp_result.delete(1.0, END)
            text_jp_result.insert(1.0, result)
            text_jp_result.config(state=DISABLED)
            label_jp_msg.config(text=f"Found {len(rows)} application(s)", fg="green")
        else:
            messagebox.showinfo("No Applications", "You have not applied to any jobs yet.")
            text_jp_result.config(state=NORMAL)
            text_jp_result.delete(1.0, END)
            text_jp_result.insert(1.0, "No applications found.")
            text_jp_result.config(state=DISABLED)
            label_jp_msg.config(text="No applications", fg="orange")
    except mc.Error as e:
        messagebox.showerror("DB Error", f"View failed:\n{e}")
        label_jp_msg.config(text="View failed", fg="red")
    finally:
        conn.close()

def read_job_posting():
    """Read job posting (for recruiters/admins)"""
    search_val = entry_jp_search.get().strip()
    if not search_val.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric JobID or RecruiterID.")
        return

    search_by = jp_search_by.get()
    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        if search_by == "JobID":
            cur.execute("""
                SELECT JobID, RecruiterID, Title, Department, Location, EmploymentType, PostedDate, Status 
                FROM JobPosting WHERE JobID=%s
            """, (search_val,))
        else:  # RecruiterID
            cur.execute("""
                SELECT JobID, RecruiterID, Title, Department, Location, EmploymentType, PostedDate, Status 
                FROM JobPosting WHERE RecruiterID=%s
            """, (search_val,))
        
        rows = cur.fetchall()
        if rows:
            result = ""
            for row in rows:
                result += f"JobID: {row[0]}\nRecruiterID: {row[1]}\nTitle: {row[2]}\n"
                result += f"Department: {row[3] or 'N/A'}\nLocation: {row[4] or 'N/A'}\n"
                result += f"Employment Type: {row[5]}\nPosted Date: {row[6]}\nStatus: {row[7]}\n"
                result += "-" * 40 + "\n"
            text_jp_result.config(state=NORMAL)
            text_jp_result.delete(1.0, END)
            text_jp_result.insert(1.0, result)
            text_jp_result.config(state=DISABLED)
            label_jp_msg.config(text=f"Found {len(rows)} job(s)", fg="green")
        else:
            messagebox.showinfo("Not Found", f"No job posting found with {search_by}={search_val}")
            label_jp_msg.config(text="Job posting not found", fg="orange")
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Search failed:\n{e}")
        label_jp_msg.config(text="Search failed", fg="red")
    finally:
        conn.close()

def update_job_posting():
    job_id = entry_jp_update_id.get().strip()
    title = entry_jp_update_title.get().strip()
    department = entry_jp_update_department.get().strip()
    location = entry_jp_update_location.get().strip()
    employment_type = jp_update_employment_type.get()
    posted_date = entry_jp_update_posted_date.get().strip()
    status = jp_update_status.get()

    if not job_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric JobID.")
        return
    if not title:
        messagebox.showwarning("Missing data", "Job Title is required.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        # Build update query dynamically based on provided fields
        update_fields = ["Title=%s"]
        values = [title]
        
        if department:
            update_fields.append("Department=%s")
            values.append(department)
        if location:
            update_fields.append("Location=%s")
            values.append(location)
        if employment_type:
            update_fields.append("EmploymentType=%s")
            values.append(employment_type)
        if posted_date:
            update_fields.append("PostedDate=%s")
            values.append(posted_date)
        if status:
            update_fields.append("Status=%s")
            values.append(status)
        
        values.append(job_id)
        query = f"UPDATE JobPosting SET {', '.join(update_fields)} WHERE JobID=%s"
        cur.execute(query, tuple(values))
        conn.commit()
        if cur.rowcount == 0:
            messagebox.showinfo("Info", f"No job posting with JobID={job_id}")
            label_jp_msg.config(text=f"JobID {job_id} not found", fg="orange")
        else:
            messagebox.showinfo("Success", f"Updated JobID={job_id}")
            label_jp_msg.config(text=f"Updated JobID {job_id}", fg="green")
            entry_jp_update_id.delete(0, END)
            entry_jp_update_title.delete(0, END)
            entry_jp_update_department.delete(0, END)
            entry_jp_update_location.delete(0, END)
            entry_jp_update_posted_date.delete(0, END)
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Update failed:\n{e}")
        label_jp_msg.config(text="Update failed", fg="red")
    finally:
        conn.close()

def delete_job_posting():
    job_id = entry_jp_delete_id.get().strip()
    if not job_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric JobID.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM JobPosting WHERE JobID=%s", (job_id,))
        conn.commit()
        if cur.rowcount == 0:
            messagebox.showinfo("Info", f"No job posting with JobID={job_id}")
            label_jp_msg.config(text=f"JobID {job_id} not found", fg="orange")
        else:
            messagebox.showinfo("Success", f"Deleted JobID={job_id}")
            label_jp_msg.config(text=f"Deleted JobID {job_id}", fg="green")
        entry_jp_delete_id.delete(0, END)
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Delete failed:\n{e}")
        label_jp_msg.config(text="Delete failed", fg="red")
    finally:
        conn.close()

# ==================== AUTHENTICATION UI FUNCTIONS ====================
def show_login_window():
    """Show login window"""
    login_win = Toplevel(root)
    login_win.title("Login")
    login_win.geometry("350x200")
    login_win.transient(root)
    login_win.grab_set()
    
    # Center the window
    login_win.update_idletasks()
    x = (login_win.winfo_screenwidth() // 2) - (350 // 2)
    y = (login_win.winfo_screenheight() // 2) - (200 // 2)
    login_win.geometry(f"350x200+{x}+{y}")
    
    frame = Frame(login_win, padx=20, pady=20)
    frame.pack(fill=BOTH, expand=True)
    
    Label(frame, text="Username:").grid(row=0, column=0, padx=5, pady=5, sticky="e")
    entry_login_user = Entry(frame, width=25)
    entry_login_user.grid(row=0, column=1, padx=5, pady=5)
    entry_login_user.focus()
    
    Label(frame, text="Password:").grid(row=1, column=0, padx=5, pady=5, sticky="e")
    entry_login_pass = Entry(frame, width=25, show="*")
    entry_login_pass.grid(row=1, column=1, padx=5, pady=5)
    
    label_login_msg = Label(frame, text="", fg="red")
    label_login_msg.grid(row=2, column=0, columnspan=2, pady=5)
    
    def do_login():
        username = entry_login_user.get().strip()
        password = entry_login_pass.get().strip()
        success, msg = login(username, password)
        if success:
            login_win.destroy()
            show_main_app()
            update_auth_status()
        else:
            label_login_msg.config(text=msg, fg="red")
            entry_login_pass.delete(0, END)
    
    Button(frame, text="Login", command=do_login, width=15).grid(row=3, column=0, columnspan=2, pady=10)
    Button(frame, text="Sign Up", command=lambda: (login_win.destroy(), show_signup_window()), width=15).grid(row=4, column=0, columnspan=2, pady=5)
    
    entry_login_pass.bind('<Return>', lambda e: do_login())

def show_signup_window():
    """Show signup window"""
    signup_win = Toplevel(root)
    signup_win.title("Sign Up")
    signup_win.geometry("400x300")
    signup_win.transient(root)
    signup_win.grab_set()
    
    # Center the window
    signup_win.update_idletasks()
    x = (signup_win.winfo_screenwidth() // 2) - (400 // 2)
    y = (signup_win.winfo_screenheight() // 2) - (300 // 2)
    signup_win.geometry(f"400x300+{x}+{y}")
    
    frame = Frame(signup_win, padx=20, pady=20)
    frame.pack(fill=BOTH, expand=True)
    
    Label(frame, text="Username:").grid(row=0, column=0, padx=5, pady=5, sticky="e")
    entry_signup_user = Entry(frame, width=25)
    entry_signup_user.grid(row=0, column=1, padx=5, pady=5)
    entry_signup_user.focus()
    
    Label(frame, text="Password:").grid(row=1, column=0, padx=5, pady=5, sticky="e")
    entry_signup_pass = Entry(frame, width=25, show="*")
    entry_signup_pass.grid(row=1, column=1, padx=5, pady=5)
    
    Label(frame, text="User Type:").grid(row=2, column=0, padx=5, pady=5, sticky="e")
    signup_user_type = StringVar(value="JobApplicant")
    frame_type = Frame(frame)
    frame_type.grid(row=2, column=1, padx=5, pady=5, sticky="w")
    Radiobutton(frame_type, text="Job Applicant", variable=signup_user_type, value="JobApplicant").pack(side=LEFT)
    Radiobutton(frame_type, text="Recruiter", variable=signup_user_type, value="Recruiter").pack(side=LEFT)
    Radiobutton(frame_type, text="Interviewer", variable=signup_user_type, value="Interviewer").pack(side=LEFT)
    Radiobutton(frame_type, text="Hiring Manager", variable=signup_user_type, value="HiringManager").pack(side=LEFT)
    
    label_signup_msg = Label(frame, text="", fg="red")
    label_signup_msg.grid(row=3, column=0, columnspan=2, pady=5)
    
    def do_signup():
        username = entry_signup_user.get().strip()
        password = entry_signup_pass.get().strip()
        user_type = signup_user_type.get()
        success, msg = signup(username, password, user_type)
        if success:
            messagebox.showinfo("Success", msg)
            signup_win.destroy()
            show_login_window()
        else:
            label_signup_msg.config(text=msg, fg="red")
    
    Button(frame, text="Sign Up", command=do_signup, width=15).grid(row=4, column=0, columnspan=2, pady=10)
    Button(frame, text="Back to Login", command=lambda: (signup_win.destroy(), show_login_window()), width=15).grid(row=5, column=0, columnspan=2, pady=5)

def show_change_password_window():
    """Show change password window"""
    cp_win = Toplevel(root)
    cp_win.title("Change Password")
    cp_win.geometry("350x200")
    cp_win.transient(root)
    cp_win.grab_set()
    
    # Center the window
    cp_win.update_idletasks()
    x = (cp_win.winfo_screenwidth() // 2) - (350 // 2)
    y = (cp_win.winfo_screenheight() // 2) - (200 // 2)
    cp_win.geometry(f"350x200+{x}+{y}")
    
    frame = Frame(cp_win, padx=20, pady=20)
    frame.pack(fill=BOTH, expand=True)
    
    Label(frame, text="Current Password:").grid(row=0, column=0, padx=5, pady=5, sticky="e")
    entry_cp_old = Entry(frame, width=25, show="*")
    entry_cp_old.grid(row=0, column=1, padx=5, pady=5)
    entry_cp_old.focus()
    
    Label(frame, text="New Password:").grid(row=1, column=0, padx=5, pady=5, sticky="e")
    entry_cp_new = Entry(frame, width=25, show="*")
    entry_cp_new.grid(row=1, column=1, padx=5, pady=5)
    
    label_cp_msg = Label(frame, text="", fg="red")
    label_cp_msg.grid(row=2, column=0, columnspan=2, pady=5)
    
    def do_change_password():
        old_pass = entry_cp_old.get().strip()
        new_pass = entry_cp_new.get().strip()
        success, msg = change_password(current_user, old_pass, new_pass)
        if success:
            messagebox.showinfo("Success", msg)
            cp_win.destroy()
        else:
            label_cp_msg.config(text=msg, fg="red")
            entry_cp_old.delete(0, END)
            entry_cp_new.delete(0, END)
    
    Button(frame, text="Change Password", command=do_change_password, width=20).grid(row=3, column=0, columnspan=2, pady=10)

def show_create_admin_window():
    """Show create admin window (only for admins)"""
    if current_user_type != 'Admin':
        messagebox.showerror("Access Denied", "Only admins can create other admins.")
        return
    
    admin_win = Toplevel(root)
    admin_win.title("Create Admin")
    admin_win.geometry("350x180")
    admin_win.transient(root)
    admin_win.grab_set()
    
    # Center the window
    admin_win.update_idletasks()
    x = (admin_win.winfo_screenwidth() // 2) - (350 // 2)
    y = (admin_win.winfo_screenheight() // 2) - (180 // 2)
    admin_win.geometry(f"350x180+{x}+{y}")
    
    frame = Frame(admin_win, padx=20, pady=20)
    frame.pack(fill=BOTH, expand=True)
    
    Label(frame, text="Username:").grid(row=0, column=0, padx=5, pady=5, sticky="e")
    entry_admin_user = Entry(frame, width=25)
    entry_admin_user.grid(row=0, column=1, padx=5, pady=5)
    entry_admin_user.focus()
    
    Label(frame, text="Password:").grid(row=1, column=0, padx=5, pady=5, sticky="e")
    entry_admin_pass = Entry(frame, width=25, show="*")
    entry_admin_pass.grid(row=1, column=1, padx=5, pady=5)
    
    label_admin_msg = Label(frame, text="", fg="red")
    label_admin_msg.grid(row=2, column=0, columnspan=2, pady=5)
    
    def do_create_admin():
        username = entry_admin_user.get().strip()
        password = entry_admin_pass.get().strip()
        success, msg = create_admin_by_admin(username, password)
        if success:
            messagebox.showinfo("Success", msg)
            admin_win.destroy()
        else:
            label_admin_msg.config(text=msg, fg="red")
            entry_admin_pass.delete(0, END)
    
    Button(frame, text="Create Admin", command=do_create_admin, width=20).grid(row=3, column=0, columnspan=2, pady=10)

def do_logout():
    """Logout and return to login"""
    if messagebox.askyesno("Logout", "Are you sure you want to logout?"):
        logout()
        hide_main_app()
        show_login_window()
        update_auth_status()

def show_main_app():
    """Show main application"""
    notebook.pack(padx=10, pady=10, fill=BOTH, expand=True)
    auth_frame.pack_forget()

def hide_main_app():
    """Hide main application"""
    notebook.pack_forget()
    auth_frame.pack(padx=10, pady=10, fill=BOTH, expand=True)

def configure_role_based_access():
    """Configure UI access based on user role"""
    if not current_user_type:
        return
    
    # Remove all existing tabs
    while notebook.index("end") > 0:
        notebook.forget(0)
    
    # Configure access based on role
    if current_user_type == 'Admin':
        # Admin: Full access to all tabs
        notebook.add(tab_applicant, text="Job Applicant")
        notebook.add(tab_profile, text="Candidate Profile")
        notebook.add(tab_job, text="Job Posting")
        notebook.add(tab_auth, text="Authentication")
        # Enable all operations
        enable_all_operations(True)
        
    elif current_user_type == 'JobApplicant':
        # Job Applicants: Can view their profile, browse jobs, apply
        notebook.add(tab_profile, text="My Profile")
        notebook.add(tab_job, text="Browse Jobs")
        notebook.add(tab_auth, text="Account")
        # Disable admin operations, enable profile viewing and job browsing
        enable_all_operations(False)
        enable_job_applicant_operations()
        
    elif current_user_type == 'Recruiter':
        # Recruiters: Can manage job postings, view applicants
        notebook.add(tab_applicant, text="View Applicants")
        notebook.add(tab_profile, text="Candidate Profiles")
        notebook.add(tab_job, text="Manage Job Postings")
        notebook.add(tab_auth, text="Account")
        # Enable recruiter operations
        enable_all_operations(False)
        enable_recruiter_operations()
        
    elif current_user_type == 'Interviewer':
        # Interviewers: Can view profiles, interviews, submit feedback
        notebook.add(tab_profile, text="Candidate Profiles")
        notebook.add(tab_job, text="Job Postings")
        notebook.add(tab_auth, text="Account")
        # Enable interviewer operations (read-only mostly)
        enable_all_operations(False)
        enable_interviewer_operations()
        
    elif current_user_type == 'HiringManager':
        # Hiring Managers: Can review candidates, approve/reject
        notebook.add(tab_profile, text="Review Candidates")
        notebook.add(tab_job, text="Job Postings")
        notebook.add(tab_auth, text="Account")
        # Enable hiring manager operations
        enable_all_operations(False)
        enable_hiring_manager_operations()

def enable_all_operations(enabled):
    """Enable or disable all operations (for Admin)"""
    state = NORMAL if enabled else DISABLED
    
    # Job Applicant operations
    try:
        for widget in [entry_first, entry_last, entry_email, entry_phone]:
            widget.config(state=state)
        btn_insert_applicant.config(state=state)
        btn_delete_applicant.config(state=state)
    except:
        pass
    
    # Candidate Profile operations
    try:
        for widget in [entry_cp_applicant_id, entry_cp_location, entry_cp_linkedin, 
                       entry_cp_portfolio, text_cp_summary, entry_cp_update_id,
                       entry_cp_update_location, entry_cp_update_linkedin,
                       entry_cp_update_portfolio, text_cp_update_summary]:
            widget.config(state=state)
        btn_create_profile.config(state=state)
        btn_search_profile.config(state=state)
        btn_update_profile.config(state=state)
        btn_delete_profile.config(state=state)
    except:
        pass
    
    # Job Posting operations - show all sections for admin
    try:
        for widget in [entry_jp_recruiter_id, entry_jp_title, entry_jp_department,
                       entry_jp_location, entry_jp_posted_date, entry_jp_update_id,
                       entry_jp_update_title, entry_jp_update_department,
                       entry_jp_update_location, entry_jp_update_posted_date]:
            widget.config(state=state)
        btn_create_job.config(state=state)
        btn_search_job.config(state=state)
        btn_update_job.config(state=state)
        btn_delete_job.config(state=state)
        
        # Show all sections for admin
        frm_jp_create.grid()
        frm_jp_read.grid()
        frm_jp_update.grid()
        frm_jp_del.grid()
        frm_jp_browse.grid()
        frm_jp_apply.grid()
        frm_jp_view_apps.grid()
        
        # Enable applicant fields too
        entry_jp_apply_job_id.config(state=state)
        entry_jp_apply_applicant_id.config(state=state)
        entry_jp_view_applicant_id.config(state=state)
        btn_browse_jobs.config(state=state)
        btn_apply_job.config(state=state)
        btn_view_applications.config(state=state)
    except:
        pass

def enable_job_applicant_operations():
    """Enable operations for Job Applicants"""
    # Can view and update their own profile (read-only for others)
    try:
        entry_cp_applicant_id.config(state=DISABLED)  # Can't create new profiles
        entry_cp_location.config(state=NORMAL)
        entry_cp_linkedin.config(state=NORMAL)
        entry_cp_portfolio.config(state=NORMAL)
        text_cp_summary.config(state=NORMAL)
        entry_cp_update_location.config(state=NORMAL)
        entry_cp_update_linkedin.config(state=NORMAL)
        entry_cp_update_portfolio.config(state=NORMAL)
        text_cp_update_summary.config(state=NORMAL)
        btn_create_profile.config(state=DISABLED)  # Can't create profiles
        btn_search_profile.config(state=NORMAL)  # Can search
        btn_update_profile.config(state=NORMAL)  # Can update their own
        btn_delete_profile.config(state=DISABLED)  # Can't delete
        
        # Hide recruiter sections, show applicant sections
        frm_jp_create.grid_remove()  # Hide create job posting
        frm_jp_read.grid_remove()  # Hide search by ID
        frm_jp_update.grid_remove()  # Hide update job posting
        frm_jp_del.grid_remove()  # Hide delete job posting
        frm_jp_browse.grid()  # Show browse open jobs
        frm_jp_apply.grid()  # Show apply to job
        frm_jp_view_apps.grid()  # Show view applications
        
        # Enable applicant fields
        entry_jp_apply_job_id.config(state=NORMAL)
        entry_jp_apply_applicant_id.config(state=NORMAL)
        entry_jp_view_applicant_id.config(state=NORMAL)
        btn_browse_jobs.config(state=NORMAL)
        btn_apply_job.config(state=NORMAL)
        btn_view_applications.config(state=NORMAL)
        
        # Can't manage applicants
        entry_first.config(state=DISABLED)
        entry_last.config(state=DISABLED)
        entry_email.config(state=DISABLED)
        entry_phone.config(state=DISABLED)
        btn_insert_applicant.config(state=DISABLED)
        btn_delete_applicant.config(state=DISABLED)
    except:
        pass

def enable_recruiter_operations():
    """Enable operations for Recruiters"""
    # Can view applicants (read-only)
    try:
        entry_first.config(state=DISABLED)  # Can't create applicants directly
        entry_last.config(state=DISABLED)
        entry_email.config(state=DISABLED)
        entry_phone.config(state=DISABLED)
        btn_insert_applicant.config(state=DISABLED)
        btn_delete_applicant.config(state=DISABLED)
        
        # Can view candidate profiles (read-only)
        entry_cp_applicant_id.config(state=DISABLED)
        entry_cp_location.config(state=DISABLED)
        entry_cp_linkedin.config(state=DISABLED)
        entry_cp_portfolio.config(state=DISABLED)
        text_cp_summary.config(state=DISABLED)
        entry_cp_update_id.config(state=DISABLED)
        entry_cp_update_location.config(state=DISABLED)
        entry_cp_update_linkedin.config(state=DISABLED)
        entry_cp_update_portfolio.config(state=DISABLED)
        text_cp_update_summary.config(state=DISABLED)
        btn_create_profile.config(state=DISABLED)
        btn_search_profile.config(state=NORMAL)  # Can search
        btn_update_profile.config(state=DISABLED)
        btn_delete_profile.config(state=DISABLED)
        
        # Show recruiter sections, hide applicant sections
        frm_jp_create.grid()  # Show create job posting
        frm_jp_read.grid()  # Show search by ID
        frm_jp_update.grid()  # Show update job posting
        frm_jp_del.grid()  # Show delete job posting
        frm_jp_browse.grid_remove()  # Hide browse open jobs
        frm_jp_apply.grid_remove()  # Hide apply to job
        frm_jp_view_apps.grid_remove()  # Hide view applications
        
        # Can manage job postings
        entry_jp_recruiter_id.config(state=NORMAL)
        entry_jp_title.config(state=NORMAL)
        entry_jp_department.config(state=NORMAL)
        entry_jp_location.config(state=NORMAL)
        entry_jp_posted_date.config(state=NORMAL)
        entry_jp_update_id.config(state=NORMAL)
        entry_jp_update_title.config(state=NORMAL)
        entry_jp_update_department.config(state=NORMAL)
        entry_jp_update_location.config(state=NORMAL)
        entry_jp_update_posted_date.config(state=NORMAL)
        btn_create_job.config(state=NORMAL)
        btn_search_job.config(state=NORMAL)
        btn_update_job.config(state=NORMAL)
        btn_delete_job.config(state=NORMAL)
    except:
        pass

def enable_interviewer_operations():
    """Enable operations for Interviewers"""
    # Read-only access to most things
    try:
        entry_first.config(state=DISABLED)
        entry_last.config(state=DISABLED)
        entry_email.config(state=DISABLED)
        entry_phone.config(state=DISABLED)
        btn_insert_applicant.config(state=DISABLED)
        btn_delete_applicant.config(state=DISABLED)
        
        entry_cp_applicant_id.config(state=DISABLED)
        entry_cp_location.config(state=DISABLED)
        entry_cp_linkedin.config(state=DISABLED)
        entry_cp_portfolio.config(state=DISABLED)
        text_cp_summary.config(state=DISABLED)
        entry_cp_update_id.config(state=DISABLED)
        entry_cp_update_location.config(state=DISABLED)
        entry_cp_update_linkedin.config(state=DISABLED)
        entry_cp_update_portfolio.config(state=DISABLED)
        text_cp_update_summary.config(state=DISABLED)
        btn_create_profile.config(state=DISABLED)
        btn_search_profile.config(state=NORMAL)  # Can search profiles
        btn_update_profile.config(state=DISABLED)
        btn_delete_profile.config(state=DISABLED)
        
        # Show read-only job search, hide everything else
        frm_jp_create.grid_remove()
        frm_jp_read.grid()
        frm_jp_update.grid_remove()
        frm_jp_del.grid_remove()
        frm_jp_browse.grid_remove()
        frm_jp_apply.grid_remove()
        frm_jp_view_apps.grid_remove()
        
        entry_jp_recruiter_id.config(state=DISABLED)
        entry_jp_title.config(state=DISABLED)
        entry_jp_department.config(state=DISABLED)
        entry_jp_location.config(state=DISABLED)
        entry_jp_posted_date.config(state=DISABLED)
        entry_jp_update_id.config(state=DISABLED)
        entry_jp_update_title.config(state=DISABLED)
        entry_jp_update_department.config(state=DISABLED)
        entry_jp_update_location.config(state=DISABLED)
        entry_jp_update_posted_date.config(state=DISABLED)
        btn_create_job.config(state=DISABLED)
        btn_search_job.config(state=NORMAL)  # Can search jobs
        btn_update_job.config(state=DISABLED)
        btn_delete_job.config(state=DISABLED)
    except:
        pass

def enable_hiring_manager_operations():
    """Enable operations for Hiring Managers"""
    # Can view candidates and jobs, but limited editing
    try:
        entry_first.config(state=DISABLED)
        entry_last.config(state=DISABLED)
        entry_email.config(state=DISABLED)
        entry_phone.config(state=DISABLED)
        btn_insert_applicant.config(state=DISABLED)
        btn_delete_applicant.config(state=DISABLED)
        
        entry_cp_applicant_id.config(state=DISABLED)
        entry_cp_location.config(state=DISABLED)
        entry_cp_linkedin.config(state=DISABLED)
        entry_cp_portfolio.config(state=DISABLED)
        text_cp_summary.config(state=DISABLED)
        entry_cp_update_id.config(state=DISABLED)
        entry_cp_update_location.config(state=DISABLED)
        entry_cp_update_linkedin.config(state=DISABLED)
        entry_cp_update_portfolio.config(state=DISABLED)
        text_cp_update_summary.config(state=DISABLED)
        btn_create_profile.config(state=DISABLED)
        btn_search_profile.config(state=NORMAL)  # Can search profiles
        btn_update_profile.config(state=DISABLED)
        btn_delete_profile.config(state=DISABLED)
        
        # Show read-only job search, hide everything else
        frm_jp_create.grid_remove()
        frm_jp_read.grid()
        frm_jp_update.grid_remove()
        frm_jp_del.grid_remove()
        frm_jp_browse.grid_remove()
        frm_jp_apply.grid_remove()
        frm_jp_view_apps.grid_remove()
        
        entry_jp_recruiter_id.config(state=DISABLED)
        entry_jp_title.config(state=DISABLED)
        entry_jp_department.config(state=DISABLED)
        entry_jp_location.config(state=DISABLED)
        entry_jp_posted_date.config(state=DISABLED)
        entry_jp_update_id.config(state=DISABLED)
        entry_jp_update_title.config(state=DISABLED)
        entry_jp_update_department.config(state=DISABLED)
        entry_jp_update_location.config(state=DISABLED)
        entry_jp_update_posted_date.config(state=DISABLED)
        btn_create_job.config(state=DISABLED)
        btn_search_job.config(state=NORMAL)  # Can search jobs
        btn_update_job.config(state=DISABLED)
        btn_delete_job.config(state=DISABLED)
    except:
        pass

def update_auth_status():
    """Update authentication status display"""
    if current_user:
        label_auth_status.config(text=f"Logged in as: {current_user} ({current_user_type})", fg="green")
        btn_logout.config(state=NORMAL)
        btn_change_pass.config(state=NORMAL)
        if current_user_type == 'Admin':
            btn_create_admin.config(state=NORMAL)
        else:
            btn_create_admin.config(state=DISABLED)
        # Configure role-based access
        configure_role_based_access()
    else:
        label_auth_status.config(text="Not logged in", fg="red")
        btn_logout.config(state=DISABLED)
        btn_change_pass.config(state=DISABLED)
        btn_create_admin.config(state=DISABLED)

# ==================== GUI ====================
root = Tk()
root.title("CS4604 Phase 2 - Job Application System")
root.geometry("600x700")
root.minsize(500, 600)

# Initialize database
if not initialize_users_table():
    messagebox.showerror("Error", "Failed to initialize database. Application will exit.")
    root.destroy()
    exit()

# Authentication frame (shown when not logged in)
auth_frame = Frame(root)
auth_frame.pack(padx=10, pady=10, fill=BOTH, expand=True)

Label(auth_frame, text="Job Applicant Tracking System", font=("Arial", 16, "bold")).pack(pady=20)
Label(auth_frame, text="Please login to continue", font=("Arial", 12)).pack(pady=10)
Button(auth_frame, text="Login", command=show_login_window, width=20, height=2).pack(pady=20)

# Create notebook for tabs (hidden until login)
notebook = ttk.Notebook(root)
# Don't pack it yet - it will be shown after login

# ==================== TAB 1: JobApplicant ====================
tab_applicant = Frame(notebook)
notebook.add(tab_applicant, text="Job Applicant")
tab_applicant.columnconfigure(0, weight=1)

# Insert area
frm_ins = LabelFrame(tab_applicant, text="Insert into JobApplicant")
frm_ins.grid(row=0, column=0, padx=12, pady=8, sticky="ew")
frm_ins.columnconfigure(1, weight=1)

Label(frm_ins, text="First Name:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_first = Entry(frm_ins, width=32)
entry_first.grid(row=0, column=1, padx=6, pady=6)

Label(frm_ins, text="Last Name:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_last = Entry(frm_ins, width=32)
entry_last.grid(row=1, column=1, padx=6, pady=6)

Label(frm_ins, text="Email:").grid(row=2, column=0, padx=6, pady=6, sticky="e")
entry_email = Entry(frm_ins, width=32)
entry_email.grid(row=2, column=1, padx=6, pady=6)

Label(frm_ins, text="Phone:").grid(row=3, column=0, padx=6, pady=6, sticky="e")
entry_phone = Entry(frm_ins, width=32)
entry_phone.grid(row=3, column=1, padx=6, pady=6)

btn_insert_applicant = Button(frm_ins, text="INSERT APPLICANT", command=insert_applicant, width=32)
btn_insert_applicant.grid(row=4, column=0, columnspan=2, padx=6, pady=10)

# Delete area
frm_del = LabelFrame(tab_applicant, text="Delete from JobApplicant")
frm_del.grid(row=1, column=0, padx=12, pady=8, sticky="ew")
frm_del.columnconfigure(1, weight=1)

Label(frm_del, text="ApplicantID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_id = Entry(frm_del, width=32)
entry_id.grid(row=0, column=1, padx=6, pady=6)

btn_delete_applicant = Button(frm_del, text="DELETE APPLICANT", command=delete_applicant, width=32)
btn_delete_applicant.grid(row=1, column=0, columnspan=2, padx=6, pady=10)

# Status
label_msg = Label(tab_applicant, text="", fg="green")
label_msg.grid(row=2, column=0, padx=12, pady=(0,12))

# ==================== TAB 2: CandidateProfile ====================
tab_profile = Frame(notebook)
notebook.add(tab_profile, text="Candidate Profile")
tab_profile.columnconfigure(0, weight=1)

# Create Profile
frm_create = LabelFrame(tab_profile, text="Create CandidateProfile")
frm_create.grid(row=0, column=0, padx=12, pady=8, sticky="ew")
frm_create.columnconfigure(1, weight=1)

Label(frm_create, text="ApplicantID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_cp_applicant_id = Entry(frm_create, width=32)
entry_cp_applicant_id.grid(row=0, column=1, padx=6, pady=6)

Label(frm_create, text="Location:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_cp_location = Entry(frm_create, width=32)
entry_cp_location.grid(row=1, column=1, padx=6, pady=6)

Label(frm_create, text="LinkedIn URL:").grid(row=2, column=0, padx=6, pady=6, sticky="e")
entry_cp_linkedin = Entry(frm_create, width=32)
entry_cp_linkedin.grid(row=2, column=1, padx=6, pady=6)

Label(frm_create, text="Portfolio URL:").grid(row=3, column=0, padx=6, pady=6, sticky="e")
entry_cp_portfolio = Entry(frm_create, width=32)
entry_cp_portfolio.grid(row=3, column=1, padx=6, pady=6)

Label(frm_create, text="Summary:").grid(row=4, column=0, padx=6, pady=6, sticky="ne")
text_cp_summary = Text(frm_create, width=32, height=4)
text_cp_summary.grid(row=4, column=1, padx=6, pady=6)

btn_create_profile = Button(frm_create, text="CREATE PROFILE", command=create_candidate_profile, width=32)
btn_create_profile.grid(row=5, column=0, columnspan=2, padx=6, pady=10)

# Read/Search Profile
frm_read = LabelFrame(tab_profile, text="View CandidateProfile")
frm_read.grid(row=1, column=0, padx=12, pady=8, sticky="ew")
frm_read.columnconfigure(1, weight=1)

Label(frm_read, text="Search By:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
cp_search_by = StringVar(value="ProfileID")
frm_radio = Frame(frm_read)
frm_radio.grid(row=0, column=1, padx=6, pady=6, sticky="w")
Radiobutton(frm_radio, text="ProfileID", variable=cp_search_by, value="ProfileID").pack(side=LEFT)
Radiobutton(frm_radio, text="ApplicantID", variable=cp_search_by, value="ApplicantID").pack(side=LEFT)

Label(frm_read, text="ID:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_cp_search = Entry(frm_read, width=32)
entry_cp_search.grid(row=1, column=1, padx=6, pady=6)

btn_search_profile = Button(frm_read, text="SEARCH PROFILE", command=read_candidate_profile, width=32)
btn_search_profile.grid(row=2, column=0, columnspan=2, padx=6, pady=10)

Label(frm_read, text="Result:").grid(row=3, column=0, padx=6, pady=6, sticky="ne")
text_cp_result = Text(frm_read, width=32, height=6, state=DISABLED)
text_cp_result.grid(row=3, column=1, padx=6, pady=6)

# Update Profile
frm_update = LabelFrame(tab_profile, text="Update CandidateProfile")
frm_update.grid(row=2, column=0, padx=12, pady=8, sticky="ew")
frm_update.columnconfigure(1, weight=1)

Label(frm_update, text="ProfileID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_cp_update_id = Entry(frm_update, width=32)
entry_cp_update_id.grid(row=0, column=1, padx=6, pady=6)

Label(frm_update, text="Location:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_cp_update_location = Entry(frm_update, width=32)
entry_cp_update_location.grid(row=1, column=1, padx=6, pady=6)

Label(frm_update, text="LinkedIn URL:").grid(row=2, column=0, padx=6, pady=6, sticky="e")
entry_cp_update_linkedin = Entry(frm_update, width=32)
entry_cp_update_linkedin.grid(row=2, column=1, padx=6, pady=6)

Label(frm_update, text="Portfolio URL:").grid(row=3, column=0, padx=6, pady=6, sticky="e")
entry_cp_update_portfolio = Entry(frm_update, width=32)
entry_cp_update_portfolio.grid(row=3, column=1, padx=6, pady=6)

Label(frm_update, text="Summary:").grid(row=4, column=0, padx=6, pady=6, sticky="ne")
text_cp_update_summary = Text(frm_update, width=32, height=4)
text_cp_update_summary.grid(row=4, column=1, padx=6, pady=6)

btn_update_profile = Button(frm_update, text="UPDATE PROFILE", command=update_candidate_profile, width=32)
btn_update_profile.grid(row=5, column=0, columnspan=2, padx=6, pady=10)

# Delete Profile
frm_cp_del = LabelFrame(tab_profile, text="Delete CandidateProfile")
frm_cp_del.grid(row=3, column=0, padx=12, pady=8, sticky="ew")
frm_cp_del.columnconfigure(1, weight=1)

Label(frm_cp_del, text="ProfileID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_cp_delete_id = Entry(frm_cp_del, width=32)
entry_cp_delete_id.grid(row=0, column=1, padx=6, pady=6)

btn_delete_profile = Button(frm_cp_del, text="DELETE PROFILE", command=delete_candidate_profile, width=32)
btn_delete_profile.grid(row=1, column=0, columnspan=2, padx=6, pady=10)

# Status
label_cp_msg = Label(tab_profile, text="", fg="green")
label_cp_msg.grid(row=4, column=0, padx=12, pady=(0,12))

# ==================== TAB 3: JobPosting ====================
tab_job = Frame(notebook)
notebook.add(tab_job, text="Job Posting")
tab_job.columnconfigure(0, weight=1)

# Create Job Posting
frm_jp_create = LabelFrame(tab_job, text="Create JobPosting")
frm_jp_create.grid(row=0, column=0, padx=12, pady=8, sticky="ew")
frm_jp_create.columnconfigure(1, weight=1)

Label(frm_jp_create, text="RecruiterID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_jp_recruiter_id = Entry(frm_jp_create, width=32)
entry_jp_recruiter_id.grid(row=0, column=1, padx=6, pady=6)

Label(frm_jp_create, text="Job Title:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_jp_title = Entry(frm_jp_create, width=32)
entry_jp_title.grid(row=1, column=1, padx=6, pady=6)

Label(frm_jp_create, text="Department:").grid(row=2, column=0, padx=6, pady=6, sticky="e")
entry_jp_department = Entry(frm_jp_create, width=32)
entry_jp_department.grid(row=2, column=1, padx=6, pady=6)

Label(frm_jp_create, text="Location:").grid(row=3, column=0, padx=6, pady=6, sticky="e")
entry_jp_location = Entry(frm_jp_create, width=32)
entry_jp_location.grid(row=3, column=1, padx=6, pady=6)

Label(frm_jp_create, text="Employment Type:").grid(row=4, column=0, padx=6, pady=6, sticky="e")
jp_employment_type = StringVar(value="Full-time")
frm_jp_emp_type = Frame(frm_jp_create)
frm_jp_emp_type.grid(row=4, column=1, padx=6, pady=6, sticky="w")
Radiobutton(frm_jp_emp_type, text="Full-time", variable=jp_employment_type, value="Full-time").pack(side=LEFT)
Radiobutton(frm_jp_emp_type, text="Part-time", variable=jp_employment_type, value="Part-time").pack(side=LEFT)
Radiobutton(frm_jp_emp_type, text="Intern", variable=jp_employment_type, value="Intern").pack(side=LEFT)
Radiobutton(frm_jp_emp_type, text="Contract", variable=jp_employment_type, value="Contract").pack(side=LEFT)

Label(frm_jp_create, text="Posted Date (YYYY-MM-DD):").grid(row=5, column=0, padx=6, pady=6, sticky="e")
entry_jp_posted_date = Entry(frm_jp_create, width=32)
entry_jp_posted_date.grid(row=5, column=1, padx=6, pady=6)

Label(frm_jp_create, text="Status:").grid(row=6, column=0, padx=6, pady=6, sticky="e")
jp_status = StringVar(value="Open")
frm_jp_status = Frame(frm_jp_create)
frm_jp_status.grid(row=6, column=1, padx=6, pady=6, sticky="w")
Radiobutton(frm_jp_status, text="Open", variable=jp_status, value="Open").pack(side=LEFT)
Radiobutton(frm_jp_status, text="Closed", variable=jp_status, value="Closed").pack(side=LEFT)
Radiobutton(frm_jp_status, text="On Hold", variable=jp_status, value="On Hold").pack(side=LEFT)

btn_create_job = Button(frm_jp_create, text="CREATE JOB POSTING", command=create_job_posting, width=32)
btn_create_job.grid(row=7, column=0, columnspan=2, padx=6, pady=10)

# Read/Search Job Posting
frm_jp_read = LabelFrame(tab_job, text="View JobPosting")
frm_jp_read.grid(row=1, column=0, padx=12, pady=8, sticky="ew")
frm_jp_read.columnconfigure(1, weight=1)

Label(frm_jp_read, text="Search By:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
jp_search_by = StringVar(value="JobID")
frm_jp_radio = Frame(frm_jp_read)
frm_jp_radio.grid(row=0, column=1, padx=6, pady=6, sticky="w")
Radiobutton(frm_jp_radio, text="JobID", variable=jp_search_by, value="JobID").pack(side=LEFT)
Radiobutton(frm_jp_radio, text="RecruiterID", variable=jp_search_by, value="RecruiterID").pack(side=LEFT)

Label(frm_jp_read, text="ID:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_jp_search = Entry(frm_jp_read, width=32)
entry_jp_search.grid(row=1, column=1, padx=6, pady=6)

btn_search_job = Button(frm_jp_read, text="SEARCH JOB POSTING", command=read_job_posting, width=32)
btn_search_job.grid(row=2, column=0, columnspan=2, padx=6, pady=10)

Label(frm_jp_read, text="Result:").grid(row=3, column=0, padx=6, pady=6, sticky="ne")
text_jp_result = Text(frm_jp_read, width=32, height=8, state=DISABLED)
text_jp_result.grid(row=3, column=1, padx=6, pady=6)

# Update Job Posting
frm_jp_update = LabelFrame(tab_job, text="Update JobPosting")
frm_jp_update.grid(row=2, column=0, padx=12, pady=8, sticky="ew")
frm_jp_update.columnconfigure(1, weight=1)

Label(frm_jp_update, text="JobID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_jp_update_id = Entry(frm_jp_update, width=32)
entry_jp_update_id.grid(row=0, column=1, padx=6, pady=6)

Label(frm_jp_update, text="Job Title:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_jp_update_title = Entry(frm_jp_update, width=32)
entry_jp_update_title.grid(row=1, column=1, padx=6, pady=6)

Label(frm_jp_update, text="Department:").grid(row=2, column=0, padx=6, pady=6, sticky="e")
entry_jp_update_department = Entry(frm_jp_update, width=32)
entry_jp_update_department.grid(row=2, column=1, padx=6, pady=6)

Label(frm_jp_update, text="Location:").grid(row=3, column=0, padx=6, pady=6, sticky="e")
entry_jp_update_location = Entry(frm_jp_update, width=32)
entry_jp_update_location.grid(row=3, column=1, padx=6, pady=6)

Label(frm_jp_update, text="Employment Type:").grid(row=4, column=0, padx=6, pady=6, sticky="e")
jp_update_employment_type = StringVar(value="Full-time")
frm_jp_update_emp_type = Frame(frm_jp_update)
frm_jp_update_emp_type.grid(row=4, column=1, padx=6, pady=6, sticky="w")
Radiobutton(frm_jp_update_emp_type, text="Full-time", variable=jp_update_employment_type, value="Full-time").pack(side=LEFT)
Radiobutton(frm_jp_update_emp_type, text="Part-time", variable=jp_update_employment_type, value="Part-time").pack(side=LEFT)
Radiobutton(frm_jp_update_emp_type, text="Intern", variable=jp_update_employment_type, value="Intern").pack(side=LEFT)
Radiobutton(frm_jp_update_emp_type, text="Contract", variable=jp_update_employment_type, value="Contract").pack(side=LEFT)

Label(frm_jp_update, text="Posted Date (YYYY-MM-DD):").grid(row=5, column=0, padx=6, pady=6, sticky="e")
entry_jp_update_posted_date = Entry(frm_jp_update, width=32)
entry_jp_update_posted_date.grid(row=5, column=1, padx=6, pady=6)

Label(frm_jp_update, text="Status:").grid(row=6, column=0, padx=6, pady=6, sticky="e")
jp_update_status = StringVar(value="Open")
frm_jp_update_status = Frame(frm_jp_update)
frm_jp_update_status.grid(row=6, column=1, padx=6, pady=6, sticky="w")
Radiobutton(frm_jp_update_status, text="Open", variable=jp_update_status, value="Open").pack(side=LEFT)
Radiobutton(frm_jp_update_status, text="Closed", variable=jp_update_status, value="Closed").pack(side=LEFT)
Radiobutton(frm_jp_update_status, text="On Hold", variable=jp_update_status, value="On Hold").pack(side=LEFT)

btn_update_job = Button(frm_jp_update, text="UPDATE JOB POSTING", command=update_job_posting, width=32)
btn_update_job.grid(row=7, column=0, columnspan=2, padx=6, pady=10)

# Delete Job Posting
frm_jp_del = LabelFrame(tab_job, text="Delete JobPosting")
frm_jp_del.grid(row=3, column=0, padx=12, pady=8, sticky="ew")
frm_jp_del.columnconfigure(1, weight=1)

Label(frm_jp_del, text="JobID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_jp_delete_id = Entry(frm_jp_del, width=32)
entry_jp_delete_id.grid(row=0, column=1, padx=6, pady=6)

btn_delete_job = Button(frm_jp_del, text="DELETE JOB POSTING", command=delete_job_posting, width=32)
btn_delete_job.grid(row=1, column=0, columnspan=2, padx=6, pady=10)

# ==================== APPLICANT-SPECIFIC SECTIONS ====================
# Browse Open Jobs (for applicants)
frm_jp_browse = LabelFrame(tab_job, text="Browse Open Jobs")
frm_jp_browse.grid(row=4, column=0, padx=12, pady=8, sticky="ew")
frm_jp_browse.columnconfigure(0, weight=1)

btn_browse_jobs = Button(frm_jp_browse, text="BROWSE ALL OPEN JOBS", command=browse_open_jobs, width=32)
btn_browse_jobs.grid(row=0, column=0, padx=6, pady=10)

# Apply to Job (for applicants)
frm_jp_apply = LabelFrame(tab_job, text="Apply to Job")
frm_jp_apply.grid(row=5, column=0, padx=12, pady=8, sticky="ew")
frm_jp_apply.columnconfigure(1, weight=1)

Label(frm_jp_apply, text="JobID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_jp_apply_job_id = Entry(frm_jp_apply, width=32)
entry_jp_apply_job_id.grid(row=0, column=1, padx=6, pady=6)

Label(frm_jp_apply, text="Your ApplicantID:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_jp_apply_applicant_id = Entry(frm_jp_apply, width=32)
entry_jp_apply_applicant_id.grid(row=1, column=1, padx=6, pady=6)

btn_apply_job = Button(frm_jp_apply, text="APPLY TO JOB", command=apply_to_job, width=32)
btn_apply_job.grid(row=2, column=0, columnspan=2, padx=6, pady=10)

# View My Applications (for applicants)
frm_jp_view_apps = LabelFrame(tab_job, text="View My Applications")
frm_jp_view_apps.grid(row=6, column=0, padx=12, pady=8, sticky="ew")
frm_jp_view_apps.columnconfigure(1, weight=1)

Label(frm_jp_view_apps, text="Your ApplicantID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_jp_view_applicant_id = Entry(frm_jp_view_apps, width=32)
entry_jp_view_applicant_id.grid(row=0, column=1, padx=6, pady=6)

btn_view_applications = Button(frm_jp_view_apps, text="VIEW MY APPLICATIONS", command=view_my_applications, width=32)
btn_view_applications.grid(row=1, column=0, columnspan=2, padx=6, pady=10)

# Status
label_jp_msg = Label(tab_job, text="", fg="green")
label_jp_msg.grid(row=7, column=0, padx=12, pady=(0,12))

# ==================== TAB 4: Authentication ====================
tab_auth = Frame(notebook)
notebook.add(tab_auth, text="Authentication")
tab_auth.columnconfigure(0, weight=1)

# Status display
frm_auth_status = LabelFrame(tab_auth, text="Current Session")
frm_auth_status.grid(row=0, column=0, padx=12, pady=8, sticky="ew")
frm_auth_status.columnconfigure(0, weight=1)

label_auth_status = Label(frm_auth_status, text="Not logged in", fg="red", font=("Arial", 10))
label_auth_status.grid(row=0, column=0, padx=12, pady=12)

# Change Password
frm_change_pass = LabelFrame(tab_auth, text="Change Password")
frm_change_pass.grid(row=1, column=0, padx=12, pady=8, sticky="ew")

btn_change_pass = Button(frm_change_pass, text="Change Password", command=show_change_password_window, width=30)
btn_change_pass.grid(row=0, column=0, padx=12, pady=12)
btn_change_pass.config(state=DISABLED)

# Create Admin (only for admins)
frm_create_admin = LabelFrame(tab_auth, text="Admin Functions")
frm_create_admin.grid(row=2, column=0, padx=12, pady=8, sticky="ew")

btn_create_admin = Button(frm_create_admin, text="Create New Admin", command=show_create_admin_window, width=30)
btn_create_admin.grid(row=0, column=0, padx=12, pady=12)
btn_create_admin.config(state=DISABLED)

# Logout
frm_logout = LabelFrame(tab_auth, text="Session Management")
frm_logout.grid(row=3, column=0, padx=12, pady=8, sticky="ew")

btn_logout = Button(frm_logout, text="Logout", command=do_logout, width=30, bg="#ff6b6b", fg="white")
btn_logout.grid(row=0, column=0, padx=12, pady=12)
btn_logout.config(state=DISABLED)

# Initialize: Show login window on startup
root.after(100, show_login_window)

root.mainloop()
