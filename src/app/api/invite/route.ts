import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, link, inviter, workspaceTitle, role } = body;

        if (!email || !link) {
            return NextResponse.json({ error: 'Missing email or link' }, { status: 400 });
        }

        const roleText = role === 'editor' ? 'edit' : 'view';

        const brevoPayload = {
            sender: {
                name: process.env.BREVO_SENDER_NAME || "FlowState",
                email: process.env.BREVO_SENDER_EMAIL || "onboarding@resend.dev"
            },
            to: [{ email: email }],
            subject: `${inviter} invited you to ${roleText} a workspace on FlowState`,
            htmlContent: `
            <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f4; padding: 40px 0; margin: 0;">
                <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); overflow: hidden;">
                    
                    <!-- Header -->
                    <div style="padding: 32px 40px 24px; text-align: center; border-bottom: 1px solid #e0e0e0;">
                        <h2 style="margin: 0; color: #202124; font-size: 24px; font-weight: 400;">FlowState</h2>
                    </div>
                    
                    <!-- Body -->
                    <div style="padding: 40px;">
                        <p style="color: #3c4043; font-size: 16px; line-height: 1.5; margin-top: 0; margin-bottom: 24px;">
                            <strong>${inviter}</strong> has invited you to <strong>${roleText}</strong> the following workspace on FlowState:
                        </p>
                        
                        <!-- Workspace Card -->
                        <div style="background-color: #f8f9fa; border: 1px solid #dadce0; border-radius: 8px; padding: 24px; margin-bottom: 32px; text-align: center;">
                            <h3 style="margin: 0; color: #202124; font-size: 20px; font-weight: 500;">${workspaceTitle}</h3>
                        </div>
                        
                        <!-- Action Button -->
                        <div style="text-align: center; margin-bottom: 24px;">
                            <a href="${link}" style="background-color: #1a73e8; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: 500; font-size: 14px; display: inline-block; letter-spacing: 0.25px;">Open Workspace</a>
                        </div>
                        
                        <p style="color: #5f6368; font-size: 14px; line-height: 1.5; margin: 0;">
                            If you don't recognize the inviter, you can safely ignore this email.
                        </p>
                    </div>
                    
                    <!-- Footer -->
                    <div style="background-color: #f8f9fa; padding: 24px 40px; text-align: center; border-top: 1px solid #e0e0e0;">
                        <p style="color: #5f6368; font-size: 12px; margin: 0; line-height: 1.5;">
                            This email was sent by FlowState.<br>
                            &copy; ${new Date().getFullYear()} FlowState
                        </p>
                    </div>
                    
                </div>
            </div>
        `
        };

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': process.env.BREVO_API_KEY || '',
                'content-type': 'application/json'
            },
            body: JSON.stringify(brevoPayload)
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("Brevo API error:", data);
            return NextResponse.json({
                error: 'Failed to send invite',
                details: data
            }, { status: response.status });
        }

        console.log(`✅ Invite email sent successfully to ${email} (Message ID: ${data.messageId})`);
        return NextResponse.json({ success: true, id: data.messageId });

    } catch (error: any) {
        console.error("Error sending invite email:", error.message || error);
        return NextResponse.json({
            error: 'Failed to send invite',
            details: error.message || String(error)
        }, { status: 500 });
    }
}
