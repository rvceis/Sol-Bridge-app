import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { iotService } from '../../api/iotService';

interface TemperatureData {
  current: number;
  min: number;
  max: number;
  avg: number;
}

interface TemperatureCardProps {
  deviceId?: string;
  title?: string;
  showCombined?: boolean;
}

export const TemperatureCard: React.FC<TemperatureCardProps> = ({
  deviceId,
  title,
  showCombined = false,
}) => {
  const [data, setData] = useState<TemperatureData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTemperatureData();
  }, [deviceId]);

  const loadTemperatureData = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (deviceId) {
        response = await iotService.getDeviceProduction(
          deviceId,
          undefined,
          undefined,
          'hourly'
        );
      } else if (showCombined) {
        response = await iotService.getCombinedProduction(
          undefined,
          undefined,
          'hourly'
        );
      } else {
        return;
      }

      if (response.success && response.data && response.data.readings) {
        const readings = response.data.readings;
        const temps = readings
          .map((r: any) => r.avg_temperature)
          .filter((t: any) => t != null);

        if (temps.length > 0) {
          setData({
            current: temps[0] || 0,
            min: Math.min(...temps),
            max: Math.max(...temps),
            avg: temps.reduce((a: number, b: number) => a + b, 0) / temps.length,
          });
        } else {
          setError('No temperature data available');
        }
      } else {
        setError(response.message || 'Failed to load temperature data');
      }
    } catch (err: any) {
      setError(err.message || 'Error loading temperature data');
      console.error('Temperature data error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getTemperatureColor = (temp: number) => {
    if (temp < 20) return '#2196F3'; // Cold - Blue
    if (temp < 30) return '#4CAF50'; // Normal - Green
    if (temp < 40) return '#FF9800'; // Warm - Orange
    return '#FF5722'; // Hot - Red
  };

  const getTemperatureIcon = (temp: number) => {
    if (temp < 20) return 'snow';
    if (temp < 30) return 'thermometer-outline';
    if (temp < 40) return 'sunny';
    return 'flame';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#FF9800" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={24} color="#FF9800" />
        <Text style={styles.errorText}>
          {error || 'No temperature data'}
        </Text>
      </View>
    );
  }

  const currentTemp = data.current;
  const tempColor = getTemperatureColor(currentTemp);
  const tempIcon = getTemperatureIcon(currentTemp);

  return (
    <LinearGradient
      colors={[tempColor, tempColor + 'CC']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Ionicons name={tempIcon as any} size={24} color="#fff" />
          <Text style={styles.title}>{title || 'Temperature'}</Text>
        </View>
      </View>

      <View style={styles.currentTemp}>
        <Text style={styles.tempValue}>{currentTemp.toFixed(1)}°C</Text>
        <Text style={styles.tempLabel}>Current Temp</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Ionicons name="arrow-down" size={16} color="#fff" />
          <Text style={styles.statValue}>{data.min.toFixed(1)}°C</Text>
          <Text style={styles.statLabel}>Min</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="analytics" size={16} color="#fff" />
          <Text style={styles.statValue}>{data.avg.toFixed(1)}°C</Text>
          <Text style={styles.statLabel}>Avg</Text>
        </View>

        <View style={styles.statItem}>
          <Ionicons name="arrow-up" size={16} color="#fff" />
          <Text style={styles.statValue}>{data.max.toFixed(1)}°C</Text>
          <Text style={styles.statLabel}>Max</Text>
        </View>
      </View>
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
    backgroundColor: '#FFF3E0',
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
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  currentTemp: {
    alignItems: 'center',
    marginBottom: 16,
  },
  tempValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '700',
  },
  tempLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  errorText: {
    color: '#FF9800',
    fontSize: 14,
    flex: 1,
  },
});

export default TemperatureCard;
