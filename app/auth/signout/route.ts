import { createClient } from "@/utils/supabase/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
    const supabase = await createClient()

    // Check if we have a session
    const {
        data: { session },
    } = await supabase.auth.getSession()

    if (session) {
        await supabase.auth.signOut()
    }

    revalidatePath("/", "layout")
    return redirect("/")
}
