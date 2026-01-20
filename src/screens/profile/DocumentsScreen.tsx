import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Animated, StyleSheet, ActivityIndicator, Alert, Image } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { profileApi } from '../../api/profileService';
import DocumentUploadModal from '../../components/modals/DocumentUploadModal';
import { API_BASE_URL } from '../../api/config';

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size?: number;
  mime_type?: string;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  rejection_reason?: string;
}

export default function DocumentsScreen() {
  const navigation = useNavigation();
  const slideAnim = new Animated.Value(0);
  const [loading, setLoading] = React.useState(true);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [uploadModalVisible, setUploadModalVisible] = React.useState(false);

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    loadDocuments();
  }, []);

  // Reload documents when screen is focused (after upload)
  useFocusEffect(
    React.useCallback(() => {
      loadDocuments();
    }, [])
  );

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
      case 'identity':
      case 'identity_proof':
      case 'aadhar':
      case 'aadhaar':
      case 'pan':
      case 'pan_card':
        return 'id-card';
      case 'address_proof':
        return 'home';
      case 'bank_details':
      case 'bank_statement':
        return 'cash';
      default:
        return 'document-text';
    }
  };

  const handleViewDocument = (doc: Document) => {
    Alert.alert(
      doc.document_name,
      `Type: ${doc.document_type}\nStatus: ${doc.verification_status}\nUploaded: ${new Date(doc.created_at).toLocaleDateString()}${doc.rejection_reason ? `\n\nRejection Reason: ${doc.rejection_reason}` : ''}`,
      [{ text: 'OK' }]
    );
  };

  const isImageDocument = (doc: Document) => {
    return doc.mime_type?.startsWith('image/') || 
           doc.file_path?.match(/\.(jpg|jpeg|png|gif)$/i);
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
          {documents.map((doc) => (
            <TouchableOpacity 
              key={doc.id} 
              style={styles.documentCard}
              onPress={() => handleViewDocument(doc)}
              activeOpacity={0.7}
            >
              {/* Document Icon or Image Thumbnail */}
              {isImageDocument(doc) ? (
                <View style={styles.documentIcon}>
                  <Image
                    source={{ uri: `${API_BASE_URL}${doc.file_path}` }}
                    style={styles.documentThumbnail}
                  />
                </View>
              ) : (
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
              )}
              
              <View style={styles.documentInfo}>
                <Text style={styles.documentName}>{doc.document_name}</Text>
                <Text style={styles.documentType}>{doc.document_type.replace('_', ' ')}</Text>
                <View style={styles.statusRow}>
                  <Ionicons
                    name={doc.verification_status === 'verified' ? 'checkmark-circle' : 
                          doc.verification_status === 'rejected' ? 'close-circle' : 'time'}
                    size={14}
                    color={getStatusColor(doc.verification_status)}
                  />
                  <Text style={[styles.documentStatus, { color: getStatusColor(doc.verification_status) }]}>
                    {doc.verification_status.charAt(0).toUpperCase() + doc.verification_status.slice(1)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteDocument(doc.id, doc.document_name);
                }}
                style={styles.deleteButton}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setUploadModalVisible(true)}
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

      {/* Document Upload Modal */}
      <DocumentUploadModal
        visible={uploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onSuccess={(newDocument) => {
          // Add the new document to the list
          setDocuments([newDocument, ...documents]);
        }}
      />
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
    overflow: 'hidden',
  },
  documentThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
    color: '#333',
  },
  documentType: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  documentStatus: {
    fontSize: 12,
    fontWeight: '500',
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
