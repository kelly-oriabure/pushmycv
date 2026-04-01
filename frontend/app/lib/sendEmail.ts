import nodemailer from 'nodemailer';

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    attachments?: Array<{
        filename: string;
        content: Buffer | string;
        contentType?: string;
    }>;
}

export async function sendEmail({ to, subject, html, attachments }: SendEmailOptions) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true, // true for port 465
        auth: {
            user: 'resend',
            pass: process.env.RESEND_API_KEY,
        },
    });

    const info = await transporter.sendMail({
        from: 'FirmCloud <contact@firmcloud.ng>',
        to,
        subject,
        html,
        attachments,
    });

    return info;
}

if (require.main === module) {
    sendEmail({
        to: 'firmcloudlimited@gmail.com',
        subject: 'Test Email from FirmCloud',
        html: '<p>This is a test email sent from the FirmCloud nodemailer setup.</p>',
    })
        .then(info => console.log('Email sent:', info.messageId))
        .catch(console.error);
} 