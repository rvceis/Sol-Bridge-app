import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Alert, FlatList } from 'react-native';
import { Text, Card, Button, Chip, ProgressBar, IconButton } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors } from '../theme/colors';
import { matchingApi } from '../api/matchingApi';
import { format } from 'date-fns';

const SmartAllocationScreen = ({ route, navigation }) => {
  const { buyerRequirement } = route.params || {};
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatches, setSelectedMatches] = useState({});
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Memoized cache key to avoid unnecessary re-renders
  const cacheKey = useMemo(() => 
    buyerRequirement ? `${buyerRequirement.requiredKwh}-${buyerRequirement.maxPrice}` : '',
    [buyerRequirement]
  );

  useEffect(() => {
    // Use lazy initialization - only fetch if needed
    fetchMatches(false);
  }, [cacheKey]);

  const fetchMatches = useCallback(async (isRefresh = false) => {
    if (!buyerRequirement) {
      setError('No buyer requirement provided');
      setLoading(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
        matchingApi.clearCache(); // Force refresh
      } else {
        setLoading(true);
      }

      console.log('[FETCH] Loading matches for:', buyerRequirement);
      const startTime = performance.now();

      const response = await matchingApi.findSellers(buyerRequirement);
      
      const endTime = performance.now();
      console.log(`[TIMING] Fetch took ${endTime - startTime}ms`);

      // Validate response
      if (!response || !response.matches) {
        throw new Error('Invalid response format');
      }

      setMatches(response.matches || []);
      setError(null);
    } catch (err) {
      console.error('[ERROR]', err);
      setError(err.message || 'Failed to fetch matches');
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buyerRequirement]);

  const handleSelectMatch = (matchId) => {
    setSelectedMatches(prev => ({
      ...prev,
      [matchId]: !prev[matchId],
    }));
  };

  const renderScoreBreakdown = (breakdown) => {
    const scores = [
      { key: 'availability', label: 'Availability', color: '#4CAF50' },
      { key: 'price', label: 'Price', color: '#2196F3' },
      { key: 'reliability', label: 'Reliability', color: '#FF9800' },
      { key: 'distance', label: 'Distance', color: '#9C27B0' },
      { key: 'renewable', label: 'Renewable', color: '#00BCD4' },
      { key: 'timing', label: 'Timing', color: '#F44336' },
    ];

    return (
      <View style={styles.scoreContainer}>
        {scores.map(({ key, label, color }) => (
          <View key={key} style={styles.scoreRow}>
            <Text style={styles.scoreLabel}>{label}</Text>
            <View style={styles.scoreBar}>
              <ProgressBar 
                progress={breakdown[key] / 100} 
                color={color}
                style={styles.progressBar}
              />
              <Text style={styles.scoreValue}>{breakdown[key]}/100</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderMatchCard = (match, index) => {
    const isSelected = selectedMatches[match.id];
    const recommendation = match.match_score >= 75 ? 'Highly Recommended' :
                          match.match_score >= 50 ? 'Recommended' : 'Consider';

    return (
      <Card 
        key={match.id} 
        style={[styles.matchCard, isSelected && styles.selectedCard]}
        onPress={() => handleSelectMatch(match.id)}
      >
        <Card.Content>
          {/* Header with score and recommendation */}
          <View style={styles.cardHeader}>
            <View style={styles.scoreHeader}>
              <Text style={styles.mainScore}>{Math.round(match.match_score)}</Text>
              <Text style={styles.scoreOutOf}>/100</Text>
            </View>
            <Chip 
              label={recommendation}
              style={{
                backgroundColor: match.match_score >= 75 ? '#4CAF50' : 
                               match.match_score >= 50 ? '#FFC107' : '#FF9800'
              }}
              textStyle={{ color: '#fff' }}
            />
            <IconButton
              icon={isSelected ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={24}
              onPress={() => handleSelectMatch(match.id)}
            />
          </View>

          {/* Seller info */}
          <View style={styles.sellerInfo}>
            <Icon name="account-circle" size={40} color={colors.primary} />
            <View style={styles.sellerDetails}>
              <Text style={styles.sellerName}>{match.seller_name}</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.rating}>⭐ {match.rating}</Text>
                <Text style={styles.transactions}>({match.completed_transactions} sales)</Text>
              </View>
            </View>
          </View>

          {/* Key metrics */}
          <View style={styles.metricsRow}>
            <View style={styles.metric}>
              <Icon name="lightning-bolt" size={16} color={colors.primary} />
              <Text style={styles.metricValue}>{match.available_kwh} kWh</Text>
            </View>
            <View style={styles.metric}>
              <Icon name="currency-inr" size={16} color={colors.success} />
              <Text style={styles.metricValue}>₹{match.price_per_kwh}/kWh</Text>
            </View>
            <View style={styles.metric}>
              <Icon name="map-marker" size={16} color={colors.secondary} />
              <Text style={styles.metricValue}>{match.distance_km.toFixed(1)}km</Text>
            </View>
            {match.renewable_cert && (
              <View style={styles.metric}>
                <Icon name="leaf" size={16} color={colors.success} />
                <Text style={styles.metricValue}>Renewable</Text>
              </View>
            )}
          </View>

          {/* Score breakdown */}
          <Text style={styles.breakdownTitle}>Score Breakdown</Text>
          {renderScoreBreakdown(match.match_breakdown)}

          {/* Match details explanation */}
          <View style={styles.detailsBox}>
            <Text style={styles.detailsTitle}>Why This Match?</Text>
            <Text style={styles.detailsText}>
              • {Math.round(match.match_breakdown.availability)}% of your required {buyerRequirement.requiredKwh}kWh available
            </Text>
            <Text style={styles.detailsText}>
              • Priced at ₹{match.price_per_kwh}/kWh {match.price_per_kwh < buyerRequirement.maxPrice ? '(within budget)' : '(above budget)'}
            </Text>
            <Text style={styles.detailsText}>
              • Seller reliability: {Math.round(match.match_breakdown.reliability)}% based on {match.completed_transactions} transactions
            </Text>
            <Text style={styles.detailsText}>
              • Only {match.distance_km.toFixed(1)}km away (transmission efficient)
            </Text>
            {match.renewable_cert && (
              <Text style={styles.detailsText}>
                • Certified renewable energy source
              </Text>
            )}
          </View>
        </Card.Content>
      </Card>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Finding best matches...</Text>
        <Text style={styles.loadingSubtext}>(Querying backend...)</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Icon name="alert-circle" size={48} color={colors.error} />
        <Text style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => fetchMatches(true)} style={styles.retryButton}>
          Retry
        </Button>
      </View>
    );
  }

  const selectedCount = Object.values(selectedMatches).filter(Boolean).length;
  const totalCost = useMemo(() => 
    matches
      .filter(m => selectedMatches[m.id])
      .reduce((sum, m) => sum + (m.price_per_kwh * m.available_kwh), 0),
    [selectedMatches, matches]
  );

  const renderMatchCardMemo = useCallback((item) => renderMatchCard(item.item, item.index), [selectedMatches, buyerRequirement]);

  const keyExtractor = useCallback((item) => item.id || Math.random().toString(), []);

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Smart Allocation Matches</Text>
        <Text style={styles.subtitle}>
          Found {matches.length} sellers matching your requirement of {buyerRequirement.requiredKwh} kWh
        </Text>
      </View>

      <ScrollView style={styles.content} scrollEnabled={true}>
        {matches.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="magnify-close" size={48} color={colors.placeholder} />
            <Text style={styles.emptyText}>No sellers found for your requirements</Text>
          </View>
        ) : (
          <FlatList
            data={matches}
            renderItem={renderMatchCardMemo}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
            initialNumToRender={5}
            maxToRenderPerBatch={10}
            removeClippedSubviews={true}
          />
        )}
      </ScrollView>

      {selectedCount > 0 && (
        <Card style={styles.footerCard}>
          <Card.Content>
            <View style={styles.footerContent}>
              <View>
                <Text style={styles.footerLabel}>Selected: {selectedCount} matches</Text>
                <Text style={styles.footerCost}>Estimated Cost: ₹{totalCost.toFixed(2)}</Text>
              </View>
              <Button
                mode="contained"
                style={styles.allocateButton}
                onPress={() => {
                  // Navigate to confirmation with selected matches
                  navigation.navigate('AllocationConfirm', {
                    selectedMatches: matches.filter(m => selectedMatches[m.id]),
                    totalCost,
                  });
                }}
              >
                Allocate
              </Button>
            </View>
          </Card.Content>
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: colors.primary,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#ddd',
    marginTop: 8,
  },
  content: {
    flex: 1,
    padding: 12,
  },
  matchCard: {
    marginBottom: 12,
    borderRadius: 8,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  selectedCard: {
    borderLeftColor: colors.success,
    backgroundColor: '#f0f8f4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mainScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
  },
  scoreOutOf: {
    fontSize: 14,
    color: '#999',
    marginLeft: 4,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sellerDetails: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  rating: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.success,
  },
  transactions: {
    fontSize: 12,
    color: '#999',
    marginLeft: 8,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
    marginLeft: 6,
  },
  breakdownTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  scoreContainer: {
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreLabel: {
    width: 80,
    fontSize: 12,
    fontWeight: '500',
    color: '#555',
  },
  scoreBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  scoreValue: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#333',
    width: 45,
    textAlign: 'right',
  },
  detailsBox: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  detailsTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 6,
  },
  detailsText: {
    fontSize: 11,
    color: '#666',
    lineHeight: 16,
    marginBottom: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: colors.placeholder,
    marginTop: 12,
  },
  loadingText: {
    fontSize: 16,
    color: colors.placeholder,
    marginTop: 12,
  },
  loadingSubtext: {
    fontSize: 12,
    color: colors.placeholder,
    marginTop: 8,
  },
  errorText: {
    fontSize: 16,
    color: colors.error,
    marginTop: 12,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 32,
  },
  footerCard: {
    margin: 12,
    elevation: 4,
  },
  footerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  footerCost: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.success,
    marginTop: 4,
  },
  allocateButton: {
    paddingHorizontal: 24,
  },
});

export default SmartAllocationScreen;
