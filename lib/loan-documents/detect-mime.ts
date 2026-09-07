import { LOAN_DOC_ALLOWED_MIME } from '@/lib/loan-documents/constants';

export function detectLoanDocumentMime(buf: Buffer): string | null {
  if (buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === '%PDF') {
    return 'application/pdf';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  ) {
    return 'image/png';
  }
  return null;
}

export function isAllowedLoanMime(mime: string): boolean {
  return LOAN_DOC_ALLOWED_MIME.has(mime);
}
