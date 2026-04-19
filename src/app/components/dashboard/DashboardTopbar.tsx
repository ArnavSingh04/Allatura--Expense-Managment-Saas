'use client';

import {
  Avatar,
  Box,
  IconButton,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { Menu, Settings } from 'lucide-react';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const titles: { prefix: string; title: string }[] = [
  { prefix: '/dashboard/systems/new', title: 'New system' },
  { prefix: '/dashboard/contracts/new', title: 'New contract' },
  { prefix: '/dashboard/systems', title: 'Systems' },
  { prefix: '/dashboard/contracts', title: 'Contracts' },
  { prefix: '/dashboard/renewals', title: 'Renewals' },
  { prefix: '/dashboard/calendar', title: 'Calendar' },
  { prefix: '/dashboard/import', title: 'Import' },
  { prefix: '/dashboard/audit', title: 'Audit log' },
  { prefix: '/dashboard/users/pending', title: 'Pending requests' },
  { prefix: '/dashboard/users', title: 'User management' },
  { prefix: '/dashboard/settings', title: 'Settings' },
  { prefix: '/dashboard', title: 'Dashboard' },
];

function titleFromPath(pathname: string | null): string {
  if (!pathname) {
    return 'Allatura';
  }
  const hit = titles.find((t) => pathname.startsWith(t.prefix));
  return hit?.title ?? 'Allatura';
}

type DashboardTopbarProps = {
  onMenuClick: () => void;
};

export default function DashboardTopbar({ onMenuClick }: DashboardTopbarProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const title = titleFromPath(pathname);

  return (
    <Box
      component="header"
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: theme.zIndex.appBar,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 56,
        px: { xs: 2, sm: 2.5 },
        py: 1,
        borderBottom: `1px solid ${theme.palette.divider}`,
        bgcolor: (th) =>
          th.palette.mode === 'dark' ? alpha(th.palette.background.paper, 0.85) : 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
        {!isMdUp && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="open navigation"
            onClick={onMenuClick}
            sx={{ color: 'text.secondary' }}
          >
            <Menu size={22} />
          </IconButton>
        )}
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 600,
            letterSpacing: '-0.02em',
            color: 'text.primary',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <Tooltip title="Settings">
          <IconButton
            component={Link}
            href="/dashboard/settings"
            size="small"
            sx={{ color: 'text.secondary' }}
            aria-label="Settings"
          >
            <Settings size={20} />
          </IconButton>
        </Tooltip>
        <Tooltip title="Account">
          <IconButton
            component={Link}
            href="/dashboard/settings"
            size="small"
            sx={{ color: 'text.secondary' }}
            aria-label="Account"
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                fontSize: '0.8rem',
                fontWeight: 600,
                bgcolor: (th) => alpha(th.palette.primary.main, 0.15),
                color: 'primary.main',
              }}
            >
              P
            </Avatar>
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  );
}
