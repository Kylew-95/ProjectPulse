import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ThemeToggle from '../ui/ThemeToggle';
import Button from '../ui/Button';
import Container from '../ui/Container';

const Navbar = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <nav className="border-b border-border-main bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
      <Container className="h-20 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/logo.png" alt="Pulse Logo" className="w-10 h-10 object-contain" />
          <span className="text-xl font-bold text-main tracking-tight">
            Pulse
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <ThemeToggle />
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => supabase.auth.signOut()}
                >
                  Sign Out
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
              </div>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                >
                  Sign In
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={() => navigate('/signup')}
                >
                  Get Started
                </Button>
              </>
            )}
          </div>
        </div>
      </Container>
    </nav>
  );
};

export default Navbar;
