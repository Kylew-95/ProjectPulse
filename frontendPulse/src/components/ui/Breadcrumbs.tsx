import React from 'react';
import { NavLink } from 'react-router-dom';
import useBreadcrumbs from 'use-react-router-breadcrumbs';

const Breadcrumbs = () => {
  const breadcrumbs = useBreadcrumbs([
    { path: '/', breadcrumb: null },
    { path: '/dashboard', breadcrumb: 'Home' },
    { path: '/dashboard/overview', breadcrumb: 'Overview' },
    { path: '/dashboard/team', breadcrumb: 'Teams' },
    { path: '/dashboard/team/:teamId', breadcrumb: 'Members' },
    { path: '/dashboard/tickets', breadcrumb: 'Tickets' },
    { path: '/dashboard/analytics', breadcrumb: 'Analytics' },
    { path: '/dashboard/settings', breadcrumb: 'Settings' },
  ]);

  return (
    <nav className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-4 px-2 overflow-x-auto whitespace-nowrap scrollbar-hide">
      {breadcrumbs.map(({ match, breadcrumb }, index) => (
        <React.Fragment key={match.pathname}>
          {index > 0 && <span className="text-slate-700 flex-shrink-0">/</span>}
          <NavLink
            to={match.pathname}
            className={({ isActive }) => 
              `transition-colors flex-shrink-0 ${
                isActive && index === breadcrumbs.length - 1
                  ? 'text-slate-300 pointer-events-none' 
                  : 'hover:text-slate-300 text-slate-500 cursor-pointer'
              }`
            }
          >
            {breadcrumb}
          </NavLink>
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumbs;
