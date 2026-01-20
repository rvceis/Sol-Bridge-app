/**
 * AI Insights Screen - ML Models & Predictions
 * Shows solar forecasts, demand predictions, and anomalies
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuthStore } from '../../store';
import { safeToFixed } from '../../utils/formatters';

const { width } = Dimensions.get('window');

interface Forecast {
  timestamp: string;
  predicted_power: number;
  confidence: number;
}

interface SolarRadiation {
  uvi: number;
  radiation_watts: number;
  timestamp: string;
}

export default function AIInsightsScreen() {
  const responsive = useResponsive();
  const navigation = useNavigation();
  const user = useAuthStore((state) => state.user);
  const insets = useSafeAreaInsets();

  const [solarForecast, setSolarForecast] = useState<Forecast[]>([]);
  const [demandForecast, setDemandForecast] = useState<Forecast[]>([]);
  const [solarRadiation, setSolarRadiation] = useState<SolarRadiation | null>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'solar' | 'demand' | 'weather' | 'anomalies'>('solar');

  // Define styles early so they're available
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F9F9F9',
    },
    centerContent: {
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      marginTop: 12,
      fontSize: 14,
      color: '#666',
    },
    header: {
      paddingTop: insets.top || 16,
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
      fontSize: 13 * responsive.fontScale,
      color: '#999',
      marginTop: 4,
    },
    tabsContainer: {
      flexDirection: 'row',
      backgroundColor: '#FFF',
      borderBottomWidth: 1,
      borderBottomColor: '#EEE',
      paddingHorizontal: responsive.screenPadding,
    },
    tab: {
      paddingVertical: responsive.gridGap,
      paddingHorizontal: responsive.gridGap,
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    activeTab: {
      borderBottomColor: '#007AFF',
    },
    tabText: {
      fontSize: 13 * responsive.fontScale,
      fontWeight: '600',
      color: '#999',
    },
    activeTabText: {
      color: '#007AFF',
    },
    scrollContent: {
      paddingTop: responsive.screenPadding,
      paddingHorizontal: responsive.screenPadding,
      paddingBottom: responsive.screenPadding * 2,
    },
    card: {
      backgroundColor: '#FFF',
      borderRadius: 12,
      padding: responsive.cardPadding,
      marginBottom: responsive.screenPadding,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    cardTitle: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
      marginBottom: responsive.gridGap,
    },
    statRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: responsive.gridGap,
      borderBottomWidth: 1,
      borderBottomColor: '#F0F0F0',
    },
    statLabel: {
      fontSize: 13 * responsive.fontScale,
      color: '#666',
    },
    statValue: {
      fontSize: 16 * responsive.fontScale,
      fontWeight: '700',
      color: '#333',
    },
    confidenceBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: '#E3F2FD',
    },
    confidenceText: {
      fontSize: 12 * responsive.fontScale,
      fontWeight: '600',
      color: '#2196F3',
    },
    radiationHigh: {
      color: '#FF9800',
    },
    radiationMedium: {
      color: '#4CAF50',
    },
    radiationLow: {
      color: '#2196F3',
    },
    anomalyItem: {
      backgroundColor: '#FFEBEE',
      borderLeftWidth: 4,
      borderLeftColor: '#F44336',
      paddingVertical: responsive.gridGap,
      paddingHorizontal: responsive.gridGap,
      marginBottom: responsive.gridGap,
      borderRadius: 8,
    },
    anomalyText: {
      fontSize: 13 * responsive.fontScale,
      color: '#C62828',
      fontWeight: '600',
    },
    chartContainer: {
      marginVertical: responsive.gridGap,
      alignItems: 'center',
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: responsive.screenPadding * 2,
    },
    emptyText: {
      fontSize: 14 * responsive.fontScale,
      color: '#999',
      marginTop: responsive.gridGap,
    },
  });

  useEffect(() => {
    loadAIInsights();
  }, []);

  const loadAIInsights = async () => {
    try {
      setLoading(true);
      const [solarRes, demandRes, radiationRes, anomaliesRes] = await Promise.all([
        apiClient.get('/ai/forecast/solar?hours=24'),
        apiClient.get('/ai/forecast/demand?hours=24'),
        apiClient.get('/weather/solar-radiation'),
        apiClient.get('/ai/anomalies'),
      ]);

      setSolarForecast(solarRes.data?.data || []);
      setDemandForecast(demandRes.data?.data || []);
      setSolarRadiation(radiationRes.data?.data || null);
      setAnomalies(anomaliesRes.data?.data || []);
    } catch (error) {
      console.error('Error loading AI insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAIInsights();
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading AI Insights...</Text>
      </View>
    );
  }

  const renderSolarForecast = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>⚡ 24-Hour Solar Forecast</Text>
      {solarForecast.length > 0 ? (
          <>
            {solarForecast.slice(0, 6).map((forecast, idx) => (
              <View key={idx} style={styles.statRow}>
                <Text style={styles.statLabel}>{new Date(forecast.timestamp).toLocaleTimeString()}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.statValue}>{safeToFixed(forecast.predicted_power, 2)} kW</Text>
                  <View style={styles.confidenceBadge}>
                    <Text style={styles.confidenceText}>{safeToFixed(forecast.confidence * 100, 0)}%</Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="trending-up" size={32} color="#CCC" />
            <Text style={styles.emptyText}>No forecast data available</Text>
          </View>
        )}
    </View>
  );

  const renderDemandForecast = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📊 Demand Forecast</Text>
      {demandForecast.length > 0 ? (
        <>
          {demandForecast.slice(0, 6).map((forecast, idx) => {
            const power =
              forecast.predicted_demand ??
              forecast.predicted_load ??
              forecast.predicted_power ??
              forecast.value ?? 0;
            return (
              <View key={idx} style={styles.statRow}>
                <Text style={styles.statLabel}>{new Date(forecast.timestamp).toLocaleTimeString()}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={styles.statValue}>{safeToFixed(power, 2)} kW</Text>
                  {forecast.confidence !== undefined && (
                    <View style={styles.confidenceBadge}>
                      <Text style={styles.confidenceText}>{safeToFixed((forecast.confidence || 0) * 100, 0)}%</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="pulse" size={32} color="#CCC" />
          <Text style={styles.emptyText}>No demand forecast data</Text>
        </View>
      )}
    </View>
  );

  const renderWeather = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>☀️ Solar Radiation (Daytime)</Text>
      {solarRadiation && new Date().getHours() >= 6 && new Date().getHours() <= 18 ? (
          <>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>UV Index</Text>
              <Text style={[styles.statValue, solarRadiation.uvi > 8 ? styles.radiationHigh : styles.radiationMedium]}>
                {safeToFixed(solarRadiation.uvi, 1)}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Radiation</Text>
              <Text style={styles.statValue}>{safeToFixed(solarRadiation.radiation_watts, 0)} W/m²</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Timestamp</Text>
              <Text style={styles.statValue}>{new Date(solarRadiation.timestamp).toLocaleTimeString()}</Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="moon" size={32} color="#CCC" />
            <Text style={styles.emptyText}>Solar radiation data only available during daytime (6 AM - 6 PM)</Text>
          </View>
        )}
    </View>
  );

  const renderAnomalies = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>⚠️ Detected Anomalies</Text>
      {anomalies.length > 0 ? (
          anomalies.slice(0, 5).map((anomaly, idx) => (
            <View key={idx} style={styles.anomalyItem}>
              <Text style={styles.anomalyText}>{anomaly.type}: {anomaly.message}</Text>
              <Text style={{ fontSize: 11, color: '#D32F2F', marginTop: 4 }}>
                Severity: {anomaly.severity}
              </Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
            <Text style={styles.emptyText}>No anomalies detected</Text>
          </View>
        )}
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Insights</Text>
        <Text style={styles.headerSubtitle}>ML-Powered Predictions & Analysis</Text>
      </View>

      {/* Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        scrollEventThrottle={16}
      >
        {['solar', 'demand', 'weather', 'anomalies'].map((tabName) => (
          <TouchableOpacity
            key={tabName}
            style={[styles.tab, selectedTab === tabName && styles.activeTab]}
            onPress={() => setSelectedTab(tabName as any)}
          >
            <Text style={[styles.tabText, selectedTab === tabName && styles.activeTabText]}>
              {tabName.charAt(0).toUpperCase() + tabName.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Content */}
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {selectedTab === 'solar' && renderSolarForecast()}
        {selectedTab === 'weather' && renderWeather()}
        {selectedTab === 'anomalies' && renderAnomalies()}
        {selectedTab === 'demand' && renderDemandForecast()}
      </ScrollView>
    </View>
  );
}
