/**
 * TontinesListScreen — browse "Mes tontines" / "Explorer" with search + filters.
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TextInput,
  ScrollView,
} from 'react-native';
import {StackNavigationProp} from '@react-navigation/stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import {TontineCard} from '@components/tontine';
import {
  LoadingSpinner,
  EmptyState,
  SegmentedControl,
  Chip,
  PressableScale,
} from '@components/common';
import {TAB_BAR_SPACE} from '@components/navigation/CustomTabBar';
import {SearchIcon, FilterIcon, CloseIcon} from '@components/icons';
import {useTheme, useThemedStyles, typography, spacing, borderRadius, type ThemedTokens} from '@theme';
import {TontinesStackParamList} from '@navigation/types';
import {useTontines} from '@hooks';
import {useSelector} from 'react-redux';
import {RootState} from '@store/store';
import {Tontine, TontineCategory, TontineStatus, TontineType} from '@types';

type Nav = StackNavigationProp<TontinesStackParamList, 'TontinesList'>;
interface Props {
  navigation: Nav;
}
type TabType = 'my' | 'explore';

const CATEGORIES: {value: TontineCategory; label: string}[] = [
  {value: TontineCategory.FAMILY, label: 'Famille'},
  {value: TontineCategory.FRIENDS, label: 'Amis'},
  {value: TontineCategory.PROFESSIONAL, label: 'Pro'},
  {value: TontineCategory.COMMUNITY, label: 'Communauté'},
];

const TontinesListScreen: React.FC<Props> = ({navigation}) => {
  const {colors} = useTheme();
  const s = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const {myTontines, publicTontines, isLoading, fetchMyTontines, fetchPublicTontines} = useTontines();
  const {user} = useSelector((state: RootState) => state.auth);

  const [activeTab, setActiveTab] = useState<TabType>('my');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<TontineCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<TontineStatus | null>(null);
  const [selectedType, setSelectedType] = useState<TontineType | null>(null);

  useEffect(() => {
    loadTontines();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const buildFilters = () => ({
    category: selectedCategory || undefined,
    status: selectedStatus || undefined,
    type: selectedType || undefined,
    search: searchQuery || undefined,
  });

  const loadTontines = async () => {
    if (activeTab === 'my' && user?.id) await fetchMyTontines(user.id);
    else if (activeTab === 'explore') await fetchPublicTontines(buildFilters());
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadTontines();
    setRefreshing(false);
  };

  const handleApplyFilters = () => {
    if (activeTab === 'explore') fetchPublicTontines(buildFilters());
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    setSelectedCategory(null);
    setSelectedStatus(null);
    setSelectedType(null);
    setSearchQuery('');
    if (activeTab === 'explore') fetchPublicTontines({});
  };

  const filterTontines = (tontines: Tontine[]): Tontine[] => {
    let filtered = [...tontines];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        t => t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q),
      );
    }
    if (activeTab === 'my' && selectedCategory) filtered = filtered.filter(t => t.category === selectedCategory);
    if (activeTab === 'my' && selectedStatus) filtered = filtered.filter(t => t.status === selectedStatus);
    if (activeTab === 'my' && selectedType) filtered = filtered.filter(t => t.type === selectedType);
    return filtered;
  };

  const tontines = filterTontines(activeTab === 'my' ? myTontines : publicTontines);
  const activeFiltersCount = [selectedCategory, selectedStatus, selectedType].filter(Boolean).length;

  const goCreate = () => (navigation.getParent() as any)?.navigate('Create');

  const Header = (
    <View style={[s.header, {paddingTop: insets.top + spacing.md}]}>
      <View style={s.titleRow}>
        <Text style={s.title}>Tontines</Text>
        <View style={s.headerStats}>
          <View style={s.stat}>
            <Text style={s.statValue}>{myTontines.length}</Text>
            <Text style={s.statLabel}>Actives</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.stat}>
            <Text style={s.statValue}>{publicTontines.length}</Text>
            <Text style={s.statLabel}>Publiques</Text>
          </View>
        </View>
      </View>

      <SegmentedControl
        options={[
          {label: 'Mes tontines', value: 'my'},
          {label: 'Explorer', value: 'explore'},
        ]}
        value={activeTab}
        onChange={v => setActiveTab(v as TabType)}
        style={{marginBottom: spacing.md}}
      />

      <View style={s.searchRow}>
        <View style={s.searchBox}>
          <SearchIcon size={18} color={colors.text.tertiary} />
          <TextInput
            style={s.searchInput}
            placeholder="Rechercher une tontine..."
            placeholderTextColor={colors.text.hint}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <PressableScale onPress={() => setSearchQuery('')}>
              <CloseIcon size={16} color={colors.text.tertiary} />
            </PressableScale>
          )}
        </View>
        <PressableScale
          style={[s.filterBtn, showFilters && {backgroundColor: colors.accent.main}]}
          onPress={() => setShowFilters(v => !v)}>
          <FilterIcon size={18} color={showFilters ? colors.accent.contrast : colors.text.secondary} />
          {activeFiltersCount > 0 && (
            <View style={s.filterCount}>
              <Text style={s.filterCountText}>{activeFiltersCount}</Text>
            </View>
          )}
        </PressableScale>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {CATEGORIES.map(c => (
          <Chip
            key={c.value}
            label={c.label}
            selected={selectedCategory === c.value}
            onPress={() => setSelectedCategory(selectedCategory === c.value ? null : c.value)}
          />
        ))}
      </ScrollView>

      {showFilters && (
        <View style={s.filtersPanel}>
          <Text style={s.filterLabel}>Statut</Text>
          <View style={s.filterWrap}>
            {(['Open', 'Active', 'Completed'] as TontineStatus[]).map(st => (
              <Chip
                key={st}
                label={({Open: 'Ouvert', Active: 'Actif', Completed: 'Terminé'} as any)[st]}
                selected={selectedStatus === st}
                onPress={() => setSelectedStatus(selectedStatus === st ? null : st)}
              />
            ))}
          </View>
          <Text style={[s.filterLabel, {marginTop: spacing.md}]}>Type</Text>
          <View style={s.filterWrap}>
            {(['ROSCA', 'ASCRA', 'Commercial'] as TontineType[]).map(tp => (
              <Chip
                key={tp}
                label={tp}
                selected={selectedType === tp}
                onPress={() => setSelectedType(selectedType === tp ? null : tp)}
              />
            ))}
          </View>
          <View style={s.filterActions}>
            {activeFiltersCount > 0 && (
              <PressableScale onPress={handleClearFilters} style={s.clearBtn}>
                <Text style={s.clearText}>Effacer</Text>
              </PressableScale>
            )}
            <PressableScale onPress={handleApplyFilters} style={s.applyBtn}>
              <Text style={s.applyText}>Appliquer</Text>
            </PressableScale>
          </View>
        </View>
      )}
    </View>
  );

  if (isLoading && tontines.length === 0) {
    return <LoadingSpinner fullScreen text="Chargement des tontines..." />;
  }

  return (
    <View style={s.container}>
      <FlatList
        data={tontines}
        keyExtractor={item => item.id}
        ListHeaderComponent={Header}
        ListEmptyComponent={
          activeTab === 'my' ? (
            <EmptyState
              icon="wallet-plus"
              title="Aucune tontine"
              description="Vous n'avez pas encore de tontine. Créez-en une ou explorez les tontines publiques."
              actionLabel="Créer une tontine"
              onAction={goCreate}
            />
          ) : (
            <EmptyState
              icon="magnify"
              title="Aucun résultat"
              description="Aucune tontine ne correspond à vos critères. Ajustez vos filtres."
            />
          )
        }
        contentContainerStyle={s.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent.main} />
        }
        renderItem={({item}) => (
          <TontineCard
            tontine={item}
            onPress={() => navigation.navigate('TontineDetail', {tontineId: item.id})}
            showProgress={item.status === 'Open'}
          />
        )}
      />
    </View>
  );
};

const makeStyles = ({colors}: ThemedTokens) =>
  StyleSheet.create({
    container: {flex: 1, backgroundColor: colors.bg.base},
    header: {paddingHorizontal: spacing.lg, paddingBottom: spacing.sm},
    titleRow: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg},
    title: {...typography.h1, color: colors.text.primary},
    headerStats: {flexDirection: 'row', alignItems: 'center'},
    stat: {alignItems: 'center'},
    statValue: {...typography.h3, color: colors.accent.main, fontWeight: '800'},
    statLabel: {...typography.small, color: colors.text.secondary},
    statDivider: {width: 1, height: 26, backgroundColor: colors.border.default, marginHorizontal: spacing.md},
    searchRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.md},
    searchBox: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.surface.sunken,
      borderRadius: borderRadius.lg,
      paddingHorizontal: spacing.md,
      height: 48,
    },
    searchInput: {flex: 1, ...typography.body, color: colors.text.primary, padding: 0},
    filterBtn: {
      width: 48,
      height: 48,
      borderRadius: borderRadius.lg,
      backgroundColor: colors.surface.sunken,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterCount: {
      position: 'absolute',
      top: 6,
      right: 6,
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      backgroundColor: colors.error,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    filterCountText: {...typography.small, color: '#FFF', fontSize: 9, fontWeight: '800'},
    chips: {gap: spacing.sm, paddingVertical: 2},
    filtersPanel: {
      backgroundColor: colors.surface.sunken,
      borderRadius: borderRadius.xl,
      padding: spacing.md,
      marginTop: spacing.md,
    },
    filterLabel: {...typography.captionMedium, color: colors.text.primary, fontWeight: '700', marginBottom: spacing.sm},
    filterWrap: {flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm},
    filterActions: {flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: spacing.md, gap: spacing.sm},
    clearBtn: {paddingVertical: spacing.sm, paddingHorizontal: spacing.md},
    clearText: {...typography.captionMedium, color: colors.text.secondary, fontWeight: '600'},
    applyBtn: {backgroundColor: colors.accent.main, paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: borderRadius.full},
    applyText: {...typography.captionMedium, color: colors.accent.contrast, fontWeight: '700'},
    listContent: {paddingHorizontal: spacing.lg, paddingBottom: TAB_BAR_SPACE + spacing.lg},
  });

export default TontinesListScreen;
