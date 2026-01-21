/**
 * AI Insights Screen - Redesigned
 * Compact, minimal spacing ML Models & Predictions
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import apiClient from '../../api/client';
import { useResponsive } from '../../hooks/useResponsive';
import { useAuthStore } from '../../store';
import { safeToFixed } from '../../utils/formatters';

interface Forecast {
  timestamp: string;
  predicted_power?: number;
  predicted_demand?: number;
  predicted_load?: number;
  predicted_generation?: number;
  confidence?: number;
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

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F5F5' },
    header: {
      backgroundColor: '#FFF',
      paddingTop: insets.top + 8,
      paddingBottom: 8,
      paddingHorizontal: 16,
      borderBottomWidth: 0,
    },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#000' },
    headerSubtitle: { fontSize: 12, color: '#999', marginTop: 2 },
    tabsContainer: {
      backgroundColor: '#FFF',
      flexDirection: 'row',
      borderBottomWidth: 2,
      borderBottomColor: '#E8E8E8',
      paddingHorizontal: 0,
    },
    tab: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      alignItems: 'center',
      borderBottomWidth: 3,
      borderBottomColor: 'transparent',
    },
    activeTab: { borderBottomColor: '#007AFF' },
    tabText: { fontSize: 12, fontWeight: '500', color: '#666' },
    activeTabText: { color: '#007AFF', fontWeight: '600' },
    content: { flex: 1 },
    scrollContent: {
      padding: 10,
      paddingBottom: insets.bottom + 16,
    },
    card: {
      backgroundColor: '#FFF',
      borderRadius: 8,
      marginBottom: 8,
      padding: 12,
      shadowColor: '#000',
      shadowOpacity: 0.03,
      shadowRadius: 2,
      elevation: 1,
    },
    cardTitle: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 6 },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 6,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    label: { fontSize: 12, color: '#666', fontWeight: '500' },
    value: { fontSize: 12, fontWeight: '600', color: '#333' },
    badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#E3F2FD' },
    badgeText: { fontSize: 10, color: '#1976D2', fontWeight: '500' },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
    emptyText: { fontSize: 13, color: '#999', marginTop: 8 },
  });

  useEffect(() => {
    loadAIInsights();
  }, []);

  const loadAIInsights = async () => {
    try {
      setLoading(true);
      const ML_BASE = 'https://th0r777-sol-bridge-ai.hf.space/api/v1';
      
      console.log('[AI Insights] Loading from:', ML_BASE);
      
      const solarPromise = fetch(`${ML_BASE}/forecast/solar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host_id: 'H-1',
          panel_capacity_kw: 5,
          forecast_hours: 24,
          historical_data: [],
          weather_forecast: [],
        }),
      })
        .then(r => {
          console.log('[AI Insights] Solar response status:', r.status);
          return r.json();
        })
        .then(d => {
          console.log('[AI Insights] Solar data received');
          return d;
        })
        .catch(e => {
          console.error('[AI Insights] Solar error:', e);
          return { predictions: [] };
        });

      const demandPromise = (async () => {
        try {
          console.log('[AI Insights] Starting demand fetch...');
          const demandBody = {
            user_id: user?.id || 'H-1',
            host_id: 'H-1',
            panel_capacity_kw: 5,
            forecast_hours: 24,
            historical_data: [],
            weather_forecast: [],
          };
          console.log('[AI Insights] Demand request body:', demandBody);
          
          const demandUrl = `${ML_BASE}/forecast/demand`;
          console.log('[AI Insights] Demand URL:', demandUrl);
          
          const r = await fetch(demandUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(demandBody),
          });
          
          console.log('[AI Insights] Demand response status:', r.status);
          const text = await r.text();
          console.log('[AI Insights] Demand response text:', text);
          
          try {
            const d = JSON.parse(text);
            console.log('[AI Insights] Demand parsed JSON:', d);
            return d;
          } catch (e) {
            console.error('[AI Insights] Demand JSON parse error:', e);
            return { predictions: [] };
          }
        } catch (e) {
          console.error('[AI Insights] Demand fetch error:', e.message);
          return { predictions: [] };
        }
      })();

      const anomalyPromise = fetch(`${ML_BASE}/anomaly/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user?.id || 'H-1',
          host_id: 'H-1',
          panel_capacity_kw: 5,
          historical_data: [],
        }),
      })
        .then(r => {
          console.log('[AI Insights] Anomaly response status:', r.status);
          return r.json();
        })
        .then(d => {
          console.log('[AI Insights] Anomaly data received');
          return d;
        })
        .catch(e => {
          console.error('[AI Insights] Anomaly error:', e);
          return { anomalies: [] };
        });

      const [solarRes, demandRes, anomaliesRes] = await Promise.all([solarPromise, demandPromise, anomalyPromise]);

      // Map solar predictions
      const solarForecasts = (solarRes.predictions || []).map((p: any) => ({
        timestamp: p.hour,
        predicted_power: p.predicted_kwh,
        predicted_generation: p.predicted_kwh,
        confidence: (p.confidence_lower + p.confidence_upper) / 2 / p.predicted_kwh || 0.8,
      }));

      // Map demand predictions
      const demandForecasts = (demandRes.predictions || []).map((p: any) => ({
        timestamp: p.hour,
        predicted_demand: p.predicted_kwh,
        predicted_load: p.predicted_kwh,
        confidence: (p.confidence_lower + p.confidence_upper) / 2 / p.predicted_kwh || 0.8,
      }));

      // Map anomalies
      const anomalyList = (anomaliesRes.anomalies || anomaliesRes.data || []).map((a: any) => ({
        type: a.type || 'Unknown',
        message: a.message || a.description || 'Anomaly detected',
        severity: a.severity || 'medium',
      }));

      console.log('[AI Insights] Mapped solar:', solarForecasts.length, 'items');
      console.log('[AI Insights] Mapped demand:', demandForecasts.length, 'items');
      console.log('[AI Insights] Mapped anomalies:', anomalyList.length, 'items');

      setSolarForecast(solarForecasts);
      setDemandForecast(demandForecasts);
      setAnomalies(anomalyList);
      
      // Fetch solar radiation from OpenWeatherMap API
      try {
        const weatherRes = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=28.6139&lon=77.2090&appid=47e62c31d249512dcf50b8a4b0faeb2d`
        ).then(r => r.json());
        
        console.log('[AI Insights] Weather data received');
        
        if (weatherRes.clouds) {
          setSolarRadiation({
            uvi: weatherRes.clouds?.all ? Math.max(0, 12 - (weatherRes.clouds.all / 10)) : 6,
            radiation_watts: weatherRes.clouds?.all ? Math.max(100, 800 - (weatherRes.clouds.all * 5)) : 800,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (e) {
        console.error('[AI Insights] Weather error:', e);
        setSolarRadiation(null);
      }
    } catch (error) {
      console.error('[AI Insights] Error loading AI insights:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAIInsights();
  };

  const renderSolarForecast = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>⚡ 24-Hour Solar Forecast</Text>
      {solarForecast.length > 0 ? (
        solarForecast.slice(0, 6).map((f, i) => (
          <View key={i} style={styles.row}>
            <Text style={styles.label}>{new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.value}>{safeToFixed(f.predicted_power || f.predicted_generation || 0, 2)} kW</Text>
              {f.confidence && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{safeToFixed(f.confidence * 100, 0)}%</Text>
                </View>
              )}
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="sunny-outline" size={28} color="#CCC" />
          <Text style={styles.emptyText}>No forecast data</Text>
        </View>
      )}
    </View>
  );

  const renderDemandForecast = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>📊 24-Hour Demand Forecast</Text>
      {demandForecast.length > 0 ? (
        demandForecast.slice(0, 6).map((f, i) => {
          const power = f.predicted_demand ?? f.predicted_load ?? f.predicted_power ?? 0;
          return (
            <View key={i} style={styles.row}>
              <Text style={styles.label}>{new Date(f.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.value}>{safeToFixed(power, 2)} kW</Text>
                {f.confidence && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{safeToFixed(f.confidence * 100, 0)}%</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="pulse" size={28} color="#CCC" />
          <Text style={styles.emptyText}>No demand data</Text>
        </View>
      )}
    </View>
  );

  const renderWeather = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>☀️ Solar Radiation</Text>
      {solarRadiation ? (
        <>
          <View style={styles.row}>
            <Text style={styles.label}>UV Index</Text>
            <Text style={[styles.value, { color: solarRadiation.uvi > 8 ? '#D32F2F' : '#4CAF50' }]}>
              {safeToFixed(solarRadiation.uvi, 1)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Radiation</Text>
            <Text style={styles.value}>{safeToFixed(solarRadiation.radiation_watts, 0)} W/m²</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time</Text>
            <Text style={styles.value}>{new Date(solarRadiation.timestamp).toLocaleTimeString()}</Text>
          </View>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="cloud-offline-outline" size={28} color="#CCC" />
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      )}
    </View>
  );

  const renderAnomalies = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>⚠️ Anomalies</Text>
      {anomalies.length > 0 ? (
        anomalies.slice(0, 5).map((a, i) => (
          <View key={i} style={[styles.row, { backgroundColor: '#FFEBEE', borderRadius: 4, paddingHorizontal: 8 }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: '#C62828' }]}>{a.type}</Text>
              <Text style={{ fontSize: 11, color: '#D32F2F', marginTop: 2 }}>{a.message}</Text>
            </View>
            <View style={{ backgroundColor: '#D32F2F', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3 }}>
              <Text style={{ fontSize: 10, color: '#FFF', fontWeight: '500' }}>{a.severity}</Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="checkmark-circle" size={28} color="#4CAF50" />
          <Text style={styles.emptyText}>No anomalies detected</Text>
        </View>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 12, color: '#666' }}>Loading insights...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI Insights</Text>
        <Text style={styles.headerSubtitle}>ML-Powered Predictions</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['solar', 'demand', 'weather', 'anomalies'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab as any)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'solar' && renderSolarForecast()}
        {selectedTab === 'demand' && renderDemandForecast()}
        {selectedTab === 'weather' && renderWeather()}
        {selectedTab === 'anomalies' && renderAnomalies()}
      </ScrollView>
    </View>
  );
}
