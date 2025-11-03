import re
import mysql.connector as mc
from tkinter import *
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

# GUI
root = Tk()
root.title("CS4604 Phase 2 - Insert/Delete GUI")
root.resizable(False, False)

# Insert area
frm_ins = LabelFrame(root, text="Insert into JobApplicant")
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
frm_del = LabelFrame(root, text="Delete from JobApplicant")
frm_del.grid(row=1, column=0, padx=12, pady=8, sticky="ew")

Label(frm_del, text="ApplicantID:").grid(row=0, column=0, padx=6, pady=6, sticky="e")
entry_id = Entry(frm_del, width=32)
entry_id.grid(row=0, column=1, padx=6, pady=6)

Button(frm_del, text="DELETE APPLICANT", command=delete_applicant, width=32)\
    .grid(row=1, column=0, columnspan=2, padx=6, pady=10)

# Status
label_msg = Label(root, text="", fg="green")
label_msg.grid(row=2, column=0, padx=12, pady=(0,12))

root.mainloop()
