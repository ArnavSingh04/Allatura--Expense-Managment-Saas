import { beforeEach, describe, expect, it, vi } from 'vitest';
import { documentService, uploadFile, type UploadUrlResponse } from '../../src/services/documentService';
import type { AppDocument } from '@/types/construction';

vi.mock('@/lib/api-client', () => ({ apiGet: vi.fn(), apiPost: vi.fn(), apiDelete: vi.fn(), apiPatch: vi.fn() }));
const signed: UploadUrlResponse = { documentId: 'qa-document-a', uploadUrl: 'https://storage.example.test/qa-document-a', method: 'PUT', headers: {} };
const file = new File(['synthetic document'], 'qa.txt', { type: 'text/plain' });

describe('document upload completion boundary', () => {
  beforeEach(() => vi.restoreAllMocks());
  it('rejects unconfigured storage without finalising or claiming uploaded bytes', async () => {
    vi.spyOn(documentService, 'uploadUrl').mockResolvedValue({ ...signed, uploadUrl: 'stub://qa-document-a' });
    const finalise = vi.spyOn(documentService, 'finalise');
    const fetch = vi.fn(); vi.stubGlobal('fetch', fetch);
    await expect(uploadFile(file, { category: 'Other' })).rejects.toThrow('has not been uploaded');
    expect(finalise).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
  it('does not finalise when storage rejects the byte upload', async () => {
    vi.spyOn(documentService, 'uploadUrl').mockResolvedValue(signed);
    const finalise = vi.spyOn(documentService, 'finalise');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(uploadFile(file, { category: 'Other' })).rejects.toThrow('Upload failed: 503');
    expect(finalise).not.toHaveBeenCalled();
  });
  it('propagates backend finalisation failure instead of showing a completed document', async () => {
    vi.spyOn(documentService, 'uploadUrl').mockResolvedValue(signed);
    vi.spyOn(documentService, 'finalise').mockRejectedValue(new Error('uploaded_content_mismatch'));
    const get = vi.spyOn(documentService, 'get');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    await expect(uploadFile(file, { category: 'Other' })).rejects.toThrow('uploaded_content_mismatch');
    expect(get).not.toHaveBeenCalled();
  });
  it('sends the selected bytes and returns the validated document only after finalisation', async () => {
    const record = { _id: 'qa-document-a', uploaded: true } as AppDocument;
    vi.spyOn(documentService, 'uploadUrl').mockResolvedValue(signed);
    const finalise = vi.spyOn(documentService, 'finalise').mockResolvedValue(record);
    vi.spyOn(documentService, 'get').mockResolvedValue(record);
    const fetch = vi.fn().mockResolvedValue({ ok: true }); vi.stubGlobal('fetch', fetch);
    await expect(uploadFile(file, { category: 'Other' })).resolves.toEqual(record);
    expect(fetch).toHaveBeenCalledWith(signed.uploadUrl, expect.objectContaining({ method: 'PUT', body: file }));
    expect(finalise).toHaveBeenCalledWith({ documentId: 'qa-document-a' });
  });
});
