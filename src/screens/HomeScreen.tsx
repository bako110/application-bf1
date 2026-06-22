import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Animated, RefreshControl, StatusBar, StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useNavigation, useIsFocused } from '@react-navigation/native';
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
  { label: '7INFOS',        api: '7INFOS' },
  { label: 'D WUUM NEERE',  api: 'D WUUM NEERE' },
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
  const isScreenFocused    = useIsFocused();

  const [refreshing,  setRefreshing]  = useState(false);
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

  // ─── Emission-categories ─────────────────────────────────────────────────
  const { data: sectionCats = [], isLoading: lEmissions, refetch: rCats } = useQuery({
    queryKey:  ['emission-categories'],
    queryFn:   () => api.getEmissions(),
    staleTime: 10 * 60_000,
  });

  // ─── Sections épisodes ────────────────────────────────────────────────────
  const { data: missed,     isLoading: lMissed,   refetch: rMissed   } = useQuery({ queryKey: ['missed'],     queryFn: () => api.getMissed()     });
  const { data: reportages, isLoading: lReport,   refetch: rReport   } = useQuery({ queryKey: ['reportages'], queryFn: () => api.getReportages() });
  const { data: archives,   isLoading: lArchives, refetch: rArchives } = useQuery({ queryKey: ['archive'],    queryFn: () => api.getArchive()    });

  // ─── Entries par section — construites depuis /emission-categories uniquement ─
  const jtMagEntries    = useEmissionSection({ sectionCats, section: 'jtandmag',       orderedCats: JT_CATS       });
  const magazineEntries = useEmissionSection({ sectionCats, section: 'magazine',       orderedCats: MAGAZINE_CATS });
  const divertEntries   = useEmissionSection({ sectionCats, section: 'divertissement', orderedCats: DIVERT_CATS   });
  const teleEntries     = useEmissionSection({ sectionCats, section: 'tele_realite',   orderedCats: TELE_CATS     });
  const sportsEntries   = useEmissionSection({ sectionCats, section: 'sport',          orderedCats: SPORTS_CATS   });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([rMissed(), rReport(), rArchives(), rCats()]);
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
    // Reset dismiss après le scroll pour que le player réapparaisse en hero
    setTimeout(() => setMiniClosed(false), 350);
  }, []);

  const handleScroll = useCallback(
    Animated.event(
      [{ nativeEvent: { contentOffset: { y: scrollY } } }],
      {
        useNativeDriver: false,
        listener: (e: any) => {
          // Reset miniClosed dès qu'on revient tout en haut
          if (e.nativeEvent.contentOffset.y < 10) {
            setMiniClosed(false);
          }
        },
      },
    ),
    [],
  );

  // Fallback : si lEmissions passe à false mais qu'aucune image n'arrive, on débloqueaprès 600ms
  const [emissionForced, setEmissionForced] = useState(false);
  useEffect(() => {
    if (!lEmissions) {
      const t = setTimeout(() => setEmissionForced(true), 600);
      return () => clearTimeout(t);
    }
  }, [lEmissions]);

  const empty        = (d: any)         => !!d && !d.items?.length;
  const emptyEntries = (entries: any[]) => entries.length === 0;
  // Prête = données chargées ET (au moins 1 entry avec image + filter_path OU timeout de sécurité)
  const emissionReady = (entries: any[]) =>
    !lEmissions && (entries.some(e => !!e.image && !!e.filter_path) || emissionForced);

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
          variant="missed"
          onSeeMore={() => navigation.navigate('MissedPage')}
        >
          {missed?.items?.map((item: any) => (
            <MissedCard
              key={item.id}
              title={item.title}
              image={item.thumbnail || item.image_url || item.image || null}
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
          isLoading={!emissionReady(jtMagEntries)}
          isEmpty={!lEmissions && emptyEntries(jtMagEntries)}
          onSeeMore={() => navigation.navigate('JTandMagPage')}
          variant="emission"
        >
          {jtMagEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: e.filter_path,
                heroImage:  e.image_background || e.image,
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
          variant="missed"
          onSeeMore={() => navigation.navigate('ReportagesPage')}
        >
          {reportages?.items?.map((item: any) => (
            <MissedCard
              key={item.id}
              title={item.title}
              image={item.thumbnail || item.image_url || item.image || null}
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
          isLoading={!emissionReady(magazineEntries)}
          isEmpty={!lEmissions && emptyEntries(magazineEntries)}
          onSeeMore={() => navigation.navigate('MagazinePage')}
          variant="emission"
        >
          {magazineEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: e.filter_path,
                heroImage:  e.image_background || e.image,
              })}
            />
          ))}
        </SectionRow>

        {/* ── Divertissement ── */}
        <SectionRow
          title={t.home.divertissement}
          isLoading={!emissionReady(divertEntries)}
          isEmpty={!lEmissions && emptyEntries(divertEntries)}
          onSeeMore={() => navigation.navigate('DivertissementPage')}
          variant="emission"
        >
          {divertEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: e.filter_path,
                heroImage:  e.image_background || e.image,
              })}
            />
          ))}
        </SectionRow>

        {/* ── Télé réalité ── */}
        <SectionRow
          title={t.home.teleRealite}
          isLoading={!emissionReady(teleEntries)}
          isEmpty={!lEmissions && emptyEntries(teleEntries)}
          onSeeMore={() => navigation.navigate('TeleRealitePage')}
          variant="emission"
        >
          {teleEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: e.filter_path,
                heroImage:  e.image_background || e.image,
              })}
            />
          ))}
        </SectionRow>

        {/* ── Sports ── */}
        <SectionRow
          title={t.home.sports}
          isLoading={!emissionReady(sportsEntries)}
          isEmpty={!lEmissions && emptyEntries(sportsEntries)}
          onSeeMore={() => navigation.navigate('SportsPage')}
          variant="emission"
        >
          {sportsEntries.map(e => (
            <EmissionCard
              key={e.apiName}
              name={e.label}
              image={e.image}
              count={e.count}
              onPress={() => navigation.navigate('EmissionCategory', {
                name:       e.label,
                filterPath: e.filter_path,
                heroImage:  e.image_background || e.image,
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
          variant="content"
        >
          {archives?.items?.map((item: any) => {
            const locked = !canAccess(item.subscription);
            return (
              <ContentCard
                key={item.id}
                title={item.title}
                image={item.thumbnail || item.image_url || item.image || null}
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
        scrollY={scrollY}
        miniDismissed={miniClosed}
        onDismiss={() => setMiniClosed(true)}
        onExpand={scrollToHero}
        placeholderRef={placeholderRef}
        isScreenFocused={isScreenFocused}
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
