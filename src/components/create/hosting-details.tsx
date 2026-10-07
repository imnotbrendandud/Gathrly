import { Image } from 'expo-image';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/avatar';
import { Brand, Radii } from '@/constants/theme';

const PLUS_ICON = require('@/assets/images/create/plus.svg');

/** Hosting Details: who is hosting, and a way to add a cohost. */
export function HostingDetails({ hostName }: { hostName: string }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.heading}>
        Hosting Details
      </Text>
      <View style={styles.content}>
        <View style={styles.list}>
          <View style={styles.person}>
            <Avatar name={hostName} size={38} />
            <View style={styles.text}>
              <Text style={styles.name} numberOfLines={1}>
                {hostName}
              </Text>
              <Text style={styles.role}>Host</Text>
            </View>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          // Picking a cohost needs guest lists, which aren't designed yet.
          onPress={() =>
            Alert.alert(
              'Cohosts are coming soon',
              'You’ll be able to add a cohost once inviting guests is ready.'
            )
          }
          style={({ pressed }) => [styles.addButton, pressed && styles.pressed]}>
          <Image source={PLUS_ICON} style={styles.addIcon} contentFit="contain" />
          <Text style={styles.addLabel}>Add cohost</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 16,
  },
  heading: {
    fontSize: 16,
    color: Brand.ink,
  },
  content: {
    alignItems: 'flex-end',
    gap: 8,
  },
  list: {
    alignSelf: 'stretch',
    overflow: 'hidden',
    borderRadius: Radii.select,
    borderWidth: 1,
    borderColor: Brand.border,
    backgroundColor: Brand.inputBackground,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    padding: 13,
    backgroundColor: Brand.fieldBackground,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 13,
    color: Brand.ink,
  },
  role: {
    fontSize: 12,
    color: Brand.textMuted,
  },
  addButton: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 7,
    borderRadius: Radii.select,
    borderWidth: 1,
    borderColor: Brand.border,
  },
  addIcon: {
    width: 16,
    height: 16,
  },
  addLabel: {
    fontSize: 12,
    color: Brand.ink,
  },
  pressed: {
    opacity: 0.6,
  },
});
