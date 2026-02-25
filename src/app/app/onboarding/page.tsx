import { createClient } from "@/lib/supabase/server"
import OnboardingClient from "./OnboardingClient"
import { redirect } from "next/navigation"

export default async function OnboardingPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    return <OnboardingClient initialData={profile || null} />
}
