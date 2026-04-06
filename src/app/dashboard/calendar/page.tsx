'use client';

import 'react-big-calendar/lib/css/react-big-calendar.css';

import {
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import {
  endOfMonth,
  endOfWeek,
  format,
  parse,
  startOfMonth,
  startOfWeek,
  getDay,
} from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useCallback, useMemo, useState } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  type View,
} from 'react-big-calendar';
import useSWR from 'swr';
import { authFetcher } from '@/lib/swr-fetcher';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse: (value: string, formatString: string) =>
    parse(value, formatString, new Date()),
  startOfWeek: (date: Date) => startOfWeek(date, { locale: enUS }),
  getDay,
  locales,
});

type CalContract = {
  _id: string;
  renewalDate: string;
  costAmount: number;
  autoRenew: boolean;
  systemId?: {
    name?: string;
    vendor?: string;
    department?: string;
    criticality?: string;
    businessOwner?: { _id?: string; name?: string };
  };
};

type UserOpt = { id: string; name?: string; email?: string };

export default function CalendarPage() {
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [department, setDepartment] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [criticality, setCriticality] = useState('');

  const range = useMemo(() => {
    if (view === 'month') {
      const start = startOfMonth(date);
      const end = endOfMonth(date);
      return {
        from: start.toISOString(),
        to: end.toISOString(),
      };
    }
    const start = startOfWeek(date, { locale: enUS });
    const end = endOfWeek(date, { locale: enUS });
    return {
      from: start.toISOString(),
      to: end.toISOString(),
    };
  }, [view, date]);

  const qs = useMemo(() => {
    const p = new URLSearchParams();
    p.set('from', range.from);
    p.set('to', range.to);
    if (department) {
      p.set('department', department);
    }
    if (ownerId) {
      p.set('ownerId', ownerId);
    }
    if (criticality) {
      p.set('criticality', criticality);
    }
    return `contracts/calendar?${p.toString()}`;
  }, [range, department, ownerId, criticality]);

  const { data: contracts } = useSWR<CalContract[]>(qs, authFetcher);
  const { data: users } = useSWR<UserOpt[]>('users', authFetcher);

  const events = useMemo(() => {
    return (contracts ?? []).map((c) => {
      const d = new Date(c.renewalDate);
      const title = c.systemId?.name ?? 'Renewal';
      return {
        id: c._id,
        title,
        start: d,
        end: d,
        resource: c,
      };
    });
  }, [contracts]);

  const onNavigate = useCallback((d: Date) => setDate(d), []);
  const onView = useCallback((v: View) => setView(v), []);

  return (
    <Box>
      <Typography sx={dashboardHeader}>Renewal calendar</Typography>
      <Typography sx={dashboardSubheader} gutterBottom>
        Filter and explore renewals
      </Typography>

      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2, alignItems: 'center' }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
        >
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
        </ToggleButtonGroup>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Department</InputLabel>
          <Select
            label="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            {[...new Set((contracts ?? []).map((c) => c.systemId?.department).filter(Boolean))].map(
              (d) => (
                <MenuItem key={d} value={d!}>
                  {d}
                </MenuItem>
              ),
            )}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Owner</InputLabel>
          <Select label="Owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            {(users ?? []).map((u) => (
              <MenuItem key={u.id} value={u.id}>
                {u.name || u.email}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Risk (criticality)</InputLabel>
          <Select
            label="Risk (criticality)"
            value={criticality}
            onChange={(e) => setCriticality(e.target.value)}
          >
            <MenuItem value="">All</MenuItem>
            <MenuItem value="Low">Low</MenuItem>
            <MenuItem value="Medium">Medium</MenuItem>
            <MenuItem value="High">High</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Box sx={{ height: 560 }}>
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={onView}
          date={date}
          onNavigate={onNavigate}
          popup
          tooltipAccessor={(ev) => {
            const c = ev.resource as CalContract;
            const o = c.systemId?.businessOwner;
            return `${c.systemId?.name}\n${c.costAmount} ${c.autoRenew ? '(auto-renew)' : ''}\n${o?.name ?? ''}`;
          }}
        />
      </Box>
    </Box>
  );
}
