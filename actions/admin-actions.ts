"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/utils/zepto"

export async function approveUser(userId: string) {
    const supabase = await createClient()

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Update status
    const { error, data: profile } = await supabase
        .from("profiles")
        .update({ status: "active" })
        .eq("id", userId)
        .select("email, full_name") // Select email to notify
        .single()

    if (error) throw error

    // Notify User
    if (profile?.email) {
        await sendEmail({
            to: profile.email,
            name: profile.full_name || "Agent",
            subject: "Access Approved - IBBE Ops",
            html: `
                <div style="font-family: monospace; color: #1a1a1a;">
                    <h2>ACCESS GRANTED</h2>
                    <p>Agent ${profile.full_name},</p>
                    <p>Your mandate has been approved by Command.</p>
                    <p><strong>Login immediately to review your directives.</strong></p>
                    <br/>
                    <a href="https://ops.ibbe.in" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold;">ENTER OPERATIONS</a>
                </div>
            `
        })
    }

    revalidatePath("/admin")
}

export async function rejectUser(userId: string) {
    const supabase = await createClient()

    // Verify Admin
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    const { error } = await supabase.from("profiles").delete().eq("id", userId)
    if (error) throw error

    revalidatePath("/admin")
}

export async function createTask(formData: FormData) {
    const supabase = await createClient()

    const title = formData.get("title") as string
    const description = formData.get("description") as string
    const assignedTo = formData.get("assigned_to") as string
    const deadline = formData.get("deadline") as string // ISO string

    // Handle File Attachments
    const files = formData.getAll("attachments") as File[]
    const attachmentUrls: string[] = []

    for (const file of files) {
        if (file.size > 0) {
            const fileName = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`
            const { error: uploadError } = await supabase.storage
                .from("task-attachments")
                .upload(fileName, file)

            if (!uploadError) {
                const { data: { publicUrl } } = supabase.storage
                    .from("task-attachments")
                    .getPublicUrl(fileName)
                attachmentUrls.push(publicUrl)
            }
        }
    }

    const { error } = await supabase.from("tasks").insert({
        title,
        description,
        assigned_to: assignedTo,
        deadline,
        attachment_urls: attachmentUrls,
        status: "todo"
    })

    if (error) throw error

    // Notify Assignee
    const { data: assignee } = await supabase.from("profiles").select("email, full_name").eq("id", assignedTo).single()
    if (assignee?.email) {
        await sendEmail({
            to: assignee.email,
            name: assignee.full_name || "Agent",
            subject: "New Task Assigned",
            html: `
                <div style="font-family: monospace; color: #1a1a1a;">
                    <h2>NEW TASK ASSIGNED</h2>
                    <p><strong>TASK:</strong> ${title}</p>
                    <p><strong>DEADLINE:</strong> ${new Date(deadline).toLocaleString()}</p>
                    <hr/>
                    <p>You have a new task waiting. Please log in to view details and submit your work.</p>
                    <br/>
                    <a href="https://ops.ibbe.in" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; font-weight: bold; border-radius: 99px;">VIEW TASK</a>
                </div>
            `
        })
    }

    revalidatePath("/admin")
}
