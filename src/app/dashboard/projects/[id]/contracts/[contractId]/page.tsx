'use client';

import { Alert, Box, Button, CardContent, LinearProgress, Stack, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import AppCard from '@/components/ui/AppCard';
import Money from '@/components/construction/Money';
import StatusChip from '@/components/construction/StatusChip';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import type { Contract } from '@/types/construction';

export default function ContractDetailPage() {
  const { id, contractId } = useParams<{ id: string; contractId: string }>();
  const { data: contract, error, isLoading, mutate } = useSWR<Contract>(contractId ? keys.contract(contractId) : null, authFetcher);
  const back = <Button component={Link} href={`/dashboard/projects/${id}/contracts`}>Back to contracts</Button>;
  if (isLoading) return <LinearProgress aria-label="Loading contract" />;
  if (error) return <Stack spacing={2}>{back}<Alert severity="error" action={<Button color="inherit" onClick={() => void mutate()}>Try again</Button>}>Could not load this contract. Please try again.</Alert></Stack>;
  if (!contract || contract.projectId !== id) return <Stack spacing={2}>{back}<Alert severity="warning">This contract is not available in this project.</Alert></Stack>;

  return <Stack spacing={2}>
    <Box>{back}</Box>
    <Stack direction="row" spacing={2} alignItems="center">
      <Typography variant="h5" component="h1">{contract.reference}</Typography>
      <StatusChip status={contract.status} />
    </Stack>
    <Typography>{contract.scope}</Typography>
    <AppCard><CardContent>
      <Typography variant="h6" gutterBottom>Contract value</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={4}>
        <Box><Typography color="text.secondary">Original value</Typography><Money value={contract.originalValue} /></Box>
        <Box><Typography color="text.secondary">Current value</Typography><Money value={contract.currentValue} bold /></Box>
        <Box><Typography color="text.secondary">Retention</Typography><Typography>{contract.retentionPercent}%</Typography></Box>
      </Stack>
      <Typography sx={{ mt: 2 }}>Start: {contract.startDate?.slice(0, 10) || 'Not set'}</Typography>
      <Typography>Planned completion: {contract.plannedCompletionDate?.slice(0, 10) || 'Not set'}</Typography>
    </CardContent></AppCard>
    <AppCard><CardContent>
      <Typography variant="h6" gutterBottom>Payment milestones</Typography>
      {contract.paymentMilestones.length === 0 ? <Typography color="text.secondary">No payment milestones recorded.</Typography> :
        <Table aria-label="Payment milestones"><TableHead><TableRow><TableCell>Name</TableCell><TableCell>Status</TableCell><TableCell align="right">Amount</TableCell></TableRow></TableHead><TableBody>
          {contract.paymentMilestones.map((milestone) => <TableRow key={milestone._id}><TableCell>{milestone.name}</TableCell><TableCell>{milestone.status}</TableCell><TableCell align="right"><Money value={milestone.amount} /></TableCell></TableRow>)}
        </TableBody></Table>}
    </CardContent></AppCard>
  </Stack>;
}
