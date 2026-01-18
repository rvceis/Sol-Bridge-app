import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  route: {
    params?: {
      userId?: string;
      user?: {
        id: string;
        full_name: string;
        role: string;
        city?: string;
        state?: string;
        profile_image?: string;
        average_rating?: number;
        completed_transactions?: number;
      };
    };
  };
  navigation: any;
}

const UserProfileScreen: React.FC<Props> = ({ route, navigation }) => {
  const user = route.params?.user;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <View style={styles.avatarContainer}>
          {user?.profile_image ? (
            <Image source={{ uri: user.profile_image }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={48} color="#666" />
            </View>
          )}
        </View>

        <Text style={styles.name}>{user?.full_name || 'Unknown User'}</Text>
        <Text style={styles.subText}>{user?.role?.toUpperCase()}</Text>
        <Text style={styles.subText}>{user?.city || 'Unknown'}{user?.state ? `, ${user.state}` : ''}</Text>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Ionicons name="star" size={18} color="#FFD700" />
            <Text style={styles.statText}>{(user?.average_rating ?? 0).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Rating</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-done" size={18} color="#4CAF50" />
            <Text style={styles.statText}>{user?.completed_transactions ?? 0}</Text>
            <Text style={styles.statLabel}>Trades</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#FF9800' }]}
            onPress={() => navigation.navigate('Chat', { userId: user?.id, name: user?.full_name })}
          >
            <Ionicons name="chatbubble-outline" size={18} color="#FFF" />
            <Text style={styles.buttonText}>Start Chat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F9F9' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#333' },
  content: { padding: 16 },
  avatarContainer: { alignItems: 'center', marginTop: 12 },
  avatar: { width: 96, height: 96, borderRadius: 48 },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEE',
  },
  name: { fontSize: 20, fontWeight: '700', color: '#333', textAlign: 'center', marginTop: 12 },
  subText: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  statItem: { alignItems: 'center' },
  statText: { fontSize: 14, fontWeight: '600', color: '#333', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#999', marginTop: 2 },
  actions: { marginTop: 24, alignItems: 'center' },
  button: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});

export default UserProfileScreen;
