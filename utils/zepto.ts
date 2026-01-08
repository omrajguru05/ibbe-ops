
export async function sendEmail({
    to,
    subject,
    html,
    name,
}: {
    to: string
    subject: string
    html: string
    name: string
}) {
    const apiKey = process.env.ZEPTO_MAIL_API_KEY
    const fromEmail = process.env.NEXT_PUBLIC_ZEPTO_FROM_EMAIL
    const fromName = "IBBE Operations"

    if (!apiKey) {
        console.error("Zepto Mail API Key missing")
        return { success: false, error: "Configuration Error: API Key Missing" }
    }

    if (!fromEmail) {
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
                    address: fromEmail,
                    name: fromName,
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
            const errorData = await response.json()
            console.error("Zepto Mail Error:", JSON.stringify(errorData, null, 2))
            return { success: false, error: errorData }
        }

        return { success: true }
    } catch (error) {
        console.error("Email Sending Failed:", error)
        return { success: false, error }
    }
}
