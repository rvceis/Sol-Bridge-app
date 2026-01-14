import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../theme';
import * as Haptics from 'expo-haptics';
import { profileApi } from '../../api/profileService';

interface SettingItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  label: string;
  subtitle?: string;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  onPress?: () => void;
  hasSwitch?: boolean;
}

const SettingItem: React.FC<SettingItemProps> = ({
  icon,
  iconColor,
  label,
  subtitle,
  value,
  onValueChange,
  onPress,
  hasSwitch,
}) => (
  <TouchableOpacity
    style={styles.settingItem}
    onPress={onPress}
    activeOpacity={0.6}
    disabled={hasSwitch}
  >
    <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
      <Ionicons name={icon} size={20} color={iconColor} />
    </View>
    <View style={styles.settingContent}>
      <Text style={styles.settingLabel}>{label}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
    </View>
    {hasSwitch ? (
      <Switch
        value={value || false}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border.light, true: colors.primary.light }}
        thumbColor={value ? colors.primary.main : colors.text.tertiary}
      />
    ) : (
      <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
    )}
  </TouchableOpacity>
);

const SettingsScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  const slideAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const response = await profileApi.getPreferences();
      const prefs = response.data;
      setDarkMode(prefs.theme === 'dark');
      setLanguage(prefs.language || 'en');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleDarkModeToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await profileApi.updatePreferences({ theme: value ? 'dark' : 'light' });
      setDarkMode(value);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update theme preference');
      setDarkMode(!value);
    }
  };

  const slideYInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0],
  });

  const opacityInterpolate = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={[
              styles.content,
              {
                transform: [{ translateY: slideYInterpolate }],
                opacity: opacityInterpolate,
              },
            ]}
          >
            {/* Display Settings */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Display</Text>
              <View style={styles.settingsCard}>
                <SettingItem
                  icon="moon-outline"
                  iconColor={colors.warning.main}
                  label="Dark Mode"
                  subtitle="Easier on the eyes"
                  value={darkMode}
                  onValueChange={handleDarkModeToggle}
                  hasSwitch
                />
              </View>
            </View>

            {/* Preferences */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Preferences</Text>
              <View style={styles.settingsCard}>
                <SettingItem
                  icon="globe-outline"
                  iconColor={colors.info.main}
                  label="Language"
                  subtitle={language === 'en' ? 'English' : 'हिन्दी'}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
              />
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Settings</Text>
            <View style={styles.settingsCard}>
              <SettingItem
                icon="download-outline"
                iconColor={colors.success.main}
                label="Auto-Update"
                subtitle="Receive the latest features"
                value={true}
                onValueChange={() => {}}
                hasSwitch
              />
              <View style={styles.divider} />
              <SettingItem
                icon="analytics-outline"
                iconColor={colors.secondary.main}
                label="Analytics"
                subtitle="Help us improve the app"
                value={true}
                onValueChange={() => {}}
                hasSwitch
              />
            </View>
          </View>

          {/* About */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            <View style={styles.settingsCard}>
              <SettingItem
                icon="information-circle-outline"
                iconColor={colors.info.main}
                label="App Version"
                subtitle="v1.0.0"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="document-outline"
                iconColor={colors.secondary.main}
                label="Terms & Conditions"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
              <View style={styles.divider} />
              <SettingItem
                icon="shield-checkmark-outline"
                iconColor={colors.success.main}
                label="Privacy Policy"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              />
            </View>
          </View>

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="bulb-outline" size={18} color={colors.warning.main} />
            <Text style={styles.infoText}>
              Tip: Keep auto-update enabled to get the latest security patches and features
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  content: {
    marginTop: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.subheading,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  settingsCard: {
    backgroundColor: colors.background.light,
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    ...typography.subtitle2,
    color: colors.text.primary,
    fontWeight: '600',
  },
  settingSubtitle: {
    ...typography.caption,
    color: colors.text.secondary,
    marginTop: spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginHorizontal: spacing.md,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: colors.warning.light,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.lg,
    alignItems: 'flex-start',
  },
  infoText: {
    ...typography.caption,
    color: colors.warning.main,
    marginLeft: spacing.md,
    flex: 1,
  },
});

export default SettingsScreen;
