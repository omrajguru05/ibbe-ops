import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { PDFDocument, StandardFonts, rgb } from 'https://cdn.skypack.dev/pdf-lib'

const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

const ZEPTO_URL = "https://api.zeptomail.in/v1.1/email"
const ZEPTO_TOKEN = Deno.env.get('ZEPTO_MAIL_TOKEN')
const FROM_EMAIL = Deno.env.get('ZEPTO_FROM_EMAIL')

Deno.serve(async (req) => {
    // 1. Fetch overdue tasks
    const now = new Date().toISOString()
    const { data: tasks, error } = await supabase
        .from('tasks')
        .select(`
            id, title, assigned_to, deadline,
            profiles:assigned_to (email, full_name, employee_id)
        `)
        .neq('status', 'done')
        .lt('deadline', now)
        .eq('is_blue_paged', false)

    if (error) return new Response(JSON.stringify({ error }), { status: 500 })
    if (!tasks || tasks.length === 0) return new Response(JSON.stringify({ message: 'No overdue tasks' }), { status: 200 })

    const results = []

    for (const task of tasks) {
        // 2. Generate Real PDF
        const pdfDoc = await PDFDocument.create()
        const page = pdfDoc.addPage()
        const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

        page.drawText('OFFICIAL VIOLATION RECORD', { x: 50, y: 700, size: 20, font })
        page.drawText('BLUE PAGE ISSUED', { x: 50, y: 670, size: 15, font, color: rgb(0, 0, 1) })

        const details = `
        VIOLATION: DEADLINE MISSED
        TASK: ${task.title}
        EMPLOYEE: ${task.profiles.full_name} (${task.profiles.employee_id})
        DEADLINE: ${new Date(task.deadline).toLocaleString()}
        ISSUED: ${new Date().toLocaleString()}
        PENALTY: INR 2,000
        `
        page.drawText(details, { x: 50, y: 600, size: 12, lineHeight: 20 })

        const pdfBytes = await pdfDoc.save()
        const fileName = `violation_${task.id}_${Date.now()}.pdf`

        await supabase.storage.from('official-records').upload(`violations/${fileName}`, pdfBytes, { contentType: 'application/pdf' })
        const pdfUrl = supabase.storage.from('official-records').getPublicUrl(`violations/${fileName}`).data.publicUrl

        // 3. Create Violation
        const { error: violError } = await supabase.from('violations').insert({
            user_id: task.assigned_to,
            task_id: task.id,
            violation_type: 'deadline_missed',
            penalty_amount: 2000,
            pdf_url: pdfUrl
        })

        if (violError) {
            results.push({ id: task.id, status: 'failed', error: violError })
            continue
        }

        // 4. Update Profile Penalty
        const { data: profile } = await supabase.from('profiles').select('total_penalty').eq('id', task.assigned_to).single()
        const newPenalty = (profile?.total_penalty || 0) + 2000
        await supabase.from('profiles').update({ total_penalty: newPenalty }).eq('id', task.assigned_to)

        // 5. Mark Task as Blue Paged
        await supabase.from('tasks').update({ is_blue_paged: true }).eq('id', task.id)

        // 6. Send Email (via Zepto)
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
                    "subject": "⛔ BLUE PAGE ISSUED: Deadline Missed",
                    "htmlbody": `
                        <div style="font-family: monospace; border: 4px solid #000; padding: 20px;">
                            <h1 style="color: blue;">BLUE PAGE NOTICE</h1>
                            <p>You have missed a critical operational deadline.</p>
                            <p><strong>TASK:</strong> ${task.title}</p>
                            <p><strong>PENALTY:</strong> ₹2,000 deducted from tally.</p>
                            <p>This infraction has been logged in your permanent record.</p>
                        </div>
                    `
                })
            })
        }

        results.push({ id: task.id, status: 'processed', pdf: pdfUrl })
    }

    return new Response(JSON.stringify({ processed: results }), { headers: { 'Content-Type': 'application/json' } })
})
