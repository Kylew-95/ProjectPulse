import React, { useEffect } from 'react';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';

const URLListener: React.FC = () => {
  const router = useRouter();

  useEffect(() => {
    function handleDeepLink(event: { url: string }) {
      
      // 1. Handle OAuth Callback (Supabase)
      if (event.url.includes('access_token') || event.url.includes('refresh_token')) {
          // This is usually handled by `WebBrowser.openAuthSessionAsync` returning the result
          // BUT if that fails or behaves oddly, we might catch it here.
          // For now, let's just log it.

      }

      // 2. Handle Specific Paths logic (User's request)
      // Expo URLs often look like: exp://.../--/path?query=...
      // We need to parse this carefully.
      
      let path = "";
      let queryParams: Record<string, string> = {};

      try {
          const parsed = Linking.parse(event.url);
          path = parsed.path || "";
          queryParams = parsed.queryParams as Record<string, string> || {};
      } catch (e) {
          console.error("Error parsing URL:", e);
      }

      // Fallback manual parsing if Linking.parse is weird about hashes
      if (!path && event.url.includes('#')) {
          // e.g. exp://.../#access_token=...
          // This is typical for implicit flow
      }
      
      // User's specific logic
      if (path === 'AccountVerified') {
        router.push('/(auth)/account-verified');
      }
      
      if (path === 'SetNewPassword') {
          const accessToken = queryParams.accessToken || queryParams.access_token;
          const refreshToken = queryParams.refreshToken || queryParams.refresh_token;

          router.push({
              pathname: '/(auth)/set-new-password',
              params: { accessToken, refreshToken }
          });
      }
    }

    // Handle initial URL (if app was closed)
    Linking.getInitialURL().then((url) => {
        if (url) handleDeepLink({ url });
    });

    // Handle updates (if app was open)
    const subscription = Linking.addEventListener('url', handleDeepLink);

    return () => {
      subscription.remove();
    };
  }, [router]);

  return null; // Render nothing
};

export default URLListener;
