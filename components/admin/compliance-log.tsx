"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/utils/supabase/client"
import { OrbitalCard } from "@/components/ui/orbital-card"

export function ComplianceLog() {
    const supabase = createClient()
    const [violations, setViolations] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchViolations = async () => {
            const { data } = await supabase
                .from("violations")
                .select(`
                    *,
                    profiles:user_id(full_name, employee_id, slug),
                    tasks:task_id(title)
                `)
                .order("created_at", { ascending: false })

            if (data) setViolations(data)
            setLoading(false)
        }

        fetchViolations()

        // Realtime Subscription for new violations
        const channel = supabase
            .channel('violations-log')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'violations' },
                () => { fetchViolations() }
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }

    }, [supabase])

    if (loading) return <div className="p-8 text-center font-mono animate-pulse">Scanning records...</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between mb-8 pb-4 border-b-2 border-gray-100">
                <h2 className="text-2xl font-black italic uppercase text-blue-800">Compliance Log</h2>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                    <span className="bg-red-50 text-red-800 px-3 py-1 text-xs font-bold border-2 border-red-800 rounded-full">
                        {violations.length} VIOLATIONS RECORDED
                    </span>
                </div>
            </div>

            {violations.length === 0 ? (
                <div className="p-12 border-2 border-dashed border-gray-300 rounded-xl text-center">
                    <div className="text-4xl mb-4 grayscale opacity-50">🛡️</div>
                    <h3 className="text-lg font-bold uppercase text-gray-400">All Systems Nominal</h3>
                    <p className="font-mono text-xs text-gray-500">No active violations detected in the network.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {violations.map((v) => (
                        <div key={v.id} className="group relative">
                            {/* Blue Page Aesthetic */}
                            <div className="absolute inset-0 bg-blue-900/10 translate-x-2 translate-y-2 rounded-xl" />

                            <div className="relative bg-[#F0F4FF] border-2 border-blue-800 p-6 rounded-xl hover:shadow-xl transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex gap-4">
                                        <div className="bg-blue-800 text-white w-12 h-12 flex items-center justify-center font-bold text-xl rounded">
                                            BP
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-black uppercase text-blue-900">{v.profiles?.full_name}</h4>
                                                <span className="font-mono text-xs text-blue-600 bg-blue-100 px-2 rounded">
                                                    {v.profiles?.employee_id}
                                                </span>
                                            </div>
                                            <p className="font-mono text-xs text-blue-800 uppercase mb-2">
                                                VIOLATION: <span className="font-bold">{v.violation_type.replace('_', ' ')}</span>
                                            </p>
                                            <p className="text-sm text-gray-700">
                                                Task: <span className="font-bold">{v.tasks?.title || "Unknown Task"}</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <div className="text-2xl font-black text-red-600">-₹{v.penalty_amount.toLocaleString()}</div>
                                        <div className="text-[10px] font-mono uppercase text-gray-500 mb-2">
                                            {new Date(v.created_at).toLocaleString()}
                                        </div>
                                        {v.pdf_url && (
                                            <a
                                                href={v.pdf_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-block bg-blue-800 text-white text-xs font-bold px-4 py-2 rounded hover:bg-blue-900 transition-colors uppercase tracking-wider"
                                            >
                                                View Blue Page PDF
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
