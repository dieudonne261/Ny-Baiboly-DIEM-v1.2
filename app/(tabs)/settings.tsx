import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { StorageService } from '@/hooks/useStorage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const FONT_OPTIONS = [14, 16, 18, 20, 22, 24];

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const insets = useSafeAreaInsets();

  const [fontSize, setFontSize] = useState(18);

  useEffect(() => {
    StorageService.getFontSize().then(setFontSize);
  }, []);

  const updateFontSize = async (size: number) => {
    setFontSize(size);
    await StorageService.saveFontSize(size);
  };

  const clearHistory = () => {
    Alert.alert(
      'Hamafa ny tantara?',
      'Tena te hamafa ny tantaran\'ny famakiana ve ianao?',
      [
        { text: 'Tsia', style: 'cancel' },
        {
          text: 'Hamafa',
          style: 'destructive',
          onPress: async () => {
            await StorageService.saveLastPosition({ bookId: 0, bookName: '', chapter: 0, timestamp: 0 });
            Alert.alert('Vita', 'Voafafa ny tantara.');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Fikirana</Text>
      </Animated.View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Font size */}
        <Animated.Text entering={FadeIn.delay(200)} style={[styles.sectionLabel, { color: colors.textMuted }]}>HABENY NY SORATRA</Animated.Text>
        <Animated.View 
          entering={FadeInDown.delay(300).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.fontRow}>
            {FONT_OPTIONS.map((size) => (
              <TouchableOpacity
                key={size}
                style={[
                  styles.fontOption,
                  { borderColor: colors.border },
                  fontSize === size && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
                onPress={() => updateFontSize(size)}
              >
                <Text
                  style={[
                    styles.fontOptionText,
                    { color: fontSize === size ? '#FFF' : colors.textSecondary },
                  ]}
                >
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={[styles.fontPreview, { color: colors.text, fontSize }]}>
            Ary Andriamanitra niteny hoe...
          </Text>
        </Animated.View>

        {/* Appearance */}
        <Animated.Text entering={FadeIn.delay(400)} style={[styles.sectionLabel, { color: colors.textMuted }]}>FISEHOANA</Animated.Text>
        <Animated.View 
          entering={FadeInDown.delay(500).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.row}>
            <Ionicons name="moon-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Loko maizina</Text>
              <Text style={[styles.rowDesc, { color: colors.textMuted }]}>Manara-maso ny finday</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.surfaceAlt }]}>
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>Auto</Text>
            </View>
          </View>
        </Animated.View>

        {/* Data */}
        <Animated.Text entering={FadeIn.delay(600)} style={[styles.sectionLabel, { color: colors.textMuted }]}>DATA</Animated.Text>
        <Animated.View entering={FadeInDown.delay(700).duration(500)}>
          <TouchableOpacity
            style={[styles.card, styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={clearHistory}
          >
            <Ionicons name="time-outline" size={20} color={colors.textSecondary} />
            <View style={styles.rowText}>
              <Text style={[styles.rowLabel, { color: colors.text }]}>Fafana ny tantara</Text>
              <Text style={[styles.rowDesc, { color: colors.textMuted }]}>Ataovy baolina ny tantara</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.border} />
          </TouchableOpacity>
        </Animated.View>

        {/* About */}
        <Animated.Text entering={FadeIn.delay(800)} style={[styles.sectionLabel, { color: colors.textMuted }]}>MOMBAMOMBA</Animated.Text>
        <Animated.View 
          entering={FadeInDown.delay(900).duration(500)}
          style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}
        >
          <View style={styles.aboutInner}>
            <Text style={[styles.aboutTitle, { color: colors.text }]}>Ny Baiboly DIEM</Text>
            <Text style={[styles.aboutSub, { color: colors.textSecondary }]}>
              Dikan-teny Ifanaovan'ny Mpino
            </Text>
            <Text style={[styles.aboutVersion, { color: colors.textMuted }]}>v1.2 · Offline</Text>
          </View>
        </Animated.View>

        <Animated.Text entering={FadeIn.delay(1100)} style={[styles.footer, { color: colors.textMuted }]}>
          Ho voninahitr'Andriamanitra irery ihany
        </Animated.Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    marginBottom: 10,
    marginTop: 24,
    marginLeft: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 16,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  rowDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fontRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  fontOption: {
    width: 44,
    height: 36,
    borderRadius: 8,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fontOptionText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fontPreview: {
    fontStyle: 'italic',
    lineHeight: 28,
    opacity: 0.8,
  },
  aboutInner: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  aboutMark: {
    fontSize: 24,
    marginBottom: 4,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  aboutSub: {
    fontSize: 13,
    fontWeight: '500',
  },
  aboutVersion: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 32,
    marginBottom: 8,
  },
});
