import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ResumeClient from "./ResumeClient"

export default async function ResumePage({ params }: { params: Promise<{ jobId: string }> }) {
    const { jobId } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: job } = await supabase
        .from('job_logs')
        .select('*')
        .eq('id', jobId)
        .eq('user_id', user.id)
        .single()

    if (!job) {
        redirect('/app/dashboard')
    }

    return <ResumeClient job={job} />
}
