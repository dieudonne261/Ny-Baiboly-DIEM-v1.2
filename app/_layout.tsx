import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { SQLiteProvider } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system';
import { Asset } from 'expo-asset';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { Suspense } from 'react';
import { Colors } from '@/constants/Colors';
import { SafeAreaProvider } from 'react-native-safe-area-context';

async function loadDatabase(): Promise<void> {
  const dbName = 'diem.db';
  const dbDirectory = `${FileSystem.documentDirectory}SQLite/`;
  const dbUri = `${dbDirectory}${dbName}`;

  const dirInfo = await FileSystem.getInfoAsync(dbDirectory);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(dbDirectory, { intermediates: true });
  }

  const fileInfo = await FileSystem.getInfoAsync(dbUri);
  if (!fileInfo.exists) {
    const asset = Asset.fromModule(require('../assets/diem.db'));
    await asset.downloadAsync();
    if (asset.localUri) {
      await FileSystem.copyAsync({ from: asset.localUri, to: dbUri });
    }
  }
}

function DatabaseLoader({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider
      databaseName="diem.db"
      assetSource={{ assetId: require('../assets/diem.db') }}
      useSuspense
    >
      {children}
    </SQLiteProvider>
  );
}

function LoadingScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  return (
    <View style={[styles.loading, { backgroundColor: colors.background }]}>
      <Text style={[styles.loadingTitle, { color: colors.text }]}>Ny Baiboly DIEM</Text>
      <Text style={[styles.loadingVersion, { color: colors.textMuted }]}>v1.2</Text>
      <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 28 }} />
    </View>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  return (
    <SafeAreaProvider>
      <Suspense fallback={<LoadingScreen />}>
        <DatabaseLoader>
          <Stack
            screenOptions={{
              headerStyle: { backgroundColor: colors.headerBg },
              headerTintColor: colors.text,
              headerTitleStyle: { fontWeight: '700', color: colors.text },
              contentStyle: { backgroundColor: colors.background },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="reader"
              options={{
                title: 'Famakiana',
                headerShown: false,
                animation: 'slide_from_right',
              }}
            />
          </Stack>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        </DatabaseLoader>
      </Suspense>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingMark: {
    fontSize: 28,
    marginBottom: 12,
  },
  loadingTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  loadingVersion: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.5,
  },
});
