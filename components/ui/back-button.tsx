"use client"

import { useRouter } from "next/navigation"

export function BackButton({ className = "" }: { className?: string }) {
    const router = useRouter()

    return (
        <button
            onClick={() => router.back()}
            className={`flex items-center gap-2 text-sm font-bold uppercase hover:opacity-70 transition-opacity ${className}`}
        >
            <span>←</span> Back
        </button>
    )
}
