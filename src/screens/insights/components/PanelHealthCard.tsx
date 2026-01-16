import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../api/client';

/**
 * PanelHealthCard: Display solar panel degradation status
 */

interface HealthStatus {
  deviceId: string;
  healthStatus: 'healthy' | 'minor_degradation' | 'degrading';
  severity: 'low' | 'medium' | 'high';
  degradationRate: number;
  trend: 'declining' | 'stable';
  confidence: number;
  recommendations: string[];
  metrics: {
    dataPoints: number;
    avgOutput: number;
    variance: number;
  };
}

interface PanelHealthCardProps {
  deviceId: string;
  onRefresh?: () => void;
}

const PanelHealthCard: React.FC<PanelHealthCardProps> = ({ deviceId, onRefresh }) => {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsVisible, setDetailsVisible] = useState(false);

  useEffect(() => {
    loadHealthStatus();
  }, [deviceId]);

  const loadHealthStatus = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/devices/${deviceId}/health/degradation`);
      if (response.data?.data) {
        setHealth(response.data.data);
      }
    } catch (error) {
      console.error('Error loading health status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return '#4CAF50';
      case 'minor_degradation':
        return '#FF9800';
      case 'degrading':
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
      default:
        return 'help-circle';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Healthy';
      case 'minor_degradation':
        return 'Minor Degradation';
      case 'degrading':
        return 'Significant Degradation';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View style={styles.card}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  if (!health) {
    return (
      <View style={styles.card}>
        <Text style={styles.errorText}>Unable to load health status</Text>
      </View>
    );
  }

  const statusColor = getStatusColor(health.healthStatus);

  return (
    <>
      <TouchableOpacity
        style={styles.card}
        onPress={() => setDetailsVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.header}>
          <View style={styles.titleRow}>
            <Ionicons name="solar" size={24} color={statusColor} />
            <Text style={styles.title}>Panel Health</Text>
          </View>
          <TouchableOpacity onPress={loadHealthStatus}>
            <Ionicons name="refresh" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.statusContainer}>
          <View style={[styles.statusBadge, { borderColor: statusColor }]}>
            <Ionicons name={getSeverityIcon(health.severity)} size={32} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {getStatusLabel(health.healthStatus)}
            </Text>
          </View>

          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Degradation Rate</Text>
              <Text style={styles.metricValue}>{health.degradationRate.toFixed(2)}%/year</Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Trend</Text>
              <Text style={[styles.metricValue, { color: health.trend === 'declining' ? '#F44336' : '#4CAF50' }]}>
                {health.trend === 'declining' ? '↓ Declining' : '→ Stable'}
              </Text>
            </View>
            <View style={styles.metric}>
              <Text style={styles.metricLabel}>Confidence</Text>
              <Text style={styles.metricValue}>{(health.confidence * 100).toFixed(0)}%</Text>
            </View>
          </View>
        </View>

        <View style={styles.recommendationsPreview}>
          <Text style={styles.recommendationLabel}>Top Recommendation:</Text>
          <Text style={styles.recommendationText} numberOfLines={2}>
            {health.recommendations?.[0] || 'No recommendations'}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.tapText}>Tap for more details</Text>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </View>
      </TouchableOpacity>

      {/* Details Modal */}
      <Modal
        visible={detailsVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Panel Health Analysis</Text>
            <TouchableOpacity onPress={() => setDetailsVisible(false)}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalContent}>
            {/* Status Overview */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status Overview</Text>
              <View style={[styles.statusBox, { borderLeftColor: statusColor }]}>
                <View>
                  <Text style={styles.boxLabel}>Current Status</Text>
                  <Text style={[styles.boxValue, { color: statusColor }]}>
                    {getStatusLabel(health.healthStatus)}
                  </Text>
                </View>
                <Ionicons name={getSeverityIcon(health.severity)} size={40} color={statusColor} />
              </View>
            </View>

            {/* Detailed Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Detailed Metrics</Text>
              <View style={styles.metricsTable}>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Degradation Rate</Text>
                  <Text style={styles.tableValue}>{health.degradationRate.toFixed(2)}%/year</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Trend Direction</Text>
                  <Text style={[styles.tableValue, { color: health.trend === 'declining' ? '#F44336' : '#4CAF50' }]}>
                    {health.trend === 'declining' ? 'Declining' : 'Stable'}
                  </Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Analysis Confidence</Text>
                  <Text style={styles.tableValue}>{(health.confidence * 100).toFixed(0)}%</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Average Output</Text>
                  <Text style={styles.tableValue}>{health.metrics.avgOutput.toFixed(2)} kW</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Output Variance</Text>
                  <Text style={styles.tableValue}>{health.metrics.variance.toFixed(2)}</Text>
                </View>
                <View style={styles.tableRow}>
                  <Text style={styles.tableLabel}>Data Points Analyzed</Text>
                  <Text style={styles.tableValue}>{health.metrics.dataPoints}</Text>
                </View>
              </View>
            </View>

            {/* Recommendations */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recommendations</Text>
              {health.recommendations.map((rec, idx) => (
                <View key={idx} style={styles.recommendationItem}>
                  <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                  <Text style={styles.recommendationItemText}>{rec}</Text>
                </View>
              ))}
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton} onPress={() => setDetailsVisible(false)}>
              <Text style={styles.actionButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
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
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  statusContainer: {
    marginBottom: 16,
  },
  statusBadge: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 2,
    backgroundColor: '#F9F9F9',
    marginBottom: 12,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  metric: {
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recommendationsPreview: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  recommendationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  tapText: {
    fontSize: 12,
    color: '#999',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statusBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  boxLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  boxValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  metricsTable: {
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  tableLabel: {
    fontSize: 13,
    color: '#666',
  },
  tableValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  recommendationItem: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  recommendationItemText: {
    fontSize: 13,
    color: '#1976D2',
    marginLeft: 8,
    flex: 1,
  },
  actionButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
  },
});

export default PanelHealthCard;
