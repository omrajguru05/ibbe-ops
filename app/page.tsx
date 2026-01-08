"use client"

import * as React from "react"
import { OrbitalButton } from "@/components/ui/orbital-button"
import { OrbitalCard } from "@/components/ui/orbital-card"
import { OrbitalInput } from "@/components/ui/orbital-input"
import { LiveCapture } from "@/components/live-capture"
import { createClient } from "@/utils/supabase/client"
import { useRouter } from "next/navigation"

export default function Home() {
  const [isLogin, setIsLogin] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [photoBlob, setPhotoBlob] = React.useState<Blob | null>(null)

  // Registration Form State
  const [fullName, setFullName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [employeeId, setEmployeeId] = React.useState("")
  const [password, setPassword] = React.useState("") // Auth requires password

  const supabase = createClient()
  const router = useRouter()

  const handleCapture = (blob: Blob) => {
    setPhotoBlob(blob)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!photoBlob) {
      alert("Live identity capture is required.")
      return
    }
    setLoading(true)

    try {
      // 1. Upload Photo
      const photoName = `${employeeId}_${Date.now()}.jpg`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("official-records")
        .upload(`photos/${photoName}`, photoBlob)

      if (uploadError) throw uploadError

      const photoUrl = supabase.storage.from("official-records").getPublicUrl(`photos/${photoName}`).data.publicUrl

      // 2. Sign Up
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            employee_id: employeeId,
            photo_url: photoUrl,
          },
        },
      })

      if (authError) throw authError

      // 3. Trigger handles profile creation with photo_url.

      router.push("/dashboard") // Will likely hit "Pending" state there
    } catch (error: any) {
      alert("Registration failed: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      alert(error.message)
      setLoading(false)
    } else {
      router.push("/dashboard")
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 gap-8">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="orbital-element w-24 h-24 bg-orbital-accent border-[3px] border-orbital-ink shadow-orbital mb-4">
          <span className="text-3xl font-bold">IBBE</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight">OPERATIONAL TASK</h1>
        <p className="text-lg max-w-md">
          Strict adherence to responsiveness protocols is required.
          <br />
          Compliance is mandatory.
        </p>
      </div>

      <OrbitalCard className="w-full max-w-md p-8 bg-white">
        <div className="flex justify-center mb-6 border-b-2 border-orbital-ink/10 pb-4">
          <button
            onClick={() => setIsLogin(false)}
            className={`px-4 py-2 font-bold ${!isLogin ? "text-orbital-ink border-b-4 border-orbital-accent" : "text-gray-400"}`}
          >
            REGISTER
          </button>
          <button
            onClick={() => setIsLogin(true)}
            className={`px-4 py-2 font-bold ${isLogin ? "text-orbital-ink border-b-4 border-orbital-accent" : "text-gray-400"}`}
          >
            ACCESS
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Official Email</label>
              <OrbitalInput required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@ibbe.in" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Password</label>
              <OrbitalInput required type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>
            <OrbitalButton className="w-full mt-4" disabled={loading}>
              {loading ? "AUTHENTICATING..." : "INITIATE SESSION"}
            </OrbitalButton>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Full Legal Name</label>
              <OrbitalInput required value={fullName} onChange={e => setFullName(e.target.value)} placeholder="LAST, FIRST" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Employee ID</label>
              <OrbitalInput required value={employeeId} onChange={e => setEmployeeId(e.target.value)} placeholder="IBBE-XXX" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Official Email</label>
              <OrbitalInput required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@ibbe.in" />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2 uppercase">Set Password</label>
              <OrbitalInput required type="password" value={password} onChange={e => setPassword(e.target.value)} />
            </div>

            <div className="pt-4 border-t-2 border-orbital-ink/10">
              <label className="block text-sm font-bold mb-4 uppercase text-center text-red-600">
                Identity Verification Required
              </label>
              <LiveCapture onCapture={handleCapture} />
            </div>

            <OrbitalButton className="w-full mt-6" disabled={loading}>
              {loading ? "PROCESSING..." : "SUBMIT TASK"}
            </OrbitalButton>
          </form>
        )}
      </OrbitalCard>
    </main>
  )
}
