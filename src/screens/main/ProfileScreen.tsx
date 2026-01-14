/**
 * Solar Energy Sharing Platform - Profile Screen
 * User profile and settings
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Alert,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors, spacing, typography } from '../../theme';
import { useAuthStore } from '../../store';

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress: () => void;
  iconColor?: string;
  showBadge?: boolean;
  isDestructive?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  icon,
  label,
  value,
  onPress,
  iconColor = colors.text.secondary,
  showBadge,
  isDestructive,
}) => (
  <TouchableOpacity
    style={styles.menuItem}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={[styles.menuIcon, { backgroundColor: (isDestructive ? colors.error.light : iconColor) + '20' }]}>
      <Ionicons
        name={icon}
        size={20}
        color={isDestructive ? colors.error.main : iconColor}
      />
    </View>
    <View style={styles.menuContent}>
      <Text style={[styles.menuLabel, isDestructive && styles.menuLabelDestructive]}>
        {label}
      </Text>
      {value && <Text style={styles.menuValue}>{value}</Text>}
    </View>
    {showBadge && <View style={styles.badge} />}
    <Ionicons
      name="chevron-forward"
      size={18}
      color={colors.text.tertiary}
    />
  </TouchableOpacity>
);

const ProfileScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const getRoleIcon = (): keyof typeof Ionicons.glyphMap => {
    switch (user?.role) {
      case 'host':
        return 'sunny';
      case 'investor':
        return 'trending-up';
      default:
        return 'flash';
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'host':
        return colors.primary.main;
      case 'investor':
        return colors.success.main;
      default:
        return colors.secondary.main;
    }
  };

  const getRoleLabel = () => {
    switch (user?.role) {
      case 'host':
        return 'Energy Host';
      case 'investor':
        return 'Investor';
      default:
        return 'Energy Buyer';
    }
  };

  const handleLogout = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleEditProfile = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as any).navigate('PersonalInfo');
  };

  const handleMenuItem = async (screenName: string) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    (navigation as any).navigate(screenName);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + spacing.md },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={22} color={colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {user?.phone ? (
              <LinearGradient
                colors={[getRoleColor(), getRoleColor() + 'CC'] as [string, string]}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            ) : (
              <LinearGradient
                colors={[getRoleColor(), getRoleColor() + 'CC'] as [string, string]}
                style={styles.avatarPlaceholder}
              >
                <Text style={styles.avatarText}>
                  {user?.fullName?.charAt(0)?.toUpperCase() || 'U'}
                </Text>
              </LinearGradient>
            )}
            <TouchableOpacity
              style={styles.editAvatarButton}
              onPress={handleEditProfile}
            >
              <Ionicons name="camera" size={14} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* User Info */}
          <Text style={styles.userName}>{user?.fullName || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email || 'email@example.com'}</Text>

          {/* Role Badge */}
          <View style={[styles.roleBadge, { backgroundColor: getRoleColor() + '20' }]}>
            <Ionicons name={getRoleIcon()} size={14} color={getRoleColor()} />
            <Text style={[styles.roleText, { color: getRoleColor() }]}>
              {getRoleLabel()}
            </Text>
          </View>

          {/* Edit Profile Button */}
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
          >
            <Text style={styles.editProfileText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>127</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>₹12.5K</Text>
            <Text style={styles.statLabel}>Total Earned</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>850 kWh</Text>
            <Text style={styles.statLabel}>Energy Shared</Text>
          </View>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="person-outline"
              label="Personal Information"
              iconColor={colors.primary.main}
              onPress={() => handleMenuItem('PersonalInfo')}
            />
            <MenuItem
              icon="location-outline"
              label="Address"
              value="Add address"
              iconColor={colors.secondary.main}
              onPress={() => handleMenuItem('Address')}
            />
            <MenuItem
              icon="card-outline"
              label="Payment Methods"
              iconColor={colors.success.main}
              onPress={() => handleMenuItem('PaymentMethods')}
            />
            <MenuItem
              icon="document-text-outline"
              label="Documents"
              iconColor={colors.info.main}
              onPress={() => handleMenuItem('Documents')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="notifications-outline"
              label="Notifications"
              showBadge
              iconColor={colors.warning.main}
              onPress={() => handleMenuItem('Notifications')}
            />
            <MenuItem
              icon="shield-checkmark-outline"
              label="Security"
              iconColor={colors.success.main}
              onPress={() => handleMenuItem('Security')}
            />
            <MenuItem
              icon="language-outline"
              label="Language"
              value="English"
              iconColor={colors.info.main}
              onPress={() => handleMenuItem('Settings')}
            />
            <MenuItem
              icon="moon-outline"
              label="Dark Mode"
              value="Off"
              iconColor={colors.text.secondary}
              onPress={() => handleMenuItem('Settings')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.menuSectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon="help-circle-outline"
              label="Help Center"
              iconColor={colors.info.main}
              onPress={() => {}}
            />
            <MenuItem
              icon="chatbubble-outline"
              label="Contact Us"
              iconColor={colors.secondary.main}
              onPress={() => {}}
            />
            <MenuItem
              icon="star-outline"
              label="Rate App"
              iconColor={colors.warning.main}
              onPress={() => {}}
            />
            <MenuItem
              icon="information-circle-outline"
              label="About"
              value="v1.0.0"
              iconColor={colors.text.secondary}
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Logout */}
        <View style={styles.menuSection}>
          <View style={styles.menuCard}>
            <MenuItem
              icon="log-out-outline"
              label="Logout"
              iconColor={colors.error.main}
              isDestructive
              onPress={handleLogout}
            />
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Solar Energy Sharing Platform</Text>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.secondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  headerTitle: {
    ...typography.textStyles.h1,
    color: colors.text.primary,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 20,
    padding: spacing.xl,
    alignItems: 'center',
    marginBottom: spacing.lg,
    shadowColor: colors.neutral.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    ...typography.textStyles.display,
    color: colors.neutral.white,
    fontSize: 40,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary.main,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.background.primary,
  },
  userName: {
    ...typography.textStyles.h2,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  userEmail: {
    ...typography.textStyles.body,
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  roleText: {
    ...typography.textStyles.label,
    fontWeight: '600',
  },
  editProfileButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary.main,
  },
  editProfileText: {
    ...typography.textStyles.buttonMedium,
    color: colors.primary.main,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    ...typography.textStyles.h3,
    color: colors.text.primary,
    marginBottom: 2,
  },
  statLabel: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border.light,
  },
  menuSection: {
    marginBottom: spacing.lg,
  },
  menuSectionTitle: {
    ...typography.textStyles.label,
    color: colors.text.tertiary,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuCard: {
    backgroundColor: colors.background.primary,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    ...typography.textStyles.body,
    color: colors.text.primary,
  },
  menuLabelDestructive: {
    color: colors.error.main,
  },
  menuValue: {
    ...typography.textStyles.caption,
    color: colors.text.tertiary,
    marginTop: 2,
  },
  badge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.error.main,
    marginRight: spacing.sm,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  footerText: {
    ...typography.textStyles.body,
    color: colors.text.tertiary,
  },
  versionText: {
    ...typography.textStyles.caption,
    color: colors.text.placeholder,
    marginTop: spacing.xs,
  },
});

export default ProfileScreen;
