import { type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface DemoSectionProps {
    stepNumber: number;
    title: string;
    children: ReactNode;
    icon: LucideIcon;
    iconColor: string;
    screenshotSrc?: string;
    screenshotAlt?: string;
    onImageClick: (src: string) => void;
}

const DemoSection = ({ 
    stepNumber, 
    title, 
    children, 
    icon: Icon, 
    iconColor, 
    screenshotSrc, 
    screenshotAlt = "Screenshot", 
    onImageClick 
}: DemoSectionProps) => {
    
    // Helper to generate dynamic tailwind classes based on color prop
    // Note: In a real app with static analysis tools like Tailwind, 
    // it's often safer to map these explicitly, but passing constructed strings works 
    // if the classes are already "seen" by the compiler or safelisted.
    // For this refactor, we'll map them to be safe.
    
    const colorVariants = {
        blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', hoverBorder: 'group-hover:border-blue-500/30', shadow: 'shadow-blue-900/10' },
        purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', hoverBorder: 'group-hover:border-purple-500/30', shadow: 'shadow-purple-900/10' },
        orange: { bg: 'bg-orange-500/10', text: 'text-orange-400', border: 'border-orange-500/20', hoverBorder: 'group-hover:border-orange-500/30', shadow: 'shadow-orange-900/10' },
        emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', hoverBorder: 'group-hover:border-emerald-500/30', shadow: 'shadow-emerald-900/10' },
    };

    const colorClasses = colorVariants[iconColor as keyof typeof colorVariants] || colorVariants.blue;

    return (
        <section className="mb-12 relative">
            <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/0 via-blue-500/20 to-blue-500/0 md:-left-12 hidden md:block"></div>
        
            <div className="flex items-center gap-4 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorClasses.bg} ${colorClasses.text} ${colorClasses.border}`}>
                    <Icon size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">{stepNumber}. {title}</h2>
            </div>
            
            <div className="prose prose-invert max-w-none text-slate-400 mb-8">
                {children}
            </div>

            {screenshotSrc && (
                <div 
                    className="w-full aspect-video flex items-center justify-center cursor-pointer group/image relative overflow-hidden rounded-2xl"
                    onClick={() => onImageClick(screenshotSrc)}
                >
                    <img 
                        src={screenshotSrc} 
                        alt={screenshotAlt} 
                        className="max-w-full max-h-full object-contain"
                    />
                </div>
            )}
        </section>
    );
};

export default DemoSection;
