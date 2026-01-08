Product Requirements Document (PRD)
Project Name: IBBE Operational Mandate Domain: ops.ibbe.in Tech Stack: Next.js (App Router), Supabase (Auth, DB, Storage, Edge Functions, Realtime), Tailwind CSS. Target Audience: IBBE Leadership (Admins) and Employees.

1. Executive Summary
The IBBE Operational Mandate is a high-stakes, internal operational platform designed to enforce strict accountability. It moves beyond standard project management by integrating financial consequences ("Blue Pages") and strict responsiveness protocols (2-hour rule). The system is built for mobile-first responsiveness, functioning like a native application to ensure employees are connected at all times.

2. User Flows
A. The Admin Journey (You)
Goal: Total oversight, task assignment, and compliance enforcement.

Access: Admin navigates to ops.ibbe.in/admin.

Login: Authenticates via secure email/password (or magic link) with 2FA enabled.

Dashboard (The Command Center):

Overview: Sees a bird's-eye view of all Active Employees, Pending Approvals, and Total Penalties collected.

Pending Queue: Reviews a list of new sign-ups. Clicks "Review" on a candidate to see their Live Photo, uploaded ID card, and details.

Action: Clicks "Approve" (generates slug/access) or "Reject".

Active Directory: Views grid of employees. Can search by name or ID.

Action: Clicks "Pause Account" to instantly revoke access. The employee session is terminated immediately.

Action: Clicks "Export Data" to download a ZIP of all user documents and logs.

Task Management:

Selects an employee.

Clicks "Mandate New Task."

Fills: Title, Detailed Description, Deadline (Date & Time), and Uploads Reference Documents (PDF/Images).

Result: Task appears instantly on the employee's board.

Monitoring & Communication:

Clicks on an active task to view the "War Room" (Task Details + Chat).

Posts a comment/query. The system timestamp is logged.

If the employee replies, the 2-hour timer resets.

If the Blue Page trigger fires (deadline missed), the Admin gets a notification.

Logout: Secure session termination.

B. The Employee Journey (The Candidate)
Goal: Execution, reporting, and compliance.

Onboarding (The Gate):

Navigates to ops.ibbe.in.

Registration Form: Enters Full Name, Email, Employee ID.

Identity Verification:

Live Capture: Browser requests camera access. User must take a live selfie. (Uploads prevented to ensure presence).

ID Upload: User uploads a clear scan of their Government or IBBE ID Card.

Submission: Clicks "Submit for Review."

Waiting Room: Redirected to a static "Pending Approval" screen. "Your access is currently being reviewed by Executive Leadership."

Access & Dashboard:

Once approved, they receive an email.

Login redirects them to ops.ibbe.in/dashboard/[employee-name]-[id].

Header: Shows Name, ID, and "Total Loss: ₹[Amount]" in red.

Main View: Toggle switch for List View vs. Kanban Board.

Task Execution:

Clicks a task card to open details.

Reads instructions and downloads Admin attachments.

Chat/Submission: Uses the comment box to upload proof of work (files) or reply to Admin queries.

Constraint: Must reply to Admin comments within 2 hours to avoid a "Compliance Warning."

Status Change: Moves task from "To Do" -> "In Progress" -> "Done."

The Penalty (Blue Page):

If a task is overdue at EOD, the dashboard flashes a notification.

A "Blue Page" PDF is generated and logged in the "Compliance" tab.

The "Total Loss" counter increases by ₹2,000.

3. Detailed Feature Logic
A. The "Blue Page" Logic (Financial Penalty)
Trigger: Supabase Cron Job runs daily (e.g., at 11:59 PM IST).

Condition: SELECT * FROM tasks WHERE status != 'Done' AND deadline < NOW().

Action:

Create entry in violations table.

Generate PDF (Contains: Task Name, Missed Deadline, Employee Details).

Upload PDF to Supabase Storage Bucket official-records.

Update Profile: total_penalty = total_penalty + 2000.

Email Notification sent to Employee & Admin.

B. The 2-Hour Responsiveness Rule
Trigger: Admin posts a comment on a task.

Logic:

Database stores last_admin_comment_at timestamp.

Supabase Edge Function checks every 15 minutes:

IF last_admin_comment_at is > 2 hours ago AND last_employee_reply_at is < last_admin_comment_at.

THEN: Flag as "Non-Responsive."

Consequence: A "Yellow Warning" badge appears on the task and dashboard. Email alert sent: "Immediate Response Required."

C. "On Hold" Protocol
Mechanism: Middleware in Next.js.

Check: On every route change, check auth.users metadata or profiles table for status.

Action: If status == 'on_hold', force redirect to /account-suspended.

UI: A stark, black screen with white text: "Administrative Hold. Contact HR."

4. Technical Architecture (Supabase & Next.js)
Database Schema (Supabase PostgreSQL)
1. profiles Table

id (UUID, PK) - Links to Auth.

employee_id (Text, Unique)

full_name (Text)

slug (Text, Unique) - e.g., rahul-sharma-102

photo_url (Text) - Live capture storage path.

id_card_url (Text) - Upload path.

status (Enum: pending, active, on_hold)

total_penalty (Integer) - Default 0.

role (Enum: admin, employee)

2. tasks Table

id (UUID, PK)

assigned_to (UUID, FK -> profiles.id)

title (Text)

description (Text)

attachment_urls (Array of Text)

deadline (Timestamptz)

status (Enum: todo, in_progress, done)

is_blue_paged (Boolean) - Default false.

3. comments Table

id (UUID, PK)

task_id (UUID, FK)

author_id (UUID, FK)

content (Text)

attachments (Array of Text)

created_at (Timestamptz)

4. violations Table

id (UUID, PK)

user_id (UUID, FK)

task_id (UUID, FK)

pdf_url (Text)

violation_type (Enum: deadline_missed, responsiveness)

penalty_amount (Integer) - e.g., 2000.

Security (RLS - Row Level Security)
Admin Policy: Select/Insert/Update/Delete on ALL tables.

Employee Policy:

Select on own profiles, assigned tasks, and related comments.

Update on own tasks (status only) and comments.

Strictly Forbidden: Deleting tasks or modifying total_penalty.

5. Mobile Optimization & Future React Native Prep
To ensure the web app feels "native" and is ready for a future port to React Native (Expo):

PWA (Progressive Web App): Configure manifest.json so users can "Add to Home Screen." This removes the browser address bar, giving a full-screen app experience.

Touch Targets: All buttons (Kanban toggle, Upload, Submit) must be at least 44x44px for easy thumb tapping.

API-First Design:

Build all logic in Supabase Edge Functions or Next.js API Routes (Server Actions).

Why: When you build the React Native app later, you simply connect the mobile UI to these same APIs. No backend rewrite needed.

Components: Use "dumb" UI components (buttons, cards) that receive data as props. This makes swapping HTML divs for React Native Views much faster. 

keep fonts, inter and jet brains mono  and use the favicon pack in the folder. 