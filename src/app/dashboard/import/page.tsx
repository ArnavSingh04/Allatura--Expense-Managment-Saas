'use client';

import { Box } from '@mui/material';
import PageHeader from '@/components/ui/PageHeader';
import RoleGate from '@/components/auth/RoleGate';
import ImportWizard from '@/components/import/ImportWizard';

export default function ImportPage() {
  return (
    <Box>
      <PageHeader
        title="Import data"
        description="Bring in suppliers, subcontractors, projects, contracts, variations and payment claims from a spreadsheet — or several at once in a zip. Nothing is saved until you have reviewed it."
      />
      <RoleGate action="imports.run">
        <ImportWizard />
      </RoleGate>
    </Box>
  );
}
