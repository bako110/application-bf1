import React, { useCallback, useRef, useState } from 'react';
import {
  View, Animated, RefreshControl, StatusBar, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme } from '../hooks/useTheme';
import { useTranslation } from '../hooks/useTranslation';
import { useAuthStore } from '../stores';
import { useFavorites } from '../hooks/useFavorites';
import { SectionRow } from '../components/layout/SectionRow';
import { ContentCard } from '../components/ui/ContentCard';
import { MissedCard } from '../components/ui/MissedCard';
import { EmissionCard } from '../components/ui/EmissionCard';
import { Toast } from '../components/ui/Toast';
import { HomeHeader } from '../components/home/HomeHeader';
import { LivePlaceholder, LiveWebView, HERO_HEIGHT } from '../components/home/LivePlayer';
import * as api from '../services/api';
import { useEmissionSection } from '../hooks/useEmissionSection';
import { PremiumModal } from '../components/profile/PremiumModal';
import { COLORS } from '../constants';
import type { HomeStackParams } from '../navigation/types';

type Nav = StackNavigationProp<HomeStackParams, 'Home'>;

const HEADER_H = 70;

const JT_CATS = [
  { label: 'Le 13H',        api: 'LE 13H' },
  { label: 'Le 19h30',      api: 'LE 19H30' },
  { label: 'Kibaye Wakato', api: 'Kibaye Wakato' },
  { label: 'Le 7Infos',     api: '7INFOS' },
  { label: 'Edwum Nere',    api: 'D WUUM NEERE' },
];

const MAGAZINE_CATS = [
  { label: 'Surface de vérité',    api: 'Surface de vérité ' },
  { label: 'Leçons de vie',        api: 'Leçons de vie' },
  { label: 'Au-delà de l\'écorce', api: 'Au-delà de l\'écorce' },
  { label: 'Le Loft',              api: 'Le Loft' },
  { label: 'Émission spéciale',    api: 'Émission spéciale' },
];

const DIVERT_CATS = [
  { label: 'La Télé s\'amuz', api: 'LA TÉLÉ S\'AMUZ' },
  { label: 'Reem Wakato',     api: 'REEM WAKATO ' },
  { label: 'BF1 Showtimes',   api: 'BF1 SHOWTIMES' },
];

const SPORTS_CATS = [
  { label: 'Sport Time',       api: 'SPORT TIME' },
  { label: 'Au cœur du sport', api: 'AU CŒUR DU SPORT' },
];

const TELE_CATS = [
  { label: 'Pépites d\'entreprises',  api: 'PÉPITES D\'ENTREPRISES' },
  { label: 'Bâtisseurs de cités',     api: 'BATISSEURS DE CITÉS' },
  { label: 'Marathon des Échangeurs', api: 'MARATHON DES ÉCHANGEURS' },
];

export function HomeScreen() {
  const { theme, isDark }  = useTheme();
  const { t }              = useTranslation();
  const navigation         = useNavigation<Nav>();
  const { canAccess }      = useAuthStore();
  const insets             = useSafeAreaInsets();
  const { isFav, toggleFav } = useFavorites();

  const [refreshing,  setRefreshing]  = useState(false);
  const [miniVisible, setMiniVisible] = useState(false);
  const [miniClosed,  setMiniClosed]  = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [premiumCat,  setPremiumCat]  = useState<string | null>(null);

  const scrollY        = useRef(new Animated.Value(0)).current;
  const scrollViewRef  = useRef<any>(null);
  const placeholderRef = useRef<View>(null);

  // ─── Live ─────────────────────────────────────────────────────────────────
  const { data: liveData } = useQuery({
    queryKey:        ['live-status'],
    queryFn:         () => api.getLive(),
    refetchInterval: 30_000,
    staleTime:       20_000,
  });
  const isOnAir = !!liveData?.is_live;

  // ─── Emission-categories (images admin) ───────────────────────────────────
  const { data: sectionCats = [] } = useQuery({
    queryKey:  ['emission-categories'],
    queryFn:   () => api.getEmissions(),
    staleTime: 10 * 60_000,
  });

  // ─── Sections épisodes ────────────────────────────────────────────────────
  const { data: missed,      isLoading: lMissed,   refetch: rMissed   } = useQuery({ queryKey: ['missed'],        queryFn: () => api.getMissed()               });
  const { data: reportages,  isLoading: lReport,   refetch: rReport   } = useQuery({ queryKey: ['reportages'],    queryFn: () => api.getReportages()           });
  const { data: archives,    isLoading: lArchives, refetch: rArchives } = useQuery({ queryKey: ['archive'],       queryFn: () => api.getArchive()              });
  const { data: jtMag,       isLoading: lJT,       refetch: rJT       } = useQuery({ queryKey: ['jtandmag-home'], queryFn: () => api.getJTandMag(0, 100)       });
  const { data: magazine,    isLoading: lMag,      refetch: rMag      } = useQuery({ queryKey: ['magazine-home'], queryFn: () => api.getMagazine(0, 100)       });
  const { data: divert,      isLoading: lDivert,   refetch: rDivert   } = useQuery({ queryKey: ['divert-home'],   queryFn: () => api.getDivertissement(0, 100) });
  const { data: teleRealite, isLoading: lTele,     refetch: rTele     } = useQuery({ queryKey: ['tele-home'],     queryFn: () => api.getTeleRealite(0, 100)    });
  const { data: sports,      isLoading: lSports,   refetch: rSports   } = useQuery({ queryKey: ['sports-home'],   queryFn: () => api.getSports(0, 100)         });

  // ─── Entries par section ──────────────────────────────────────────────────
  const jtMagEntries    = useEmissionSection({ items: jtMag?.items,       sectionCats, section: 'jtandmag',       orderedCats: JT_CATS,       fetchFn: api.getJTandMag       });
  const magazineEntries = useEmissionSection({ items: magazine?.items,    sectionCats, section: 'magazine',       orderedCats: MAGAZINE_CATS, fetchFn: api.getMagazine       });
  const divertEntries   = useEmissionSection({ items: divert?.items,      sectionCats, section: 'divertissement', orderedCats: DIVERT_CATS,   fetchFn: api.getDivertissement });
  const teleEntries     = useEmissionSection({ items: teleRealite?.items, sectionCats, section: 'tele_realite',   orderedCats: TELE_CATS,     fetchFn: api.getTeleRealite    });
  const sportsEntries   = useEmissionSection({ items: sports?.items,      sectionCats, section: 'sport',          orderedCats: SPORTS_CATS,   fetchFn: api.getSports         });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([rMissed(), rReport(), rArchives(), rJT(), rMag(), rDivert(), rTele(), rSports()]);
    setRefreshing(false);
  }, []);

  const goDetail = useCallback((item: any, sectionType?: string) =>
    navigation.navigate('ShowDetail', { id: item.id, type: item.type ?? sectionType }), [navigation]);

  const openPaywall = useCallback((subscription?: string | null) => {
    setPremiumCat(subscription ?? null);
    setPremiumOpen(true);
  }, []);

  const scrollToHero = useCallback(() => {
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    setMiniClosed(false);
    setMiniVisible(false);
  }, []);

  const handleScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
        useNativeDriver: true,
        listener: (e: any) => {
          const y   = e.nativeEvent.contentOffset.y;
          const out = y > HERO_HEIGHT - 20;
          setMiniVisible(out);
          if (!out) setMiniClosed(false);
        },
      },
    ),
    [],
  );

  const empty        = (d: any)         => !!d && !d.items?.length;
  const emptyEntries = (entries: any[]) => entries.length === 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar
        translucent
        backgroundColor="transparent"
        barStyle={isDark ? 'light-content' : 'dark-content'}
      />

      <Animated.ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
            progressViewOffset={insets.top + HEADER_H}
          />
        }
        contentContainerStyle={{ paddingTop: insets.top + HEADER_H, paddingBottom: 20 }}
      >
        <LivePlaceholder ref={placeholderRef} isOnAir={isOnAir} />

        {/* ── Vous l'avez raté ── */}
        <SectionRow
          title={t.home.missed}
          isLoading={lMissed}
          isEmpty={empty(missed)}
          landscape
          onSeeMore={() => navigation.navigate('MissedPage')}
        >
          {missed?.items?.map((item: any) => (
            <MissedCard
              key={item.id}
              title={item.title}
              image={item.thumbnail || item.image_url || item.image}
              category={item.category || item.edition || 'BF1'}
              duration={item.duration_minutes ?? item.duration}
              views={item.views}
              date={item.aired_at || item.created_at || item.published_at}
              onPress={() => goDetail(item, 'missed')}
              isFavorited={isFav(item.id)}
              onToggleFav={() => toggleFav(item.id, 'missed')}
            />
          ))}
        </SectionRow>

        {/* ── JT & Magazines ── */}
        <SectionRow
          title={t.home.jtMag}
          isLoading={lJT}
          isEmpty={!lJT && emptyEntries(jtMagEntries)}
          onSeeMore={() => navigation.navigate('JTandMagPage')}
        >
          {jtMagEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: `/jtandmag?category=${encodeURIComponent(e.apiName)}`,
              })}
            />
          ))}
        </SectionRow>

        {/* ── Reportages ── */}
        <SectionRow
          title={t.home.reportages}
          isLoading={lReport}
          isEmpty={empty(reportages)}
          landscape
          onSeeMore={() => navigation.navigate('ReportagesPage')}
        >
          {reportages?.items?.map((item: any) => (
            <MissedCard
              key={item.id}
              title={item.title}
              image={item.thumbnail || item.image_url || item.image}
              category={item.category || item.emission_name || 'Reportage'}
              duration={item.duration_minutes ?? item.duration}
              views={item.views}
              date={item.aired_at || item.created_at}
              onPress={() => goDetail(item, 'reportage')}
              isFavorited={isFav(item.id)}
              onToggleFav={() => toggleFav(item.id, 'reportage')}
            />
          ))}
        </SectionRow>

        {/* ── Magazine ── */}
        <SectionRow
          title={t.home.magazine}
          isLoading={lMag}
          isEmpty={!lMag && emptyEntries(magazineEntries)}
          onSeeMore={() => navigation.navigate('MagazinePage')}
        >
          {magazineEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: `/magazine?category=${encodeURIComponent(e.apiName)}`,
              })}
            />
          ))}
        </SectionRow>

        {/* ── Divertissement ── */}
        <SectionRow
          title={t.home.divertissement}
          isLoading={lDivert}
          isEmpty={!lDivert && emptyEntries(divertEntries)}
          onSeeMore={() => navigation.navigate('DivertissementPage')}
        >
          {divertEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: `/divertissement?category=${encodeURIComponent(e.apiName)}`,
              })}
            />
          ))}
        </SectionRow>

        {/* ── Télé réalité ── */}
        <SectionRow
          title={t.home.teleRealite}
          isLoading={lTele}
          isEmpty={!lTele && emptyEntries(teleEntries)}
          onSeeMore={() => navigation.navigate('TeleRealitePage')}
        >
          {teleEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: `/tele-realite?category=${encodeURIComponent(e.apiName)}`,
              })}
            />
          ))}
        </SectionRow>

        {/* ── Sports ── */}
        <SectionRow
          title={t.home.sports}
          isLoading={lSports}
          isEmpty={!lSports && emptyEntries(sportsEntries)}
          onSeeMore={() => navigation.navigate('SportsPage')}
        >
          {sportsEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: `/sports?category=${encodeURIComponent(e.apiName)}`,
              })}
            />
          ))}
        </SectionRow>

        {/* ── Archives ── */}
        <SectionRow
          title={t.home.archives}
          isLoading={lArchives}
          isEmpty={empty(archives)}
          onSeeMore={() => navigation.navigate('ArchivePage')}
        >
          {archives?.items?.map((item: any) => {
            const locked = !canAccess(item.subscription);
            return (
              <ContentCard
                key={item.id}
                title={item.title}
                image={item.thumbnail || item.image}
                duration={item.duration_minutes ?? item.duration}
                date={item.created_at}
                subscription={item.subscription}
                isLocked={locked}
                onPress={locked ? () => openPaywall(item.subscription) : () => goDetail(item, 'archive')}
                isFavorited={isFav(item.id)}
                onToggleFav={() => toggleFav(item.id, 'archive')}
              />
            );
          })}
        </SectionRow>
      </Animated.ScrollView>

      <HomeHeader
        onSearchPress={() => navigation.navigate('Search')}
        scrollY={scrollY}
        onProfileTabPress={(screen?: string) => {
          const tabNav = navigation.getParent<any>();
          tabNav?.navigate('ProfileTab', screen ? { screen, params: {} } : undefined);
        }}
      />

      <LiveWebView
        liveData={liveData}
        isOnAir={isOnAir}
        heroOut={miniVisible}
        miniDismissed={miniClosed}
        onDismiss={() => setMiniClosed(true)}
        onExpand={scrollToHero}
        placeholderRef={placeholderRef}
      />

      <Toast />

      <PremiumModal
        visible={premiumOpen}
        onClose={() => setPremiumOpen(false)}
        requiredCategory={premiumCat}
        onSuccess={() => setPremiumOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
