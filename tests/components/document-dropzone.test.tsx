import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DocumentDropzone from '../../src/app/components/construction/DocumentDropzone';
import { uploadFile } from '@/services/documentService';
import type { AppDocument } from '@/types/construction';

vi.mock('@/services/documentService', () => ({ uploadFile: vi.fn() }));

describe('document upload recovery', () => {
  beforeEach(() => vi.mocked(uploadFile).mockReset());
  it('shows storage failure without reporting success, then permits retrying the same file', async () => {
    const file = new File(['synthetic'], 'qa.txt', { type: 'text/plain' });
    const uploaded = { _id: 'qa-document-a', uploaded: true } as AppDocument;
    vi.mocked(uploadFile).mockRejectedValueOnce(new Error('Document storage is not configured. Your file has not been uploaded.')).mockResolvedValue(uploaded);
    const onUploaded = vi.fn();
    render(<DocumentDropzone projectId="qa-project-a" onUploaded={onUploaded} />);
    const user = userEvent.setup();
    const input = screen.getByLabelText('Document files') as HTMLInputElement;
    await user.upload(input, file);
    expect(await screen.findByRole('alert')).toHaveTextContent('has not been uploaded');
    expect(onUploaded).not.toHaveBeenCalled();
    await user.upload(input, file);
    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith(uploaded));
    expect(uploadFile).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('exposes a keyboard-focusable upload control', () => {
    render(<DocumentDropzone />);
    expect(screen.getByRole('button', { name: 'Choose documents to upload' })).toHaveAttribute('tabindex', '0');
  });
});
