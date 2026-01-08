"use client"

import { useState } from "react"
import { OrbitalCard } from "@/components/ui/orbital-card"

export function ActiveDirectory({ employees }: { employees: any[] }) {
    const [searchTerm, setSearchTerm] = useState("")

    const filtered = employees.filter(e =>
        e.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.employee_id?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <input
                type="text"
                placeholder="Search by Name or ID..."
                className="w-full md:w-1/2 p-3 bg-white border-2 border-orbital-ink rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-orbital-accent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                            <h3 className="font-black uppercase text-lg leading-none mb-1">{emp.full_name}</h3>
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
                        </div>
                    </OrbitalCard>
                ))}
            </div>

            {filtered.length === 0 && (
                <div className="text-center py-12 opacity-50 font-mono border-2 border-dashed border-gray-300 rounded-xl">
                    No records found in directory.
                </div>
            )}
        </div>
    )
}
