import { View, Text, StyleSheet, ViewStyle, TextStyle, ImageStyle } from 'react-native';
import { Image } from 'expo-image';
import { getCleanAvatarUrl } from '@/utils/image';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: number;
  style?: ImageStyle;
}

export default function Avatar({ url, name, size = 32, style }: AvatarProps) {
  const colorScheme = useColorScheme() ?? 'dark';
  const colors = Colors[colorScheme];
  
  const cleanUrl = getCleanAvatarUrl(url);
  const initial = name?.charAt(0).toUpperCase() || '?';

  // Dynamic styles based on size
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };
  
  const textStyle = {
    fontSize: size * 0.4,
    fontWeight: 'bold' as TextStyle['fontWeight'],
  };

  if (cleanUrl) {
    return (
      <Image 
        source={{ uri: cleanUrl }} 
        style={[containerStyle, style]}
        transition={200}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }

  return (
    <View style={[
      containerStyle, 
      styles.placeholder, 
      { backgroundColor: colors.tint + '20' },
      style
    ]}>
      <Text style={[textStyle, { color: colors.tint }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
