import { logger } from './logger.js';

interface EmailOptions {
    to: string;
    subject: string;
    text: string;
    html?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
    try {
        logger.info('Sending email', { to: options.to, subject: options.subject });

        if (process.env.NODE_ENV === 'development') {
            logger.info('📧 EMAIL (Development Mode)', {
                to: options.to,
                subject: options.subject,
                text: options.text
            });
            return { success: true };
        }

        return { success: true };
    } catch (error) {
        logger.error('Failed to send email', error);
        return { success: false, error: 'Failed to send email' };
    }
}

export async function sendOTPEmail(email: string, otp: string, fullName?: string): Promise<{ success: boolean; error?: string }> {
    const subject = 'Your PushMyCV Verification Code';
    const greeting = fullName ? `Hello ${fullName}` : 'Hello';

    const text = `
${greeting},

Your verification code is: ${otp}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

Best regards,
PushMyCV Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .otp-code { 
            font-size: 32px; 
            font-weight: bold; 
            letter-spacing: 8px; 
            text-align: center; 
            background: white; 
            padding: 20px; 
            margin: 20px 0;
            border-radius: 8px;
            border: 2px dashed #4F46E5;
        }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PushMyCV</h1>
        </div>
        <div class="content">
            <p>${greeting},</p>
            <p>Your verification code is:</p>
            <div class="otp-code">${otp}</div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <p>If you didn't request this code, please ignore this email.</p>
            <p>Best regards,<br>PushMyCV Team</p>
        </div>
        <div class="footer">
            <p>This is an automated message, please do not reply.</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return sendEmail({
        to: email,
        subject,
        text,
        html
    });
}

export async function sendWelcomeEmail(email: string, fullName: string): Promise<{ success: boolean; error?: string }> {
    const subject = 'Welcome to PushMyCV!';

    const text = `
Hello ${fullName},

Welcome to PushMyCV! Your account has been successfully created.

You can now:
- Create and manage your professional resumes
- Track job applications
- Generate tailored cover letters
- And much more!

Get started at: ${process.env.APP_URL || 'http://localhost:3000'}

Best regards,
PushMyCV Team
    `.trim();

    const html = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
        .button { 
            display: inline-block; 
            background: #4F46E5; 
            color: white; 
            padding: 12px 24px; 
            text-decoration: none; 
            border-radius: 6px; 
            margin: 20px 0;
        }
        .features { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .features li { margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to PushMyCV! 🎉</h1>
        </div>
        <div class="content">
            <p>Hello ${fullName},</p>
            <p>Your account has been successfully created!</p>
            <div class="features">
                <h3>What you can do now:</h3>
                <ul>
                    <li>✅ Create and manage professional resumes</li>
                    <li>✅ Track job applications</li>
                    <li>✅ Generate tailored cover letters</li>
                    <li>✅ Store work experience and skills</li>
                    <li>✅ Apply to jobs with one click</li>
                </ul>
            </div>
            <center>
                <a href="${process.env.APP_URL || 'http://localhost:3000'}" class="button">Get Started</a>
            </center>
            <p>Best regards,<br>PushMyCV Team</p>
        </div>
    </div>
</body>
</html>
    `.trim();

    return sendEmail({
        to: email,
        subject,
        text,
        html
    });
}
