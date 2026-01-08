import { createClient } from "@/utils/supabase/server"
import { OrbitalCard } from "@/components/ui/orbital-card"
import { OrbitalButton } from "@/components/ui/orbital-button"
import { updateTaskStatus } from "@/actions/task-actions"
import { BackButton } from "@/components/ui/back-button"
import { ReplyForm } from "@/components/task/reply-form"

export const dynamic = 'force-dynamic'

export default async function TaskPage({ params }: { params: Promise<{ id: string }> }) {
    const supabase = await createClient()
    const { id: taskId } = await params

    const { data: task } = await supabase.from("tasks").select("*, assigned_to(full_name)").eq("id", taskId).single()
    const { data: comments } = await supabase.from("comments").select("*, author_id(full_name, role)").eq("task_id", taskId).order("created_at", { ascending: true })
    const { data: { user } } = await supabase.auth.getUser()

    if (!task) return <div>Task not found</div>

    return (
        <div className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto space-y-8 pb-24">
            {/* Header */}
            <BackButton className="mb-4" />
            <OrbitalCard className="p-8 bg-white relative overflow-hidden">
                <div className="uppercase tracking-widest text-xs font-bold text-gray-400 mb-2">Task Details</div>
                <h1 className="text-3xl font-bold uppercase mb-4">{task.title}</h1>
                <p className="font-mono text-sm mb-6 whitespace-pre-wrap">{task.description}</p>

                <div className="flex flex-wrap gap-4 text-xs font-bold uppercase">
                    <div className="bg-orbital-bg px-3 py-1 rounded border border-orbital-ink">
                        Deadline: {new Date(task.deadline).toLocaleString()}
                    </div>
                    <div className="bg-orbital-bg px-3 py-1 rounded border border-orbital-ink">
                        Assigned To: {task.assigned_to?.full_name}
                    </div>
                    <div className={`px-3 py-1 rounded border border-orbital-ink ${task.status === 'done' ? 'bg-system-green text-white' : 'bg-orbital-accent'}`}>
                        Status: {task.status.replace('_', ' ')}
                    </div>

                    {/* Responsiveness Warning */}
                    {task.last_admin_comment_at &&
                        new Date(task.last_admin_comment_at).getTime() < Date.now() - 2 * 60 * 60 * 1000 &&
                        (!task.last_employee_reply_at || new Date(task.last_employee_reply_at) < new Date(task.last_admin_comment_at)) && (
                            <div className="bg-yellow-400 text-black px-3 py-1 rounded border border-black animate-pulse">
                                ⚠ RESPONSE OVERDUE
                            </div>
                        )
                    }
                </div>

                {/* Status Actions */}
                <div className="mt-6 pt-6 border-t border-gray-200 flex gap-4">
                    <form action={async () => { "use server"; await updateTaskStatus(taskId, "in_progress") }}>
                        <OrbitalButton variant="default" className="text-xs px-4 h-8" disabled={task.status === 'in_progress'}>Mark In Progress</OrbitalButton>
                    </form>
                    <form action={async () => { "use server"; await updateTaskStatus(taskId, "done") }}>
                        <OrbitalButton variant="secondary" className="text-xs px-4 h-8" disabled={task.status === 'done'}>Mark Complete</OrbitalButton>
                    </form>
                </div>
            </OrbitalCard>

            {/* Chat / Comms */}
            <section>
                <h2 className="text-xl font-bold uppercase border-b-4 border-orbital-ink inline-block pb-1 mb-6">Task Discussion</h2>

                <div className="space-y-4 mb-8">
                    {comments?.map((comment: any) => (
                        <div key={comment.id} className={`flex ${comment.author_id.role === 'admin' ? 'justify-start' : 'justify-end'}`}>
                            <div className={`max-w-[80%] p-4 rounded-xl border-2 ${comment.author_id.role === 'admin'
                                ? 'bg-orbital-ink text-white border-orbital-ink rounded-tl-none'
                                : 'bg-white text-orbital-ink border-orbital-ink rounded-tr-none'
                                }`}>
                                <div className="text-xs font-bold uppercase mb-1 opacity-70">
                                    {comment.author_id.role === 'admin' ? 'ADMIN' : comment.author_id.full_name}
                                </div>
                                <p>{comment.content}</p>
                                <div className="text-[10px] uppercase mt-2 opacity-50 text-right">{new Date(comment.created_at).toLocaleTimeString()}</div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Reply Box */}
                <OrbitalCard className="p-4 bg-orbital-bg sticky bottom-4">
                    <ReplyForm taskId={taskId} />
                </OrbitalCard>
            </section>
        </div>
    )
}
