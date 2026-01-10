"use client"

import * as React from "react"
import { createClient } from "@/utils/supabase/client"
import { Loader2, Paperclip, Send, X } from "lucide-react"

const STORAGE_KEY = "admin_email_composer_draft"

export function EmailComposer() {
    const [loading, setLoading] = React.useState(false)
    const [success, setSuccess] = React.useState(false)
    const [error, setError] = React.useState("")

    // Form State with localStorage persistence
    const [toName, setToName] = React.useState("")
    const [toEmail, setToEmail] = React.useState("")
    const [fromName, setFromName] = React.useState("IBBE Operations")
    const [fromEmailPrefix, setFromEmailPrefix] = React.useState("updates") // Only the prefix before @postman.ibbe.in
    const [subject, setSubject] = React.useState("")
    const [htmlBody, setHtmlBody] = React.useState("<h1>Hello</h1><p>Write your message here...</p>")
    const [attachments, setAttachments] = React.useState<File[]>([])
    const [uploadedUrls, setUploadedUrls] = React.useState<string[]>([])

    const supabase = createClient()

    // Fixed domain
    const EMAIL_DOMAIN = "@postman.ibbe.in"
    const fullFromEmail = `${fromEmailPrefix}${EMAIL_DOMAIN}`

    // Load saved draft from localStorage on mount
    React.useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
            try {
                const draft = JSON.parse(saved)
                if (draft.toName) setToName(draft.toName)
                if (draft.toEmail) setToEmail(draft.toEmail)
                if (draft.fromName) setFromName(draft.fromName)
                if (draft.fromEmailPrefix) setFromEmailPrefix(draft.fromEmailPrefix)
                if (draft.subject) setSubject(draft.subject)
                if (draft.htmlBody) setHtmlBody(draft.htmlBody)
            } catch (e) {
                // Ignore parse errors
            }
        }
    }, [])

    // Auto-save to localStorage whenever form changes
    React.useEffect(() => {
        const draft = {
            toName,
            toEmail,
            fromName,
            fromEmailPrefix,
            subject,
            htmlBody,
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
    }, [toName, toEmail, fromName, fromEmailPrefix, subject, htmlBody])

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setAttachments(prev => [...prev, ...Array.from(e.target.files || [])])
        }
    }

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index))
    }

    const uploadAttachments = async () => {
        const urls: string[] = []
        for (const file of attachments) {
            const fileName = `${Date.now()}-${file.name}`
            const { data, error } = await supabase.storage
                .from('mail_attachments')
                .upload(fileName, file)

            if (error) {
                const errorMsg = error.message || JSON.stringify(error)
                console.error("Upload failed:", errorMsg, error)
                throw new Error(`Failed to upload ${file.name}: ${errorMsg}`)
            }

            const { data: { publicUrl } } = supabase.storage
                .from('mail_attachments')
                .getPublicUrl(fileName)

            urls.push(publicUrl)
        }
        return urls
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess(false)

        try {
            // 1. Upload Attachments
            let currentUploadedUrls = uploadedUrls
            if (attachments.length > 0) {
                const newUrls = await uploadAttachments()
                currentUploadedUrls = [...uploadedUrls, ...newUrls]
                setUploadedUrls(currentUploadedUrls)
            }

            // 2. Construct Final HTML with Attachments
            let finalHtml = htmlBody
            if (currentUploadedUrls.length > 0) {
                finalHtml += `<br/><hr/><p><strong>Attachments:</strong></p><ul>`
                currentUploadedUrls.forEach((url, index) => {
                    const fileName = attachments[index]?.name || `Attachment ${index + 1}`
                    finalHtml += `<li><a href="${url}">${fileName}</a></li>`
                })
                finalHtml += `</ul>`
            }

            // 3. Send Email via Supabase Edge Function
            const { data: result, error: fnError } = await supabase.functions.invoke('send-admin-mail', {
                body: {
                    toName,
                    toEmail,
                    fromName,
                    fromEmail: fullFromEmail,
                    subject,
                    html: finalHtml
                }
            })

            if (fnError) {
                throw new Error(fnError.message || "Edge function error")
            }

            if (!result?.success) {
                throw new Error(result?.error || "Failed to send email")
            }

            setSuccess(true)
            // Reset only message-specific fields, keep sender config
            setToName("")
            setToEmail("")
            setSubject("")
            setHtmlBody("<h1>Hello</h1><p>Write your message here...</p>")
            setAttachments([])
            setUploadedUrls([])
            // Clear localStorage on success
            localStorage.removeItem(STORAGE_KEY)

        } catch (err: any) {
            console.error("Email submission error:", err)
            let errorMessage = "Something went wrong"
            if (typeof err === 'string') {
                errorMessage = err
            } else if (err?.message) {
                errorMessage = err.message
            } else if (err?.error) {
                errorMessage = typeof err.error === 'string' ? err.error : JSON.stringify(err.error)
            } else if (typeof err === 'object') {
                errorMessage = JSON.stringify(err)
            }
            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    // Handlers for quick inserts into HTML
    const insertHtml = (tag: string) => {
        setHtmlBody(prev => `${prev}\n<${tag}>New ${tag}</${tag}>`)
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Composer Form */}
            <div className="space-y-6">
                <div className="bg-[#F4F4F5] p-6 rounded-2xl border-2 border-orbital-ink">
                    <h3 className="font-black italic uppercase text-lg mb-4">Recipient Details</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-mono font-bold uppercase text-gray-500">To Name</label>
                            <input
                                type="text"
                                value={toName}
                                onChange={e => setToName(e.target.value)}
                                className="w-full bg-white border-2 border-gray-300 focus:border-orbital-ink rounded-lg px-3 py-2 font-mono text-sm outline-none transition-colors"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-mono font-bold uppercase text-gray-500">To Email</label>
                            <input
                                type="email"
                                value={toEmail}
                                onChange={e => setToEmail(e.target.value)}
                                className="w-full bg-white border-2 border-gray-300 focus:border-orbital-ink rounded-lg px-3 py-2 font-mono text-sm outline-none transition-colors"
                                placeholder="john@example.com"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-[#FFD60A] p-6 rounded-2xl border-2 border-orbital-ink relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Send size={100} />
                    </div>
                    <h3 className="font-black italic uppercase text-lg mb-4">Sender Config</h3>
                    <div className="grid grid-cols-2 gap-4 relative z-10">
                        <div className="space-y-1">
                            <label className="text-xs font-mono font-bold uppercase text-orbital-ink/60">From Name</label>
                            <input
                                type="text"
                                value={fromName}
                                onChange={e => setFromName(e.target.value)}
                                className="w-full bg-white/50 border-2 border-orbital-ink/20 focus:border-orbital-ink rounded-lg px-3 py-2 font-mono text-sm outline-none transition-colors"
                                placeholder="IBBE Ops"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-mono font-bold uppercase text-orbital-ink/60">From Email</label>
                            <div className="flex">
                                <input
                                    type="text"
                                    value={fromEmailPrefix}
                                    onChange={e => setFromEmailPrefix(e.target.value.replace(/[^a-zA-Z0-9._-]/g, ''))}
                                    className="flex-1 bg-white/50 border-2 border-orbital-ink/20 focus:border-orbital-ink rounded-l-lg px-3 py-2 font-mono text-sm outline-none transition-colors"
                                    placeholder="updates"
                                />
                                <span className="bg-orbital-ink text-white px-3 py-2 font-mono text-sm font-bold rounded-r-lg border-2 border-orbital-ink">
                                    {EMAIL_DOMAIN}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-mono font-bold uppercase text-gray-500">Subject Line</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                            className="w-full bg-white border-2 border-orbital-ink rounded-xl px-4 py-3 font-bold text-lg outline-none shadow-[4px_4px_0px_0px_#000] focus:translate-y-[2px] focus:shadow-[2px_2px_0px_0px_#000] transition-all"
                            placeholder="Important Update..."
                        />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-mono font-bold uppercase text-gray-500">HTML Body</label>
                            <div className="flex gap-2">
                                <button onClick={() => insertHtml('b')} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300 font-bold">B</button>
                                <button onClick={() => insertHtml('i')} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300 italic">I</button>
                                <button onClick={() => insertHtml('h2')} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300 font-bold">H2</button>
                                <button onClick={() => insertHtml('hr')} className="px-2 py-0.5 text-xs bg-gray-200 rounded hover:bg-gray-300">HR</button>
                            </div>
                        </div>
                        <textarea
                            value={htmlBody}
                            onChange={e => setHtmlBody(e.target.value)}
                            className="w-full h-64 bg-white border-2 border-gray-300 focus:border-orbital-ink rounded-xl px-4 py-3 font-mono text-sm outline-none transition-colors resize-none"
                        />
                    </div>

                    <div>
                        <input
                            type="file"
                            id="attachments"
                            multiple
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <label
                            htmlFor="attachments"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-orbital-ink rounded-lg cursor-pointer hover:bg-gray-50 font-bold text-sm shadow-[2px_2px_0px_0px_#000] active:translate-y-[2px] active:shadow-none transition-all"
                        >
                            <Paperclip size={16} />
                            Add Attachments
                        </label>

                        {attachments.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                                {attachments.map((file, i) => (
                                    <div key={i} className="flex items-center gap-1 bg-gray-100 px-3 py-1 rounded-full text-xs font-mono border border-gray-200">
                                        <span className="max-w-[150px] truncate">{file.name}</span>
                                        <button onClick={() => removeAttachment(i)} className="text-gray-400 hover:text-red-500">
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || !toEmail || !subject}
                    className="w-full bg-orbital-ink hover:bg-black text-white font-bold text-xl py-4 rounded-xl shadow-[6px_6px_0px_0px_#2962FF] active:translate-y-[2px] active:shadow-[4px_4px_0px_0px_#2962FF] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Send />}
                    SEND TRANSMISSION
                </button>

                {success && (
                    <div className="bg-green-100 text-green-800 p-4 rounded-xl border-2 border-green-800 flex items-center gap-2">
                        <span className="text-xl">✅</span>
                        <span className="font-bold">Message deployed successfully.</span>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 text-red-800 p-4 rounded-xl border-2 border-red-800 flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span className="font-bold">Error: {error}</span>
                    </div>
                )}
            </div>

            {/* Live Preview */}
            <div className="space-y-4">
                <h3 className="font-black italic uppercase text-lg text-gray-400">Live Preview</h3>
                <div className="bg-white border-[3px] border-orbital-ink rounded-[2rem] overflow-hidden shadow-[8px_8px_0px_0px_#1D1D1F] min-h-[600px] flex flex-col">
                    <div className="bg-gray-100 border-b border-gray-200 p-4 space-y-2">
                        <div className="flex gap-2 text-sm">
                            <span className="text-gray-500 font-mono w-16">From:</span>
                            <span className="font-medium">{fromName} &lt;{fullFromEmail}&gt;</span>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <span className="text-gray-500 font-mono w-16">To:</span>
                            <span className="font-medium">{toName} &lt;{toEmail}&gt;</span>
                        </div>
                        <div className="flex gap-2 text-sm">
                            <span className="text-gray-500 font-mono w-16">Subject:</span>
                            <span className="font-bold">{subject || "(No Subject)"}</span>
                        </div>
                    </div>
                    <div className="flex-1 p-8 prose max-w-none prose-headings:font-black prose-a:text-blue-600">
                        <div dangerouslySetInnerHTML={{ __html: htmlBody }} />

                        {attachments.length > 0 && (
                            <div className="mt-8 pt-8 border-t-2 border-gray-100">
                                <p className="font-bold text-sm uppercase text-gray-400 mb-2">Attachments ({attachments.length})</p>
                                <div className="space-y-2">
                                    {attachments.map((file, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 p-2 rounded border border-blue-100">
                                            <Paperclip size={14} />
                                            <span className="underline decoration-blue-300">{file.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
