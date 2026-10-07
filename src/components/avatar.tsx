import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

/** "Allen Shi" → "AS", "Brandon" → "B". */
function initialsOf(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[words.length - 1]] : words.slice(0, 1);
  return letters.map((word) => word[0]!.toUpperCase()).join('');
}

/**
 * A person's circle: their initials. The Figma design shows photos, but people
 * have no profile pictures yet — when they do, load one here and keep this as
 * the fallback.
 */
export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.initials, { fontSize: size * 0.36 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.border,
  },
  initials: {
    fontWeight: 600,
    color: Brand.ink,
  },
});
