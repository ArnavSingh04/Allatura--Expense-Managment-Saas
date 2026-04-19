'use client';

import {
  Alert,
  Box,
  Button,
  CardContent,
  IconButton,
  LinearProgress,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { CheckCheck, Plus, Receipt } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import useSWR, { mutate } from 'swr';
import AppCard from '@/components/ui/AppCard';
import EmptyState from '@/components/ui/EmptyState';
import BudgetBar from '@/components/construction/BudgetBar';
import ExpenseDialog from '@/components/construction/ExpenseDialog';
import Money from '@/components/construction/Money';
import StatusChip from '@/components/construction/StatusChip';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import { ApiError } from '@/lib/api-client';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import { expenseService } from '@/services/expenseService';
import {
  EXPENSE_KINDS,
  EXPENSE_STATUSES,
  type Contract,
  type Expense,
  type ExpenseKind,
  type ExpenseStatus,
  type Project,
  type Subcontractor,
  type Supplier,
} from '@/types/construction';

type Ledger = Awaited<ReturnType<typeof expenseService.costLedger>>;

export default function ProjectExpensesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { can } = useAuthSession();

  const [deptId, setDeptId] = useState('');
  const [kind, setKind] = useState<'all' | ExpenseKind>('all');
  const [status, setStatus] = useState<'all' | ExpenseStatus>('all');
  const [creating, setCreating] = useState(false);
  const [marking, setMarking] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: project } = useSWR<Project>(
    id ? keys.project(id) : null,
    authFetcher,
  );
  const { data: contracts } = useSWR<Contract[]>(
    id ? keys.contractsByProject(id) : null,
    authFetcher,
  );
  const { data: subbies } = useSWR<Subcontractor[]>(keys.subbies(), authFetcher);
  const { data: suppliers } = useSWR<Supplier[]>(keys.suppliers(), authFetcher);

  const expensesKey = useMemo(
    () =>
      id
        ? keys.expensesByProject(id, {
            deptId: deptId || undefined,
            kind: kind === 'all' ? undefined : kind,
            status: status === 'all' ? undefined : status,
          })
        : null,
    [id, deptId, kind, status],
  );
  const { data: expenses, isLoading, error } = useSWR<Expense[]>(
    expensesKey,
    authFetcher,
  );
  const { data: ledger } = useSWR<Ledger>(
    id ? keys.costLedger(id) : null,
    authFetcher,
  );

  const refresh = () =>
    void Promise.all([
      mutate(expensesKey),
      mutate(keys.costLedger(id)),
      mutate(keys.projectFinancials(id)),
      mutate(keys.projectDashboard(id)),
    ]);

  const deptById = useMemo(
    () => new Map((project?.departments ?? []).map((d) => [d._id, d])),
    [project],
  );
  const subbieById = useMemo(
    () => new Map((subbies ?? []).map((s) => [s._id, s.name])),
    [subbies],
  );
  const supplierById = useMemo(
    () => new Map((suppliers ?? []).map((s) => [s._id, s.name])),
    [suppliers],
  );

  const markPaid = async (expenseId: string) => {
    setActionError(null);
    setMarking(expenseId);
    try {
      await expenseService.markPaid(expenseId, {
        paidOn: new Date().toISOString().slice(0, 10),
      });
      refresh();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'Could not mark paid.');
    } finally {
      setMarking(null);
    }
  };

  if (error)
    return <Alert severity="error">{(error as Error).message}</Alert>;

  return (
    <Box>
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Expenses ({expenses?.length ?? 0})
        </Typography>
        {can('expenses.create') && project && (
          <Button
            variant="contained"
            startIcon={<Plus size={16} />}
            onClick={() => setCreating(true)}
          >
            New expense
          </Button>
        )}
      </Stack>

      {ledger && ledger.perDepartment.length > 0 && (
        <AppCard sx={{ mb: 2.5 }}>
          <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
            <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>
              Cost ledger by department
            </Typography>
            <Stack spacing={1.5}>
              {ledger.perDepartment.map((d) => (
                <Box key={d.departmentId}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    sx={{ mb: 0.5 }}
                  >
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {d.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Paid <Money value={d.paid} /> · Committed{' '}
                      <Money value={d.committed} /> ·{' '}
                      <Money value={d.budget} bold /> budget
                    </Typography>
                  </Stack>
                  <BudgetBar
                    budget={d.budget}
                    committed={d.committed}
                    paid={d.paid}
                    size="sm"
                  />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </AppCard>
      )}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <TextField
          select
          size="small"
          label="Department"
          value={deptId}
          onChange={(e) => setDeptId(e.target.value)}
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All departments</MenuItem>
          {(project?.departments ?? []).map((d) => (
            <MenuItem key={d._id} value={d._id}>
              {d.name}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as 'all' | ExpenseKind)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All kinds</MenuItem>
          {EXPENSE_KINDS.map((k) => (
            <MenuItem key={k} value={k}>
              {k}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value as 'all' | ExpenseStatus)}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="all">All statuses</MenuItem>
          {EXPENSE_STATUSES.map((s) => (
            <MenuItem key={s} value={s}>
              {s}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}
      {isLoading && <LinearProgress sx={{ mb: 2 }} />}

      {!isLoading && (expenses?.length ?? 0) === 0 ? (
        <EmptyState
          icon={Receipt}
          title="No expenses logged yet"
          description={
            can('expenses.create')
              ? 'Track committed and paid spend by department to keep budget vs. actual honest.'
              : 'Expenses on this job will appear here.'
          }
          actionLabel={can('expenses.create') ? 'Add expense' : undefined}
          onAction={can('expenses.create') ? () => setCreating(true) : undefined}
        />
      ) : (
        <AppCard>
          <CardContent sx={{ p: 0 }}>
            <TableContainer>
              <Table size="medium">
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell>Department</TableCell>
                    <TableCell>Kind</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Incurred</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right" />
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(expenses ?? []).map((e) => {
                    const vendor =
                      (e.subcontractorId && subbieById.get(e.subcontractorId)) ||
                      (e.supplierId && supplierById.get(e.supplierId)) ||
                      '—';
                    return (
                      <TableRow key={e._id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {e.description}
                          </Typography>
                          {e.invoiceNumber && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              Invoice {e.invoiceNumber}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {deptById.get(e.departmentId)?.name ?? '—'}
                        </TableCell>
                        <TableCell>{e.kind}</TableCell>
                        <TableCell>{vendor}</TableCell>
                        <TableCell>
                          <StatusChip status={e.status} />
                        </TableCell>
                        <TableCell>
                          {new Date(e.incurredOn).toLocaleDateString()}
                        </TableCell>
                        <TableCell align="right">
                          <Money value={e.amount} bold />
                        </TableCell>
                        <TableCell align="right">
                          {can('expenses.markPaid') && e.status !== 'Paid' && (
                            <Tooltip title="Mark paid">
                              <span>
                                <IconButton
                                  size="small"
                                  color="success"
                                  disabled={marking === e._id}
                                  onClick={() => markPaid(e._id)}
                                >
                                  <CheckCheck size={16} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </AppCard>
      )}

      {project && (
        <ExpenseDialog
          open={creating}
          onClose={() => setCreating(false)}
          project={project}
          contracts={contracts ?? []}
          subbies={subbies ?? []}
          suppliers={suppliers ?? []}
          defaultDeptId={deptId || undefined}
          onCreated={refresh}
        />
      )}
    </Box>
  );
}
