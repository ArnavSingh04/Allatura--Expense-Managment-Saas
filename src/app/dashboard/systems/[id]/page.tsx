'use client';

import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import useSWR from 'swr';
import { authFetcher } from '@/lib/swr-fetcher';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';

type SystemDoc = {
  name: string;
  vendor?: string;
  category: string;
  department?: string;
  criticality: string;
  businessOwner?: { name?: string; email?: string };
  technicalOwner?: { name?: string; email?: string };
};

type ContractRow = {
  _id: string;
  costAmount: number;
  billingCycle: string;
  renewalDate: string;
  autoRenew: boolean;
};

export default function SystemDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: sys } = useSWR<SystemDoc>(id ? `systems/${id}` : null, authFetcher);
  const { data: contracts } = useSWR<ContractRow[]>(
    id ? `contracts?systemId=${id}` : null,
    authFetcher,
  );

  if (!sys) {
    return <Typography>Loading…</Typography>;
  }

  return (
    <Box>
      <Typography sx={dashboardHeader}>{sys.name}</Typography>
      <Typography sx={dashboardSubheader}>
        {sys.vendor} · {sys.category} · {sys.department} · {sys.criticality}
      </Typography>
      <Typography variant="body2" sx={{ mt: 1 }}>
        Business owner: {sys.businessOwner?.name || sys.businessOwner?.email || '—'}
      </Typography>
      <Typography variant="body2">
        Technical owner: {sys.technicalOwner?.name || sys.technicalOwner?.email || '—'}
      </Typography>
      <Button component={Link} href={`/dashboard/systems/${id}/edit`} variant="outlined" sx={{ mt: 2 }}>
        Edit
      </Button>

      <Typography sx={{ ...dashboardHeader, mt: 3 }}>Contracts</Typography>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Cost</TableCell>
            <TableCell>Billing</TableCell>
            <TableCell>Renewal</TableCell>
            <TableCell>Auto-renew</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {(contracts ?? []).map((c) => (
            <TableRow key={c._id}>
              <TableCell>
                <Link href={`/dashboard/contracts/${c._id}`}>{c.costAmount}</Link>
              </TableCell>
              <TableCell>{c.billingCycle}</TableCell>
              <TableCell>{new Date(c.renewalDate).toLocaleDateString()}</TableCell>
              <TableCell>{c.autoRenew ? 'Yes' : 'No'}</TableCell>
            </TableRow>
          ))}
          {!(contracts ?? []).length && (
            <TableRow>
              <TableCell colSpan={4}>No contracts</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Box>
  );
}
