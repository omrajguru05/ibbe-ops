"use client"

import { approveUser, rejectUser } from "@/actions/admin-actions"
import { OrbitalButton } from "@/components/ui/orbital-button"
import { OrbitalCard } from "@/components/ui/orbital-card"
import { useState } from "react"
import { RefreshCw } from "lucide-react"

interface Profile {
    id: string
    full_name: string
    employee_id: string
    photo_url: string
}

export function PendingQueue({ initialProfiles }: { initialProfiles: Profile[] }) {
    const [profiles, setProfiles] = useState(initialProfiles)

    const handleApprove = async (id: string) => {
        await approveUser(id)
        setProfiles(prev => prev.filter(p => p.id !== id))
    }

    const handleReject = async (id: string) => {
        if (!confirm("Permenantly reject access?")) return
        await rejectUser(id)
        setProfiles(prev => prev.filter(p => p.id !== id))
    }

    if (profiles.length === 0) {
        return (
            <div className="bg-white/50 p-8 text-center italic text-gray-500 border-2 border-dashed border-gray-300 rounded-xl">
                No pending approvals.
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {profiles.map(profile => (
                <OrbitalCard key={profile.id} className="p-4 bg-white flex flex-col md:flex-row gap-4 items-center">
                    <div className="w-24 h-24 orbital-element overflow-hidden flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={profile.photo_url || "https://placehold.co/100"} alt="Face" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h3 className="font-bold text-lg uppercase">{profile.full_name}</h3>
                        <p className="font-mono text-sm opacity-60 uppercase">{profile.employee_id}</p>
                    </div>
                    <div className="flex gap-2">
                        <OrbitalButton onClick={() => handleApprove(profile.id)} className="bg-system-green text-white border-green-900 shadow-[4px_4px_0px_0px_#14532d] hover:bg-green-600 px-4 py-2 text-xs">
                            Approve
                        </OrbitalButton>
                        <OrbitalButton onClick={() => handleReject(profile.id)} variant="danger" className="bg-red-500 text-white border-red-900 shadow-[4px_4px_0px_0px_#7f1d1d] hover:bg-red-600 px-4 py-2 text-xs">
                            Reject
                        </OrbitalButton>
                    </div>
                </OrbitalCard>
            ))}
        </div>
    )
}
