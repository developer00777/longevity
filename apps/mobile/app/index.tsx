import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/stores/auth.store';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '../src/lib/theme';

export default function Index() {
  const { session, loading } = useAuthStore();
  if (loading) return <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator color={Colors.primary} /></View>;
  return <Redirect href={session ? '/(tabs)/dashboard' : '/(auth)/signup'} />;
}
