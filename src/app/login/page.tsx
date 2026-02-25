'use client'

import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { Chrome } from "lucide-react"

export default function LoginPage() {
    const supabase = createClient()

    const handleGoogleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${location.origin}/auth/callback`
            }
        })
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden p-4">
            <div className="z-10 glass-panel glass-panel-hover p-10 max-w-md w-full space-y-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
                <div className="text-center space-y-3">
                    <div className="w-20 h-20 bg-black/60 border border-[hsl(var(--neon-cyan))]/30 rounded-2xl mx-auto flex items-center justify-center shadow-[0_0_20px_hsla(var(--neon-cyan),0.2)] mb-6 transition-transform hover:scale-105 hover:border-[hsl(var(--neon-cyan))]/60">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="hsl(var(--neon-cyan))" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 drop-shadow-[0_0_8px_hsla(var(--neon-cyan),0.8)]"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text-gradient bg-clip-text text-transparent pb-1">
                        Nexatask
                    </h1>
                    <p className="text-sm text-zinc-400 font-medium">Secure automated job targeting & resume tuning.</p>
                </div>

                <div className="w-full pt-4">
                    <Button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-zinc-950 hover:bg-zinc-200 transition-all font-bold flex items-center justify-center space-x-3 h-12 rounded-xl text-md shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-1"
                    >
                        <Chrome className="w-5 h-5" />
                        <span>Continue with Google</span>
                    </Button>
                </div>

                <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed mt-4">
                    By continuing, you verify your clearance to access the <strong className="text-zinc-400">Nexatask Network</strong>.
                </p>
            </div>
        </div>
    )
}
