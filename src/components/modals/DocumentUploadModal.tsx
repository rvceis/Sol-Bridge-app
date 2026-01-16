import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../../api/config';

interface DocumentUploadModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (document: any) => void;
}

type DocumentType = 'identity' | 'address_proof' | 'bank_statement' | 'pan_card' | 'aadhaar' | 'other';

const DOCUMENT_TYPES: { label: string; value: DocumentType }[] = [
  { label: 'Identity Proof', value: 'identity' },
  { label: 'Address Proof', value: 'address_proof' },
  { label: 'Bank Statement', value: 'bank_statement' },
  { label: 'PAN Card', value: 'pan_card' },
  { label: 'Aadhaar Card', value: 'aadhaar' },
  { label: 'Other', value: 'other' },
];

export default function DocumentUploadModal({ visible, onClose, onSuccess }: DocumentUploadModalProps) {
  const [selectedType, setSelectedType] = useState<DocumentType>('identity');
  const [documentName, setDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedFile({
          uri: asset.uri,
          name: asset.name,
          size: asset.size,
          type: asset.mimeType,
        });
        
        // Auto-fill document name if not already set
        if (!documentName) {
          const fileName = asset.name.split('.')[0];
          setDocumentName(fileName);
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document');
      console.error('Document picker error:', error);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Error', 'Please select a document');
      return;
    }

    if (!documentName.trim()) {
      Alert.alert('Error', 'Please enter a document name');
      return;
    }

    setLoading(true);
    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('document_type', selectedType);
      formData.append('document_name', documentName.trim());
      
      // Append file
      formData.append('document', {
        uri: selectedFile.uri,
        type: selectedFile.type || 'application/octet-stream',
        name: selectedFile.name,
      } as any);

      // Get auth token from AsyncStorage
      const token = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

      if (!token) {
        throw new Error('Authentication token not found');
      }

      // Upload file using fetch (FormData support)
      const response = await fetch(`${API_BASE_URL}/users/documents`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Upload failed');
      }

      Alert.alert('Success', 'Document uploaded successfully');
      onSuccess(responseData.data);
      resetForm();
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload document');
      console.error('Upload error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedType('identity');
    setDocumentName('');
    setSelectedFile(null);
  };

  const getFileSizeDisplay = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#007AFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Upload Document</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Document Type Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Type *</Text>
            <View style={styles.typeGrid}>
              {DOCUMENT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.typeOption,
                    selectedType === type.value && styles.typeOptionSelected,
                  ]}
                  onPress={() => setSelectedType(type.value)}
                >
                  <Text
                    style={[
                      styles.typeOptionText,
                      selectedType === type.value && styles.typeOptionTextSelected,
                    ]}
                  >
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Document Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Document Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter document name"
              placeholderTextColor="#999"
              value={documentName}
              onChangeText={setDocumentName}
              editable={!loading}
            />
          </View>

          {/* File Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Select File *</Text>
            <TouchableOpacity
              style={[styles.filePicker, selectedFile && styles.filePickerSelected]}
              onPress={handlePickDocument}
              disabled={loading}
            >
              <Ionicons
                name={selectedFile ? 'checkmark-circle' : 'cloud-upload'}
                size={32}
                color={selectedFile ? '#4CAF50' : '#007AFF'}
              />
              <Text style={styles.filePickerText}>
                {selectedFile ? selectedFile.name : 'Choose PDF or Image'}
              </Text>
              <Text style={styles.filePickerSubtext}>
                {selectedFile ? `Size: ${getFileSizeDisplay(selectedFile.size)}` : 'Tap to browse'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* File Details */}
          {selectedFile && (
            <View style={styles.fileDetails}>
              <View style={styles.fileDetailRow}>
                <Text style={styles.fileDetailLabel}>File Name:</Text>
                <Text style={styles.fileDetailValue}>{selectedFile.name}</Text>
              </View>
              <View style={styles.fileDetailRow}>
                <Text style={styles.fileDetailLabel}>File Size:</Text>
                <Text style={styles.fileDetailValue}>
                  {getFileSizeDisplay(selectedFile.size)}
                </Text>
              </View>
              <View style={styles.fileDetailRow}>
                <Text style={styles.fileDetailLabel}>Type:</Text>
                <Text style={styles.fileDetailValue}>{selectedFile.type}</Text>
              </View>
            </View>
          )}

          {/* Info Box */}
          <View style={styles.infoBox}>
            <Ionicons name="information-circle" size={20} color="#2196F3" />
            <Text style={styles.infoText}>
              Upload clear copies of your documents in PDF or image format (JPG, PNG). Maximum file size: 10MB.
            </Text>
          </View>
        </ScrollView>

        {/* Footer Buttons */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.button,
              styles.uploadButton,
              (!selectedFile || !documentName.trim() || loading) && styles.uploadButtonDisabled,
            ]}
            onPress={handleUpload}
            disabled={!selectedFile || !documentName.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={18} color="#FFF" />
                <Text style={styles.uploadButtonText}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
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
    paddingTop: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeOption: {
    flex: 1,
    minWidth: '48%',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    backgroundColor: '#FFF',
    alignItems: 'center',
  },
  typeOptionSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#E3F2FD',
  },
  typeOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
    textAlign: 'center',
  },
  typeOptionTextSelected: {
    color: '#007AFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    backgroundColor: '#FFF',
    color: '#333',
  },
  filePicker: {
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 32,
    alignItems: 'center',
    backgroundColor: '#F0F8FF',
  },
  filePickerSelected: {
    borderColor: '#4CAF50',
    backgroundColor: '#F1F8F4',
  },
  filePickerText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    marginTop: 8,
  },
  filePickerSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  fileDetails: {
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  fileDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  fileDetailLabel: {
    fontSize: 12,
    color: '#999',
    fontWeight: '500',
  },
  fileDetailValue: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  uploadButton: {
    backgroundColor: '#007AFF',
  },
  uploadButtonDisabled: {
    backgroundColor: '#CCC',
  },
  uploadButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
});
