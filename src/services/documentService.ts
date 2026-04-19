import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type {
  AppDocument,
  DocumentCategory,
  DocumentEntityType,
} from '@/types/construction';

export type CreateUploadUrlInput = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  category: DocumentCategory;
  projectId?: string;
  departmentId?: string;
  contractId?: string;
  entityType?: DocumentEntityType;
  entityId?: string;
  tags?: string[];
};

export const documentService = {
  list: (params?: {
    projectId?: string;
    contractId?: string;
    entityType?: string;
    entityId?: string;
    category?: string;
    tag?: string;
    q?: string;
  }) => {
    const s = new URLSearchParams();
    Object.entries(params ?? {}).forEach(([k, v]) => {
      if (v) s.set(k, v as string);
    });
    const q = s.toString();
    return apiGet<AppDocument[]>(q ? `documents?${q}` : 'documents');
  },
  get: (id: string) => apiGet<AppDocument>(`documents/${id}`),
  uploadUrl: (input: CreateUploadUrlInput) =>
    apiPost<{
      uploadUrl: string;
      method: 'PUT' | 'POST';
      headers: Record<string, string>;
      document: AppDocument;
    }>('documents/upload-url', input),
  finalise: (input: { documentId: string; checksum?: string }) =>
    apiPost<AppDocument>('documents/finalise', input),
  download: (id: string) =>
    apiGet<{ url: string; expiresAt: string }>(`documents/${id}/download-url`),
  update: (
    id: string,
    body: Partial<{ category: DocumentCategory; tags: string[] }>,
  ) => apiPatch<AppDocument>(`documents/${id}`, body),
  remove: (id: string) =>
    apiDelete<{ id: string; deleted: boolean }>(`documents/${id}`),
};

/**
 * Drive a full upload: ask BE for a signed URL, PUT the bytes, then finalise.
 * In dev the BE returns a stub URL we POST to ourselves so the workflow stays
 * end-to-end testable without GCS configured.
 */
export async function uploadFile(
  file: File,
  meta: Omit<CreateUploadUrlInput, 'fileName' | 'mimeType' | 'sizeBytes'>,
): Promise<AppDocument> {
  const created = await documentService.uploadUrl({
    fileName: file.name,
    mimeType: file.type || 'application/octet-stream',
    sizeBytes: file.size,
    ...meta,
  });

  const isStub = created.uploadUrl.startsWith('stub://');
  if (!isStub) {
    const headers: Record<string, string> = {
      'content-type': file.type || 'application/octet-stream',
      ...created.headers,
    };
    const res = await fetch(created.uploadUrl, {
      method: created.method,
      headers,
      body: file,
    });
    if (!res.ok) {
      throw new Error(`Upload failed: ${res.status}`);
    }
  }
  // In dev (stub URL) we treat the upload as a no-op. Real bytes only land in
  // object storage once the GCS/S3 client is wired in DocumentService.

  return documentService.finalise({ documentId: created.document._id });
}
