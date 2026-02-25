'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { saveProfileActon } from "@/app/actions/profile"
import { useState, useTransition } from "react"
import { Loader2, FileUp, User, Briefcase, GraduationCap, Target } from "lucide-react"

export default function OnboardingClient({ initialData }: { initialData: any }) {
    const [isPending, startTransition] = useTransition()
    const [errorDetails, setErrorDetails] = useState<any>(null)
    const [distance, setDistance] = useState(initialData?.distance_miles || 25)

    const [remoteOnly, setRemoteOnly] = useState(initialData?.remote_only || false)

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        formData.append("distance_miles", distance.toString())
        formData.append("remote_only", remoteOnly ? "on" : "off")

        startTransition(async () => {
            const res = await saveProfileActon(formData)
            if (res?.error) {
                setErrorDetails(res.details || { general: res.error })
            }
        })
    }

    return (
        <div className="min-h-screen text-white flex items-center justify-center p-4 relative py-12">
            <Card className="w-full max-w-2xl text-foreground glass-panel glass-panel-hover relative z-10 overflow-hidden border-0">
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[hsl(var(--neon-cyan))] to-transparent opacity-80" />
                <CardHeader>
                    <CardTitle className="text-2xl text-white font-bold tracking-tight">Nexatask Profile Setup</CardTitle>
                    <CardDescription className="text-zinc-300">
                        Securely configure your base professional parameters. Data is isolated privately for your account.
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-24">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Core Targeting */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner space-y-6">
                            <h3 className="text-sm font-bold text-[hsl(var(--neon-cyan))] text-glow-cyan flex items-center">
                                <Target className="w-4 h-4 mr-2" /> Targeting Parameters
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-zinc-300">Target Designation (Name)</Label>
                                    <Input id="name" name="name" required defaultValue={initialData?.name || ""} placeholder="John Doe" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                                    {errorDetails?.name && <p className="text-red-400 text-xs">{errorDetails.name}</p>}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="location" className="text-zinc-300">Sector Location (City, State)</Label>
                                    <Input id="location" name="location" required defaultValue={initialData?.location || ""} placeholder="Pinellas County, FL" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="target_roles" className="text-zinc-300">Target Operating Roles</Label>
                                <Input id="target_roles" name="target_roles" required defaultValue={initialData?.target_roles?.join(', ') || ""} placeholder="Cloud Engineer, SOC Analyst (Comma separated)" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner">
                            <div className="space-y-4">
                                <Label className="text-zinc-200">Job Search Mode</Label>
                                <div className="flex items-center space-x-3 bg-black/30 p-2 rounded-lg border border-white/5 w-fit">
                                    <Label htmlFor="remote_only" className={`text-sm cursor-pointer ${!remoteOnly ? 'text-[hsl(var(--neon-cyan))] font-bold' : 'text-zinc-500'}`}>Local / In-Person</Label>
                                    <Switch id="remote_only" checked={remoteOnly} onCheckedChange={setRemoteOnly} className="data-[state=checked]:bg-[hsl(var(--neon-magenta))] data-[state=unchecked]:bg-[hsl(var(--neon-cyan))]" />
                                    <Label htmlFor="remote_only" className={`text-sm cursor-pointer ${remoteOnly ? 'text-[hsl(var(--neon-magenta))] font-bold' : 'text-zinc-500'}`}>Remote Only</Label>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex justify-between">
                                    <Label className="text-zinc-200">Target Commute Radius</Label>
                                    <span className="text-[hsl(var(--neon-cyan))] text-xs font-mono font-bold text-glow-cyan">{distance} mins</span>
                                </div>
                                <Slider
                                    defaultValue={[distance]}
                                    max={120}
                                    min={5}
                                    step={5}
                                    onValueChange={(vals) => setDistance(vals[0])}
                                    className="pt-2"
                                    disabled={remoteOnly}
                                />
                                <p className="text-xs text-zinc-400 italic">Commute time is disabled for remote searches.</p>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner space-y-6">
                            <h3 className="text-sm font-bold text-[hsl(var(--neon-green))] text-glow-green flex items-center">
                                <User className="w-4 h-4 mr-2" /> Contact & Links
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="contact_email" className="text-zinc-300">Email Address</Label>
                                    <Input id="contact_email" name="contact_email" type="email" defaultValue={initialData?.contact_email || ""} placeholder="john@example.com" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contact_phone" className="text-zinc-300">Phone Number</Label>
                                    <Input id="contact_phone" name="contact_phone" defaultValue={initialData?.contact_phone || ""} placeholder="(555) 123-4567" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="portfolio_links" className="text-zinc-300">Websites / LinkedIn / Portfolio</Label>
                                <Input id="portfolio_links" name="portfolio_links" defaultValue={initialData?.portfolio_links || ""} placeholder="https://linkedin.com/in/..., https://github.com/..." className="bg-black/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                            </div>
                        </div>

                        {/* Profile Base Content */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner space-y-6">
                            <h3 className="text-sm font-bold text-white flex items-center drop-shadow-md">
                                <Briefcase className="w-4 h-4 mr-2" /> Professional Experience & Skills
                            </h3>

                            <div className="space-y-2">
                                <Label htmlFor="skills" className="text-zinc-300">Core Competencies & Technical Skills</Label>
                                <Textarea id="skills" name="skills" defaultValue={initialData?.skills || ""} placeholder="AWS, Python, React, Cybersecurity, Agile Methodologies, CI/CD..." className="bg-black/50 border-white/10 text-white min-h-[80px] placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="work_experience" className="text-zinc-300">Work Experience (Chronological)</Label>
                                <Textarea id="work_experience" name="work_experience" defaultValue={initialData?.work_experience || ""} placeholder={`Senior Engineer @ Acme Corp (Jan 2020 - Present)\n- Led migration to AWS...\n\nSoftware Engineer @ Startup (Feb 2018 - Dec 2019)\n- Developed React frontend...`} className="bg-black/50 border-white/10 text-white min-h-[160px] placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                            </div>
                        </div>

                        {/* Education & Certs */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner space-y-6">
                            <h3 className="text-sm font-bold text-[hsl(var(--neon-green))] text-glow-green flex items-center">
                                <GraduationCap className="w-4 h-4 mr-2" /> Education & Certifications
                            </h3>
                            <div className="space-y-2">
                                <Label htmlFor="education" className="text-zinc-300">Degrees Earned</Label>
                                <Textarea id="education" name="education" required defaultValue={initialData?.education || ""} placeholder="University of Washington - B.S. Computer Science" className="bg-black/50 border-white/10 text-white min-h-[80px] placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="certifications" className="text-zinc-300">Active Certifications (Comma separated)</Label>
                                <Input id="certifications" name="certifications" defaultValue={initialData?.certifications?.join(', ') || ""} placeholder="CompTIA A+, AWS Solutions Architect Associate" className="bg-black/50 border-white/10 text-white placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                                <p className="text-xs text-zinc-400 mt-1">Our AI will automatically derive acquired skills from these credentials.</p>
                            </div>
                        </div>

                        {/* Master Document Uploads (Fallback/Additional Context) */}
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 shadow-inner space-y-4">
                            <h3 className="text-sm font-bold text-[hsl(var(--neon-magenta))] text-glow-magenta flex items-center">
                                <FileUp className="w-4 h-4 mr-2" />
                                Additional Context (Master Documents)
                            </h3>
                            <p className="text-xs text-zinc-300">Optional: Upload an existing resume or cover letter. Our AI will use this to supplement the structured data above.</p>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="master_resume_file" className="text-zinc-200 text-xs mb-1 block">Upload Master Resume (PDF, DOCX)</Label>
                                    <Input id="master_resume_file" name="master_resume_file" type="file" accept=".pdf,.docx,.txt" className="bg-black/50 border-white/10 text-zinc-300 file:text-white file:bg-white/10 file:font-medium file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 cursor-pointer hover:border-white/20 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="master_resume" className="text-zinc-200 text-xs">Or Master Resume (Raw Text)</Label>
                                    <Textarea id="master_resume" name="master_resume" defaultValue={initialData?.master_resume || ""} placeholder="Paste your entire current resume here..." className="bg-black/50 border-white/10 text-white min-h-[100px] placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                                </div>
                            </div>

                            <hr className="border-white/10" />

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="master_cover_letter_file" className="text-zinc-200 text-xs mb-1 block">Upload Master Cover Letter (PDF, DOCX)</Label>
                                    <Input id="master_cover_letter_file" name="master_cover_letter_file" type="file" accept=".pdf,.docx,.txt" className="bg-black/50 border-white/10 text-zinc-300 file:text-white file:bg-white/10 file:font-medium file:border-0 file:rounded-md file:mr-4 file:px-4 file:py-1 cursor-pointer hover:border-white/20 transition-colors" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="master_cover_letter" className="text-zinc-200 text-xs">Or Master Cover Letter (Raw Text)</Label>
                                    <Textarea id="master_cover_letter" name="master_cover_letter" defaultValue={initialData?.master_cover_letter || ""} placeholder="Paste a baseline cover letter or writing sample here..." className="bg-black/50 border-white/10 text-white min-h-[100px] placeholder:text-zinc-500 focus:border-white/30 transition-colors" />
                                </div>
                            </div>
                        </div>

                        {errorDetails?.general && <p className="text-red-400 text-sm font-medium">{errorDetails.general}</p>}

                        <div className="fixed sm:absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-md border-t border-white/5 z-50">
                            <Button type="submit" disabled={isPending} className="w-full max-w-2xl mx-auto block bg-gradient-to-r from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-cyan))/80] text-black font-bold hover:opacity-90 transition-all h-12 text-md shadow-[0_0_20px_hsla(var(--neon-cyan),0.4)] hover:shadow-[0_0_30px_hsla(var(--neon-cyan),0.6)]">
                                <div className="flex items-center justify-center h-full">
                                    {isPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                                    {isPending ? "Validating & Encrypting..." : (initialData ? "Update Profile Information" : "Save and Continue")}
                                </div>
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
