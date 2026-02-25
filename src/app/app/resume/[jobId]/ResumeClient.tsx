'use client'

import { useState, useTransition } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { runWriterAgent } from "@/app/actions/writer"
import { runValidatorAgent } from "@/app/actions/validator"
import { Loader2, Play, ShieldAlert, CheckCircle, AlertTriangle, FileText, Download, ArrowLeft, Target, MessageSquare, HelpCircle, Briefcase, ChevronRight } from "lucide-react"
import { useRouter } from "next/navigation"

export default function ResumeClient({ job }: { job: any }) {
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState(job.status)
    const [resumeData, setResumeData] = useState<any>(job.resume_content ? JSON.parse(job.resume_content) : null)
    const [report, setReport] = useState(job.validation_report)
    const [errorDetails, setErrorDetails] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'resume' | 'cover_letter'>('resume')

    const handleWrite = () => {
        setErrorDetails(null)
        startTransition(async () => {
            const res = await runWriterAgent(job.id)
            if (res?.error) setErrorDetails(res.error)
            else if (res?.status) {
                setStatus(res.status)
                if (res.resumeContent) setResumeData(JSON.parse(res.resumeContent))
            }
        })
    }

    const handleValidate = () => {
        setErrorDetails(null)
        startTransition(async () => {
            const res = await runValidatorAgent(job.id)
            if (res?.error) setErrorDetails(res.error)
            else if (res?.status) {
                setStatus(res.status)
                setReport(res.report)
            }
        })
    }

    let parsedReport: any = null;
    let rawReportText = report;
    if (typeof report === 'string' && report.trim().startsWith('{')) {
        try {
            parsedReport = JSON.parse(report);
            rawReportText = parsedReport.report;
        } catch (e) {
            console.error("Failed to parse validation report JSON", e);
        }
    }

    return (
        <div className="min-h-screen text-white p-4 md:p-8 relative overflow-x-hidden">
            <div className="max-w-7xl mx-auto space-y-8 relative z-10">

                <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-white/10 gap-4 transition-all">
                    <div className="cursor-pointer group flex items-center" onClick={() => router.push('/app/dashboard')}>
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-magenta))] p-[2px] mr-4 shadow-[0_0_15px_hsla(var(--neon-cyan),0.4)] group-hover:shadow-[0_0_25px_hsla(var(--neon-magenta),0.6)] transition-all">
                            <div className="w-full h-full bg-black rounded-lg flex items-center justify-center">
                                <ArrowLeft className="w-5 h-5 text-white group-hover:-translate-x-1 transition-transform" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-magenta))] mb-1 tracking-tighter drop-shadow-lg transition-all">Nexatask</h1>
                            <p className="text-zinc-400 font-medium text-sm tracking-wide group-hover:text-zinc-300 transition-colors">Return to Dashboard</p>
                        </div>
                    </div>
                </header>

                <div className="pb-6 border-b border-white/10 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-magenta))] mb-2 tracking-tighter drop-shadow-lg">{job.title}</h1>
                        <p className="text-zinc-300 font-medium tracking-wide flex items-center">
                            <Briefcase className="w-4 h-4 mr-2 text-[hsl(var(--neon-cyan))]" /> {job.company}
                        </p>
                    </div>

                    <div className="flex gap-3">
                        {job.employment_type && (
                            <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl flex items-center shadow-inner">
                                <span className="text-sm text-zinc-300 font-semibold">{job.employment_type}</span>
                            </div>
                        )}
                        {job.salary_range && (
                            <div className="px-4 py-2 bg-[hsl(var(--neon-green))]/10 border border-[hsl(var(--neon-green))]/30 rounded-xl flex items-center shadow-[0_0_15px_hsla(var(--neon-green),0.1)]">
                                <span className="text-sm text-[hsl(var(--neon-green))] font-bold tracking-wide">{job.salary_range}</span>
                            </div>
                        )}
                    </div>
                </div>

                {errorDetails && (
                    <div className="p-4 bg-red-900/20 border border-red-900 rounded-xl text-red-400 text-sm flex items-center shadow-lg">
                        <AlertTriangle className="w-5 h-5 mr-3" />
                        {errorDetails}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Actions & Insights */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* Execution Sequence Card */}
                        <Card className="glass-panel glass-panel-hover">
                            <CardHeader>
                                <CardTitle className="text-lg text-white font-bold tracking-tight">Execution Sequence</CardTitle>
                                <CardDescription className="text-zinc-300">Generate, tailor, and validate your application materials.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className={'p-4 rounded-xl border transition-all duration-500 ' + (status === 'scouted' || status === 'failed_validation' ? 'border-[hsl(var(--neon-cyan))]/50 bg-[hsl(var(--neon-cyan))]/10 shadow-[0_0_15px_hsla(var(--neon-cyan),0.2)]' : 'border-white/10 bg-black/40 text-zinc-500')}>
                                    <h3 className="text-sm font-semibold mb-3 flex items-center">
                                        1. AI Resume Writer
                                        {status !== 'scouted' && status !== 'failed_validation' && <CheckCircle className="w-4 h-4 ml-2 text-[hsl(var(--neon-cyan))] drop-shadow-[0_0_5px_hsla(var(--neon-cyan),0.8)]" />}
                                    </h3>
                                    <Button
                                        onClick={handleWrite}
                                        disabled={isPending || (status !== 'scouted' && status !== 'failed_validation')}
                                        className="w-full bg-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))]/80 text-black font-extrabold shadow-[0_0_15px_hsla(var(--neon-cyan),0.4)] hover:shadow-[0_0_25px_hsla(var(--neon-cyan),0.6)] transition-all h-10 text-sm"
                                    >
                                        {isPending && (status === 'scouted' || status === 'failed_validation') ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
                                        {status === 'scouted' ? 'Generate Tailored Resume' : 'Regenerate Resume'}
                                    </Button>
                                </div>

                                <div className={'p-4 rounded-xl border transition-all duration-500 ' + (status === 'written' || status === 'validated' ? 'border-[hsl(var(--neon-magenta))]/50 bg-[hsl(var(--neon-magenta))]/10 shadow-[0_0_15px_hsla(var(--neon-magenta),0.2)]' : 'border-white/10 bg-black/40 text-zinc-500')}>
                                    <h3 className="text-sm font-semibold mb-3 flex items-center">
                                        2. Quality Check
                                        {status === 'validated' && <CheckCircle className="w-4 h-4 ml-2 text-[hsl(var(--neon-cyan))] drop-shadow-[0_0_5px_hsla(var(--neon-cyan),0.8)]" />}
                                    </h3>
                                    <Button
                                        onClick={handleValidate}
                                        disabled={isPending || (status !== 'written' && status !== 'validated')}
                                        className="w-full bg-[hsl(var(--neon-magenta))] hover:bg-[hsl(var(--neon-magenta))]/80 text-black font-extrabold shadow-[0_0_15px_hsla(var(--neon-magenta),0.4)] hover:shadow-[0_0_25px_hsla(var(--neon-magenta),0.6)] transition-all h-10 text-sm"
                                    >
                                        {isPending && (status === 'written' || status === 'validated') ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                                        {status === 'validated' ? 'Run Quality Check Again' : 'Run Quality Check'}
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Strategist Insights (Only show if written/validated) */}
                        {resumeData && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                                {/* Match Score */}
                                <Card className="glass-panel glass-panel-hover overflow-hidden relative border-white/10 group">
                                    <div className="absolute right-0 top-0 w-32 h-32 bg-[hsl(var(--neon-cyan))]/10 blur-3xl pointer-events-none rounded-full transition-all group-hover:scale-150 group-hover:bg-[hsl(var(--neon-cyan))]/20" />
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-md flex items-center text-[hsl(var(--neon-cyan))] text-glow-cyan">
                                            <Target className="w-4 h-4 mr-2" /> ATS Match Analysis
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-end justify-between mb-4">
                                            <div className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-white to-zinc-400 drop-shadow-md">
                                                {resumeData.match_score}<span className="text-2xl text-zinc-500 font-normal">/100</span>
                                            </div>
                                            <div className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] font-bold">Match Score</div>
                                        </div>

                                        {resumeData.missing_keywords && resumeData.missing_keywords.length > 0 && (
                                            <div className="pt-4 border-t border-white/10">
                                                <p className="text-xs text-zinc-300 mb-3 font-semibold tracking-wide">Missing Keywords (Gap Analysis):</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {resumeData.missing_keywords.map((kw: string, i: number) => (
                                                        <span key={i} className="px-2.5 py-1 bg-red-500/10 text-red-400 border border-red-500/30 rounded-md text-[11px] font-mono shadow-inner hover:bg-red-500/20 transition-colors cursor-default">
                                                            {kw}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>

                                {/* LinkedIn Outreach */}
                                {resumeData.linkedin_outreach && (
                                    <Card className="glass-panel glass-panel-hover border-white/10 group">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-md flex items-center text-[hsl(var(--neon-magenta))] text-glow-magenta">
                                                <MessageSquare className="w-4 h-4 mr-2" /> Recruiter Outreach Draft
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="p-4 bg-black/40 rounded-xl border border-white/10 shadow-inner group-hover:border-[hsl(var(--neon-magenta))]/30 transition-colors">
                                                <p className="text-sm text-zinc-200 italic leading-relaxed">
                                                    "{resumeData.linkedin_outreach}"
                                                </p>
                                                <div className="mt-3 flex justify-end">
                                                    <Button variant="ghost" size="sm" className="h-8 text-xs text-zinc-400 hover:text-white hover:bg-white/10" onClick={() => navigator.clipboard.writeText(resumeData.linkedin_outreach)}>
                                                        Copy to Clipboard
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}

                                {/* Interview Prep */}
                                {resumeData.interview_question && (
                                    <Card className="glass-panel glass-panel-hover border-white/10 group">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-md flex items-center text-[hsl(var(--neon-green))]">
                                                <HelpCircle className="w-4 h-4 mr-2" /> Anticipated Interview Question
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-zinc-200 bg-[hsl(var(--neon-green))]/5 p-4 rounded-xl border border-[hsl(var(--neon-green))]/20 shadow-inner group-hover:border-[hsl(var(--neon-green))]/40 transition-colors">
                                                {resumeData.interview_question}
                                            </p>
                                        </CardContent>
                                    </Card>
                                )}

                            </div>
                        )}

                        {/* Validation Report & ATS Analytics */}
                        {report && (
                            <div className="space-y-6">
                                {parsedReport?.analysis && status === 'validated' && (
                                    <Card className="glass-panel border-2 border-[hsl(var(--neon-green))]/50 bg-gradient-to-br from-[hsl(var(--neon-green))]/10 to-transparent backdrop-blur-3xl shadow-[0_0_30px_hsla(var(--neon-green),0.2)] overflow-hidden relative group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--neon-green))]/20 blur-[80px] rounded-full pointer-events-none group-hover:bg-[hsl(var(--neon-green))]/30 transition-colors duration-700" />
                                        <CardHeader className="pb-2 border-b border-white/10 relative z-10">
                                            <CardTitle className="text-lg font-bold tracking-tight text-[hsl(var(--neon-green))] text-glow-green flex items-center">
                                                <Target className="w-5 h-5 mr-3" />
                                                ATS Transformation Analytics
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-6 relative z-10 space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 shadow-inner flex flex-col items-center justify-center text-center">
                                                    <span className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-2">Master Resume</span>
                                                    <div className="text-4xl font-extrabold text-zinc-300">
                                                        {parsedReport.analysis.before_score}<span className="text-lg text-zinc-600 font-normal">/100</span>
                                                    </div>
                                                </div>
                                                <div className="bg-[hsl(var(--neon-green))]/10 p-4 rounded-2xl border border-[hsl(var(--neon-green))]/30 shadow-[0_0_15px_hsla(var(--neon-green),0.1)] flex flex-col items-center justify-center text-center relative overflow-hidden">
                                                    <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--neon-green))]/10 to-transparent pointer-events-none" />
                                                    <span className="text-[hsl(var(--neon-green))] text-xs font-bold uppercase tracking-widest mb-2 flex items-center">
                                                        <ChevronRight className="w-3 h-3 mr-1" /> Tailored Payload
                                                    </span>
                                                    <div className="text-5xl font-extrabold text-white drop-shadow-[0_0_10px_hsla(var(--neon-green),0.8)] relative z-10">
                                                        {parsedReport.analysis.after_score}<span className="text-xl text-[hsl(var(--neon-green))]/60 font-normal">/100</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {parsedReport.analysis.skill_gaps_closed && parsedReport.analysis.skill_gaps_closed.length > 0 && (
                                                <div className="pt-2">
                                                    <h4 className="text-xs text-zinc-300 font-bold tracking-wider mb-3 flex items-center">
                                                        <CheckCircle className="w-3.5 h-3.5 mr-2 text-[hsl(var(--neon-green))]" />
                                                        Skill Gaps Closed
                                                    </h4>
                                                    <div className="flex flex-wrap gap-2">
                                                        {parsedReport.analysis.skill_gaps_closed.map((gap: string, i: number) => (
                                                            <span key={i} className="px-3 py-1.5 bg-[hsl(var(--neon-green))]/20 text-[hsl(var(--neon-green))] border border-[hsl(var(--neon-green))]/40 rounded-lg text-xs font-bold shadow-inner">
                                                                {gap}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                )}

                                <Card className={`glass-panel glass-panel-hover border-2 shadow-[0_0_30px_rgba(0,0,0,0.5)] ${status === 'validated' ? 'border-[hsl(var(--neon-cyan))]/50 bg-[hsl(var(--neon-cyan))]/5 shadow-[0_0_20px_hsla(var(--neon-cyan),0.1)]' : 'border-red-500/50 bg-red-500/5'}`}>
                                    <CardHeader>
                                        <CardTitle className={`text-lg font-bold tracking-tight ${status === 'validated' ? 'text-[hsl(var(--neon-cyan))] text-glow-cyan' : 'text-red-400'} flex items-center`}>
                                            {status === 'validated' ? <ShieldAlert className="w-5 h-5 mr-3" /> : <AlertTriangle className="w-5 h-5 mr-3" />}
                                            Quality Gate Report
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed bg-black/40 p-4 rounded-xl border border-white/5 shadow-inner">
                                            {rawReportText}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Markdown Preview */}
                    <div className="lg:col-span-8">
                        <Card className="glass-panel border-white/10 min-h-[800px] relative overflow-hidden shadow-2xl flex flex-col">
                            <CardHeader className="border-b border-white/10 flex flex-row items-center justify-between pb-4 bg-black/40 backdrop-blur-md sticky top-0 z-20">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <FileText className="w-5 h-5 mr-3 text-[hsl(var(--neon-cyan))] drop-shadow-[0_0_5px_hsla(var(--neon-cyan),0.8)]" />
                                        <CardTitle className="text-lg text-white font-bold flex items-center tracking-tight">Target Payload</CardTitle>
                                    </div>
                                    <div className="flex bg-black/60 border border-white/10 rounded-lg p-1 shadow-inner">
                                        <button
                                            onClick={() => setActiveTab('resume')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'resume' ? 'bg-[hsl(var(--neon-cyan))]/20 text-[hsl(var(--neon-cyan))] shadow-[0_0_10px_hsla(var(--neon-cyan),0.2)]' : 'text-zinc-400 hover:text-white'}`}
                                        >
                                            Tailored Resume
                                        </button>
                                        <button
                                            onClick={() => setActiveTab('cover_letter')}
                                            className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'cover_letter' ? 'bg-[hsl(var(--neon-magenta))]/20 text-[hsl(var(--neon-magenta))] shadow-[0_0_10px_hsla(var(--neon-magenta),0.2)]' : 'text-zinc-400 hover:text-white'}`}
                                        >
                                            Cover Letter
                                        </button>
                                    </div>
                                </div>
                                {status === 'validated' && resumeData && (
                                    <Button size="sm" className="bg-white hover:bg-zinc-200 text-black font-extrabold shadow-[0_0_15px_rgba(255,255,255,0.4)] transition-all" onClick={() => navigator.clipboard.writeText(activeTab === 'resume' ? resumeData.resume_markdown : (resumeData.cover_letter_markdown || ''))}>
                                        <Download className="w-4 h-4 mr-2" /> Copy Markdown
                                    </Button>
                                )}
                            </CardHeader>
                            <CardContent className="p-0 flex-grow relative bg-transparent">
                                {!resumeData ? (
                                    <div className="flex flex-col items-center justify-center p-32 text-zinc-500 italic space-y-4 h-full">
                                        <div className="w-24 h-24 rounded-full border border-white/5 flex items-center justify-center bg-black/20 shadow-inner backdrop-blur-sm">
                                            <FileText className="w-10 h-10 text-zinc-700" />
                                        </div>
                                        <p className="tracking-wide">Data unavailable. Engage Strategist Agent to compute parameters.</p>
                                    </div>
                                ) : (
                                    <div className="p-8 relative min-h-full">
                                        {status !== 'validated' && (
                                            <div className="absolute inset-0 backdrop-blur-[6px] bg-black/40 z-10 flex items-center justify-center rounded-b-xl border-t border-white/5">
                                                <div className="bg-black/90 px-8 py-5 rounded-2xl border border-[hsl(var(--neon-magenta))]/50 shadow-[0_0_30px_hsla(var(--neon-magenta),0.3)] flex items-center text-[hsl(var(--neon-magenta))] text-glow-magenta font-bold">
                                                    <ShieldAlert className="w-6 h-6 mr-4" />
                                                    Payload Restricted: Awaiting Validator Gate
                                                </div>
                                            </div>
                                        )}
                                        <div className="prose prose-invert prose-zinc max-w-none">
                                            <pre className="text-[13px] text-zinc-200 font-sans whitespace-pre-wrap leading-relaxed max-w-full bg-transparent p-0 border-0">
                                                {activeTab === 'resume' ? resumeData.resume_markdown : (resumeData.cover_letter_markdown || 'No cover letter generated yet. Please re-run the Strategist Agent.')}
                                            </pre>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
