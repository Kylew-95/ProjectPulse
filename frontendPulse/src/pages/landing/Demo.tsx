import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, LayoutDashboard, Bot, Settings, Users, Menu, X } from 'lucide-react';
import ImageModal from './components/ImageModal';
import DemoSection from './components/DemoSection';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from '../../components/ui/ThemeToggle';

const Demo = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className={`${theme} min-h-screen bg-background text-main selection:bg-blue-500/30 transition-colors duration-300`}>
      <ImageModal selectedImage={selectedImage} onClose={() => setSelectedImage(null)} />
      
      {/* Navbar */}
      <nav className="border-b border-border-main bg-surface/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src="/logo.png" alt="Pulse Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold tracking-tight">Pulse</span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <button 
                onClick={() => navigate('/')} 
                className="px-5 py-2 text-sm font-semibold border border-white/10 text-white rounded-full hover:bg-white/5 transition-all"
              >
                Back to Site
              </button>
            </div>
          </div>

          {/* Mobile Toggle */}
          <button 
            className="md:hidden p-2 text-muted hover:text-white"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-background p-4 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="pt-4 flex items-center justify-between">
              <span className="text-sm text-muted">Theme</span>
              <ThemeToggle />
            </div>
            <button 
              onClick={() => navigate('/')}
              className="w-full py-3 border border-white/10 text-white rounded-xl font-bold"
            >
              Back to Site
            </button>
          </div>
        )}
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            User Guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 pb-2">
            Getting Started with Pulse
          </h1>
          <p className="text-lg text-muted max-w-2xl mx-auto">
            A step-by-step guide to accessing your account, managing your materials, and leveraging our powerful automation tools.
          </p>
        </div>

        {/* Steps */}
        <DemoSection
            stepNumber={1}
            title="Accessing Your Account"
            icon={User}
            iconColor="blue"
            screenshotSrc="/Screenshots/Login homepage.png"
            screenshotAlt="Login Page"
            onImageClick={setSelectedImage}
        >
             <p>
              To get started, navigate to the <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate('/login')}>Login page</span>. 
              If you don't have an account yet, you can create one instantly.
            </p>
        </DemoSection>

        <DemoSection
            stepNumber={2}
            title="Managing Your Materials"
            icon={LayoutDashboard}
            iconColor="purple"
            screenshotSrc="/Screenshots/Dashboard.png"
            screenshotAlt="Dashboard Overview"
            onImageClick={setSelectedImage}
        >
             <p>
              Once logged in, you will be directed to your <strong>Dashboard</strong>. This is your command center.
              From here, you can access your <strong>Tickets</strong>, view <strong>Team Members</strong>, and track project analytics.
            </p>
        </DemoSection>

        <DemoSection
            stepNumber={3}
            title="Connecting the Experience"
            icon={Settings}
            iconColor="orange"
            screenshotSrc="/Screenshots/Discord integration.png"
            screenshotAlt="Settings Page"
            onImageClick={setSelectedImage}
        >
             <p>
              To fully power your workspace, you need to connect the <strong>Discord Bot</strong>.
            </p>
            <p className="mt-4">
              <strong>Before you connect:</strong> Make sure you have created a <strong>Discord Server</strong> or have a channel ready where you want the bot to operate.
            </p>
            <p className="mt-4">
              Then, go to the <strong>Settings</strong> page in your dashboard to invite the bot to your server.
            </p>
            <p className="mt-4 text-emerald-400">
              <span className="font-bold">Note:</span> Upon successful connection, a channel named <code className="bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-300">report-issues-with-pulse</code> will be automatically created in your server.
            </p>
        </DemoSection>

        <DemoSection
            stepNumber={4}
            title="Automation & Intelligence"
            icon={Bot}
            iconColor="emerald"
            screenshotSrc="/Screenshots/Discord Bot notifications.png"
            screenshotAlt="Discord Bot Notifications"
            onImageClick={setSelectedImage}
        >
             <p>
              Pulse provides deep <strong>company insights</strong>, allowing you to stay perfectly in tune with community needs and desires. 
              Our intelligence engine constantly monitors feedback and automates ticket routing, ensuring your operations are always aligned with what your users want.
            </p>
        </DemoSection>

        <DemoSection
            stepNumber={5}
            title="Insights & Data"
            icon={LayoutDashboard}
            iconColor="purple"
            onImageClick={setSelectedImage}
        >
             <p>
              Unlock the full potential of your community data with <strong>Intelligence Analytics</strong> and our vectorized <strong>Knowledge Base</strong>.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 mt-8">
                <div 
                    className="group/img relative rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImage('/Screenshots/Real_Analytics.png')}
                >
                    <img 
                        src="/Screenshots/Real_Analytics.png" 
                        alt="Analytics Dashboard Preview" 
                        className="w-full h-auto object-cover border border-white/10 group-hover:scale-105 transition-transform duration-500 rounded-lg"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <h4 className="text-purple-400 font-semibold text-sm">Pro Analytics</h4>
                    </div>
                </div>
                <div 
                    className="group/img relative rounded-xl overflow-hidden cursor-pointer"
                    onClick={() => setSelectedImage('/Screenshots/Real_KnowledgeBase.png')}
                >
                    <img 
                        src="/Screenshots/Real_KnowledgeBase.png" 
                        alt="Knowledge Base Preview" 
                        className="w-full h-auto object-cover border border-white/10 group-hover:scale-105 transition-transform duration-500 rounded-lg"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <h4 className="text-blue-400 font-semibold text-sm">Enterprise Knowledge</h4>
                    </div>
                </div>
            </div>
        </DemoSection>

        <DemoSection
            stepNumber={6}
            title="Team & Collaboration"
            icon={Users}
            iconColor="blue"
            screenshotSrc="/Screenshots/TeamManagement.png"
            screenshotAlt="Team Management Dashboard"
            onImageClick={setSelectedImage}
        >
             <p>
              Scale your operations by organizing members into specialized <strong>Teams</strong>.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 text-muted">
                <li>Manage team availability and workloads in real-time.</li>
                <li>Delegate tickets to specific departments (Technical, Billing, General).</li>
                <li>Monitor individual performance metrics via the Team dashboard.</li>
            </ul>
        </DemoSection>



        {/* CTA */}
        <div className="text-center py-12 border-t border-white/5 ">
            <h3 className="text-2xl font-bold mb-6 text-white">Ready to get started?</h3>
            <button 
                onClick={() => navigate('/signup')} 
                className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-semibold transition-all shadow-lg shadow-blue-500/25 inline-flex items-center gap-2"
            >
                Launch Pulse <ArrowLeft className="rotate-180" size={20} />
            </button>
        </div>

      </main>
    </div>
  );
};

export default Demo;
