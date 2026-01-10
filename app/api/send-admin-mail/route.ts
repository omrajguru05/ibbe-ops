
import { NextResponse } from 'next/server'
import { sendEmail } from '@/utils/zepto'

export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { toName, toEmail, fromName, fromEmail, subject, html } = body

        if (!toEmail || !subject || !html) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const result = await sendEmail({
            to: toEmail,
            name: toName || toEmail,
            subject,
            html,
            fromEmail,
            fromName,
        })

        if (!result.success) {
            // Properly serialize the error
            let errorMessage = 'Failed to send email'
            if (typeof result.error === 'string') {
                errorMessage = result.error
            } else if (result.error?.message) {
                errorMessage = result.error.message
            } else if (result.error) {
                errorMessage = JSON.stringify(result.error)
            }

            console.error('Zepto email error:', errorMessage)
            return NextResponse.json(
                { success: false, error: errorMessage },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Error in send-admin-mail:', error)
        const errorMessage = error?.message || 'Internal Server Error'
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        )
    }
}
