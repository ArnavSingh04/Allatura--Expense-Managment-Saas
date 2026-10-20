import { apiGet, apiGetBlob, apiPatch, apiPostRaw } from '@/lib/api-client';
import { saveBlob } from '@/lib/download';
import type {
  DuplicatePolicy,
  ImportEntityType,
  ImportSession,
  ImportTarget,
  ImportTypeDef,
} from '@/types/imports';

/**
 * The only module that knows the `/v1/imports/*` paths.
 *
 * Every mutating call returns the whole session, so callers write the response
 * straight into their cache rather than refetching.
 */
export const importService = {
  types: () => apiGet<{ types: ImportTypeDef[] }>('imports/types'),

  createSession: async (file: File, entityType: ImportTarget) => {
    const form = new FormData();
    form.append('file', file);
    form.append('entityType', entityType);
    const { data } = await apiPostRaw<ImportSession>('imports/sessions', form);
    return data;
  },

  getSession: (id: string) => apiGet<ImportSession>(`imports/sessions/${id}`),

  setMapping: (
    id: string,
    body: {
      mapping?: Record<string, string>;
      duplicatePolicy?: DuplicatePolicy;
      member?: ImportEntityType;
    },
  ) => apiPatch<ImportSession>(`imports/sessions/${id}/mapping`, body),

  preview: async (id: string) => {
    const { data } = await apiPostRaw<ImportSession>(
      `imports/sessions/${id}/preview`,
    );
    return data;
  },

  setRowAction: (
    id: string,
    row: number,
    body: { action: DuplicatePolicy; member?: ImportEntityType },
  ) => apiPatch<ImportSession>(`imports/sessions/${id}/rows/${row}`, body),

  /**
   * 200 means the import ran inline and `session` is final.
   * 202 means it was handed off; poll `getSession` until it leaves `importing`.
   */
  confirm: async (
    id: string,
  ): Promise<
    { mode: 'sync'; session: ImportSession } | { mode: 'async' }
  > => {
    const { status, data } = await apiPostRaw<ImportSession>(
      `imports/sessions/${id}/confirm`,
    );
    return status === 202
      ? { mode: 'async' }
      : { mode: 'sync', session: data };
  },

  downloadTemplate: async (entityType: ImportEntityType) => {
    const { blob, filename } = await apiGetBlob(
      `imports/templates/${entityType}`,
    );
    saveBlob(blob, filename ?? `allatura-${entityType}-import-template.xlsx`);
  },

  downloadErrors: async (id: string) => {
    const { blob, filename } = await apiGetBlob(
      `imports/sessions/${id}/errors`,
    );
    saveBlob(blob, filename ?? `allatura-import-${id}-errors.csv`);
  },
};
