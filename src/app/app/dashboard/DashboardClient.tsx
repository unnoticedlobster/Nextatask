'use client'

import { useState, useTransition, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Loader2, Crosshair, Briefcase, ChevronRight, ExternalLink, HelpCircle, FileText, CheckCircle, Trash2 } from "lucide-react"
import { runScouterAgent, getScoutedJobs, deleteJobAction } from "@/app/actions/scouter"
import { signOutAction } from "@/app/actions/auth"
import { useRouter } from "next/navigation"
import { ManualJobEntry } from "@/components/ManualJobEntry"
import { InvestigatorModal } from "@/components/InvestigatorModal"

export default function DashboardClient({ profile }: { profile: any }) {
    const [isPending, startTransition] = useTransition()
    const [jobs, setJobs] = useState<any[]>([])
    const [expandedJobId, setExpandedJobId] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        // Load existing jobs on mount
        getScoutedJobs().then(data => {
            if (data?.jobs) setJobs(data.jobs)
        })
    }, [])

    const handleScout = () => {
        startTransition(async () => {
            const res: any = await runScouterAgent(profile)
            if (res?.jobs) {
                // Prepend new jobs to the top
                setJobs(prev => [...res.jobs, ...prev])
            }
        })
    }

    const handleDeleteJob = async (jobId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        // Optimistic UI update - remove instantly
        setJobs(prev => prev.filter(j => j.id !== jobId));

        // Fire backend action
        await deleteJobAction(jobId);
    }

    return (
        <div className="min-h-screen text-white p-4 md:p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4 transition-all">
                    <div className="cursor-pointer group flex items-center" onClick={() => router.push('/app/dashboard')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-magenta))] p-[2px] mr-4 shadow-[0_0_15px_hsla(var(--neon-cyan),0.4)] group-hover:shadow-[0_0_25px_hsla(var(--neon-magenta),0.6)] transition-all">
                            <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                                <Crosshair className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-magenta))] mb-1 tracking-tighter drop-shadow-lg transition-all">Nexatask</h1>
                            <p className="text-zinc-400 font-medium text-sm tracking-wide group-hover:text-zinc-300 transition-colors">Targeting Profile: <span className="text-white font-bold">{profile.name}</span></p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" className="bg-black/50 border-white/20 text-zinc-300 hover:text-white hover:bg-white/10 hover:border-white/30 transition-all font-semibold shadow-inner">
                                    <HelpCircle className="w-4 h-4 mr-2" /> How to Use
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-72 glass-panel border-white/20 text-white p-2" align="end">
                                <DropdownMenuLabel className="font-bold text-[hsl(var(--neon-cyan))] text-glow-cyan text-base">Nexatask Workflow</DropdownMenuLabel>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <div className="p-2 space-y-4 text-sm text-zinc-300">
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 text-white font-bold text-xs mt-0.5">1</div>
                                        <p><strong className="text-white">Edit Docs:</strong> Update your base resume, cover letter, and job preferences.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[hsl(var(--neon-cyan))]/20 flex items-center justify-center flex-shrink-0 text-[hsl(var(--neon-cyan))] font-bold text-xs mt-0.5 shadow-[0_0_10px_hsla(var(--neon-cyan),0.3)]">2</div>
                                        <p><strong className="text-[hsl(var(--neon-cyan))]">Find Jobs:</strong> Let the Scouter Engine simulate job board scrapes tailored to you.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[hsl(var(--neon-magenta))]/20 flex items-center justify-center flex-shrink-0 text-[hsl(var(--neon-magenta))] font-bold text-xs mt-0.5 shadow-[0_0_10px_hsla(var(--neon-magenta),0.3)]">3</div>
                                        <p><strong className="text-[hsl(var(--neon-magenta))]">AI Resume Writer:</strong> Click a job card to generate a perfectly tailored resume and cover letter.</p>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="w-6 h-6 rounded-full bg-[hsl(var(--neon-green))]/20 flex items-center justify-center flex-shrink-0 text-[hsl(var(--neon-green))] font-bold text-xs mt-0.5 shadow-[0_0_10px_hsla(var(--neon-green),0.3)]">4</div>
                                        <p><strong className="text-[hsl(var(--neon-green))]">Quality Check:</strong> Validate the AI's output to ensure it is professional and accurate before downloading.</p>
                                    </div>
                                </div>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        <Button
                            variant="outline"
                            className="bg-black/50 border-white/20 text-white hover:bg-white/10 hover:border-white/30 transition-all font-semibold"
                            onClick={() => router.push('/app/onboarding')}
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Edit Docs
                        </Button>
                        <Button
                            variant="outline"
                            className="bg-black/50 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:text-red-300 hover:border-red-500/80 transition-all font-semibold"
                            onClick={() => startTransition(() => { signOutAction() })}
                        >
                            Sign Out
                        </Button>
                    </div>
                </header>

                <Card className="glass-panel overflow-hidden relative">
                    <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-[hsl(var(--neon-cyan))]/10 blur-[100px] pointer-events-none rounded-full translate-x-1/3 -translate-y-1/3" />
                    <CardHeader className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <CardTitle className="text-2xl text-white font-bold tracking-tight">Active Job Radar</CardTitle>
                            <CardDescription className="text-zinc-300">
                                Deploy scouts to scrape matching job targets based on your profile architecture.
                            </CardDescription>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                            <ManualJobEntry onJobAdded={(job) => setJobs(prev => [job, ...prev])} />
                            <Button
                                onClick={handleScout}
                                disabled={isPending}
                                className="w-full sm:w-auto bg-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))]/80 text-black font-extrabold transition-all h-10 px-8 flex-1 shadow-[0_0_20px_hsla(var(--neon-cyan),0.4)] hover:shadow-[0_0_30px_hsla(var(--neon-cyan),0.6)] rounded-xl group"
                            >
                                {isPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Crosshair className="mr-2 h-5 w-5 group-hover:rotate-90 transition-transform duration-500" />}
                                {isPending ? "Scanning Market..." : "Find More Jobs"}
                            </Button>
                        </div>
                    </CardHeader>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {jobs.length === 0 && !isPending && (
                        <div className="col-span-full pt-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto border border-zinc-800">
                                <Briefcase className="w-8 h-8 text-zinc-600" />
                            </div>
                            <p className="text-zinc-500 italic">Targeting Agent Awaiting Orders. Initiate Scout sequence above.</p>
                        </div>
                    )}

                    {jobs.map((job: any, index: number) => (
                        // Add stagger delay for a cool cascade loading effect
                        <Card
                            key={job.id}
                            className={`glass-panel glass-panel-hover overflow-hidden group border-0 text-white relative animate-in fade-in slide-in-from-bottom-4 duration-500 ${expandedJobId === job.id ? 'col-span-1 md:col-span-2 lg:col-span-3 border-[hsl(var(--neon-green))]/50 bg-black/60 shadow-[0_0_30px_hsla(var(--neon-green),0.1)]' : ''}`}
                            style={{ animationFillMode: 'both', animationDelay: `${index * 50}ms` }}
                        >
                            {/* Subtle neon accent line at the top of the card */}
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--neon-cyan))] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                            <CardHeader className="pb-3 border-b border-white/5 bg-white/[0.02]">
                                <div className="flex justify-between items-start">
                                    <div className="p-3 bg-black/50 border border-white/10 rounded-2xl group-hover:border-[hsl(var(--neon-cyan))]/50 transition-colors shadow-inner">
                                        <Briefcase className="w-6 h-6 text-[hsl(var(--neon-cyan))] drop-shadow-[0_0_8px_hsla(var(--neon-cyan),0.8)] transition-all group-hover:scale-110" />
                                    </div>
                                    <div className="flex gap-2">
                                        {job.url && (
                                            <a
                                                href={job.url.startsWith('http') ? job.url : `https://${job.url}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="px-3 py-1.5 bg-black/60 hover:bg-[hsl(var(--neon-cyan))] text-zinc-300 hover:text-black font-semibold text-xs rounded-lg border border-white/10 hover:border-[hsl(var(--neon-cyan))] transition-all flex items-center gap-1 shadow-md hover:shadow-[0_0_15px_hsla(var(--neon-cyan),0.5)]"
                                            >
                                                Source <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        )}
                                        {job.status === 'validated' && (
                                            <span className="px-3 py-1.5 flex items-center bg-[hsl(var(--neon-magenta))]/15 text-[hsl(var(--neon-magenta))] font-bold text-xs rounded-lg border border-[hsl(var(--neon-magenta))]/30 shadow-[0_0_15px_hsla(var(--neon-magenta),0.2)]">
                                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Validated
                                            </span>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-[30px] w-[30px] p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/15 hover:border-red-500/30 border border-transparent rounded-lg transition-all"
                                            onClick={(e) => handleDeleteJob(job.id, e)}
                                            title="Delete Job from Radar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle className="text-2xl text-white font-black mt-3 leading-tight group-hover:bg-clip-text-gradient group-hover:text-transparent transition-all duration-300">{job.title}</CardTitle>
                                <CardDescription className="text-zinc-400 font-medium text-sm mt-1">{job.company}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-6 flex flex-col h-full">
                                <div className="flex flex-wrap gap-2 mt-auto">
                                    {job.employment_type && (
                                        <span className="px-2.5 py-1 bg-white/5 border border-white/10 rounded text-xs text-zinc-300 font-medium break-words">
                                            {job.employment_type}
                                        </span>
                                    )}
                                    {job.location && (
                                        <span className="px-2.5 py-1 bg-zinc-800/80 text-zinc-300 text-xs rounded-md border border-white/10 shadow-inner break-words">
                                            {job.location}
                                        </span>
                                    )}
                                    {job.salary_range && job.salary_range !== "Based on Experience" && (
                                        <span className="px-2.5 py-1 bg-[hsl(var(--neon-green))]/10 text-[hsl(var(--neon-green))] text-xs font-semibold rounded-md border border-[hsl(var(--neon-green))]/20 shadow-inner break-words">
                                            {job.salary_range.replace(/<[^>]*>?/gm, '')}
                                        </span>
                                    )}
                                </div>

                                <div className="flex-grow flex flex-col sm:flex-row items-start sm:items-end justify-between mt-4 pt-4 border-t border-white/10 group-hover:border-white/20 transition-colors gap-3">
                                    <span className="text-xs text-zinc-400 font-medium whitespace-nowrap">Scouted {new Date(job.created_at).toLocaleDateString()}</span>
                                    <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
                                        <Button
                                            variant="ghost"
                                            className="text-xs h-8 text-zinc-400 hover:text-white hover:bg-white/10 px-3 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setExpandedJobId(expandedJobId === job.id ? null : job.id);
                                            }}
                                        >
                                            {expandedJobId === job.id ? 'Hide' : 'View'}
                                        </Button>
                                        <InvestigatorModal companyName={job.company} />
                                        <Button
                                            className="text-xs h-8 bg-gradient-to-r from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-cyan))/80] text-black hover:opacity-90 font-bold px-4 transition-all shadow-[0_0_15px_hsla(var(--neon-cyan),0.4)] hover:shadow-[0_0_25px_hsla(var(--neon-cyan),0.6)]"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                router.push(`/app/resume/${job.id}`);
                                            }}
                                        >
                                            Prep <ChevronRight className="w-3.5 h-3.5 ml-1 hidden sm:block" />
                                        </Button>
                                    </div>
                                </div>

                                {expandedJobId === job.id && (
                                    <div className="mt-4 pt-4 border-t border-white/10 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <h4 className="text-[hsl(var(--neon-green))] text-xs font-bold uppercase tracking-wider mb-2 drop-shadow-md flex items-center">
                                            <FileText className="w-3.5 h-3.5 mr-2" />
                                            Full Job Description
                                        </h4>
                                        <p className="text-sm text-zinc-200 leading-relaxed font-sans bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner whitespace-pre-wrap selection:bg-[hsl(var(--neon-green))]/30 selection:text-white">
                                            {job.description}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        </div>
    )
}
