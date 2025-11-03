import mysql.connector as mc

conn = mc.connect(
    host="localhost",
    user="jat_user",
    password="jat_pass_123",
    database="jat_db"
)
print("Connected OK:", conn.is_connected())

cur = conn.cursor()
cur.execute("SELECT COUNT(*) FROM JobApplicant;")
print("JobApplicant rows:", cur.fetchone()[0])
cur.close()
conn.close()