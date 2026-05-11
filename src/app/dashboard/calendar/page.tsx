'use client';

import 'react-big-calendar/lib/css/react-big-calendar.css';
import './calendar.css';

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
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  Calendar,
  dateFnsLocalizer,
  type View,
} from 'react-big-calendar';
import useSWR from 'swr';
import {
  dashboardHeader,
  dashboardSubheader,
} from '@/styles/MaterialStyles/shared/sharedStyles';
import { authFetcher } from '@/lib/swr-fetcher';
import { keys } from '@/lib/swr-keys';
import type { Project } from '@/types/construction';

const locales = { 'en-US': enUS };

const localizer = dateFnsLocalizer({
  format,
  parse: (value: string, formatString: string) =>
    parse(value, formatString, new Date()),
  startOfWeek: (date: Date) => startOfWeek(date, { locale: enUS }),
  getDay,
  locales,
});

type CalendarApiEvent = {
  id: string;
  kind: string;
  title: string;
  at: string;
  projectId: string;
  projectName: string;
  contractId?: string;
  contractRef?: string;
  link: string;
};

type CalendarResponse = {
  from: string;
  to: string;
  events: CalendarApiEvent[];
};

const KIND_LABEL: Record<string, string> = {
  project_start: 'Project start',
  project_end: 'Planned completion',
  contract_completion: 'Contract completion',
  payment_milestone: 'Payment milestone',
  site_milestone: 'Site milestone',
};

export default function CalendarPage() {
  const router = useRouter();
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [projectId, setProjectId] = useState('');
  const [kind, setKind] = useState('');

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

  const calKey = useMemo(
    () =>
      keys.companyCalendar({
        from: range.from,
        to: range.to,
        projectId: projectId || undefined,
      }),
    [range.from, range.to, projectId],
  );

  const { data, isLoading } = useSWR<CalendarResponse>(calKey, authFetcher);
  const { data: projects } = useSWR<Project[]>(keys.projects(), authFetcher);

  const events = useMemo(() => {
    const raw = data?.events ?? [];
    const filtered = kind ? raw.filter((e) => e.kind === kind) : raw;
    return filtered.map((e) => ({
      id: e.id,
      title: e.title,
      start: new Date(e.at),
      end: new Date(e.at),
      resource: e,
    }));
  }, [data, kind]);

  const kindOptions = useMemo(() => {
    const set = new Set((data?.events ?? []).map((e) => e.kind));
    return [...set].sort();
  }, [data]);

  const onNavigate = useCallback((d: Date) => setDate(d), []);
  const onView = useCallback((v: View) => setView(v), []);

  return (
    <Box>
      <Typography sx={dashboardHeader}>Project calendar</Typography>
      <Typography sx={dashboardSubheader} gutterBottom>
        Key dates across projects: starts, planned completion, contract targets,
        payment milestones, and site milestones.
      </Typography>

      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 2,
          mb: 2,
          alignItems: 'center',
        }}
      >
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
        >
          <ToggleButton value="month">Month</ToggleButton>
          <ToggleButton value="week">Week</ToggleButton>
        </ToggleButtonGroup>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Project</InputLabel>
          <Select
            label="Project"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <MenuItem value="">All projects</MenuItem>
            {(projects ?? []).map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.code} — {p.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Event type</InputLabel>
          <Select label="Event type" value={kind} onChange={(e) => setKind(e.target.value)}>
            <MenuItem value="">All types</MenuItem>
            {kindOptions.map((k) => (
              <MenuItem key={k} value={k}>
                {KIND_LABEL[k] ?? k}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        {isLoading && (
          <Typography variant="caption" color="text.secondary">
            Loading…
          </Typography>
        )}
      </Box>

      <Box className="plutus-calendar" sx={{ height: 560 }}>
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
          onSelectEvent={(ev) => {
            const r = ev.resource as CalendarApiEvent;
            if (r?.link) router.push(r.link);
          }}
          tooltipAccessor={(ev) => {
            const r = ev.resource as CalendarApiEvent;
            const typeLine = KIND_LABEL[r.kind] ?? r.kind;
            return `${r.title}\n${typeLine}\n${r.projectName}`;
          }}
        />
      </Box>
    </Box>
  );
}
