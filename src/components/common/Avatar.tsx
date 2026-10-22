import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { User } from 'lucide-react-native';

interface AvatarProps {
  url?: string | null;
  name?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export const Avatar: React.FC<AvatarProps> = ({
  url,
  name,
  size = 40,
  style,
}) => {
  const [hasError, setHasError] = useState(false);

  const isValidUrl =
    url &&
    typeof url === 'string' &&
    url.trim() !== '' &&
    url !== 'null' &&
    url !== 'undefined';

  if (isValidUrl && !hasError) {
    return (
      <Image
        source={{ uri: url.trim() }}
        onError={() => setHasError(true)}
        style={[
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: '#F1F5F9',
          },
          style as any,
        ]}
      />
    );
  }

  // Fallback: Initials from user's full name or email
  const initial = (name || '').trim().charAt(0).toUpperCase();

  if (initial && /^[A-Z0-9À-Ỹ]$/i.test(initial)) {
    return (
      <View
        style={[
          styles.initialContainer,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
          style,
        ]}
      >
        <Text
          style={[
            styles.initialText,
            {
              fontSize: Math.round(size * 0.44),
            },
          ]}
        >
          {initial}
        </Text>
      </View>
    );
  }

  // Fallback: Standard User placeholder
  return (
    <View
      style={[
        styles.placeholderContainer,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
        },
        style,
      ]}
    >
      <User size={Math.round(size * 0.52)} color="#94A3B8" />
    </View>
  );
};

const styles = StyleSheet.create({
  initialContainer: {
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    elevation: 2,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  initialText: {
    color: '#FFFFFF',
    fontWeight: '800',
    textAlign: 'center',
  },
  placeholderContainer: {
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
});
