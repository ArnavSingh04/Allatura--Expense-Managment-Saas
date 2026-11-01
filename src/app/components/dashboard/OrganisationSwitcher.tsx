'use client';

import { Alert, Box, FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { useState } from 'react';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ROLE_LABEL } from '@/lib/rbac';
import { teamManagementError } from '@/lib/team-management-errors';
import { activateOrganisation } from '@/services/organisationService';

export default function OrganisationSwitcher() {
  const { ready, session, organisations } = useAuthSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!ready || organisations.length === 0) return null;

  const switchTo = async (organisationId: string) => {
    if (organisationId === session?.organisationId) return;
    setBusy(true);
    setError('');
    try {
      await activateOrganisation(organisationId);
      // Full navigation drops SWR and page state from the previous workspace.
      window.location.assign('/dashboard');
    } catch (err) {
      setError(teamManagementError(err, 'Could not switch organisation. Try again.'));
      setBusy(false);
    }
  };

  return (
    <Box sx={{ width: { xs: 170, sm: 260 }, maxWidth: '100%' }}>
      <FormControl fullWidth size="small">
        <InputLabel id="active-organisation-label">Organisation</InputLabel>
        <Select
          labelId="active-organisation-label"
          label="Organisation"
          value={session?.organisationId || ''}
          disabled={busy}
          onChange={(event) => void switchTo(event.target.value)}
        >
          <MenuItem value="" disabled>Choose an organisation</MenuItem>
          {organisations.map((organisation) => (
            <MenuItem key={organisation.id} value={organisation.id}>
              {organisation.name} · {ROLE_LABEL[organisation.role]}
              {organisation.status !== 'Active' ? ` · ${organisation.status}` : ''}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
      {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
    </Box>
  );
}
