import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  route: {
    params?: {
      userId?: string;
      name?: string;
    };
  };
  navigation: any;
}

const ChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const name = route.params?.name ?? 'User';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{`Chat with ${name}`}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Ionicons name="chatbubble-ellipses-outline" size={64} color="#999" />
        <Text style={styles.title}>Direct messages coming soon</Text>
        <Text style={styles.subtitle}>We'll enable chat shortly. For now, use listings or profile to connect.</Text>
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
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  title: { fontSize: 18, fontWeight: '700', color: '#333', marginTop: 16 },
  subtitle: { fontSize: 13, color: '#666', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});

export default ChatScreen;
