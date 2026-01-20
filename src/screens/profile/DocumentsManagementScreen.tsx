/**
 * Documents Management Screen - Upload and view transaction documents
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import { api } from '../../api';
import { useResponsive } from '../../hooks/useResponsive';
import { safeToFixed } from '../../utils/formatters';

interface Document {
  id: string;
  document_type: string;
  document_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
  updated_at?: string;
}

const DocumentTypes = {
  identity: { label: 'Identity Proof', icon: 'id-card', color: '#2196F3' },
  address_proof: { label: 'Address Proof', icon: 'home', color: '#4CAF50' },
  bank_statement: { label: 'Bank Statement', icon: 'document-text', color: '#FF9800' },
  pan_card: { label: 'PAN Card', icon: 'card', color: '#9C27B0' },
  aadhaar: { label: 'Aadhaar', icon: 'id-card', color: '#F44336' },
  transaction_receipt: { label: 'Transaction Receipt', icon: 'receipt', color: '#00BCD4' },
  invoice: { label: 'Invoice', icon: 'document', color: '#3F51B5' },
  other: { label: 'Other Document', icon: 'document-attach', color: '#607D8B' },
};

export default function DocumentsManagementScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const responsive = useResponsive();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9F9F9',
    },
    header: {
      paddingTop: insets.top + 12,
      paddingHorizontal: responsive.screenPadding,
      paddingBottom: responsive.screenPadding,
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
    },
    headerTitle: {
      fontSize: 24 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    headerSubtitle: {
      fontSize: 14 * responsive.fontScale,
      color: '#999',
      marginTop: 4,
    },
    content: {
      flex: 1,
      padding: responsive.screenPadding,
    },
    uploadCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: '#007AFF',
      padding: responsive.screenPadding * 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: responsive.screenPadding * 2,
    },
    uploadText: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '600',
      color: '#007AFF',
      marginTop: 12,
    },
    uploadSubtext: {
      fontSize: 13 * responsive.fontScale,
      color: '#999',
      marginTop: 4,
      textAlign: 'center',
    },
    sectionTitle: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
      marginBottom: responsive.gridGap,
      marginTop: responsive.screenPadding,
    },
    documentCard: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: responsive.cardPadding,
      marginBottom: responsive.gridGap,
      flexDirection: 'row',
      alignItems: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    documentIcon: {
      width: 48,
      height: 48,
      borderRadius: 8,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: responsive.cardPadding,
    },
    documentInfo: {
      flex: 1,
    },
    documentName: {
      fontSize: 14 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
    },
    documentDetails: {
      fontSize: 12 * responsive.fontScale,
      color: '#999',
      marginTop: 4,
    },
    documentActions: {
      flexDirection: 'row',
      gap: 8,
    },
    actionButton: {
      padding: 8,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: responsive.screenPadding * 4,
    },
    emptyIcon: {
      marginBottom: responsive.gridGap,
    },
    emptyTitle: {
      fontSize: 18 * responsive.fontScale,
      fontWeight: '600',
      color: '#333',
    },
    emptySubtitle: {
      fontSize: 14 * responsive.fontScale,
      color: '#999',
      marginTop: 8,
      textAlign: 'center',
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile/documents');
      setDocuments(response.data?.data || []);
    } catch (error: any) {
      console.error('Error loading documents:', error);
      Alert.alert('Error', 'Failed to load documents');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDocuments();
  };

  const handleUploadDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
      });

      if (result.type === 'cancel') {
        return;
      }

      setUploading(true);

      // Create FormData
      const formData = new FormData();
      formData.append('document', {
        uri: result.uri,
        type: result.mimeType || 'application/octet-stream',
        name: result.name,
      } as any);
      formData.append('document_type', 'transaction_receipt');
      formData.append('document_name', result.name);

      const response = await api.post('/profile/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      Alert.alert('Success', 'Document uploaded successfully');
      loadDocuments();
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error', 'Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (documentId: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to delete this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingId(documentId);
              await api.delete(`/profile/documents/${documentId}`);
              Alert.alert('Success', 'Document deleted');
              loadDocuments();
            } catch (error: any) {
              Alert.alert('Error', 'Failed to delete document');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const getDocumentType = (type: string) => {
    return DocumentTypes[type as keyof typeof DocumentTypes] || DocumentTypes.other;
  };

  const renderDocumentCard = (doc: Document) => {
    const docType = getDocumentType(doc.document_type);
    const fileSize = doc.file_size > 0 ? `${safeToFixed(doc.file_size / 1024 / 1024, 2)} MB` : 'Unknown size';
    const uploadDate = new Date(doc.created_at).toLocaleDateString('en-IN');

    return (
      <View key={doc.id} style={styles.documentCard}>
        <View style={[styles.documentIcon, { backgroundColor: docType.color + '20' }]}>
          <Ionicons name={docType.icon as any} size={24} color={docType.color} />
        </View>
        <View style={styles.documentInfo}>
          <Text style={styles.documentName}>{doc.document_name}</Text>
          <Text style={styles.documentDetails}>
            {docType.label} • {fileSize} • {uploadDate}
          </Text>
        </View>
        <View style={styles.documentActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              // Download/view document
              Alert.alert('Info', 'Document available at: ' + doc.file_path);
            }}
          >
            <Ionicons name="download" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            disabled={deletingId === doc.id}
            onPress={() => handleDeleteDocument(doc.id)}
          >
            {deletingId === doc.id ? (
              <ActivityIndicator size="small" color="#F44336" />
            ) : (
              <Ionicons name="trash" size={20} color="#F44336" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Documents</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Documents</Text>
        <Text style={styles.headerSubtitle}>Manage your transaction receipts and documents</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Upload Card */}
        <TouchableOpacity
          style={styles.uploadCard}
          onPress={handleUploadDocument}
          disabled={uploading}
        >
          {uploading ? (
            <ActivityIndicator size="large" color="#007AFF" />
          ) : (
            <>
              <Ionicons name="cloud-upload" size={32} color="#007AFF" />
              <Text style={styles.uploadText}>Upload Document</Text>
              <Text style={styles.uploadSubtext}>PDF or Image (JPG, PNG)</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Documents List */}
        {documents.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Your Documents ({documents.length})</Text>
            {documents.map((doc) => renderDocumentCard(doc))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-outline" size={64} color="#CCC" />
            </View>
            <Text style={styles.emptyTitle}>No Documents</Text>
            <Text style={styles.emptySubtitle}>
              Upload transaction receipts and other documents to keep them organized
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
