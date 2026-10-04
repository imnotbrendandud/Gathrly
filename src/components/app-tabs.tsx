import {
  TabList,
  TabSlot,
  TabTrigger,
  Tabs,
  type TabListProps,
  type TabTriggerSlotProps,
} from 'expo-router/ui';
import { StyleSheet } from 'react-native';

import { NAV_ITEMS, NavBar, NavButton, type NavItem } from '@/components/bottom-nav';

/**
 * Home / Create / Profile, built on the headless tabs so the bar looks the same
 * on every platform instead of using the system tab bar.
 */
export default function AppTabs() {
  return (
    <Tabs>
      <TabSlot style={styles.slot} />
      <TabList asChild>
        <TabBar>
          {NAV_ITEMS.map((item) => (
            <TabTrigger key={item.name} name={item.name} href={item.href} asChild>
              <TabItem {...item} />
            </TabTrigger>
          ))}
        </TabBar>
      </TabList>
    </Tabs>
  );
}

function TabBar(props: TabListProps) {
  return <NavBar {...props} />;
}

/** A `NavButton` that `TabTrigger` can drive: it passes `isFocused` and the press handlers. */
function TabItem({
  isFocused,
  label,
  icon,
  iconDrawnAs,
  onPress,
  onLongPress,
}: TabTriggerSlotProps & NavItem) {
  return (
    <NavButton
      label={label}
      icon={icon}
      iconDrawnAs={iconDrawnAs}
      selected={!!isFocused}
      onPress={onPress}
      onLongPress={onLongPress}
    />
  );
}

const styles = StyleSheet.create({
  slot: {
    flex: 1,
  },
});
