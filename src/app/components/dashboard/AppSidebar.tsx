'use client';

import {
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Files,
  GanttChartSquare,
  HardHat,
  History,
  LayoutDashboard,
  Settings,
  Truck,
  UserCheck,
  Users,
} from 'lucide-react';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuthSession } from '@/contexts/AuthSessionContext';
import type { RbacAction } from '@/lib/rbac';

const DRAWER_WIDTH = 260;
const DRAWER_COLLAPSED = 76;

type NavItem = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  /** Action gate; item hides if user lacks this capability. */
  needs?: RbacAction;
  /** Owner-only items hidden from everyone else. */
  ownerOnly?: boolean;
};

const items: NavItem[] = [
  { href: '/dashboard', label: 'Overview', Icon: LayoutDashboard, needs: 'dashboard.view' },
  { href: '/dashboard/projects', label: 'Projects', Icon: GanttChartSquare, needs: 'projects.view' },
  { href: '/dashboard/variations', label: 'Variation inbox', Icon: ClipboardList, needs: 'variations.view' },
  { href: '/dashboard/subcontractors', label: 'Subcontractors', Icon: HardHat, needs: 'subbies.view' },
  { href: '/dashboard/suppliers', label: 'Suppliers', Icon: Truck, needs: 'suppliers.view' },
  { href: '/dashboard/documents', label: 'Documents', Icon: Files, needs: 'documents.view' },
  { href: '/dashboard/audit', label: 'Audit log', Icon: History, needs: 'audit.view' },
  { href: '/dashboard/users', label: 'Users', Icon: Users, ownerOnly: true },
  { href: '/dashboard/users/pending', label: 'Pending requests', Icon: UserCheck, ownerOnly: true },
  { href: '/dashboard/settings', label: 'Settings', Icon: Settings, needs: 'settings.view' },
];

const STORAGE_KEY = 'allatura-sidebar-collapsed';

type AppSidebarProps = {
  mobileOpen: boolean;
  onMobileClose: () => void;
};

export default function AppSidebar({ mobileOpen, onMobileClose }: AppSidebarProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [collapsed, setCollapsed] = useState(false);
  const { session, isActive, can } = useAuthSession();
  const isOwner =
    isActive && (session?.role === 'owner' || session?.role === 'admin');

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === '1') setCollapsed(true);
    } catch {
      /* ignore */
    }
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        /* ignore */
      }
      return next;
    });
  }, []);

  const width = collapsed ? DRAWER_COLLAPSED : DRAWER_WIDTH;

  const navContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderRight: `1px solid ${theme.palette.divider}`,
        bgcolor: 'background.paper',
        backgroundImage: (th) =>
          `linear-gradient(180deg, ${alpha(th.palette.primary.main, 0.08)} 0%, transparent 42%)`,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          px: collapsed ? 0.5 : 2,
          py: 2,
          minHeight: 56,
        }}
      >
        {collapsed ? (
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '0.95rem',
                color: 'primary.main',
                letterSpacing: '-0.06em',
              }}
            >
              A
            </Typography>
          </Link>
        ) : (
          <Link href="/dashboard" style={{ textDecoration: 'none' }}>
            <Typography className="customfont" sx={{ fontSize: '1.15rem' }}>
              ALLATURA
            </Typography>
          </Link>
        )}
        {isMdUp && (
          <Tooltip title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <IconButton
              size="small"
              onClick={toggleCollapsed}
              sx={{
                color: 'text.secondary',
                '&:hover': { bgcolor: (th) => alpha(th.palette.primary.main, 0.12) },
              }}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </IconButton>
          </Tooltip>
        )}
      </Box>

      <List sx={{ flex: 1, px: 1, py: 0.5 }} dense>
        {items.map(({ href, label, Icon, needs, ownerOnly }) => {
          if (ownerOnly && !isOwner) return null;
          if (needs && !can(needs)) return null;
          const active =
            href === '/dashboard'
              ? pathname === '/dashboard' || pathname === '/dashboard/'
              : href === '/dashboard/users'
                ? pathname === '/dashboard/users' || pathname === '/dashboard/users/'
                : pathname === href || pathname.startsWith(`${href}/`);
          const button = (
            <ListItemButton
              component={Link}
              href={href}
              selected={active}
              onClick={() => {
                if (!isMdUp) onMobileClose();
              }}
              sx={{
                borderRadius: 2,
                mb: 0.25,
                py: 1,
                px: 1.25,
                '&.Mui-selected': {
                  bgcolor: (th) => alpha(th.palette.primary.main, 0.14),
                  color: 'primary.main',
                  '& .MuiListItemIcon-root': { color: 'primary.main' },
                  '&:hover': { bgcolor: (th) => alpha(th.palette.primary.main, 0.18) },
                },
                '&:hover': {
                  bgcolor: (th) =>
                    th.palette.mode === 'dark'
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(15, 23, 42, 0.04)',
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: collapsed ? 0 : 40, justifyContent: 'center' }}>
                <Icon size={20} strokeWidth={active ? 2.25 : 2} />
              </ListItemIcon>
              {!collapsed && (
                <ListItemText
                  primary={label}
                  primaryTypographyProps={{
                    fontSize: '0.875rem',
                    fontWeight: active ? 600 : 500,
                  }}
                />
              )}
            </ListItemButton>
          );

          return (
            <Box key={href} component="li" sx={{ display: 'block' }}>
              {collapsed ? (
                <Tooltip title={label} placement="right">
                  {button}
                </Tooltip>
              ) : (
                button
              )}
            </Box>
          );
        })}
      </List>

      <Box sx={{ p: 1.5, borderTop: `1px solid ${theme.palette.divider}` }}>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ px: 1, display: collapsed ? 'none' : 'block' }}
        >
          Built for builders.
        </Typography>
      </Box>
    </Box>
  );

  if (!isMdUp) {
    return (
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            border: 'none',
          },
        }}
      >
        {navContent}
      </Drawer>
    );
  }

  return (
    <Box
      component="nav"
      sx={{
        width,
        flexShrink: 0,
        alignSelf: 'stretch',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: theme.zIndex.drawer,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
      }}
      aria-label="Main navigation"
    >
      {navContent}
    </Box>
  );
}

export { DRAWER_WIDTH, DRAWER_COLLAPSED };
