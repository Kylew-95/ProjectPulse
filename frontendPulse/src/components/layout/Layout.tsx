import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Ticket, BarChart2, Settings, Users, LogOut } from 'lucide-react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography, Button, AppBar } from '@mui/material';

import { supabase } from '../../supabaseClient';
import SidebarProfile from './SidebarProfile';
import ThemeToggle from '../ui/ThemeToggle';
import CommandPalette from '../ui/CommandPalette';
import OnboardingTour from '../ui/OnboardingTour';
import { useTheme } from '../../context/ThemeContext';

const drawerWidth = 260;

const Layout = () => {
  const location = useLocation();
  const { theme } = useTheme();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const navItems = [
    { icon: LayoutDashboard, label: 'Overview', path: '/dashboard/overview' },
    { icon: Users, label: 'Teams', path: '/dashboard/team' },
    { icon: Ticket, label: 'Tickets', path: '/dashboard/tickets' },
    { icon: BarChart2, label: 'Analytics', path: '/dashboard/analytics' },
    { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <OnboardingTour />
      <CommandPalette />
      
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
            borderRight: theme === 'dark' ? '1px solid rgba(255,255,255,0.05)' : '1px solid #e2e8f0',
            color: theme === 'dark' ? 'white' : '#0f172a',
            transition: 'background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease'
          },
        }}
      >
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Link to="/" className="flex items-center gap-3 no-underline text-inherit" title="Return to home">
             <img src="/src/assets/logo.png" alt="Pulse Loop" style={{ width: 40, height: 40, objectFit: 'contain' }} />
             <Typography variant="h6" fontWeight="bold" sx={{ letterSpacing: '-0.02em', color: theme === 'dark' ? 'white' : '#0f172a' }}>
               Pulse
             </Typography>
          </Link>
        </Box>

        <List sx={{ px: 2, flex: 1, mt: 2 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ mb: 1 }}>
                <ListItemButton
                  component={Link}
                  to={item.path}
                  selected={isActive}
                  sx={{
                    borderRadius: 3,
                    py: 1.5,
                    px: 2,
                    color: theme === 'dark' ? '#94a3b8' : '#64748b',
                    '&.Mui-selected': {
                      backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.15)' : '#eff6ff', // blue-50 light
                      border: '1px solid',
                      borderColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.3)' : '#bfdbfe', // blue-200 light
                      color: theme === 'dark' ? 'white' : '#1e40af', // blue-800 light
                      '&:hover': {
                        backgroundColor: theme === 'dark' ? 'rgba(59, 130, 246, 0.25)' : '#dbeafe', // blue-100 light
                      },
                      '& .MuiListItemIcon-root': {
                        color: '#60a5fa', // blue-400 (keep consistent or adjust)
                      }
                    },
                    '&:hover': {
                      backgroundColor: theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : '#f1f5f9', // slate-100 light
                      color: theme === 'dark' ? 'white' : '#0f172a',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: isActive ? '#3b82f6' : (theme === 'dark' ? '#94a3b8' : '#94a3b8') }}>
                    <Icon size={20} />
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.label} 
                    primaryTypographyProps={{ 
                      fontSize: '0.95rem', 
                      fontWeight: isActive ? 700 : 500
                    }} 
                  />
                  {isActive && (
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        left: 0, 
                        width: 4, 
                        height: '60%', 
                        bgcolor: '#3b82f6', 
                        borderTopRightRadius: 4, 
                        borderBottomRightRadius: 4 
                      }} 
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Box sx={{ 
          p: 2, 
          borderTop: '1px solid',
          borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : '#e2e8f0',
          bgcolor: theme === 'dark' ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc' // slate-50 light
        }}>
          <SidebarProfile />
           <Button
             fullWidth
             onClick={handleLogout}
             startIcon={<LogOut size={18} />}
             sx={{
               mt: 1,
               justifyContent: 'flex-start',
               color: theme === 'dark' ? '#94a3b8' : '#64748b',
               textTransform: 'none',
               fontWeight: 'bold',
               px: 2,
               py: 1,
               borderRadius: 3,
               '&:hover': {
                 color: '#ef4444', // red-500
                 backgroundColor: theme === 'dark' ? 'rgba(239, 68, 68, 0.05)' : '#fef2f2', // red-50 light
               }
             }}
           >
             Sign Out
           </Button>
        </Box>
      </Drawer>

      <Box component="main" sx={{ 
        flexGrow: 1, 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: '#f1f5f9', // slate-100
        '.dark &': {
          bgcolor: '#0f172a' // slate-900
        }
      }}>
        <AppBar 
          position="sticky" 
          elevation={0}
          sx={{ 
            height: 64,
            justifyContent: 'center',
            bgcolor: 'rgba(255, 255, 255, 0.8)', // Fallback for light mode
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            '.dark &': {
               bgcolor: 'rgba(15, 23, 42, 0.8)',
               borderColor: 'rgba(255,255,255,0.05)'
            }
          }}
        >
          <Toolbar sx={{ justifyContent: 'flex-end', px: 4 }}>
             <ThemeToggle />
          </Toolbar>
        </AppBar>
        
        <Box sx={{ p: 4, pt: 1, flexGrow: 1 }}>
             <Outlet />
        </Box>
      </Box>
    </Box>
  );
};

export default Layout;
