import 'server-only';
import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey && process.env.NODE_ENV === 'production') {
  throw new Error('RESEND_API_KEY is required in production');
}

export const resend = new Resend(apiKey || 're_dev_placeholder');

export const EMAIL_TO = process.env.CONTACT_EMAIL_TO || 'ckimsecuriteformation@gmail.com';
export const EMAIL_FROM = process.env.CONTACT_EMAIL_FROM || 'onboarding@resend.dev';
