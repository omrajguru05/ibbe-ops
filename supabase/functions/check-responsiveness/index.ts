import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const ZEPTO_URL = "https://api.zeptomail.in/v1.1/email"
const ZEPTO_TOKEN = Deno.env.get('ZEPTO_MAIL_TOKEN')
const FROM_EMAIL = Deno.env.get('ZEPTO_FROM_EMAIL')

Deno.serve(async (req) => {
    // 1. Get all tasks that are active (todo/in_progress)
    // We need to find tasks where:
    // - last_admin_comment_at IS NOT NULL
    // - last_admin_comment_at < (NOW - 2 HOURS)
    // - last_employee_reply_at < last_admin_comment_at OR last_employee_reply_at IS NULL

    // Simplification for MVP:
    // We will select tasks and join comments, or rely on a "last_interacted" logic if present.
    // The PRD mentions: "Database stores last_admin_comment_at timestamp."
    // I need to ensure the existing schema supports this or I will infer it from the 'comments' table.
    // Since I can't easily change schema on the fly without migrations, I'll calculate it from 'comments' table here.

    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
            id, title, assigned_to, status,
            profiles:assigned_to (email, full_name),
            comments (
                author_id, created_at,
                profiles:author_id (role)
            )
        `)
        .neq('status', 'done')

    if (error) return new Response(JSON.stringify({ error }), { status: 500 })

    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
    const flaggedTasks = []

    for (const task of tasks) {
        // Sort comments by date
        const comments = task.comments?.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) || []

        if (comments.length === 0) continue

        // Find last admin comment
        const adminComments = comments.filter(c => c.profiles.role === 'admin')
        if (adminComments.length === 0) continue

        const lastAdminComment = adminComments[adminComments.length - 1]
        const lastAdminTime = new Date(lastAdminComment.created_at)

        // If last admin comment was older than 2 hours, check for replies
        if (lastAdminTime < twoHoursAgo) {
            // Check for any employee reply AFTER the admin comment
            const employeeReplies = comments.filter(c =>
                c.profiles.role === 'employee' &&
                new Date(c.created_at) > lastAdminTime
            )

            if (employeeReplies.length === 0) {
                // VIOLATION: Non-Responsive
                flaggedTasks.push({ task: task.title, user: task.profiles.full_name })

                // Send Warning Email
                if (ZEPTO_TOKEN && FROM_EMAIL && task.profiles.email) {
                    await fetch(ZEPTO_URL, {
                        method: "POST",
                        headers: {
                            "Authorization": ZEPTO_TOKEN,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            "from": { "address": FROM_EMAIL, "name": "IBBE Command" },
                            "to": [{ "email_address": { "address": task.profiles.email, "name": task.profiles.full_name } }],
                            "subject": "⚠️ RESPONSIVENESS WARNING: Immediate Reply Required",
                            "htmlbody": `
                                <div style="font-family: sans-serif; background: #FFF3CD; color: #856404; padding: 20px; border: 2px solid #FFEEBA; border-radius: 10px;">
                                    <h2>NON-RESPONSIVE ALERT</h2>
                                    <p>More than 2 hours have passed since an Admin query on task: <strong>${task.title}</strong>.</p>
                                    <p>Protocol dictates an immediate response. Failure to reply may escalate to a Blue Page violation.</p>
                                    <a href="https://ops.ibbe.in" style="font-weight: bold;">GO TO DASHBOARD</a>
                                </div>
                            `
                        })
                    })
                }
            }
        }
    }

    return new Response(JSON.stringify({ flagged: flaggedTasks }), { headers: { 'Content-Type': 'application/json' } })
})
