"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"
import { PendingQueue } from "@/components/admin/pending-queue"
import { CreateTaskForm } from "@/components/admin/create-task-form"
import { OrbitalCard } from "@/components/ui/orbital-card"
import { ActiveDirectory } from "@/components/admin/active-directory"
import { ComplianceLog } from "@/components/admin/compliance-log"
import { EmailComposer } from "@/components/admin/email-composer"

// Dashboard Component
export default function AdminDashboard() {
    const [activeTab, setActiveTab] = React.useState<"overview" | "recruitment" | "tasks" | "directory" | "compliance" | "communication">("overview")
    const [stats, setStats] = React.useState({
        totalEmployees: 0,
        pendingApprovals: 0,
        totalPenalties: 0,
    })
    const [activeEmployees, setActiveEmployees] = React.useState<any[]>([])
    const [pendingProfiles, setPendingProfiles] = React.useState<any[]>([])
    const [allottedTasks, setAllottedTasks] = React.useState<any[]>([])

    const [loading, setLoading] = React.useState(true)
    const [currentUserEmail, setCurrentUserEmail] = React.useState("")
    const supabase = createClient()
    const router = useRouter()

    React.useEffect(() => {
        const fetchStats = async () => {
            // Get Current User
            const { data: { user } } = await supabase.auth.getUser()
            if (user?.email) setCurrentUserEmail(user.email)

            // 1. Get Active & On-Hold Employees
            const { data: activeData, count: activeCount } = await supabase
                .from("profiles")
                .select("*", { count: "exact" })
                .eq("role", "employee")
                .in("status", ["active", "on_hold"])

            if (activeData) setActiveEmployees(activeData)

            // 2. Get Pending
            const { data: pendingData, count: pendingCount } = await supabase
                .from("profiles")
                .select("*", { count: "exact" })
                .eq("role", "employee")
                .eq("status", "pending")

            if (pendingData) setPendingProfiles(pendingData)

            // 3. Get Penalties
            const { data: profiles } = await supabase.from("profiles").select("total_penalty")
            const totalPenalties = profiles?.reduce((acc, curr) => acc + (curr.total_penalty || 0), 0) || 0

            setStats({
                totalEmployees: activeCount || 0,
                pendingApprovals: pendingCount || 0,
                totalPenalties,
            })

            // 4. Get Tasks (Allotted)
            const { data: tasksData } = await supabase
                .from("tasks")
                .select("*")
                .order('created_at', { ascending: false })

            if (tasksData) setAllottedTasks(tasksData)

            setLoading(false)
        }

        fetchStats()

        // Realtime Subscription
        const channel = supabase
            .channel('admin_dashboard_updates')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => fetchStats()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [supabase])

    // Clean, resolving conflicting borders
    const TabButton = ({ id, label, icon }: { id: typeof activeTab; label: string; icon: string }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`relative group flex-1 py-4 font-mono text-sm font-bold uppercase tracking-widest transition-all duration-300 rounded-full border-2 border-orbital-ink
        ${activeTab === id
                    ? "text-white bg-orbital-ink shadow-[4px_4px_0px_0px_#000] -translate-y-1"
                    : "text-orbital-ink bg-white hover:bg-gray-100"
                }
      `}
        >
            <span className="mr-2">{icon}</span>
            {label}
        </button>
    )

    if (loading) return (
        <div className="min-h-screen bg-orbital-bg flex items-center justify-center">
            <div className="font-mono text-xl font-bold animate-pulse text-orbital-ink">LOADING...</div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#F4F4F5] font-sans selection:bg-orbital-accent selection:text-black">
            {/* Top Navigation Bar */}
            <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b-[3px] border-orbital-ink z-50">
                <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-orbital-accent border-[3px] border-orbital-ink flex items-center justify-center font-black text-xl shadow-[3px_3px_0px_0px_#000]">
                            CM
                        </div>
                        <div>
                            <h1 className="text-xl font-black italic tracking-tighter leading-none">ADMIN<br />DASHBOARD</h1>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col text-right">
                            <span className="text-xs font-bold text-green-600 flex items-center justify-end gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> SYSTEM ACTIVE
                            </span>
                        </div>
                        <form action="/auth/signout" method="post">
                            <button
                                type="submit"
                                className="bg-red-500 hover:bg-red-600 text-white font-mono text-xs font-bold px-4 py-2 border-[3px] border-orbital-ink shadow-[4px_4px_0px_0px_#000] active:translate-y-1 active:shadow-none transition-all"
                            >
                                LOGOUT
                            </button>
                        </form>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 md:px-8 pt-32 pb-20">

                {/* Stats Grid - "Pop" Design */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 relative z-0">
                    {/* ... stats cards ... */}
                    {/* (Keeping existing content, just verifying z-index context on parent) */}

                    {/* Active Card - Charcoal */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-orbital-ink translate-x-2 translate-y-2 rounded-[2rem] transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
                        <div className="relative bg-[#1D1D1F] text-white p-6 rounded-[2rem] border-[3px] border-orbital-ink h-full flex flex-col justify-between overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-mono text-xs text-stone-400 uppercase tracking-widest mb-1">Employees</h3>
                                <p className="text-5xl font-black tracking-tighter">{stats.totalEmployees}</p>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-stone-500">
                                <span className="w-2 h-2 bg-green-500 rounded-full" /> Active
                            </div>
                        </div>
                    </div>

                    {/* Pending Card - Vibrant Yellow */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-orbital-ink translate-x-2 translate-y-2 rounded-[2rem] transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
                        <div className="relative bg-[#FFD60A] text-orbital-ink p-6 rounded-[2rem] border-[3px] border-orbital-ink h-full flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-4 opacity-10 text-black">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-mono text-xs font-bold uppercase tracking-widest mb-1 opacity-60">Pending Approvals</h3>
                                <p className="text-5xl font-black tracking-tighter">{stats.pendingApprovals}</p>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs font-mono font-bold opacity-60">
                                <span className="w-2 h-2 bg-orbital-ink rounded-full animate-ping" /> Waiting for Review
                            </div>
                        </div>
                    </div>

                    {/* Penalties Card - Signal Blue */}
                    <div className="group relative">
                        <div className="absolute inset-0 bg-orbital-ink translate-x-2 translate-y-2 rounded-[2rem] transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />
                        <div className="relative bg-[#2962FF] text-white p-6 rounded-[2rem] border-[3px] border-orbital-ink h-full flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-4 opacity-20">
                                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" /></svg>
                            </div>
                            <div>
                                <h3 className="font-mono text-xs text-blue-200 uppercase tracking-widest mb-1">Total Penalties</h3>
                                <p className="text-5xl font-black tracking-tighter">₹{stats.totalPenalties.toLocaleString()}</p>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs font-mono text-blue-200">
                                Accumulated Fines
                            </div>
                        </div>
                    </div>
                </div>

                {/* Floating Tabs */}
                <div className="flex gap-4 p-2 bg-white border-[3px] border-orbital-ink rounded-full shadow-[8px_8px_0px_0px_#1D1D1F] mb-12 overflow-x-auto relative z-50">
                    <TabButton id="overview" label="Overview" icon="📊" />
                    <TabButton id="recruitment" label="Recruitment" icon="👥" />
                    <TabButton id="directory" label="Directory" icon="📇" />
                    <TabButton id="tasks" label="Tasks" icon="⚡" />
                    <TabButton id="compliance" label="Compliance" icon="🛡️" />
                    <TabButton id="communication" label="Comm" icon="📡" />
                </div>

                {/* Content Area */}
                <div className="min-h-[400px]">
                    {activeTab === "overview" && (
                        <div className="text-center py-20 opacity-50 font-mono">
                            <p className="text-4xl mb-4">🖥️</p>
                            <p>Select a module above to view details.</p>
                        </div>
                    )}

                    {activeTab === "compliance" && (
                        <div className="bg-white border-[3px] border-orbital-ink rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_#1D1D1F]">
                            <ComplianceLog />
                        </div>
                    )}

                    {activeTab === "communication" && (
                        <div className="">
                            <h2 className="text-2xl font-black italic uppercase mb-8 ml-2">Secure Channel</h2>
                            <EmailComposer />
                        </div>
                    )}

                    {activeTab === "recruitment" && (
                        <div className="bg-white border-[3px] border-orbital-ink rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_#1D1D1F]">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-100">
                                <h2 className="text-2xl font-black italic uppercase">New Signups</h2>
                                <span className="bg-orbital-accent text-orbital-ink px-3 py-1 text-xs font-bold border-2 border-orbital-ink rounded-full">
                                    {pendingProfiles.length} PENDING
                                </span>
                            </div>
                            <PendingQueue initialProfiles={pendingProfiles} />
                        </div>
                    )}

                    {activeTab === "directory" && (
                        <div className="bg-white border-[3px] border-orbital-ink rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_#1D1D1F]">
                            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-100">
                                <h2 className="text-2xl font-black italic uppercase">Active Directory</h2>
                                <span className="bg-green-100 text-green-800 px-3 py-1 text-xs font-bold border-2 border-green-800 rounded-full">
                                    {activeEmployees.length} EMPLOYEES (ACTIVE & ON HOLD)
                                </span>
                            </div>
                            <ActiveDirectory employees={activeEmployees} />
                        </div>
                    )}

                    {activeTab === "tasks" && (
                        <div className="space-y-8">
                            {/* Create Task Section */}
                            <div className="bg-white border-[3px] border-orbital-ink rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_#1D1D1F]">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-100">
                                    <h2 className="text-2xl font-black italic uppercase">Assign New Task</h2>
                                    <span className="text-gray-400 font-mono text-xs">User: {currentUserEmail}</span>
                                </div>
                                <CreateTaskForm activeEmployees={activeEmployees} />
                            </div>

                            {/* Allotted Tasks Section */}
                            <div className="bg-white border-[3px] border-orbital-ink rounded-[2rem] p-8 shadow-[8px_8px_0px_0px_#1D1D1F]">
                                <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-100">
                                    <h2 className="text-2xl font-black italic uppercase">Allotted Tasks</h2>
                                    <span className="bg-orbital-accent text-orbital-ink px-3 py-1 text-xs font-bold border-2 border-orbital-ink rounded-full">
                                        {allottedTasks.length} ACTIVE
                                    </span>
                                </div>

                                {allottedTasks.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400 font-mono">
                                        No active tasks found.
                                    </div>
                                ) : (
                                    <div className="grid gap-4">
                                        {allottedTasks.map((task: any) => (
                                            <a
                                                key={task.id}
                                                href={`/task/${task.id}`}
                                                className="group block bg-[#F4F4F5] hover:bg-white p-6 rounded-xl border-2 border-transparent hover:border-orbital-ink transition-all hover:shadow-[4px_4px_0px_0px_#000]"
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-lg group-hover:text-blue-600 transition-colors uppercase">
                                                            {task.title}
                                                        </h3>
                                                        <p className="text-sm text-gray-500 font-mono">
                                                            To: {activeEmployees.find(e => e.id === task.assigned_to)?.full_name || 'Unknown'}
                                                        </p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono uppercase border-2 ${task.status === 'done' ? 'bg-green-100 text-green-700 border-green-700' :
                                                        task.status === 'in_progress' ? 'bg-blue-100 text-blue-700 border-blue-700' :
                                                            'bg-gray-200 text-gray-700 border-gray-700'
                                                        }`}>
                                                        {task.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between items-end mt-4">
                                                    <div className="text-xs font-mono text-gray-400">
                                                        DUE: {new Date(task.deadline).toLocaleString()}
                                                    </div>
                                                    <div className="w-8 h-8 rounded-full border-2 border-orbital-ink flex items-center justify-center bg-white group-hover:bg-orbital-accent transition-colors">
                                                        ➔
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

            </main >
        </div >
    )
}
