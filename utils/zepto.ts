
export async function sendEmail({
    to,
    subject,
    html,
    name,
    fromEmail,
    fromName,
}: {
    to: string
    subject: string
    html: string
    name: string
    fromEmail?: string
    fromName?: string
}) {
    const apiKey = process.env.ZEPTO_MAIL_API_KEY
    const defaultFromEmail = process.env.NEXT_PUBLIC_ZEPTO_FROM_EMAIL
    const defaultFromName = "IBBE Operations"

    if (!apiKey) {
        console.error("Zepto Mail API Key missing")
        return { success: false, error: "Configuration Error: API Key Missing" }
    }

    if (!defaultFromEmail && !fromEmail) {
        console.error("Zepto Mail From Email missing")
        return { success: false, error: "Configuration Error: From Email Missing" }
    }

    try {
        const response = await fetch("https://api.zeptomail.in/v1.1/email", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Zoho-enczapikey ${apiKey}`,
            },
            body: JSON.stringify({
                from: {
                    address: fromEmail || defaultFromEmail,
                    name: fromName || defaultFromName,
                },
                to: [
                    {
                        email_address: {
                            address: to,
                            name: name,
                        },
                    },
                ],
                subject: subject,
                htmlbody: html,
            }),
        })

        if (!response.ok) {
            // Try to get error details, but handle empty/invalid responses
            let errorMessage = `HTTP ${response.status}: ${response.statusText}`
            try {
                const responseText = await response.text()
                if (responseText) {
                    try {
                        const errorData = JSON.parse(responseText)
                        errorMessage = errorData.message || errorData.error || JSON.stringify(errorData)
                    } catch {
                        errorMessage = responseText
                    }
                }
            } catch (e) {
                // Keep the default HTTP error message
            }
            console.error("Zepto Mail Error:", errorMessage)
            return { success: false, error: errorMessage }
        }

        return { success: true }
    } catch (error: any) {
        console.error("Email Sending Failed:", error)
        return { success: false, error: error?.message || "Network error while sending email" }
    }
}
