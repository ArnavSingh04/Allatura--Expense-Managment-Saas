'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR, { mutate as globalMutate } from 'swr';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Typography,
} from '@mui/material';
import AppCard from '@/components/ui/AppCard';
import ImportUploadStep from '@/components/import/ImportUploadStep';
import ImportMapStep from '@/components/import/ImportMapStep';
import ImportReviewStep from '@/components/import/ImportReviewStep';
import ImportCommitStep from '@/components/import/ImportCommitStep';
import { useImportSession } from '@/components/import/useImportSession';
import {
  allRequiredMapped,
  memberKey,
  memberViews,
  previewTotals,
  stepForStatus,
} from '@/components/import/importFlow';
import { authFetcher } from '@/lib/swr-fetcher';
import { ApiError } from '@/lib/api-client';
import { importErrorMessage } from '@/lib/import-errors';
import { importService } from '@/services/importService';
import { keys } from '@/lib/swr-keys';
import type { ImportTarget, ImportTypeDef } from '@/types/imports';

const STEPS = ['Source', 'Map columns', 'Review', 'Import'];

export default function ImportWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const querySession = searchParams.get('session');
  const [sessionId, setSessionId] = useState<string | null>(querySession);
  const [step, setStep] = useState(0);
  const hydrated = useRef(false);
  const skipUrlSync = useRef(false);
  const [target, setTarget] = useState<ImportTarget>('pack');
  const [selectedKey, setSelectedKey] = useState<string>('__single__');
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const {
    data: typesData,
    isLoading: typesLoading,
    error: typesError,
  } = useSWR<{ types: ImportTypeDef[] }>(keys.importTypes(), authFetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  });

  const {
    session,
    isLoading: sessionLoading,
    isPolling,
    busy,
    error: sessionError,
    clearError,
    draftMapping,
    setMapping,
    setDuplicatePolicy,
    setRowAction,
    runPreview,
    confirm,
    refresh,
  } = useImportSession(sessionId);

  const views = useMemo(
    () => (session ? memberViews(session) : []),
    [session],
  );

  // Keep the selected member valid as the session changes shape.
  useEffect(() => {
    if (!views.length) return;
    if (!views.some((v) => memberKey(v) === selectedKey)) {
      setSelectedKey(memberKey(views[0]));
    }
  }, [selectedKey, views]);

  // Browser back/forward and a shared link restore the session. Our own
  // replace() after upload or start-over is skipped so it cannot clobber
  // the step the user is already on.
  useEffect(() => {
    if (skipUrlSync.current) {
      skipUrlSync.current = false;
      return;
    }
    setSessionId(querySession);
    hydrated.current = false;
  }, [querySession]);

  useEffect(() => {
    if (!session || hydrated.current) return;
    if (querySession !== session.id) return;
    hydrated.current = true;
    setStep(stepForStatus(session));
  }, [querySession, session]);

  // A background import finishing should move the user to the result.
  useEffect(() => {
    if (!session) return;
    if (session.status === 'importing' && step !== 3) setStep(3);
  }, [session, step]);

  const error = localError ?? sessionError;

  const dismissError = useCallback(() => {
    setLocalError(null);
    clearError();
  }, [clearError]);

  const handleFile = useCallback(
    async (file: File) => {
      dismissError();
      setUploading(true);
      try {
        // A zip is always a pack, whatever the select said a moment ago.
        const entityType: ImportTarget = file.name
          .toLowerCase()
          .endsWith('.zip')
          ? 'pack'
          : target;
        const created = await importService.createSession(file, entityType);
        await globalMutate(keys.importSession(created.id), created, {
          revalidate: false,
        });
        skipUrlSync.current = true;
        hydrated.current = true;
        setSessionId(created.id);
        setSelectedKey(memberKey(memberViews(created)[0]));
        setStep(stepForStatus(created));
        router.replace(`/dashboard/import?session=${created.id}`);
      } catch (e) {
        setLocalError(importErrorMessage(e));
      } finally {
        setUploading(false);
      }
    },
    [dismissError, router, target],
  );

  const startOver = useCallback(() => {
    dismissError();
    skipUrlSync.current = true;
    hydrated.current = false;
    setSessionId(null);
    setStep(0);
    setSelectedKey('__single__');
    router.replace('/dashboard/import');
  }, [dismissError, router]);

  const goToReview = useCallback(async () => {
    dismissError();
    const ok = await runPreview();
    if (ok) setStep(2);
  }, [dismissError, runPreview]);

  const startImport = useCallback(async () => {
    dismissError();
    const ok = await confirm();
    if (ok) setStep(3);
  }, [confirm, dismissError]);

  const readyToReview = session ? allRequiredMapped(session) : false;
  const importable = session ? previewTotals(session).importable : 0;

  if (typesLoading || (sessionId && sessionLoading && !session)) {
    return (
      <Stack alignItems="center" sx={{ py: 8 }}>
        <CircularProgress size={28} />
      </Stack>
    );
  }

  const types = typesData?.types ?? [];

  // Without the type list there is nothing to import into, so fail loudly
  // rather than rendering an empty picker. A 404 here means the backend has
  // no /v1/imports routes — usually the imports module is not deployed.
  if (typesError || types.length === 0) {
    const unavailable =
      typesError instanceof ApiError && typesError.status === 404;
    return (
      <Alert severity="error">
        {unavailable
          ? 'The import service is not available on the server. The backend does not expose /v1/imports — check that the imports module is deployed and that the API is running.'
          : typesError
            ? importErrorMessage(typesError)
            : 'No import types are configured on the server.'}
      </Alert>
    );
  }

  return (
    <Stack spacing={3}>
      <Stepper activeStep={step} alternativeLabel>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && (
        <Alert severity="error" onClose={dismissError}>
          {error}
        </Alert>
      )}

      {session?.skippedFiles && session.skippedFiles.length > 0 && (
        <Alert severity="info">
          Ignored {session.skippedFiles.length === 1 ? 'a file' : 'files'} we
          did not recognise: {session.skippedFiles.join(', ')}.
        </Alert>
      )}

      <AppCard>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {step === 0 && (
            <ImportUploadStep
              types={types}
              target={target}
              onTargetChange={setTarget}
              uploading={uploading}
              onFileAccepted={handleFile}
              onLocalError={setLocalError}
            />
          )}

          {step === 1 && session && (
            <ImportMapStep
              session={session}
              views={views}
              selectedKey={selectedKey}
              onSelectMember={setSelectedKey}
              draftMapping={draftMapping}
              busy={busy}
              onMappingChange={setMapping}
              onPolicyChange={(policy, member) => {
                void setDuplicatePolicy(policy, member);
              }}
            />
          )}

          {step === 2 && session && (
            <ImportReviewStep
              views={views}
              selectedKey={selectedKey}
              onSelectMember={setSelectedKey}
              busy={busy}
              onRowAction={(row, action, member) => {
                void setRowAction(row, action, member);
              }}
            />
          )}

          {step === 3 && session && (
            <ImportCommitStep
              session={session}
              views={views}
              onError={setLocalError}
              onRefresh={() => void refresh()}
              onStartOver={startOver}
            />
          )}
        </Box>
      </AppCard>

      {session && step > 0 && step < 3 && (
        <Stack
          direction="row"
          spacing={1.5}
          justifyContent="space-between"
          alignItems="center"
        >
          <Button
            variant="text"
            disabled={busy}
            onClick={() => (step === 1 ? startOver() : setStep(1))}
          >
            {step === 1 ? 'Start over' : 'Back'}
          </Button>

          <Stack direction="row" spacing={1.5} alignItems="center">
            {step === 1 && !readyToReview && (
              <Typography variant="caption" color="text.secondary">
                Map every required field to continue
              </Typography>
            )}
            <Button
              variant="contained"
              disabled={busy || isPolling || (step === 1 && !readyToReview)}
              startIcon={busy ? <CircularProgress size={14} /> : undefined}
              onClick={() => {
                if (step === 1) void goToReview();
                else void startImport();
              }}
            >
              {step === 1
                ? 'Review import'
                : `Import ${importable.toLocaleString()} ${
                    importable === 1 ? 'row' : 'rows'
                  }`}
            </Button>
          </Stack>
        </Stack>
      )}
    </Stack>
  );
}
