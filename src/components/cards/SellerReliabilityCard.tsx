import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { locationApi } from '../../api/locationService';

const { width } = Dimensions.get('window');

interface SellerReliability {
  seller_id: number;
  seller_name: string;
  reliability_score: number;
  completion_rate: number;
  cancellation_rate: number;
  dispute_rate: number;
  avg_completion_hours: number;
  avg_rating: number;
  total_transactions: number;
  tenure_months: number;
}

interface SellerReliabilityCardProps {
  sellerId: number;
  authToken: string;
  onPress?: () => void;
}

const SellerReliabilityCard: React.FC<SellerReliabilityCardProps> = ({
  sellerId,
  authToken,
  onPress,
}) => {
  const [data, setData] = useState<SellerReliability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReliability();
  }, [sellerId]);

  const fetchReliability = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/v1/location/seller-reliability/${sellerId}`,
        {
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Failed to fetch reliability');
      }
    } catch (err) {
      setError('Network error');
      console.error('Reliability fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return '#10b981'; // green
    if (score >= 70) return '#f59e0b'; // amber
    return '#ef4444'; // red
  };

  const getScoreLabel = (score: number) => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Good';
    return 'Fair';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={32} color="#ef4444" />
        <Text style={styles.errorText}>{error || 'Unable to load data'}</Text>
      </View>
    );
  }

  const scoreColor = getScoreColor(data.reliability_score);
  const scoreLabel = getScoreLabel(data.reliability_score);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header with Seller Name */}
      <View style={styles.header}>
        <View>
          <Text style={styles.sellerName}>{data.seller_name}</Text>
          <Text style={styles.tenure}>
            {data.tenure_months} months on platform
          </Text>
        </View>
        <View style={[styles.scoreCircle, { borderColor: scoreColor }]}>
          <Text style={[styles.scoreText, { color: scoreColor }]}>
            {data.reliability_score}
          </Text>
        </View>
      </View>

      {/* Score Label */}
      <View style={styles.labelRow}>
        <Text style={[styles.scoreLabel, { color: scoreColor }]}>
          {scoreLabel} Reliability
        </Text>
      </View>

      {/* Metrics Grid */}
      <View style={styles.metricsGrid}>
        {/* Completion Rate */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Ionicons name="checkmark-circle" size={20} color="#10b981" />
            <Text style={styles.metricLabel}>Completion</Text>
          </View>
          <Text style={styles.metricValue}>
            {data.completion_rate.toFixed(1)}%
          </Text>
          <Text style={styles.metricSubtext}>
            {data.total_transactions} transactions
          </Text>
        </View>

        {/* Cancellation Rate */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Ionicons name="close-circle" size={20} color="#ef4444" />
            <Text style={styles.metricLabel}>Cancelled</Text>
          </View>
          <Text style={styles.metricValue}>
            {data.cancellation_rate.toFixed(1)}%
          </Text>
          <Text style={styles.metricSubtext}>of orders</Text>
        </View>

        {/* Dispute Rate */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Ionicons name="warning" size={20} color="#f59e0b" />
            <Text style={styles.metricLabel}>Disputes</Text>
          </View>
          <Text style={styles.metricValue}>
            {data.dispute_rate.toFixed(1)}%
          </Text>
          <Text style={styles.metricSubtext}>disputed</Text>
        </View>

        {/* Average Rating */}
        <View style={styles.metricItem}>
          <View style={styles.metricHeader}>
            <Ionicons name="star" size={20} color="#fbbf24" />
            <Text style={styles.metricLabel}>Rating</Text>
          </View>
          <Text style={styles.metricValue}>{data.avg_rating.toFixed(1)}</Text>
          <Text style={styles.metricSubtext}>out of 5</Text>
        </View>
      </View>

      {/* Completion Time */}
      <View style={styles.completionTime}>
        <Ionicons name="time" size={18} color="#6366f1" />
        <Text style={styles.completionTimeText}>
          Avg completion time: <Text style={styles.bold}>{data.avg_completion_hours.toFixed(1)}h</Text>
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <Text style={styles.progressLabel}>Overall Reliability Score</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${data.reliability_score}%`,
                backgroundColor: scoreColor,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {data.reliability_score}/100
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
  },
  tenure: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  scoreCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  scoreText: {
    fontSize: 24,
    fontWeight: '700',
  },
  labelRow: {
    marginBottom: 12,
  },
  scoreLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginVertical: 12,
  },
  metricItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginRight: '4%',
    marginBottom: 8,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 4,
  },
  metricSubtext: {
    fontSize: 11,
    color: '#9ca3af',
  },
  completionTime: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    borderRadius: 8,
    padding: 10,
    marginVertical: 12,
  },
  completionTimeText: {
    fontSize: 13,
    color: '#1e40af',
    marginLeft: 8,
  },
  bold: {
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 6,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'right',
  },
});

export default SellerReliabilityCard;
