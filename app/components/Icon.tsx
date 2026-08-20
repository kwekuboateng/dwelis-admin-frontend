/**
 * Simple icon component using Unicode - avoids expo-font/registerWebModule web build issue.
 */
import React from 'react';
import { Text, StyleSheet, TextStyle } from 'react-native';

const ICONS: Record<string, string> = {
  'arrow-back': '←',
  'person': '●',
  'people': '👥',
  'log-out-outline': '↪',
  'lock-closed': '🔒',
  'checkmark-circle-outline': '✓',
  'checkmark-circle': '✓',
  'close': '✕',
  'eye': '👁',
  'eye-off': '⊘',
  'home': '⌂',
  'calendar': '📅',
  'cash': '₵',
  'flag': '⚑',
  'heart': '♥',
  'settings': '⚙',
  'chevron-forward': '›',
  /** Listing ownership transfer */
  swap: '⇄',
};

type IconProps = {
  name: keyof typeof ICONS;
  size?: number;
  color?: string;
  style?: TextStyle;
};

export function Icon({ name, size = 24, color = '#222', style }: IconProps) {
  const char = ICONS[name] ?? '?';
  return (
    <Text style={[styles.icon, { fontSize: size, color, lineHeight: size }, style]}>
      {char}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    textAlign: 'center',
  },
});
