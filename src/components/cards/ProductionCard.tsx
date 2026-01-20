import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { iotService } from '../../api/iotService';
import { useAuthStore } from '../../store';

interface ProductionData {
  total_energy_kwh: number;
  avg_power_kw: number;
  max_power_kw: number;
  reading_count: number;
}

interface ProductionCardProps {
  deviceId?: string;
  title?: string;
  subtitle?: string;
  showCombined?: boolean;
}

const { width } = Dimensions.get('window');

export const ProductionCard: React.FC<ProductionCardProps> = ({
  deviceId,
  title,
  subtitle,
  showCombined = false,
}) => {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<ProductionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProductionData();
  }, [deviceId]);

  const loadProductionData = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (deviceId) {
        // Get device-specific production
        response = await iotService.getDeviceProduction(
          deviceId,
          undefined,
          undefined,
          'daily'
        );
      } else if (showCombined) {
        // Get combined production
        response = await iotService.getCombinedProduction(
          undefined,
          undefined,
          'daily'
        );
      } else {
        return;
      }

      if (response.success && response.data) {
        setData(response.data.summary);
      } else {
        setError(response.message || 'Failed to load production data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading production data');
      console.error('Production data error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#4CAF50" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={24} color="#FF9800" />
        <Text style={styles.errorText}>
          {error || 'No production data available'}
        </Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#4CAF50', '#45a049']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name="flash" size={24} color="#fff" />
          <View style={styles.textContainer}>
            <Text style={styles.title}>{title || 'Today\'s Production'}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={24} color="#fff" />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Total Energy</Text>
          <Text style={styles.statValue}>
            {data.total_energy_kwh.toFixed(2)} kWh
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Avg Power</Text>
          <Text style={styles.statValue}>
            {data.avg_power_kw.toFixed(2)} kW
          </Text>
        </View>

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Max Power</Text>
          <Text style={styles.statValue}>
            {data.max_power_kw.toFixed(2)} kW
          </Text>
        </View>
      </View>

      {data.reading_count > 0 && (
        <Text style={styles.readingCount}>
          {data.reading_count} readings recorded
        </Text>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  loadingContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    height: 150,
  },
  errorContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    backgroundColor: '#FFF3E0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#FF9800',
    fontSize: 14,
    flex: 1,
  },
  readingCount: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default ProductionCard;
