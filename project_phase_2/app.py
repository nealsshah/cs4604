import re
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

def connect_db():
    try:
        return mc.connect(**DB_CONFIG)
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Could not connect:\n{e}")
        return None

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
    education = entry_cp_education.get().strip()
    experience = entry_cp_experience.get().strip()
    resume = entry_cp_resume.get().strip()

    if not applicant_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric ApplicantID.")
        return
    if not education or not experience:
        messagebox.showwarning("Missing data", "Education and Experience are required.")
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
            INSERT INTO CandidateProfile (ApplicantID, Education, Experience, Resume)
            VALUES (%s, %s, %s, %s)
        """, (applicant_id, education, experience, resume))
        conn.commit()
        new_id = cur.lastrowid
        messagebox.showinfo("Success", f"Created CandidateProfile with CandidateID={new_id}")
        for e in (entry_cp_applicant_id, entry_cp_education, entry_cp_experience, entry_cp_resume):
            e.delete(0, END)
        label_cp_msg.config(text=f"Created CandidateID {new_id}", fg="green")
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
        messagebox.showwarning("Bad ID", "Enter a numeric CandidateID or ApplicantID.")
        return

    search_by = cp_search_by.get()
    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        if search_by == "CandidateID":
            cur.execute("""
                SELECT CandidateID, ApplicantID, Education, Experience, Resume 
                FROM CandidateProfile WHERE CandidateID=%s
            """, (search_val,))
        else:  # ApplicantID
            cur.execute("""
                SELECT CandidateID, ApplicantID, Education, Experience, Resume 
                FROM CandidateProfile WHERE ApplicantID=%s
            """, (search_val,))
        
        row = cur.fetchone()
        if row:
            result = f"CandidateID: {row[0]}\nApplicantID: {row[1]}\nEducation: {row[2]}\nExperience: {row[3]}\nResume: {row[4]}"
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
    candidate_id = entry_cp_update_id.get().strip()
    education = entry_cp_update_education.get().strip()
    experience = entry_cp_update_experience.get().strip()
    resume = entry_cp_update_resume.get().strip()

    if not candidate_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric CandidateID.")
        return
    if not education or not experience:
        messagebox.showwarning("Missing data", "Education and Experience are required.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE CandidateProfile 
            SET Education=%s, Experience=%s, Resume=%s 
            WHERE CandidateID=%s
        """, (education, experience, resume, candidate_id))
        conn.commit()
        if cur.rowcount == 0:
            messagebox.showinfo("Info", f"No profile with CandidateID={candidate_id}")
            label_cp_msg.config(text=f"CandidateID {candidate_id} not found", fg="orange")
        else:
            messagebox.showinfo("Success", f"Updated CandidateID={candidate_id}")
            label_cp_msg.config(text=f"Updated CandidateID {candidate_id}", fg="green")
            for e in (entry_cp_update_id, entry_cp_update_education, entry_cp_update_experience, entry_cp_update_resume):
                e.delete(0, END)
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Update failed:\n{e}")
        label_cp_msg.config(text="Update failed", fg="red")
    finally:
        conn.close()

def delete_candidate_profile():
    candidate_id = entry_cp_delete_id.get().strip()
    if not candidate_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric CandidateID.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("DELETE FROM CandidateProfile WHERE CandidateID=%s", (candidate_id,))
        conn.commit()
        if cur.rowcount == 0:
            messagebox.showinfo("Info", f"No profile with CandidateID={candidate_id}")
            label_cp_msg.config(text=f"CandidateID {candidate_id} not found", fg="orange")
        else:
            messagebox.showinfo("Success", f"Deleted CandidateID={candidate_id}")
            label_cp_msg.config(text=f"Deleted CandidateID {candidate_id}", fg="green")
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
    description = text_jp_description.get("1.0", END).strip()
    requirements = text_jp_requirements.get("1.0", END).strip()

    if not recruiter_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric RecruiterID.")
        return
    if not title:
        messagebox.showwarning("Missing data", "Job Title is required.")
        return
    if not description or not requirements:
        messagebox.showwarning("Missing data", "Description and Requirements are required.")
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
            INSERT INTO JobPosting (RecruiterID, Title, Description, Requirements)
            VALUES (%s, %s, %s, %s)
        """, (recruiter_id, title, description, requirements))
        conn.commit()
        new_id = cur.lastrowid
        messagebox.showinfo("Success", f"Created JobPosting with JobID={new_id}")
        entry_jp_recruiter_id.delete(0, END)
        entry_jp_title.delete(0, END)
        text_jp_description.delete("1.0", END)
        text_jp_requirements.delete("1.0", END)
        label_jp_msg.config(text=f"Created JobID {new_id}", fg="green")
    except mc.Error as e:
        messagebox.showerror("DB Error", f"Insert failed:\n{e}")
        label_jp_msg.config(text="Insert failed", fg="red")
    finally:
        conn.close()

def read_job_posting():
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
                SELECT JobID, RecruiterID, Title, Description, Requirements 
                FROM JobPosting WHERE JobID=%s
            """, (search_val,))
        else:  # RecruiterID
            cur.execute("""
                SELECT JobID, RecruiterID, Title, Description, Requirements 
                FROM JobPosting WHERE RecruiterID=%s
            """, (search_val,))
        
        rows = cur.fetchall()
        if rows:
            result = ""
            for row in rows:
                result += f"JobID: {row[0]}\nRecruiterID: {row[1]}\nTitle: {row[2]}\n"
                result += f"Description: {row[3]}\nRequirements: {row[4]}\n"
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
    description = text_jp_update_description.get("1.0", END).strip()
    requirements = text_jp_update_requirements.get("1.0", END).strip()

    if not job_id.isdigit():
        messagebox.showwarning("Bad ID", "Enter a numeric JobID.")
        return
    if not title:
        messagebox.showwarning("Missing data", "Job Title is required.")
        return
    if not description or not requirements:
        messagebox.showwarning("Missing data", "Description and Requirements are required.")
        return

    conn = connect_db()
    if not conn: return
    try:
        cur = conn.cursor()
        cur.execute("""
            UPDATE JobPosting 
            SET Title=%s, Description=%s, Requirements=%s 
            WHERE JobID=%s
        """, (title, description, requirements, job_id))
        conn.commit()
        if cur.rowcount == 0:
            messagebox.showinfo("Info", f"No job posting with JobID={job_id}")
            label_jp_msg.config(text=f"JobID {job_id} not found", fg="orange")
        else:
            messagebox.showinfo("Success", f"Updated JobID={job_id}")
            label_jp_msg.config(text=f"Updated JobID {job_id}", fg="green")
            entry_jp_update_id.delete(0, END)
            entry_jp_update_title.delete(0, END)
            text_jp_update_description.delete("1.0", END)
            text_jp_update_requirements.delete("1.0", END)
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

# ==================== GUI ====================
root = Tk()
root.title("CS4604 Phase 2 - Job Application System")
root.resizable(False, False)

# Create notebook for tabs
notebook = ttk.Notebook(root)
notebook.pack(padx=10, pady=10, fill=BOTH, expand=True)

# ==================== TAB 1: JobApplicant ====================
tab_applicant = Frame(notebook)
notebook.add(tab_applicant, text="Job Applicant")

# Insert area
frm_ins = LabelFrame(tab_applicant, text="Insert into JobApplicant")
frm_ins.grid(row=0, column=0, padx=12, pady=8, sticky="ew")

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

Button(frm_ins, text="INSERT APPLICANT", command=insert_applicant, width=32)\
    .grid(row=4, column=0, columnspan=2, padx=6, pady=10)

# Delete area
frm_del = LabelFrame(tab_applicant, text="Delete from JobApplicant")
frm_del.grid(row=1, column=0, padx=12, pady=8, sticky="ew")

Label(frm_del, text="ApplicantID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_id = Entry(frm_del, width=32)
entry_id.grid(row=0, column=1, padx=6, pady=6)

Button(frm_del, text="DELETE APPLICANT", command=delete_applicant, width=32)\
    .grid(row=1, column=0, columnspan=2, padx=6, pady=10)

# Status
label_msg = Label(tab_applicant, text="", fg="green")
label_msg.grid(row=2, column=0, padx=12, pady=(0,12))

# ==================== TAB 2: CandidateProfile ====================
tab_profile = Frame(notebook)
notebook.add(tab_profile, text="Candidate Profile")

# Create Profile
frm_create = LabelFrame(tab_profile, text="Create CandidateProfile")
frm_create.grid(row=0, column=0, padx=12, pady=8, sticky="ew")

Label(frm_create, text="ApplicantID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_cp_applicant_id = Entry(frm_create, width=32)
entry_cp_applicant_id.grid(row=0, column=1, padx=6, pady=6)

Label(frm_create, text="Education:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_cp_education = Entry(frm_create, width=32)
entry_cp_education.grid(row=1, column=1, padx=6, pady=6)

Label(frm_create, text="Experience:").grid(row=2, column=0, padx=6, pady=6, sticky="e")
entry_cp_experience = Entry(frm_create, width=32)
entry_cp_experience.grid(row=2, column=1, padx=6, pady=6)

Label(frm_create, text="Resume:").grid(row=3, column=0, padx=6, pady=6, sticky="e")
entry_cp_resume = Entry(frm_create, width=32, state=DISABLED, disabledforeground="gray")
entry_cp_resume.grid(row=3, column=1, padx=6, pady=6)

Button(frm_create, text="CREATE PROFILE", command=create_candidate_profile, width=32)\
    .grid(row=4, column=0, columnspan=2, padx=6, pady=10)

# Read/Search Profile
frm_read = LabelFrame(tab_profile, text="View CandidateProfile")
frm_read.grid(row=1, column=0, padx=12, pady=8, sticky="ew")

Label(frm_read, text="Search By:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
cp_search_by = StringVar(value="CandidateID")
frm_radio = Frame(frm_read)
frm_radio.grid(row=0, column=1, padx=6, pady=6, sticky="w")
Radiobutton(frm_radio, text="CandidateID", variable=cp_search_by, value="CandidateID").pack(side=LEFT)
Radiobutton(frm_radio, text="ApplicantID", variable=cp_search_by, value="ApplicantID").pack(side=LEFT)

Label(frm_read, text="ID:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_cp_search = Entry(frm_read, width=32)
entry_cp_search.grid(row=1, column=1, padx=6, pady=6)

Button(frm_read, text="SEARCH PROFILE", command=read_candidate_profile, width=32)\
    .grid(row=2, column=0, columnspan=2, padx=6, pady=10)

Label(frm_read, text="Result:").grid(row=3, column=0, padx=6, pady=6, sticky="ne")
text_cp_result = Text(frm_read, width=32, height=6, state=DISABLED)
text_cp_result.grid(row=3, column=1, padx=6, pady=6)

# Update Profile
frm_update = LabelFrame(tab_profile, text="Update CandidateProfile")
frm_update.grid(row=2, column=0, padx=12, pady=8, sticky="ew")

Label(frm_update, text="CandidateID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_cp_update_id = Entry(frm_update, width=32)
entry_cp_update_id.grid(row=0, column=1, padx=6, pady=6)

Label(frm_update, text="Education:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_cp_update_education = Entry(frm_update, width=32)
entry_cp_update_education.grid(row=1, column=1, padx=6, pady=6)

Label(frm_update, text="Experience:").grid(row=2, column=0, padx=6, pady=6, sticky="e")
entry_cp_update_experience = Entry(frm_update, width=32)
entry_cp_update_experience.grid(row=2, column=1, padx=6, pady=6)

Label(frm_update, text="Resume:").grid(row=3, column=0, padx=6, pady=6, sticky="e")
entry_cp_update_resume = Entry(frm_update, width=32, state=DISABLED, disabledforeground="gray")
entry_cp_update_resume.grid(row=3, column=1, padx=6, pady=6)

Button(frm_update, text="UPDATE PROFILE", command=update_candidate_profile, width=32)\
    .grid(row=4, column=0, columnspan=2, padx=6, pady=10)

# Delete Profile
frm_cp_del = LabelFrame(tab_profile, text="Delete CandidateProfile")
frm_cp_del.grid(row=3, column=0, padx=12, pady=8, sticky="ew")

Label(frm_cp_del, text="CandidateID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_cp_delete_id = Entry(frm_cp_del, width=32)
entry_cp_delete_id.grid(row=0, column=1, padx=6, pady=6)

Button(frm_cp_del, text="DELETE PROFILE", command=delete_candidate_profile, width=32)\
    .grid(row=1, column=0, columnspan=2, padx=6, pady=10)

# Status
label_cp_msg = Label(tab_profile, text="", fg="green")
label_cp_msg.grid(row=4, column=0, padx=12, pady=(0,12))

# ==================== TAB 3: JobPosting ====================
tab_job = Frame(notebook)
notebook.add(tab_job, text="Job Posting")

# Create Job Posting
frm_jp_create = LabelFrame(tab_job, text="Create JobPosting")
frm_jp_create.grid(row=0, column=0, padx=12, pady=8, sticky="ew")

Label(frm_jp_create, text="RecruiterID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_jp_recruiter_id = Entry(frm_jp_create, width=32)
entry_jp_recruiter_id.grid(row=0, column=1, padx=6, pady=6)

Label(frm_jp_create, text="Job Title:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_jp_title = Entry(frm_jp_create, width=32)
entry_jp_title.grid(row=1, column=1, padx=6, pady=6)

Label(frm_jp_create, text="Description:").grid(row=2, column=0, padx=6, pady=6, sticky="ne")
text_jp_description = Text(frm_jp_create, width=32, height=4)
text_jp_description.grid(row=2, column=1, padx=6, pady=6)

Label(frm_jp_create, text="Requirements:").grid(row=3, column=0, padx=6, pady=6, sticky="ne")
text_jp_requirements = Text(frm_jp_create, width=32, height=4)
text_jp_requirements.grid(row=3, column=1, padx=6, pady=6)

Button(frm_jp_create, text="CREATE JOB POSTING", command=create_job_posting, width=32)\
    .grid(row=4, column=0, columnspan=2, padx=6, pady=10)

# Read/Search Job Posting
frm_jp_read = LabelFrame(tab_job, text="View JobPosting")
frm_jp_read.grid(row=1, column=0, padx=12, pady=8, sticky="ew")

Label(frm_jp_read, text="Search By:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
jp_search_by = StringVar(value="JobID")
frm_jp_radio = Frame(frm_jp_read)
frm_jp_radio.grid(row=0, column=1, padx=6, pady=6, sticky="w")
Radiobutton(frm_jp_radio, text="JobID", variable=jp_search_by, value="JobID").pack(side=LEFT)
Radiobutton(frm_jp_radio, text="RecruiterID", variable=jp_search_by, value="RecruiterID").pack(side=LEFT)

Label(frm_jp_read, text="ID:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_jp_search = Entry(frm_jp_read, width=32)
entry_jp_search.grid(row=1, column=1, padx=6, pady=6)

Button(frm_jp_read, text="SEARCH JOB POSTING", command=read_job_posting, width=32)\
    .grid(row=2, column=0, columnspan=2, padx=6, pady=10)

Label(frm_jp_read, text="Result:").grid(row=3, column=0, padx=6, pady=6, sticky="ne")
text_jp_result = Text(frm_jp_read, width=32, height=8, state=DISABLED)
text_jp_result.grid(row=3, column=1, padx=6, pady=6)

# Update Job Posting
frm_jp_update = LabelFrame(tab_job, text="Update JobPosting")
frm_jp_update.grid(row=2, column=0, padx=12, pady=8, sticky="ew")

Label(frm_jp_update, text="JobID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_jp_update_id = Entry(frm_jp_update, width=32)
entry_jp_update_id.grid(row=0, column=1, padx=6, pady=6)

Label(frm_jp_update, text="Job Title:").grid(row=1, column=0, padx=6, pady=6, sticky="e")
entry_jp_update_title = Entry(frm_jp_update, width=32)
entry_jp_update_title.grid(row=1, column=1, padx=6, pady=6)

Label(frm_jp_update, text="Description:").grid(row=2, column=0, padx=6, pady=6, sticky="ne")
text_jp_update_description = Text(frm_jp_update, width=32, height=4)
text_jp_update_description.grid(row=2, column=1, padx=6, pady=6)

Label(frm_jp_update, text="Requirements:").grid(row=3, column=0, padx=6, pady=6, sticky="ne")
text_jp_update_requirements = Text(frm_jp_update, width=32, height=4)
text_jp_update_requirements.grid(row=3, column=1, padx=6, pady=6)

Button(frm_jp_update, text="UPDATE JOB POSTING", command=update_job_posting, width=32)\
    .grid(row=4, column=0, columnspan=2, padx=6, pady=10)

# Delete Job Posting
frm_jp_del = LabelFrame(tab_job, text="Delete JobPosting")
frm_jp_del.grid(row=3, column=0, padx=12, pady=8, sticky="ew")

Label(frm_jp_del, text="JobID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_jp_delete_id = Entry(frm_jp_del, width=32)
entry_jp_delete_id.grid(row=0, column=1, padx=6, pady=6)

Button(frm_jp_del, text="DELETE JOB POSTING", command=delete_job_posting, width=32)\
    .grid(row=1, column=0, columnspan=2, padx=6, pady=10)

# Status
label_jp_msg = Label(tab_job, text="", fg="green")
label_jp_msg.grid(row=4, column=0, padx=12, pady=(0,12))

root.mainloop()
