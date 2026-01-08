import { OrbitalCard } from "@/components/ui/orbital-card"

export default function AccountSuspended() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-orbital-bg">
            <OrbitalCard className="max-w-md w-full p-8 text-center border-l-8 border-l-red-600">
                <h1 className="text-3xl font-bold uppercase mb-4 text-red-600">Account Suspended</h1>
                <p className="font-mono mb-6">
                    Your authorization has been revoked due to operational non-compliance.
                </p>
                <div className="bg-orbital-ink text-white p-4 rounded text-xs font-mono uppercase">
                    Status: ON HOLD
                    <br />
                    Action: Report to Command Center
                </div>
            </OrbitalCard>
        </div>
    )
}
