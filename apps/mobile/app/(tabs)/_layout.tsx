import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '../../src/lib/theme';

function TabIcon({ emoji, active }: { emoji: string; active: boolean }) {
  return <Text style={{ fontSize: 20, opacity: active ? 1 : 0.4 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.surf,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarActiveTintColor: Colors.gold,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: { fontSize: 9, fontWeight: '700', letterSpacing: 0.3 },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon emoji="⌂" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ focused }) => <TabIcon emoji="✚" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'CHAMP AI',
          tabBarIcon: ({ focused }) => <TabIcon emoji="🤖" active={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => <TabIcon emoji="◎" active={focused} />,
        }}
      />

      {/* Routes still fully navigable via router.push — just not shown in tab bar */}
      <Tabs.Screen name="diagnostics" options={{ href: null }} />
      <Tabs.Screen name="therapies"   options={{ href: null }} />
      <Tabs.Screen name="programs"    options={{ href: null }} />
      <Tabs.Screen name="appointments" options={{ href: null }} />
      <Tabs.Screen name="consult"     options={{ href: null }} />
    </Tabs>
  );
}
