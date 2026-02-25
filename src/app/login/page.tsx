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
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white relative overflow-hidden">
            {/* Premium UI Backgrounds */}
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

            <div className="z-10 bg-zinc-900/40 p-10 rounded-3xl border border-zinc-800/50 backdrop-blur-xl shadow-2xl max-w-md w-full space-y-8 flex flex-col items-center transition-all hover:bg-zinc-900/50">
                <div className="text-center space-y-3">
                    <div className="w-16 h-16 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white w-8 h-8"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" /></svg>
                    </div>
                    <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-br from-white to-zinc-400 bg-clip-text text-transparent">
                        Nexatask
                    </h1>
                    <p className="text-sm text-zinc-400">Secure automated job targeting & resume tuning.</p>
                </div>

                <div className="w-full pt-4">
                    <Button
                        onClick={handleGoogleLogin}
                        className="w-full bg-white text-zinc-950 hover:bg-zinc-200 transition-all font-semibold flex items-center justify-center space-x-3 h-12 rounded-xl text-md shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)]"
                    >
                        <Chrome className="w-5 h-5" />
                        <span>Continue with Google</span>
                    </Button>
                </div>

                <p className="text-xs text-zinc-500 text-center px-4 leading-relaxed mt-4">
                    By continuing, you agree to our strict <strong className="text-zinc-400">Data Isolation</strong> & <strong className="text-zinc-400">Defense-in-Depth</strong> policies.
                </p>
            </div>
        </div>
    )
}
