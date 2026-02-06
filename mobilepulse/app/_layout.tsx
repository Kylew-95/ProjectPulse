import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated from 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/AuthProvider';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { GraphqlProvider } from '@/components/providers/GraphqlProvider';
import URLListener from '@/components/URLListener';
import { Provider as PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <BottomSheetModalProvider>
        <PaperProvider>
          <AuthProvider>
            <ThemeProvider>
              <InnerLayout />
            </ThemeProvider>
          </AuthProvider>
        </PaperProvider>
      </BottomSheetModalProvider>
    </GestureHandlerRootView>
  );
}

function InnerLayout() {
  const { theme } = useTheme();

  return (
    <GraphqlProvider>
      <NavigationThemeProvider value={theme === 'dark' ? DarkTheme : DefaultTheme}>
        <URLListener />
        <View style={StyleSheet.absoluteFill}>
          <Image 
            source={require('@/assets/images/pulse-bg.png')}
            style={{
              position: 'absolute',
              width: 300,
              height: 300,
              top: '50%',
              left: '50%',
              marginTop: -150,
              marginLeft: -150,
              opacity: 0.1,
              tintColor: 'grey', // Requested grey tint
              zIndex: 0,
            }}
            contentFit="contain"
          />
          <Stack screenOptions={{ contentStyle: { backgroundColor: 'transparent' } }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
          </Stack>
        </View>
        <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      </NavigationThemeProvider>
    </GraphqlProvider>
  );
}

const styles = StyleSheet.create({
  // ...
});
