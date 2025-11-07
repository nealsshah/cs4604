# cs4604

Relational schema: 

JobApplicant
PK: ApplicantID
Name
Phone
Email

ApplicationForm
PK: ApplicationID
FK: ApplicantID
FK: JobID
DateApplied
Status

CandidateProfile
PK: CandidateID
FK: ApplicantID
Education
Experience
Resume

PK: ResumeID
FK: ApplicantID
FilePath

InterviewSchedule
PK: InterviewID
FK: ApplicationID
DateTime

StatusUpdate
PK: UpdateID
FK: ApplicantID
Message

Recruiter
PK: RecruiterID
Name
Email
Interviewer

PK: InterviewerID
Name
Department

JobPosting
PK: JobID
FK: RecruiterID
Title
Description
Requirements

FeedbackForm
PK: FeedbackID
FK: InterviewID
FK: InterviewerID
Rating
Comments

Relationships Summary

Each JobApplicant can have:
One or more ApplicationForms
One CandidateProfile
One Resume
Multiple StatusUpdates

Each ApplicationForm is associated with:
One JobPosting
One InterviewSchedule

Each JobPosting is created by a Recruiter

Each InterviewSchedule can have one FeedbackForm

Each FeedbackForm links an Interview and an Interviewer