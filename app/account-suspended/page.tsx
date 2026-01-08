import { createClient } from "@/utils/supabase/server"
import { OrbitalCard } from "@/components/ui/orbital-card"

export default async function AccountSuspended() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    let profile = null
    if (user) {
        const { data } = await supabase.from('profiles').select('status, status_reason').eq('id', user.id).single()
        profile = data
    }

    const isSuspended = profile?.status === 'suspended'

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-orbital-bg">
            <OrbitalCard className={`max-w-md w-full p-8 text-center border-l-8 ${isSuspended ? 'border-l-red-600' : 'border-l-yellow-400'}`}>
                <h1 className={`text-3xl font-bold uppercase mb-4 ${isSuspended ? 'text-red-600' : 'text-yellow-600'}`}>
                    {isSuspended ? 'Account Suspended' : 'Mandate Paused'}
                </h1>
                <p className="font-mono mb-6 text-sm">
                    {isSuspended
                        ? "Your authorization has been revoked indefinitely due to operational non-compliance or disciplinary action."
                        : "Your operational mandate has been temporarily placed on hold pending review."
                    }
                </p>

                {profile?.status_reason && (
                    <div className="mb-6 bg-gray-50 p-4 rounded border border-gray-200">
                        <span className="block text-xs font-bold uppercase text-gray-400 mb-1">Reason for Action</span>
                        <p className="font-mono text-sm">{profile.status_reason}</p>
                    </div>
                )}

                <div className="bg-orbital-ink text-white p-4 rounded text-xs font-mono uppercase">
                    Status: {profile?.status || 'UNKNOWN'}
                    <br />
                    Action: {isSuspended ? 'Contact Administration' : 'Await Further Instructions'}
                </div>
            </OrbitalCard>
        </div>
    )
}
