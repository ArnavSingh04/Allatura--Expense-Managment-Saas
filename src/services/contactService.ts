import { apiPost } from '@/lib/api-client';

export type ContactBody = {
  name: string;
  email: string;
  message: string;
  subject?: string;
  company?: string;
  /** Honeypot — leave empty; real users never fill this. */
  company_website?: string;
};

/**
 * Submits a public enquiry. Goes through the same-origin proxy (/api/v1) to the
 * backend's @Public POST /v1/contact, which emails it server-side via Mailgun.
 * No auth required; the proxy forwards anonymously when there's no session.
 */
export const submitContact = (body: ContactBody) =>
  apiPost<{ ok: boolean }>('contact', body);
