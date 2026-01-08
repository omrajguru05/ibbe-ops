"use client"

import { useState } from "react"
import { OrbitalButton } from "@/components/ui/orbital-button"
import { postComment } from "@/actions/task-actions"

export function ReplyForm({ taskId }: { taskId: string }) {
    const [fileCount, setFileCount] = useState(0)

    return (
        <form action={async (formData) => {
            await postComment(formData);
            setFileCount(0); // Reset count after submit
            // We might want to reset the form or show a success state, 
            // but the server action revalidates the path which refreshes the page.
            // For a better UX we could use a ref to clear the inputs.
            const form = document.getElementById("reply-form") as HTMLFormElement;
            if (form) form.reset();
        }}
            id="reply-form"
            className="flex flex-col gap-2"
        >
            <input type="hidden" name="task_id" value={taskId} />

            <div className="flex gap-4">
                <input
                    name="content"
                    className="flex-1 bg-transparent border-b-2 border-orbital-ink focus:border-orbital-accent outline-none px-2 py-2 font-mono text-sm"
                    placeholder="Write a reply..."
                    required
                    autoComplete="off"
                />
                <OrbitalButton className="px-6">REPLY</OrbitalButton>
            </div>

            <div className="mt-2 text-xs text-gray-500 font-mono">
                <label className="cursor-pointer hover:text-orbital-ink flex items-center gap-2 w-max">
                    <span className={fileCount > 0 ? "text-orbital-accent font-bold" : ""}>
                        {fileCount > 0 ? `📎 ${fileCount} File(s) Selected` : '📎 Attach Files'}
                    </span>
                    <input
                        type="file"
                        name="attachments"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            setFileCount(e.target.files?.length || 0);
                        }}
                    />
                </label>
            </div>
        </form>
    )
}
