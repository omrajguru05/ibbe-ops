"use server"

import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"

export async function postComment(formData: FormData) {
    const supabase = await createClient()

    const taskId = formData.get("task_id") as string
    const content = formData.get("content") as string

    // Handle Attachments
    const files = formData.getAll("attachments") as File[]
    const attachmentUrls: string[] = []

    for (const file of files) {
        if (file.size > 0) {
            const fileName = `comment_${Date.now()}_${file.name.replace(/\s+/g, "_")}`
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

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error("Unauthorized")

    // Get User Role to update timestamps
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    // Insert Comment
    const { error } = await supabase.from("comments").insert({
        task_id: taskId,
        author_id: user.id,
        content: content,
        attachments: attachmentUrls
    })
    if (error) throw error

    // Update Task Timestamps
    const now = new Date().toISOString()
    if (profile?.role === "admin") {
        await supabase.from("tasks").update({ last_admin_comment_at: now }).eq("id", taskId)
    } else {
        await supabase.from("tasks").update({ last_employee_reply_at: now }).eq("id", taskId)
    }

    revalidatePath(`/task/${taskId}`)
}

export async function updateTaskStatus(taskId: string, status: string) {
    const supabase = await createClient()
    await supabase.from("tasks").update({ status }).eq("id", taskId)
    revalidatePath(`/task/${taskId}`)
}
