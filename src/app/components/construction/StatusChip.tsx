'use client';

import { Chip } from '@mui/material';

const colorMap: Record<string, 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info'> = {
  // project
  Planning: 'info',
  Active: 'primary',
  OnHold: 'warning',
  Completed: 'success',
  Archived: 'default',
  // contract
  Draft: 'default',
  Issued: 'info',
  Signed: 'primary',
  Terminated: 'error',
  // milestone / claim
  Pending: 'warning',
  Claimed: 'info',
  Certified: 'primary',
  Paid: 'success',
  // variation
  Approved: 'success',
  Rejected: 'error',
  Cancelled: 'default',
  // expense
  Committed: 'info',
  Invoiced: 'primary',
  Disputed: 'error',
  // claims
  Submitted: 'info',
  UnderReview: 'warning',
  // milestones
  Planned: 'info',
  InProgress: 'primary',
  AtRisk: 'error',
};

export default function StatusChip({ status }: { status: string }) {
  return (
    <Chip
      label={status}
      size="small"
      color={colorMap[status] ?? 'default'}
      variant={colorMap[status] ? 'filled' : 'outlined'}
      sx={{ fontWeight: 600 }}
    />
  );
}
