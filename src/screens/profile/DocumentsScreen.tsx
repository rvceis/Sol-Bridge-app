import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '../../api/profileService';

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
}

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const slideAnim = new Animated.Value(0);
  const [loading, setLoading] = React.useState(true);
  const [documents, setDocuments] = React.useState<Document[]>([]);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await profileApi.getDocuments();
      setDocuments(response.data || []);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = (id: string, name: string) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileApi.deleteDocument(id);
              setDocuments(documents.filter(doc => doc.id !== id));
              Alert.alert('Success', 'Document deleted successfully');
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return '#4CAF50';
      case 'rejected': return '#FF6B6B';
      case 'pending': return '#FF9800';
      default: return '#999';
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'identity_proof':
      case 'aadhar':
      case 'pan':
        return 'id-card';
      case 'address_proof':
        return 'home';
      case 'bank_details':
        return 'cash';
      default:
        return 'document-text';
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[
        styles.header,
        { transform: [{ translateY: slideAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }
      ]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.title}>Documents</Text>
        <View style={{ width: 24 }} />
      </Animated.View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Uploaded Documents</Text>

          {documents.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color="#CCC" />
              <Text style={styles.emptyText}>No documents uploaded</Text>
            </View>
          ) : (
            documents.map((doc) => (
              <View key={doc.id} style={styles.documentCard}>
                <View style={[
                  styles.documentIcon,
                  { backgroundColor: doc.verification_status === 'verified' ? '#E8F5E9' : '#FFF3E0' }
                ]}>
                  <Ionicons
                    name={getDocumentIcon(doc.document_type) as any}
                    size={24}
                    color={getStatusColor(doc.verification_status)}
                  />
                </View>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentName}>{doc.document_name}</Text>
                  <Text style={[styles.documentStatus, { color: getStatusColor(doc.verification_status) }]}>
                    {doc.verification_status.charAt(0).toUpperCase() + doc.verification_status.slice(1)}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => handleDeleteDocument(doc.id, doc.document_name)}
                  style={styles.deleteButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))
          )}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => Alert.alert('Coming Soon', 'Document upload feature will be available soon')}
          >
            <Ionicons name="add-circle" size={24} color="#007AFF" />
            <Text style={styles.addButtonText}>Upload Document</Text>
          </TouchableOpacity>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoText}>Keep your documents updated to access all features</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F9F9',
  },
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
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 50,
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#999',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#EEE',
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  documentStatus: {
    fontSize: 12,
  },
  deleteButton: {
    padding: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    justifyContent: 'center',
    marginTop: 16,
  },
  addButtonText: {
    color: '#007AFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '500',
  },
});
