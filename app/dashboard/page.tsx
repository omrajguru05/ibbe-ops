import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

export default async function DashboardPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return redirect("/")
    }

    const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single()

    if (!profile) {
        // Should not happen if trigger works
        return <div>Error loading profile.</div>
    }

    if (profile.role === "admin") {
        return redirect("/admin")
    }

    // Employee: Redirect to slug or create slug if missing
    // Assuming slug is created? Trigger didn't generate slug. 
    // I should probably generate it here or in trigger. 
    // For simplicity, I'll use ID if slug missing or update it.

    if (profile.slug) {
        return redirect(`/dashboard/${profile.slug}`)
    } else {
        // Fallback or generate
        const slug = `${profile.full_name?.toLowerCase().replace(/\s+/g, '-')}-${profile.employee_id?.toLowerCase()}`
        // Requires update permission or admin. User can update own profile? 
        // My RLS says "Users can update own profile".
        await supabase.from("profiles").update({ slug }).eq("id", user.id)
        return redirect(`/dashboard/${slug}`)
    }
}
