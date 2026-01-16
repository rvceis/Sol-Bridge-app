import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ClusterMetrics {
  transaction_count: number;
  total_energy_kwh: number;
  avg_price_per_kwh: number;
  unique_buyers: number;
  unique_sellers: number;
  buyer_seller_ratio: number;
}

interface Cluster {
  id: string;
  location: {
    approx_latitude: number;
    approx_longitude: number;
    city: string;
    state: string;
    region: string;
  };
  metrics: ClusterMetrics;
  demand_level: 'very_high' | 'high' | 'medium' | 'low';
  investment_potential: 'high' | 'medium' | 'low';
}

interface DemandClustersData {
  clusters: Cluster[];
  summary: {
    total_clusters: number;
    total_transactions: number;
    total_energy_kwh: number;
    avg_transaction_value: number;
  };
}

interface DemandClusterMapProps {
  limit?: number;
  onClusterSelect?: (cluster: Cluster) => void;
}

const DemandLevelConfig = {
  very_high: { color: '#dc2626', bgColor: '#fee2e2', label: 'Very High', icon: '🔴' },
  high: { color: '#f59e0b', bgColor: '#fef3c7', label: 'High', icon: '🟠' },
  medium: { color: '#3b82f6', bgColor: '#dbeafe', label: 'Medium', icon: '🔵' },
  low: { color: '#6b7280', bgColor: '#f3f4f6', label: 'Low', icon: '⚪' },
};

const DemandClusterMap: React.FC<DemandClusterMapProps> = ({
  limit = 10,
  onClusterSelect,
}) => {
  const [data, setData] = useState<DemandClustersData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);

  useEffect(() => {
    fetchClusters();
  }, [limit]);

  const fetchClusters = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5000/api/v1/location/demand-clusters?limit=${limit}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
        setError(null);
      } else {
        setError(result.error || 'Failed to fetch clusters');
      }
    } catch (err) {
      setError('Network error');
      console.error('Cluster fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClusterSelect = (cluster: Cluster) => {
    setSelectedCluster(cluster);
    onClusterSelect?.(cluster);
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
        <Text style={styles.errorText}>{error || 'Unable to load clusters'}</Text>
      </View>
    );
  }

  const summary = data.summary;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Energy Trading Hotspots</Text>
        <Text style={styles.subtitle}>Geographic demand clusters</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Total Clusters</Text>
          <Text style={styles.summaryValue}>{summary.total_clusters}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Transactions</Text>
          <Text style={styles.summaryValue}>{summary.total_transactions}</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Energy Traded</Text>
          <Text style={styles.summaryValue}>
            {(summary.total_energy_kwh / 1000).toFixed(0)}K
          </Text>
          <Text style={styles.summaryUnit}>kWh</Text>
        </View>
        <View style={styles.summaryBox}>
          <Text style={styles.summaryLabel}>Avg Value</Text>
          <Text style={styles.summaryValue}>
            ${summary.avg_transaction_value.toFixed(0)}
          </Text>
        </View>
      </View>

      {/* Demand Level Legend */}
      <View style={styles.legendContainer}>
        <Text style={styles.legendTitle}>Demand Levels</Text>
        <View style={styles.legendGrid}>
          {Object.entries(DemandLevelConfig).map(([level, config]) => (
            <View key={level} style={styles.legendItem}>
              <View
                style={[styles.legendColor, { backgroundColor: config.bgColor }]}
              >
                <Text style={{ fontSize: 14 }}>{config.icon}</Text>
              </View>
              <Text style={styles.legendLabel}>{config.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Clusters List */}
      <Text style={styles.clustersTitle}>Top Hotspots</Text>
      {data.clusters.map((cluster, index) => {
        const config = DemandLevelConfig[cluster.demand_level];
        const isSelected = selectedCluster?.id === cluster.id;

        return (
          <TouchableOpacity
            key={cluster.id}
            style={[
              styles.clusterCard,
              isSelected && styles.clusterCardSelected,
            ]}
            onPress={() => handleClusterSelect(cluster)}
            activeOpacity={0.7}
          >
            {/* Rank Badge */}
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>

            {/* Location Header */}
            <View style={styles.locationHeader}>
              <View>
                <Text style={styles.locationName}>
                  {cluster.location.city}, {cluster.location.state}
                </Text>
                <Text style={styles.regionName}>{cluster.location.region}</Text>
              </View>
              <View
                style={[
                  styles.demandBadge,
                  { backgroundColor: config.bgColor },
                ]}
              >
                <Text style={[styles.demandText, { color: config.color }]}>
                  {config.label}
                </Text>
              </View>
            </View>

            {/* Coordinates */}
            <View style={styles.coordinatesRow}>
              <Ionicons name="location" size={14} color="#6b7280" />
              <Text style={styles.coordinates}>
                {cluster.location.approx_latitude.toFixed(2)}°, {cluster.location.approx_longitude.toFixed(2)}°
              </Text>
            </View>

            {/* Key Metrics Grid */}
            <View style={styles.metricsGrid}>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Transactions</Text>
                <Text style={styles.metricValue}>
                  {cluster.metrics.transaction_count}
                </Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Energy</Text>
                <Text style={styles.metricValue}>
                  {cluster.metrics.total_energy_kwh.toFixed(0)}
                </Text>
                <Text style={styles.metricUnit}>kWh</Text>
              </View>
              <View style={styles.metricCell}>
                <Text style={styles.metricLabel}>Avg Price</Text>
                <Text style={styles.metricValue}>
                  ${cluster.metrics.avg_price_per_kwh ? cluster.metrics.avg_price_per_kwh.toFixed(2) : 'N/A'}
                </Text>
                <Text style={styles.metricUnit}>per kWh</Text>
              </View>
            </View>

            {/* Buyer/Seller Info */}
            <View style={styles.buyerSellerContainer}>
              <View style={styles.buyerSellerItem}>
                <Ionicons name="person" size={16} color="#3b82f6" />
                <View style={styles.buyerSellerText}>
                  <Text style={styles.bsLabel}>Buyers</Text>
                  <Text style={styles.bsValue}>{cluster.metrics.unique_buyers}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.buyerSellerItem}>
                <Ionicons name="flash" size={16} color="#f59e0b" />
                <View style={styles.buyerSellerText}>
                  <Text style={styles.bsLabel}>Sellers</Text>
                  <Text style={styles.bsValue}>{cluster.metrics.unique_sellers}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.buyerSellerItem}>
                <Ionicons name="swap-horizontal" size={16} color="#10b981" />
                <View style={styles.buyerSellerText}>
                  <Text style={styles.bsLabel}>Ratio</Text>
                  <Text style={styles.bsValue}>
                    {cluster.metrics.buyer_seller_ratio.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            {/* Investment Potential */}
            <View style={styles.investmentContainer}>
              <Ionicons
                name={
                  cluster.investment_potential === 'high'
                    ? 'trending-up'
                    : 'trending-down'
                }
                size={16}
                color={
                  cluster.investment_potential === 'high' ? '#10b981' : '#f59e0b'
                }
              />
              <Text
                style={[
                  styles.investmentText,
                  {
                    color:
                      cluster.investment_potential === 'high'
                        ? '#10b981'
                        : '#f59e0b',
                  },
                ]}
              >
                {cluster.investment_potential.charAt(0).toUpperCase() +
                  cluster.investment_potential.slice(1)}{' '}
                Investment Potential
              </Text>
            </View>

            {/* Growth Indicator */}
            <View style={styles.growthIndicator}>
              <View style={styles.growthBar}>
                <View
                  style={[
                    styles.growthFill,
                    {
                      width: `${Math.min(
                        (cluster.metrics.transaction_count / 50) * 100,
                        100
                      )}%`,
                      backgroundColor: config.color,
                    },
                  ]}
                />
              </View>
              <Text style={styles.growthLabel}>Activity Level</Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Market Insights</Text>

        {(() => {
          if (!data.clusters.length) return null;

          const topCluster = data.clusters[0];
          const bottomCluster = data.clusters[data.clusters.length - 1];
          const highDemandCount = data.clusters.filter(
            c => c.demand_level === 'very_high'
          ).length;

          return (
            <>
              <View style={styles.insightItem}>
                <Ionicons name="star" size={18} color="#fbbf24" />
                <View style={styles.insightText}>
                  <Text style={styles.insightTitle2}>Hottest Cluster</Text>
                  <Text style={styles.insightDesc}>
                    {topCluster.location.city} with {topCluster.metrics.transaction_count} transactions
                  </Text>
                </View>
              </View>

              <View style={styles.insightItem}>
                <Ionicons name="flame" size={18} color="#ef4444" />
                <View style={styles.insightText}>
                  <Text style={styles.insightTitle2}>Very High Demand Areas</Text>
                  <Text style={styles.insightDesc}>
                    {highDemandCount} locations with very high activity
                  </Text>
                </View>
              </View>

              <View style={styles.insightItem}>
                <Ionicons name="target" size={18} color="#3b82f6" />
                <View style={styles.insightText}>
                  <Text style={styles.insightTitle2}>Avg B/S Ratio</Text>
                  <Text style={styles.insightDesc}>
                    {(
                      data.clusters.reduce((sum, c) => sum + c.metrics.buyer_seller_ratio, 0) /
                      data.clusters.length
                    ).toFixed(2)} buyers per seller across clusters
                  </Text>
                </View>
              </View>
            </>
          );
        })()}
      </View>

      <View style={styles.spacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    margin: 16,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    marginTop: 8,
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  summaryBox: {
    flex: 1,
    minWidth: '48%',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: '#9ca3af',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  summaryUnit: {
    fontSize: 10,
    color: '#6b7280',
  },
  legendContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  legendTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  legendGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendItem: {
    alignItems: 'center',
    flex: 1,
  },
  legendColor: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  legendLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  clustersTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  clusterCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  clusterCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#f0f9ff',
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  regionName: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  demandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  demandText: {
    fontSize: 11,
    fontWeight: '600',
  },
  coordinatesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  coordinates: {
    fontSize: 11,
    color: '#6b7280',
    marginLeft: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 10,
    color: '#9ca3af',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1f2937',
  },
  metricUnit: {
    fontSize: 9,
    color: '#6b7280',
    marginTop: 2,
  },
  buyerSellerContainer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  buyerSellerItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  buyerSellerText: {
    marginLeft: 8,
  },
  bsLabel: {
    fontSize: 10,
    color: '#9ca3af',
  },
  bsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1f2937',
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: '#e5e7eb',
  },
  investmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f0fdf4',
    borderRadius: 8,
    marginBottom: 12,
  },
  investmentText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 8,
  },
  growthIndicator: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  growthBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  growthFill: {
    height: '100%',
    borderRadius: 3,
  },
  growthLabel: {
    fontSize: 10,
    color: '#6b7280',
  },
  insightsContainer: {
    backgroundColor: '#eff6ff',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
    padding: 12,
    borderRadius: 8,
  },
  insightsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  insightText: {
    marginLeft: 12,
    flex: 1,
  },
  insightTitle2: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1e40af',
  },
  insightDesc: {
    fontSize: 11,
    color: '#1e40af',
    marginTop: 2,
    lineHeight: 16,
  },
  spacer: {
    height: 20,
  },
});

export default DemandClusterMap;
