/**
 * Transactions Screen
 * History of all contributions and distributions — "Kente Vibrant" restyle.
 */

import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, StyleSheet, FlatList, RefreshControl} from 'react-native';
import Animated, {FadeInDown} from 'react-native-reanimated';
import paymentApi from '@services/api/payment.api';
import {IS_SUPABASE_CONFIGURED} from '@config/appConfig';
import {LoadingSpinner} from '@components/common';
import {
  useTheme,
  useThemedStyles,
  typography,
  spacing,
  borderRadius,
  tabularNums,
  type ThemedTokens,
} from '@theme';
import {
  ScreenHeader,
  SegmentedControl,
  StatTile,
  EmptyState,
  PressableScale,
} from '@components/common';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  CashIcon,
  AlertIcon,
} from '@components/icons';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';

interface Transaction {
  id: string;
  type: 'contribution' | 'distribution' | 'fee' | 'penalty';
  amount: number;
  currency: string;
  tontineName: string;
  date: Date;
  status: 'completed' | 'pending' | 'failed';
  description?: string;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'contribution',
    amount: -50000,
    currency: 'FCFA',
    tontineName: 'Tontine Famille Kouassi',
    date: new Date(Date.now() - 1000 * 60 * 60 * 2),
    status: 'completed',
    description: 'Cotisation mensuelle - Decembre',
  },
  {
    id: '2',
    type: 'distribution',
    amount: 600000,
    currency: 'FCFA',
    tontineName: 'Epargne Collegues Tech',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
    status: 'completed',
    description: 'Tour du mois - Felicitations!',
  },
  {
    id: '3',
    type: 'contribution',
    amount: -25000,
    currency: 'FCFA',
    tontineName: 'Tontine du Quartier',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
    status: 'completed',
    description: 'Cotisation bi-mensuelle',
  },
  {
    id: '4',
    type: 'contribution',
    amount: -50000,
    currency: 'FCFA',
    tontineName: 'Tontine Famille Kouassi',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),
    status: 'completed',
    description: 'Cotisation mensuelle - Novembre',
  },
  {
    id: '5',
    type: 'fee',
    amount: -1000,
    currency: 'FCFA',
    tontineName: 'Cercle des Entrepreneurs',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 35),
    status: 'completed',
    description: 'Frais de service',
  },
  {
    id: '6',
    type: 'penalty',
    amount: -5000,
    currency: 'FCFA',
    tontineName: 'Tontine du Quartier',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 40),
    status: 'completed',
    description: 'Penalite de retard - 2 jours',
  },
];

// Map a backend transaction (positive magnitude + API enum) to the signed
// display row this screen renders.
const mapApiTransaction = (t: {
  id: string;
  type: string;
  amount: number;
  currency: string;
  tontineName?: string;
  description: string;
  status: string;
  createdAt: string;
}): Transaction => {
  const type: Transaction['type'] =
    t.type === 'Distribution'
      ? 'distribution'
      : t.type === 'Penalty'
        ? 'penalty'
        : t.type === 'Refund' || t.type === 'Deposit'
          ? 'distribution'
          : 'contribution';
  const credit = type === 'distribution';
  return {
    id: t.id,
    type,
    amount: credit ? Math.abs(t.amount) : -Math.abs(t.amount),
    currency: t.currency === 'XOF' ? 'FCFA' : t.currency,
    tontineName: t.tontineName || 'Tontine',
    date: new Date(t.createdAt),
    status:
      t.status === 'Completed' ? 'completed' : t.status === 'Failed' ? 'failed' : 'pending',
    description: t.description,
  };
};

type FilterType = 'all' | 'contribution' | 'distribution';

const FILTER_OPTIONS: {label: string; value: FilterType}[] = [
  {label: 'Tout', value: 'all'},
  {label: 'Cotisations', value: 'contribution'},
  {label: 'Receptions', value: 'distribution'},
];

const TransactionsScreen: React.FC = () => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);

  const [transactions, setTransactions] = useState<Transaction[]>(
    IS_SUPABASE_CONFIGURED ? [] : mockTransactions,
  );
  const [filter, setFilter] = useState<FilterType>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(IS_SUPABASE_CONFIGURED);

  const load = useCallback(async () => {
    if (!IS_SUPABASE_CONFIGURED) return;
    try {
      const res = await paymentApi.getTransactionHistory(1, 50);
      setTransactions(res.data.map(mapApiTransaction));
    } catch {
      // keep whatever we have; the empty state covers no data
    }
  }, []);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'contribution')
      return t.type === 'contribution' || t.type === 'fee' || t.type === 'penalty';
    if (filter === 'distribution') return t.type === 'distribution';
    return true;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return "Aujourd'hui";
    if (days === 1) return 'Hier';
    if (days < 7) return `Il y a ${days} jours`;
    return date.toLocaleDateString('fr-FR', {day: 'numeric', month: 'short'});
  };

  // Tinted icon chip per transaction type (direction-aware)
  const getTransactionVisual = (type: Transaction['type']) => {
    switch (type) {
      case 'distribution':
        return {
          tone: colors.brand.emerald,
          toneSoft: colors.brand.emeraldSoft,
          Icon: ArrowDownIcon,
        };
      case 'penalty':
        return {
          tone: colors.brand.crimson,
          toneSoft: colors.brand.crimsonSoft,
          Icon: AlertIcon,
        };
      case 'fee':
        return {
          tone: colors.text.secondary,
          toneSoft: colors.surface.sunken,
          Icon: CashIcon,
        };
      case 'contribution':
      default:
        return {
          tone: colors.brand.terracotta,
          toneSoft: colors.brand.terracottaSoft,
          Icon: ArrowUpIcon,
        };
    }
  };

  const getStatusColor = (status: Transaction['status']) => {
    switch (status) {
      case 'completed':
        return colors.status.completed;
      case 'pending':
        return colors.status.pending;
      case 'failed':
        return colors.status.failed;
      default:
        return colors.text.secondary;
    }
  };

  const renderTransaction = ({item, index}: {item: Transaction; index: number}) => {
    const visual = getTransactionVisual(item.type);
    const isPositive = item.amount > 0;
    const TxIcon = visual.Icon;

    return (
      <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).springify()}>
        <PressableScale style={s.transactionItem} scaleTo={0.98}>
          <View style={[s.iconChip, {backgroundColor: visual.toneSoft}]}>
            <TxIcon size={22} color={visual.tone} />
          </View>

          <View style={s.transactionContent}>
            <Text style={s.tontineName} numberOfLines={1}>
              {item.tontineName}
            </Text>
            <Text style={s.description} numberOfLines={1}>
              {item.description}
            </Text>
            <Text style={s.date}>{formatDate(item.date)}</Text>
          </View>

          <View style={s.amountContainer}>
            <Text
              style={[
                s.amount,
                {color: isPositive ? colors.brand.emerald : colors.text.primary},
              ]}>
              {isPositive ? '+' : ''}
              {item.amount.toLocaleString('fr-FR')}
            </Text>
            <Text style={s.currency}>{item.currency}</Text>
            <View
              style={[s.statusDot, {backgroundColor: getStatusColor(item.status)}]}
            />
          </View>
        </PressableScale>
      </Animated.View>
    );
  };

  // Calculate totals
  const totalContributed = transactions
    .filter(t => t.type === 'contribution' && t.status === 'completed')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalReceived = transactions
    .filter(t => t.type === 'distribution' && t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);

  const renderHeader = () => (
    <View style={s.headerBlock}>
      {/* Summary tiles */}
      <View style={s.summaryRow}>
        <StatTile
          icon={<ArrowUpIcon size={20} color={colors.brand.terracotta} />}
          value={totalContributed.toLocaleString('fr-FR')}
          label="Total cotise (FCFA)"
          tone={colors.brand.terracotta}
          toneSoft={colors.brand.terracottaSoft}
        />
        <View style={{width: spacing.md}} />
        <StatTile
          icon={<ArrowDownIcon size={20} color={colors.brand.emerald} />}
          value={totalReceived.toLocaleString('fr-FR')}
          label="Total recu (FCFA)"
          tone={colors.brand.emerald}
          toneSoft={colors.brand.emeraldSoft}
        />
      </View>

      {/* Filters */}
      <SegmentedControl
        options={FILTER_OPTIONS}
        value={filter}
        onChange={setFilter}
        style={s.segmented}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={s.container}>
        <ScreenHeader title="Transactions" />
        <LoadingSpinner fullScreen text="Chargement de l'historique…" />
      </View>
    );
  }

  return (
    <View style={s.container}>
      <ScreenHeader title="Transactions" />

      <FlatList
        data={filteredTransactions}
        keyExtractor={item => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.brand.terracotta]}
            tintColor={colors.brand.terracotta}
          />
        }
        ListEmptyComponent={
          <EmptyState
            icon="receipt-text-outline"
            title="Aucune transaction"
            description="Vos cotisations et receptions apparaitront ici."
          />
        }
      />
    </View>
  );
};

const makeStyles = ({colors, shadows}: ThemedTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.base,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: TAB_BAR_SPACE + spacing.lg,
      flexGrow: 1,
    },
    headerBlock: {
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
    },
    summaryRow: {
      flexDirection: 'row',
      marginBottom: spacing.lg,
    },
    segmented: {
      marginBottom: spacing.sm,
    },
    transactionItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: borderRadius.xl,
      backgroundColor: colors.surface.default,
      borderWidth: 1,
      borderColor: colors.border.subtle,
      marginBottom: spacing.sm,
      ...shadows.sm,
      shadowColor: colors.shadowColor,
    },
    iconChip: {
      width: 46,
      height: 46,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    transactionContent: {
      flex: 1,
      marginLeft: spacing.md,
    },
    tontineName: {
      ...typography.bodyMedium,
      fontWeight: '700',
      color: colors.text.primary,
    },
    description: {
      ...typography.caption,
      color: colors.text.secondary,
      marginTop: 2,
    },
    date: {
      ...typography.small,
      color: colors.text.tertiary,
      marginTop: 4,
    },
    amountContainer: {
      alignItems: 'flex-end',
      marginLeft: spacing.sm,
    },
    amount: {
      ...typography.bodyLarge,
      ...tabularNums,
      fontWeight: '700',
    },
    currency: {
      ...typography.small,
      color: colors.text.tertiary,
      marginTop: 2,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 6,
    },
  });

export default TransactionsScreen;
