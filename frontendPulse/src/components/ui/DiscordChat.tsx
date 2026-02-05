import WidgetBot from '@widgetbot/react-embed';
import type { Client } from '@widgetbot/embed-api';
import type { IServer } from '@widgetbot/embed-api/dist/types';
import { useAuth } from '../../context/AuthContext';
import { useState } from 'react';
import { X } from 'lucide-react';

const DiscordChat = () => {
    const { profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    console.log(profile);

    // Only render if we have a guild ID
    if (!profile?.discord_guild_id) {
        return null;
    }

    const onAPI = (api: Client) => {
        api.on('signIn', (user: IServer.Events['signIn']) => {
            console.log(`User signed in as ${user.username}`, user);
        });
    };

    return (
        <>
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 w-[400px] h-[500px] shadow-2xl rounded-2xl overflow-hidden border border-border-main hidden md:block">
                    <WidgetBot
                        server={profile.discord_guild_id ?? undefined}
                        channel={profile.discord_channel_id ?? undefined}
                        onAPI={onAPI}
                        width="100%"
                        height="100%"
                    />
                </div>
            )}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 p-4 bg-[#5865F2] hover:bg-[#4752C4] text-white rounded-full shadow-lg transition-all duration-200 ease-in-out hidden md:flex items-center justify-center group"
                aria-label="Toggle Discord Chat"
            >
                {isOpen ? (
                    <X className="w-6 h-6" />
                ) : (
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 127.14 96.36"
                        className="w-7 h-7 fill-current group-hover:scale-110 transition-transform"
                    >
                        <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.29,105.29,0,0,0,19.4,8.07C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.11,77.11,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1,105.73,105.73,0,0,0,32.19-16.14c2.64-27.38-4.51-51.11-18.9-72.13ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74c6.41,0,11.53,5.73,11.43,12.74C53.86,60,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5.06-12.74,11.44-12.74S96.23,45.92,96.12,53C96.12,60,91.08,65.69,84.69,65.69Z" />
                    </svg>
                )}
            </button>
        </>
    );
};

export default DiscordChat;
