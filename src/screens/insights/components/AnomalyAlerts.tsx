import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

/**
 * AnomalyAlerts: System anomaly detection and alert management
 */

interface Alert {
  id: string;
  deviceId?: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  metadata?: any;
}

interface AnomalyAlertsProps {
  onRefresh?: () => void;
}

const AnomalyAlerts: React.FC<AnomalyAlertsProps> = ({ onRefresh }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'active' | 'resolved'>('active');
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [resolving, setResolving] = useState(false);

  useEffect(() => {
    loadAlerts();
  }, [filterType]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const isResolved = filterType === 'resolved';
      const response = await apiClient.get(`/anomaly-alerts?resolved=${isResolved}`);
      if (response.data?.data?.alerts) {
        setAlerts(response.data.data.alerts);
      }
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResolveAlert = async () => {
    if (!selectedAlert) return;

    try {
      setResolving(true);
      await apiClient.put(`/anomaly-alerts/${selectedAlert.id}/resolve`, {
        resolutionNotes,
      });
      
      // Reload alerts
      await loadAlerts();
      setSelectedAlert(null);
      setResolutionNotes('');
    } catch (error) {
      console.error('Error resolving alert:', error);
    } finally {
      setResolving(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return '#4CAF50';
      case 'medium':
        return '#FF9800';
      case 'high':
        return '#FF5722';
      case 'critical':
        return '#F44336';
      default:
        return '#999';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'checkmark-circle';
      case 'medium':
        return 'alert-circle';
      case 'high':
        return 'warning';
      case 'critical':
        return 'close-circle';
      default:
        return 'help-circle';
    }
  };

  const getAlertTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      degradation: 'Panel Degradation',
      sudden_drop: 'Sudden Power Drop',
      voltage_anomaly: 'Voltage Anomaly',
      overheating: 'Overheating',
      no_output: 'No Power Output',
      equipment_failure: 'Equipment Failure',
    };
    return labels[type] || type;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    
    return date.toLocaleDateString();
  };

  const activeAlerts = alerts.filter(a => !a.resolvedAt);
  const resolvedAlerts = alerts.filter(a => a.resolvedAt);

  const displayAlerts = filterType === 'all' 
    ? alerts 
    : filterType === 'active' 
    ? activeAlerts 
    : resolvedAlerts;

  const renderAlertItem = ({ item }: { item: Alert }) => (
    <TouchableOpacity
      style={styles.alertItem}
      onPress={() => setSelectedAlert(item)}
    >
      <View style={[styles.severityIndicator, { backgroundColor: getSeverityColor(item.severity) }]}>
        <Ionicons name={getSeverityIcon(item.severity)} size={20} color="#FFF" />
      </View>
      
      <View style={styles.alertContent}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertTitle}>{getAlertTypeLabel(item.type)}</Text>
          {item.resolvedAt && (
            <View style={styles.resolvedBadge}>
              <Text style={styles.resolvedBadgeText}>Resolved</Text>
            </View>
          )}
        </View>
        <Text style={styles.alertDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.alertFooter}>
          <Text style={styles.alertTime}>{formatDate(item.detectedAt)}</Text>
          {item.deviceId && (
            <Text style={styles.deviceId}>Device: {item.deviceId}</Text>
          )}
        </View>
      </View>

      <Ionicons name="chevron-forward" size={20} color="#CCC" />
    </TouchableOpacity>
  );

  return (
    <>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="alert" size={24} color="#F44336" />
            <View>
              <Text style={styles.title}>System Alerts</Text>
              <Text style={styles.subtitle}>
                {activeAlerts.length} active
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={loadAlerts}>
            <Ionicons name="refresh" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterTabs}>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'active' && styles.filterTabActive]}
            onPress={() => setFilterType('active')}
          >
            <Text style={[styles.filterTabText, filterType === 'active' && styles.filterTabTextActive]}>
              Active ({activeAlerts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'resolved' && styles.filterTabActive]}
            onPress={() => setFilterType('resolved')}
          >
            <Text style={[styles.filterTabText, filterType === 'resolved' && styles.filterTabTextActive]}>
              Resolved ({resolvedAlerts.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, filterType === 'all' && styles.filterTabActive]}
            onPress={() => setFilterType('all')}
          >
            <Text style={[styles.filterTabText, filterType === 'all' && styles.filterTabTextActive]}>
              All ({alerts.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Alerts List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#F44336" />
          </View>
        ) : displayAlerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
            <Text style={styles.emptyText}>
              {filterType === 'active' ? 'No active alerts' : 'No alerts'}
            </Text>
            <Text style={styles.emptySubtext}>
              Your system is running smoothly
            </Text>
          </View>
        ) : (
          <FlatList
            data={displayAlerts}
            renderItem={renderAlertItem}
            keyExtractor={item => item.id}
            scrollEnabled={false}
          />
        )}

        {/* Alert Count Summary */}
        {activeAlerts.length > 0 && (
          <View style={styles.summary}>
            <View style={styles.summaryItem}>
              <Ionicons name="warning" size={16} color="#FF5722" />
              <Text style={styles.summaryText}>
                {activeAlerts.filter(a => a.severity === 'high').length} High Priority
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="alert-circle" size={16} color="#FF9800" />
              <Text style={styles.summaryText}>
                {activeAlerts.filter(a => a.severity === 'medium').length} Medium Priority
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Alert Details Modal */}
      <Modal
        visible={selectedAlert !== null}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedAlert(null)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Alert Details</Text>
            <View style={{ width: 24 }} />
          </View>

          {selectedAlert && (
            <View style={styles.modalContent}>
              {/* Alert Type */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Alert Type</Text>
                <View style={[styles.typeBox, { borderLeftColor: getSeverityColor(selectedAlert.severity) }]}>
                  <Ionicons
                    name={getSeverityIcon(selectedAlert.severity)}
                    size={32}
                    color={getSeverityColor(selectedAlert.severity)}
                  />
                  <View style={styles.typeContent}>
                    <Text style={styles.typeName}>{getAlertTypeLabel(selectedAlert.type)}</Text>
                    <Text style={[styles.typeSeverity, { color: getSeverityColor(selectedAlert.severity) }]}>
                      {selectedAlert.severity.toUpperCase()} SEVERITY
                    </Text>
                  </View>
                </View>
              </View>

              {/* Description */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Description</Text>
                <Text style={styles.description}>{selectedAlert.description}</Text>
              </View>

              {/* Details */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Details</Text>
                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Detected</Text>
                    <Text style={styles.detailValue}>{formatDate(selectedAlert.detectedAt)}</Text>
                  </View>
                  {selectedAlert.deviceId && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Device ID</Text>
                      <Text style={styles.detailValue}>{selectedAlert.deviceId}</Text>
                    </View>
                  )}
                  {selectedAlert.resolvedAt && (
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Resolved</Text>
                      <Text style={styles.detailValue}>{formatDate(selectedAlert.resolvedAt)}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Resolution Section */}
              {!selectedAlert.resolvedAt && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Resolution</Text>
                  <TextInput
                    style={styles.notesInput}
                    placeholder="Add resolution notes..."
                    multiline
                    numberOfLines={4}
                    value={resolutionNotes}
                    onChangeText={setResolutionNotes}
                    editable={!resolving}
                  />
                  <TouchableOpacity
                    style={[styles.resolveButton, resolving && styles.resolveButtonDisabled]}
                    onPress={handleResolveAlert}
                    disabled={resolving}
                  >
                    {resolving ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Text style={styles.resolveButtonText}>Mark as Resolved</Text>
                    )}
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  subtitle: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  filterTabs: {
    flexDirection: 'row',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomColor: '#F44336',
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
  filterTabTextActive: {
    color: '#F44336',
  },
  loadingContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  alertItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    alignItems: 'flex-start',
  },
  severityIndicator: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  resolvedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  resolvedBadgeText: {
    fontSize: 10,
    color: '#4CAF50',
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    lineHeight: 18,
  },
  alertFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTime: {
    fontSize: 11,
    color: '#999',
  },
  deviceId: {
    fontSize: 11,
    color: '#999',
  },
  summary: {
    flexDirection: 'row',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    justifyContent: 'space-around',
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF',
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  typeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  typeContent: {
    marginLeft: 12,
    flex: 1,
  },
  typeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  typeSeverity: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  detailsBox: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  detailLabel: {
    fontSize: 12,
    color: '#666',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    color: '#333',
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  resolveButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  resolveButtonDisabled: {
    opacity: 0.6,
  },
  resolveButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AnomalyAlerts;
