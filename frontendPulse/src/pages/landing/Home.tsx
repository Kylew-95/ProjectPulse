import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Bot, User, LayoutDashboard, Settings, Users } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import Navbar from '../../components/layout/Navbar';
import Button from '../../components/ui/Button';
import Container from '../../components/ui/Container';
import PricingSection from '../../components/landing/PricingSection';
import DemoSection from './components/DemoSection';
import ImageModal from './components/ImageModal';
import { Zap, Shield, Globe, ArrowRight } from 'lucide-react';
import Marquee from "react-fast-marquee";

const InteractivePulse = () => {
    return (
        <span 
            className="relative inline-block text-transparent bg-clip-text font-extrabold cursor-default select-none pb-4 px-2 -mx-2"
            style={{
                backgroundImage: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 25%, #60a5fa 50%, #94a3b8 75%, #2563eb 100%)',
                backgroundSize: '200% auto',
                backgroundPosition: '0% center',
                WebkitBackgroundClip: 'text',
                color: 'transparent',
                animation: 'pulse-gradient 4s linear infinite',
            }}
        >
            <style>
                {`
                    @keyframes pulse-gradient {
                        0% { background-position: 0% center; }
                        50% { background-position: 100% center; }
                        100% { background-position: 0% center; }
                    }
                `}
            </style>
            Pulse
        </span>
    );
};

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className={`${theme} min-h-screen bg-background selection:bg-primary/30 text-main transition-colors duration-300`}>
      <Navbar />

      {/* Hero */}
      <div className="relative pt-24 pb-20 sm:pt-32 sm:pb-24 overflow-hidden border-b border-slate-200 dark:border-white/5">
        {/* Modern Grid Background */}
        <div className="absolute inset-0 bg-grid-black/5 dark:bg-grid-white/5 bg-[bottom_1px_center] [mask-image:linear-gradient(to_bottom,transparent,black)] pointer-events-none" />
        
        {/* Dynamic Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-blue-500/20 blur-[100px] rounded-full pointer-events-none opacity-50 dark:opacity-20" />
        
        <Container className="relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs font-bold uppercase tracking-widest text-blue-500 dark:text-blue-400 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 backdrop-blur-sm shadow-sm hover:shadow-md transition-all cursor-default select-none">
            <span className="relative flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Pulse v2.0 is live
          </div>
          
          <h1 className="text-6xl sm:text-8xl font-black tracking-tighter mb-8 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 text-slate-900 dark:text-white leading-[0.9]">
            The heart of a business has a <InteractivePulse />
          </h1>
          
          <p className="text-xl sm:text-2xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 font-medium leading-relaxed">
            Streamline your workflow, manage tickets efficiently, and get real-time insights into your team's performance.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Button 
              onClick={() => navigate(user ? '/dashboard' : '/signup')} 
              variant="primary" 
              size="lg"
              className="h-12 min-w-[200px] px-8 rounded-full text-sm shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.6)] transition-all duration-300 group font-bold tracking-tight"
            >
              {user ? 'Go to Dashboard' : 'Start for free'} <ArrowRight size={16} className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={() => document.getElementById('demo')?.scrollIntoView({ behavior: 'smooth' })}
              variant="secondary"
              size="lg"
              className="h-12 min-w-[200px] px-8 rounded-full text-sm bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold tracking-tight"
            >
              See How It Works
            </Button>
          </div>
        </Container>
      </div>

      {/* Trusted By Section */}
        <Marquee gradient={false} speed={40} pauseOnHover={true} className="overflow-hidden py-4">
          <div className="flex items-center gap-12 px-4">
            {[
              {
                name: "Meta",
                url: "https://cdn.simpleicons.org/meta/64748b"
              },
              {
                name: "Vercel",
                url: "https://cdn.simpleicons.org/vercel/64748b"
              },
              {
                name: "Stripe",
                url: "https://cdn.simpleicons.org/stripe/64748b"
              },
              {
                name: "Discord",
                url: "https://cdn.simpleicons.org/discord/64748b"
              },
              {
                name: "Supabase",
                url: "https://cdn.simpleicons.org/supabase/64748b"
              },
              {
                name: "OpenAI",
                url: "https://cdn.simpleicons.org/openai/64748b"
              }
            ].map((company, index) => (
              <div 
                key={index}
                className="flex items-center gap-3 group px-6 grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-300 cursor-default"
              >
                  <img 
                    src={company.url} 
                    alt={`${company.name} Logo`} 
                    className="w-8 h-8 object-contain opacity-70 group-hover:opacity-100 transition-opacity"
                  />
                  <span className="text-xl font-bold text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white transition-colors">
                    {company.name}
                  </span>
              </div>
            ))}
          </div>
        </Marquee>
              
      
      <Container className="py-24">
        <div className="text-center mb-16">
             <h2 className="text-3xl sm:text-5xl font-black tracking-tighter text-slate-900 dark:text-white mb-4">
                 Everything you need to <span className="text-blue-500">build a community.</span>
             </h2>
             <p className="text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl mx-auto">
                 Built for modern teams who demand speed, security, and reliability.
             </p>
        </div>

         <div className="grid md:grid-cols-3 gap-6 auto-rows-[minmax(0,1fr)]">
             {/* Security - Tall Card */}
             <div className="md:col-span-1 row-span-2 group relative overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-500 flex flex-col justify-between">
                 <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                 <div>
                     <div className="w-14 h-14 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center text-blue-500 mb-6 shadow-sm">
                        <Shield size={28} />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Enterprise Grade Security</h3>
                     <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                         Bank-level encryption, SOC2 compliance ready, and role-based access control. Your data is safe with us.
                     </p>
                 </div>
                 <div className="mt-8 relative h-40 overflow-hidden rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-black/20">
                     <div className="absolute inset-0 flex items-center justify-center">
                         <div className="flex gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                             <span className="text-xs font-mono text-slate-400">System Secure</span>
                         </div>
                     </div>
                 </div>
             </div>

             {/* Performance - Wide Card */}
             <div className="md:col-span-2 group relative overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-500">
                <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:opacity-10 dark:opacity-10 dark:group-hover:opacity-20 transition-opacity">
                    <Zap size={120} strokeWidth={1} />
                </div>
                 <div className="relative z-10">
                     <div className="w-14 h-14 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center text-yellow-500 mb-6 shadow-sm">
                        <Zap size={28} />
                     </div>
                     <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Lightning Fast Sync</h3>
                     <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium max-w-md">
                         Changes propagate instantly to all team members. No refresh buttons, no stale data. Using our global CDN edge network.
                     </p>
                 </div>
             </div>

             {/* Global - Wide Card */}
             <div className="md:col-span-2 group relative overflow-hidden bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 p-8 rounded-[2.5rem] hover:border-slate-300 dark:hover:border-white/20 transition-all duration-500">
                 <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                     <div className="w-14 h-14 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center text-purple-500 shadow-sm shrink-0">
                        <Globe size={28} />
                     </div>
                     <div>
                         <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Global Infrastructure</h3>
                         <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                             Deployed on edge nodes worldwide for <span className="text-slate-900 dark:text-white font-bold">low-latency access</span> from anywhere.
                         </p>
                     </div>
                 </div>
             </div>
         </div>
      </Container>

      {/* Exact Demo Replica integrated into flow - Tighter bottom padding */}
      <main id="demo" className="max-w-4xl mx-auto px-4 pt-12 sm:pt-24 pb-4 sm:pb-8 relative z-10">
        <ImageModal selectedImage={selectedImage} onClose={() => setSelectedImage(null)} />
        
        {/* Header matched to Demo.tsx */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-400 mb-6 font-mono tracking-tighter">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            User Guide
          </div>
          <h2 className="text-4xl sm:text-6xl font-black tracking-tighter mb-6 pb-2 text-slate-900 dark:text-white leading-tight">
            Getting Started with Pulse
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto font-medium leading-relaxed">
            A step-by-step guide to accessing your account, managing your materials, and leveraging our powerful automation tools.
          </p>
        </div>

        {/* Steps replicated exactly from Demo.tsx */}
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
            <p className="mt-4 text-emerald-400 font-medium">
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
              Our intelligence engine constantly monitors feedback and automates ticket routing.
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
                    className="group/img relative rounded-xl overflow-hidden cursor-pointer aspect-video flex items-center justify-center"
                    onClick={() => setSelectedImage('/Screenshots/Real_Analytics.png')}
                >
                    <img 
                        src="/Screenshots/Real_Analytics.png" 
                        alt="Analytics Dashboard Preview" 
                        className="max-w-full max-h-full object-contain"
                    />
                    <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                        <h4 className="text-purple-400 font-semibold text-sm">Pro Analytics</h4>
                    </div>
                </div>
                <div 
                    className="group/img relative rounded-xl overflow-hidden cursor-pointer aspect-video flex items-center justify-center"
                    onClick={() => setSelectedImage('/Screenshots/Real_KnowledgeBase.png')}
                >
                    <img 
                        src="/Screenshots/Real_KnowledgeBase.png" 
                        alt="Knowledge Base Preview" 
                        className="max-w-full max-h-full object-contain"
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
            <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-500 dark:text-slate-400">
                <li>Manage team availability and workloads in real-time.</li>
                <li>Delegate tickets to specific departments (Technical, Billing, General).</li>
                <li>Monitor individual performance metrics via the Team dashboard.</li>
            </ul>
        </DemoSection>
      </main>

      <PricingSection />
    </div>
  );
};

export default Home;
