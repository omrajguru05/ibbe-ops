"use client"

import { useState } from "react"
import { OrbitalCard } from "@/components/ui/orbital-card"
import { OrbitalButton } from "@/components/ui/orbital-button"
import { pauseAccount, resumeAccount, suspendAccount } from "@/actions/admin-actions"

export function ActiveDirectory({ employees }: { employees: any[] }) {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedEmployee, setSelectedEmployee] = useState<any>(null)
    const [actionType, setActionType] = useState<'pause' | 'suspend' | null>(null)
    const [reason, setReason] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const filtered = employees.filter(e =>
        e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const handleAction = async () => {
        if (!selectedEmployee || !actionType) return
        if (!reason.trim()) {
            alert("Please provide a reason.")
            return
        }

        setIsSubmitting(true)
        try {
            if (actionType === 'pause') {
                await pauseAccount(selectedEmployee.id, reason)
            } else {
                await suspendAccount(selectedEmployee.id, reason) // Need to import this
            }
            setSelectedEmployee(null)
            setActionType(null)
            setReason("")
        } catch (e) {
            alert("Action failed. Ensure you have permissions.")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="space-y-6 relative">
            <input
                type="text"
                placeholder="Search by Name or ID..."
                className="w-full md:w-1/2 p-3 bg-white border-2 border-orbital-ink rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-orbital-accent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filtered.map(emp => (
                    <OrbitalCard key={emp.id} className="p-0 overflow-hidden group">
                        <div className="h-48 bg-gray-200 relative">
                            {emp.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={emp.photo_url} alt={emp.full_name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-bold opacity-20 bg-orbital-ink text-white">
                                    {emp.employee_id?.slice(-2)}
                                </div>
                            )}
                            <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded border border-black text-xs font-bold uppercase">
                                {emp.status}
                            </div>
                        </div>
                        <div className="p-4 border-t-2 border-orbital-ink">
                            <h3 className="font-black uppercase text-lg leading-none mb-1 truncate">{emp.full_name}</h3>
                            <p className="font-mono text-xs text-gray-500 mb-4">{emp.employee_id}</p>

                            <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold border-t border-gray-100 pt-3">
                                <div>
                                    <span className="block text-gray-400">Total Penalties</span>
                                    <span className="text-red-600 text-lg">₹{(emp.total_penalty || 0).toLocaleString()}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-400">Joined</span>
                                    <span>{new Date(emp.created_at).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {emp.id_card_url && (
                                <a
                                    href={emp.id_card_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block mt-4 text-center bg-gray-100 hover:bg-gray-200 py-2 rounded text-xs font-bold border border-gray-300"
                                >
                                    View ID Card
                                </a>
                            )}

                            <div className="mt-4 pt-4 border-t border-gray-100 flex flex-col gap-2">
                                {emp.status === 'active' && (
                                    <>
                                        <OrbitalButton
                                            variant="secondary"
                                            className="w-full bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-600"
                                            onClick={() => {
                                                setSelectedEmployee(emp)
                                                setActionType('pause')
                                                setReason("")
                                            }}
                                        >
                                            PAUSE (TEMP)
                                        </OrbitalButton>
                                        <OrbitalButton
                                            variant="danger"
                                            className="w-full"
                                            onClick={() => {
                                                setSelectedEmployee(emp)
                                                setActionType('suspend')
                                                setReason("")
                                            }}
                                        >
                                            SUSPEND (LOCK)
                                        </OrbitalButton>
                                    </>
                                )}
                                {(emp.status === 'on_hold' || emp.status === 'suspended') && (
                                    <OrbitalButton
                                        variant="default"
                                        className="w-full bg-green-600 hover:bg-green-700 text-white border-green-800"
                                        onClick={async () => {
                                            if (confirm("Restore access for this agent?")) {
                                                try {
                                                    await resumeAccount(emp.id)
                                                } catch (e) {
                                                    alert("Failed to resume account")
                                                }
                                            }
                                        }}
                                    >
                                        RESUME SERVICE
                                    </OrbitalButton>
                                )}
                            </div>
                        </div>
                    </OrbitalCard>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 opacity-50 font-mono border-2 border-dashed border-gray-300 rounded-xl">
                    No records found in directory.
                </div>
            )}

            {selectedEmployee && actionType && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white border-2 border-orbital-ink rounded-xl shadow-[8px_8px_0px_0px_#000] p-6 max-w-md w-full animate-in fade-in zoom-in duration-200">
                        <h2 className="text-xl font-black uppercase mb-4">
                            {actionType === 'pause' ? 'PAUSE MANDATE' : 'SUSPEND AGENT'}
                        </h2>
                        <p className="mb-4 text-sm text-gray-600 font-mono">
                            Action for: <strong>{selectedEmployee.full_name}</strong>
                        </p>

                        <label className="block text-xs font-bold uppercase mb-2">Reason (Required)</label>
                        <textarea
                            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-orbital-ink outline-none min-h-[100px] font-mono text-sm mb-6"
                            placeholder="Enter reason for this action..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setSelectedEmployee(null)
                                    setActionType(null)
                                }}
                                className="px-4 py-2 font-bold uppercase text-xs hover:bg-gray-100 rounded"
                            >
                                Cancel
                            </button>
                            <OrbitalButton
                                variant={actionType === 'pause' ? 'secondary' : 'danger'}
                                onClick={handleAction}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'PROCESSING...' : `CONFIRM ${actionType}`}
                            </OrbitalButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
