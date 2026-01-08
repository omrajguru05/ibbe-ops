"use client"

import * as React from "react"
import Link from "next/link"

const STATUS_COLUMNS = [
    { id: "todo", label: "To Do", color: "bg-gray-100", border: "border-gray-300" },
    { id: "in_progress", label: "In Progress", color: "bg-blue-50", border: "border-blue-300" },
    { id: "done", label: "Done", color: "bg-green-50", border: "border-green-300" },
]

export function KanbanBoard({ tasks }: { tasks: any[] }) {
    return (
        <div className="flex gap-4 overflow-x-auto pb-8 snap-x snap-mandatory">
            {STATUS_COLUMNS.map((col) => {
                const colTasks = tasks.filter(t => t.status === col.id)

                return (
                    <div key={col.id} className="min-w-[85vw] md:min-w-[350px] snap-center">
                        <div className={`flex items-center justify-between p-4 mb-4 rounded-2xl border-2 ${col.border} ${col.color}`}>
                            <h3 className="font-black uppercase italic text-lg">{col.label}</h3>
                            <span className="font-mono text-xs font-bold bg-white px-2 py-1 rounded-full border-2 border-inherit">
                                {colTasks.length}
                            </span>
                        </div>

                        <div className="space-y-4">
                            {colTasks.length === 0 && (
                                <div className="p-8 border-2 border-dashed border-gray-200 rounded-2xl text-center">
                                    <span className="text-gray-300 font-black italic text-4xl block mb-2">EMPTY</span>
                                    <span className="text-gray-400 text-xs font-mono uppercase">No tasks available</span>
                                </div>
                            )}

                            {colTasks.map((task) => (
                                <Link
                                    key={task.id}
                                    href={`/task/${task.id}`}
                                    className="block group relative"
                                >
                                    {/* Tactile Shadow */}
                                    <div className="absolute inset-0 bg-orbital-ink translate-x-2 translate-y-2 rounded-2xl transition-transform group-hover:translate-x-3 group-hover:translate-y-3" />

                                    <div className="relative bg-white border-[3px] border-orbital-ink rounded-2xl p-5 hover:bg-gray-50 transition-colors">
                                        {/* Status Line */}
                                        <div className="flex justify-between items-start mb-3">
                                            <span className="text-[10px] bg-orbital-ink text-white px-2 py-0.5 rounded-full font-mono uppercase">
                                                ID: {task.id.slice(0, 4)}
                                            </span>
                                            {task.attachment_urls && task.attachment_urls.length > 0 && (
                                                <span className="text-xs">📎</span>
                                            )}
                                        </div>

                                        <h4 className="font-bold text-lg mb-2 leading-tight uppercase group-hover:text-blue-600 transition-colors">
                                            {task.title}
                                        </h4>

                                        <div className="flex items-center justify-between mt-4 pt-4 border-t-2 border-gray-100">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] text-gray-400 font-mono uppercase">Deadline</span>
                                                <span className={`text-xs font-bold font-mono ${new Date(task.deadline) < new Date() && task.status !== 'done'
                                                        ? "text-red-500"
                                                        : "text-gray-700"
                                                    }`}>
                                                    {new Date(task.deadline).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="w-8 h-8 rounded-full border-2 border-orbital-ink flex items-center justify-center bg-orbital-accent text-orbital-ink hover:scale-110 transition-transform">
                                                ➔
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
