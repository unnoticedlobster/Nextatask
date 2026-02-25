'use client'

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { ShieldAlert, Loader2, AlertTriangle, Scale, Target, Sparkles } from "lucide-react"
import { fetchCompanyIntel } from "@/app/actions/investigator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface InvestigatorModalProps {
    companyName: string
}

export function InvestigatorModal({ companyName }: InvestigatorModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [dossier, setDossier] = useState<any>(null)
    const [error, setError] = useState<string | null>(null)

    const handleInvestigate = () => {
        if (!dossier) {
            startTransition(async () => {
                setError(null)
                const res = await fetchCompanyIntel(companyName)
                if (res.error) {
                    setError(res.error)
                } else if (res.dossier) {
                    setDossier(res.dossier)
                }
            })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open)
            if (open) handleInvestigate()
        }}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="px-3 py-1.5 bg-black/60 hover:bg-orange-500/20 text-orange-400 hover:text-orange-300 font-bold text-xs rounded-lg border border-orange-500/30 hover:border-orange-500/60 transition-all flex items-center gap-1 shadow-[0_0_10px_hsla(var(--neon-orange),0.1)] hover:shadow-[0_0_15px_hsla(var(--neon-orange),0.3)] h-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <ShieldAlert className="w-3.5 h-3.5" /> Investigate
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl bg-black/95 border-orange-500/30 text-white shadow-[0_0_50px_rgba(249,115,22,0.15)] max-h-[90vh] flex flex-col p-0 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-red-500 to-orange-500 opacity-80" />

                <DialogHeader className="p-6 pb-2 border-b border-white/5 bg-black/40">
                    <DialogTitle className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-500 flex items-center gap-2">
                        <ShieldAlert className="w-6 h-6 text-orange-500" /> Culture Dossier: {companyName}
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        AI compilation of anonymous internet chatter, reviews, and employee sentiment.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6">
                    {isPending ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="relative">
                                <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full animate-ping" />
                                <div className="w-16 h-16 rounded-full border-t-2 border-b-2 border-orange-500 animate-spin flex items-center justify-center">
                                    <ShieldAlert className="w-6 h-6 text-orange-400 animate-pulse" />
                                </div>
                            </div>
                            <p className="text-orange-400 font-mono text-sm uppercase tracking-widest animate-pulse">Running Background Check...</p>
                            <p className="text-zinc-500 text-xs text-center max-w-xs">Scraping anonymous forums and synthesizing sentiment data. This may take 5-10 seconds to bypass bot protection.</p>
                        </div>
                    ) : error ? (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-center">
                            <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                            <p className="text-red-400 font-bold">{error}</p>
                            <Button variant="outline" onClick={handleInvestigate} className="mt-4 border-red-500/30 text-red-400 hover:bg-red-500/20">Retry Investigation</Button>
                        </div>
                    ) : dossier ? (
                        <div className="space-y-6">

                            {/* Red Flags */}
                            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-5 shadow-inner relative overflow-hidden">
                                <div className="absolute right-0 top-0 w-32 h-32 bg-red-500/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2" />
                                <h3 className="text-red-400 font-black uppercase tracking-wider text-sm flex items-center mb-3">
                                    <AlertTriangle className="w-4 h-4 mr-2" /> Identified Red Flags
                                </h3>
                                <ul className="space-y-2 relative z-10">
                                    {dossier.red_flags.map((flag: string, i: number) => (
                                        <li key={i} className="text-zinc-200 text-sm flex items-start">
                                            <span className="text-red-500 mr-2 font-bold">•</span> {flag}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Work Life Balance */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-inner transition-colors hover:border-blue-500/30 group">
                                    <h3 className="text-blue-400 font-bold uppercase tracking-wider text-xs flex items-center mb-2">
                                        <Scale className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" /> Work-Life Balance
                                    </h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">{dossier.work_life_balance}</p>
                                </div>

                                {/* Turnover Risk */}
                                <div className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-inner transition-colors hover:border-orange-500/30 group">
                                    <h3 className="text-orange-400 font-bold uppercase tracking-wider text-xs flex items-center mb-2">
                                        <Target className="w-3.5 h-3.5 mr-2 group-hover:scale-110 transition-transform" /> Turnover Risk
                                    </h3>
                                    <p className="text-zinc-300 text-sm leading-relaxed">{dossier.turnover_risk}</p>
                                </div>
                            </div>

                            {/* Hidden Gems */}
                            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-5 shadow-inner">
                                <h3 className="text-emerald-400 font-black uppercase tracking-wider text-sm flex items-center mb-3">
                                    <Sparkles className="w-4 h-4 mr-2" /> Hidden Gems (Positives)
                                </h3>
                                <ul className="space-y-2">
                                    {dossier.hidden_gems.map((gem: string, i: number) => (
                                        <li key={i} className="text-zinc-200 text-sm flex items-start">
                                            <span className="text-emerald-500 mr-2 font-bold">+</span> {gem}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <p className="text-center text-xs text-zinc-500 mt-6 pb-2 italic">Intelligence gathered from public forums and synthesized by Gemini AI.</p>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    )
}
