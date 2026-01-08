"use client"

import { createTask } from "@/actions/admin-actions"
import { OrbitalButton } from "@/components/ui/orbital-button"
import { OrbitalInput } from "@/components/ui/orbital-input"
import { useState } from "react"
import { OrbitalCard } from "../ui/orbital-card"

export function CreateTaskForm({ activeEmployees }: { activeEmployees: any[] }) {
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (formData: FormData) => {
        setLoading(true)
        try {
            await createTask(formData)
            // Reset form usually
            alert("Task Mandated successfully.")
        } catch (e: any) {
            alert("Error: " + e.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <form action={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold mb-2 uppercase">Assignee</label>
                <select name="assigned_to" className="w-full h-12 rounded-lg border-[3px] border-orbital-ink bg-orbital-surface px-3 py-2 text-sm focus:ring-2 focus:ring-orbital-ink outline-none" required>
                    <option value="">Select Personnel...</option>
                    {activeEmployees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.employee_id})</option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-bold mb-2 uppercase">Task Title</label>
                <OrbitalInput name="title" required placeholder="e.g. Q3 Financial Report" />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2 uppercase">Description</label>
                <textarea name="description" className="w-full min-h-[100px] rounded-lg border-[3px] border-orbital-ink bg-orbital-surface px-3 py-2 text-sm focus:ring-2 focus:ring-orbital-ink outline-none" required placeholder="Detailed instructions..." />
            </div>
            <div>
                <label className="block text-sm font-bold mb-2 uppercase">Deadline</label>
                <OrbitalInput name="deadline" type="datetime-local" required />
            </div>

            <div>
                <label className="block text-sm font-bold mb-2 uppercase">Reference Files</label>
                <input
                    type="file"
                    name="attachments"
                    multiple
                    className="w-full text-sm font-mono file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-2 file:border-orbital-ink file:text-sm file:font-bold file:bg-gray-100 hover:file:bg-gray-200"
                />
            </div>

            <OrbitalButton disabled={loading} className="w-full">
                {loading ? "CREATING..." : "ASSIGN TASK"}
            </OrbitalButton>
        </form>
    )
}
