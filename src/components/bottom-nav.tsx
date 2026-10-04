import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type ImageSourcePropType,
  type PressableProps,
  type ViewProps,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';

/**
 * The bottom bar from the Figma designs (Home / Create / Profile). Shared by the
 * tab layout and by screens that sit outside it but still show the bar.
 */
export const NAV_ITEMS = [
  {
    name: 'home',
    href: '/home',
    label: 'Home',
    icon: require('@/assets/images/home/nav-home.svg') as ImageSourcePropType,
    iconDrawnAs: 'active',
  },
  {
    name: 'create',
    href: '/create',
    label: 'Create',
    icon: require('@/assets/images/home/nav-create.svg') as ImageSourcePropType,
    iconDrawnAs: 'inactive',
  },
  {
    name: 'profile',
    href: '/profile',
    label: 'Profile',
    icon: require('@/assets/images/home/nav-profile.svg') as ImageSourcePropType,
    iconDrawnAs: 'inactive',
  },
] as const;

export type NavItem = (typeof NAV_ITEMS)[number];

/** The bar itself; children are the three `NavButton`s. */
export function NavBar(props: ViewProps) {
  const insets = useSafeAreaInsets();
  return <View {...props} style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 16) }]} />;
}

type NavButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  icon: ImageSourcePropType;
  /**
   * Which state the exported Figma icon is drawn in. Figma only draws Home as
   * selected and Create / Profile as unselected, so the other state is the same
   * icon recolored.
   */
  iconDrawnAs: 'active' | 'inactive';
  selected: boolean;
};

/**
 * The bar for screens pushed on top of the tabs (Notifications, Drafts, Past
 * Events). The designs show it with Home selected; tapping a tab goes back to it.
 */
export function DetachedNavBar() {
  const router = useRouter();
  return (
    <NavBar>
      {NAV_ITEMS.map((item) => (
        <NavButton
          key={item.name}
          label={item.label}
          icon={item.icon}
          iconDrawnAs={item.iconDrawnAs}
          selected={item.name === 'home'}
          onPress={() => router.dismissTo(item.href)}
        />
      ))}
    </NavBar>
  );
}

export function NavButton({ label, icon, iconDrawnAs, selected, ...props }: NavButtonProps) {
  const color = selected ? Brand.ink : Brand.textMuted;
  const needsRecolor = (iconDrawnAs === 'active') !== selected;

  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
      <Image
        source={icon}
        style={styles.icon}
        contentFit="contain"
        tintColor={needsRecolor ? color : undefined}
      />
      <Text style={[styles.label, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 32,
    borderTopWidth: 1,
    borderTopColor: Brand.hairline,
    backgroundColor: Brand.navBackground,
  },
  item: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pressed: {
    opacity: 0.6,
  },
  icon: {
    width: 20,
    height: 20,
  },
  label: {
    fontSize: 12,
  },
});
