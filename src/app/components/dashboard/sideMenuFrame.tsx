'use client';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DashboardIcon from '@mui/icons-material/Dashboard';
import DescriptionIcon from '@mui/icons-material/Description';
import DnsIcon from '@mui/icons-material/Dns';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import { Button } from '@mui/material';
import Grid from '@mui/material/GridLegacy';
import { buttonStyle } from '@/styles/MaterialStyles/shared/sharedStyles';
import {
  sideMenuButtonAudit,
  sideMenuButtonCalendar,
  sideMenuButtonContracts,
  sideMenuButtonDashboard,
  sideMenuButtonImport,
  sideMenuButtonRenewals,
  sideMenuButtonSettings,
  sideMenuButtonSystems,
  sideMenuGrid,
} from '@/styles/MaterialStyles/dashboard/sideMenuStyles';
import Link from 'next/link';

const items = [
  { href: '/dashboard', label: 'Dashboard', Icon: DashboardIcon, sx: sideMenuButtonDashboard },
  { href: '/dashboard/systems', label: 'Systems', Icon: DnsIcon, sx: sideMenuButtonSystems },
  { href: '/dashboard/contracts', label: 'Contracts', Icon: DescriptionIcon, sx: sideMenuButtonContracts },
  { href: '/dashboard/renewals', label: 'Renewals', Icon: SyncAltIcon, sx: sideMenuButtonRenewals },
  { href: '/dashboard/calendar', label: 'Calendar', Icon: CalendarMonthIcon, sx: sideMenuButtonCalendar },
  { href: '/dashboard/import', label: 'Import', Icon: CloudUploadIcon, sx: sideMenuButtonImport },
  { href: '/dashboard/audit', label: 'Audit Log', Icon: HistoryIcon, sx: sideMenuButtonAudit },
  { href: '/dashboard/settings', label: 'Settings', Icon: SettingsIcon, sx: sideMenuButtonSettings },
] as const;

export default function SideMenuFrame({ children }: { children: React.ReactNode }) {
  return (
    <Grid
      container
      direction="column"
      justifyContent="flex-start"
      alignItems="baseline"
      spacing={2}
    >
      <Grid item sx={sideMenuGrid} xs={12}>
        <h1 className="customfont">PLUTUS</h1>
      </Grid>

      {items.map(({ href, label, Icon, sx }) => (
        <Grid key={href} item sx={sideMenuGrid} xs={12}>
          <Link href={href} style={{ width: '100%', display: 'block' }}>
            <Button
              startIcon={<Icon />}
              fullWidth
              variant="contained"
              sx={{ ...buttonStyle, ...sx }}
            >
              {label}
            </Button>
          </Link>
        </Grid>
      ))}

      {children}
    </Grid>
  );
}
