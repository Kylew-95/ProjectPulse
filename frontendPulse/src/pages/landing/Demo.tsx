import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, LayoutDashboard, Bot, Settings, ZoomIn } from 'lucide-react';
import ImageModal from './components/ImageModal';
import DemoSection from './components/DemoSection';

const Demo = () => {
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-blue-500/30">
      <ImageModal selectedImage={selectedImage} onClose={() => setSelectedImage(null)} />
      
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-slate-900/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="Pulse Logo" className="w-10 h-10 object-contain" />
            <span className="text-xl font-bold tracking-tight">Pulse</span>
          </div>
          <button 
            onClick={() => navigate('/')} 
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-12 sm:py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-sm font-medium text-blue-400 mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            User Guide
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent pb-2">
            Getting Started with Pulse
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
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
            title="Using the Automation Machine"
            icon={Bot}
            iconColor="emerald"
            onImageClick={setSelectedImage}
        >
             <p>
              ProjectPulse's core "Machine" is our intelligent ticket automation. 
              The system automatically routes tickets, assigns urgency scores, and notifies the right team members via Discord.
            </p>
            <ul className="list-disc pl-5 space-y-2 mt-4 text-slate-400 mb-8">
                <li>Create a ticket via the Dashboard or Discord Bot.</li>
                <li>Watch as the system automatically assigns an <strong>Urgency Score</strong>.</li>
                <li>Team updates are synced in real-time.</li>
            </ul>

            {/* Detail Screenshots Grid moved inside Step 4 */}
            <div className="grid md:grid-cols-2 gap-6 mt-12">
                {/* Ticket Management */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 shadow-xl hover:border-emerald-500/30 transition-all">
                    <div 
                        className="aspect-square bg-slate-800/50 rounded-xl flex items-center justify-center relative overflow-hidden p-4 cursor-pointer group"
                        onClick={() => setSelectedImage("/Screenshots/Ticket management .png")}
                    >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10 rounded-xl">
                            <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <img 
                            src="/Screenshots/Ticket management .png" 
                            alt="Ticket Management Interface" 
                            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <p className="text-center text-sm text-slate-500 mt-3 font-medium">Ticket Management Interface</p>
                </div>

                {/* Discord Bot Notifications */}
                <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-4 shadow-xl hover:border-emerald-500/30 transition-all">
                    <div 
                        className="aspect-square bg-slate-800/50 rounded-xl flex items-center justify-center relative overflow-hidden cursor-pointer group"
                        onClick={() => setSelectedImage("/Screenshots/Discord Bot notifications.png")}
                    >
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-10 rounded-xl">
                            <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <img 
                            src="/Screenshots/Discord Bot notifications.png" 
                            alt="Discord Bot Notifications" 
                            className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                        />
                    </div>
                    <p className="text-center text-sm text-slate-500 mt-3 font-medium">Discord Bot Notifications</p>
                </div>
            </div>
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
