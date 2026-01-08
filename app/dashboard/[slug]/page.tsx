import { createClient } from "@/utils/supabase/server"
import { OrbitalCard } from "@/components/ui/orbital-card"
import { redirect } from "next/navigation"
import Link from "next/link"
import { KanbanBoard } from "@/components/dashboard/kanban-board"

export default async function EmployeeDashboard({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return redirect("/")

    const { data: profile } = await supabase.from("profiles").select("*").eq("slug", slug).single()

    if (!profile) return <div>Profile not found</div>

    const { data: tasks } = await supabase.from("tasks").select("*").eq("assigned_to", profile.id)

    return (
        <div className="min-h-screen p-4 md:p-8 space-y-8 max-w-5xl mx-auto pb-24">
            {/* Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="orbital-element w-20 h-20 overflow-hidden bg-white">
                        {profile.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={profile.photo_url} alt="ID" className="w-full h-full object-cover" />
                        ) : (
                            <span className="text-2xl font-bold">{profile.employee_id?.slice(-2)}</span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold uppercase">{profile.full_name}</h1>
                        <div className="font-mono text-sm opacity-70 tracking-widest">{profile.employee_id}</div>
                    </div>
                </div>

                <OrbitalCard className="p-4 bg-orbital-ink text-white flex items-center gap-4 min-w-[200px]">
                    <span className="text-xs font-bold uppercase tracking-widest text-red-500">Total Loss</span>
                    <div className="text-3xl font-mono text-red-500">₹{(profile.total_penalty || 0).toLocaleString()}</div>
                </OrbitalCard>
            </header>

            {/* Status Banner */}
            {profile.status === 'pending' && (
                <div className="bg-orbital-accent p-4 rounded-xl border-2 border-orbital-ink font-bold text-center uppercase animate-pulse">
                    Access Pending Executive Review
                </div>
            )}

            {/* Task Board */}
            <section>
                <div className="flex items-center justify-between mb-6 border-b-4 border-orbital-ink pb-1">
                    <h2 className="text-xl font-bold uppercase">Active Tasks</h2>
                    <span className="hidden md:inline font-mono text-xs text-gray-400 uppercase">
                        Swipe for more →
                    </span>
                </div>

                <KanbanBoard tasks={tasks || []} />
            </section>
        </div>
    )
}
