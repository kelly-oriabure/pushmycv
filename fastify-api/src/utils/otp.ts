import crypto from 'crypto';
import { supabase } from '../config/supabase.js';
import { logger } from './logger.js';

interface OTPRecord {
    email: string;
    otp: string;
    user_data: {
        full_name?: string;
        phone?: string;
        location?: string;
    };
    expires_at: string;
    attempts: number;
    verified: boolean;
}

const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_LENGTH = 6;

export function generateOTP(): string {
    return crypto.randomInt(100000, 999999).toString();
}

export async function storeOTP(
    email: string,
    otp: string,
    userData: OTPRecord['user_data']
): Promise<{ success: boolean; error?: string }> {
    try {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + OTP_EXPIRY_MINUTES);

        const otpRecord = {
            email: email.toLowerCase(),
            otp,
            user_data: userData,
            expires_at: expiresAt.toISOString(),
            attempts: 0,
            verified: false,
            created_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('otp_verifications')
            .upsert(otpRecord, {
                onConflict: 'email'
            });

        if (error) {
            logger.error('Failed to store OTP', { email, error });
            return { success: false, error: error.message };
        }

        logger.info('OTP stored successfully', { email, expires_at: expiresAt });
        return { success: true };
    } catch (error) {
        logger.error('Error storing OTP', error);
        return { success: false, error: 'Failed to store OTP' };
    }
}

export async function verifyOTP(
    email: string,
    otp: string
): Promise<{ success: boolean; error?: string; userData?: OTPRecord['user_data'] }> {
    try {
        const { data, error } = await supabase
            .from('otp_verifications')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (error || !data) {
            logger.warn('OTP record not found', { email });
            return { success: false, error: 'Invalid or expired OTP' };
        }

        const record = data as unknown as OTPRecord;

        if (record.verified) {
            return { success: false, error: 'OTP already used' };
        }

        if (new Date(record.expires_at) < new Date()) {
            logger.warn('OTP expired', { email });
            return { success: false, error: 'OTP has expired. Please request a new one.' };
        }

        if (record.attempts >= MAX_OTP_ATTEMPTS) {
            logger.warn('Max OTP attempts exceeded', { email });
            return { success: false, error: 'Maximum verification attempts exceeded. Please request a new OTP.' };
        }

        if (record.otp !== otp) {
            await supabase
                .from('otp_verifications')
                .update({ attempts: record.attempts + 1 })
                .eq('email', email.toLowerCase());

            logger.warn('Invalid OTP attempt', { email, attempts: record.attempts + 1 });
            return {
                success: false,
                error: `Invalid OTP. ${MAX_OTP_ATTEMPTS - record.attempts - 1} attempts remaining.`
            };
        }

        await supabase
            .from('otp_verifications')
            .update({ verified: true })
            .eq('email', email.toLowerCase());

        logger.info('OTP verified successfully', { email });
        return { success: true, userData: record.user_data };
    } catch (error) {
        logger.error('Error verifying OTP', error);
        return { success: false, error: 'Failed to verify OTP' };
    }
}

export async function cleanupExpiredOTPs(): Promise<void> {
    try {
        const { error } = await supabase
            .from('otp_verifications')
            .delete()
            .lt('expires_at', new Date().toISOString());

        if (error) {
            logger.error('Failed to cleanup expired OTPs', error);
        } else {
            logger.info('Expired OTPs cleaned up');
        }
    } catch (error) {
        logger.error('Error cleaning up OTPs', error);
    }
}

export async function deleteOTP(email: string): Promise<void> {
    try {
        await supabase
            .from('otp_verifications')
            .delete()
            .eq('email', email.toLowerCase());

        logger.info('OTP deleted', { email });
    } catch (error) {
        logger.error('Error deleting OTP', error);
    }
}
