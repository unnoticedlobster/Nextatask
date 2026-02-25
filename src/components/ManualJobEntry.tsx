'use client'

import { useState, useTransition } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, PlusCircle, Link as LinkIcon, FileText } from "lucide-react"
import { parseAndSaveJob } from "@/app/actions/manual-job"

export function ManualJobEntry({ onJobAdded }: { onJobAdded: (job: any) => void }) {
    const [isOpen, setIsOpen] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [url, setUrl] = useState("")
    const [text, setText] = useState("")
    const [error, setError] = useState<string | null>(null)

    const handleSubmit = (type: 'url' | 'text') => {
        setError(null)
        if (type === 'url' && !url.trim()) {
            setError("Please enter a valid URL.")
            return
        }
        if (type === 'text' && !text.trim()) {
            setError("Please paste the job description text.")
            return
        }

        startTransition(async () => {
            const result = await parseAndSaveJob({
                url: type === 'url' ? url : undefined,
                text: type === 'text' ? text : undefined
            })

            if (result.error) {
                setError(result.error)
            } else if (result.job) {
                onJobAdded(result.job)
                setIsOpen(false)
                setUrl("")
                setText("")
            }
        })
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="bg-black/50 border-[hsl(var(--neon-green))]/40 text-[hsl(var(--neon-green))] hover:bg-[hsl(var(--neon-green))]/10 hover:text-[hsl(var(--neon-green))] hover:border-[hsl(var(--neon-green))]/80 transition-all font-semibold shadow-[0_0_10px_hsla(var(--neon-green),0.2)]"
                >
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Job Manually
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-black/95 border-white/20 text-white shadow-[0_0_50px_hsla(var(--neon-cyan),0.1)] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[hsl(var(--neon-cyan))] to-[hsl(var(--neon-magenta))]">
                        Manual Job Entry
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Found a job elsewhere? Add it to your pipeline here.
                    </DialogDescription>
                </DialogHeader>

                <Tabs defaultValue="url" className="w-full mt-4">
                    <TabsList className="grid w-full grid-cols-2 bg-white/5 border border-white/10 mb-6">
                        <TabsTrigger value="url" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
                            <LinkIcon className="w-4 h-4 mr-2" /> Via Link
                        </TabsTrigger>
                        <TabsTrigger value="text" className="data-[state=active]:bg-white/10 data-[state=active]:text-white text-zinc-400">
                            <FileText className="w-4 h-4 mr-2" /> Paste Text
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="url" className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-zinc-300">Job Posting URL</div>
                            <Input
                                placeholder="https://linkedin.com/jobs/..."
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                className="bg-black border-white/20 focus-visible:ring-[hsl(var(--neon-cyan))] text-white"
                                disabled={isPending}
                            />
                            <p className="text-xs text-zinc-500 italic">Note: Some sites block automated tools. If this fails, use the "Paste Text" tab.</p>
                        </div>
                        {error && <div className="text-red-400 text-sm font-medium">{error}</div>}
                        <Button
                            onClick={() => handleSubmit('url')}
                            disabled={isPending}
                            className="w-full bg-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))]/80 text-black font-bold h-11"
                        >
                            {isPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                            {isPending ? "Extracting & Analyzing..." : "Import Job"}
                        </Button>
                    </TabsContent>

                    <TabsContent value="text" className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-zinc-300">Raw Job Description</div>
                            <Textarea
                                placeholder="Paste the entire text of the job description here..."
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                className="min-h-[200px] bg-black border-white/20 focus-visible:ring-[hsl(var(--neon-cyan))] text-white text-sm whitespace-pre-wrap"
                                disabled={isPending}
                            />
                        </div>
                        {error && <div className="text-red-400 text-sm font-medium">{error}</div>}
                        <Button
                            onClick={() => handleSubmit('text')}
                            disabled={isPending}
                            className="w-full bg-[hsl(var(--neon-cyan))] hover:bg-[hsl(var(--neon-cyan))]/80 text-black font-bold h-11"
                        >
                            {isPending ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : null}
                            {isPending ? "Analyzing Text..." : "Parse & Import"}
                        </Button>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
