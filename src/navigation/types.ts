import type { NavigatorScreenParams } from '@react-navigation/native';

// ─── Tab params ──────────────────────────────────────────────────────────────
export type HomeTabParams   = NavigatorScreenParams<HomeStackParams>;
export type EmissionsTabParams = NavigatorScreenParams<EmissionsStackParams>;

export type RootTabParams = {
  HomeTab:      HomeTabParams;
  EmissionsTab: EmissionsTabParams;
  LiveTab:      undefined;
  ReelsTab:     undefined;
  ProfileTab:   NavigatorScreenParams<ProfileStackParams>;
};

// ─── Home stack ──────────────────────────────────────────────────────────────
export type HomeStackParams = {
  Home:            undefined;
  ShowDetail:      { id: number | string; type?: string };
  NewsDetail:      { id: number | string };
  NewsPage:        undefined;
  MissedPage:      undefined;
  JTandMagPage:    undefined;
  MagazinePage:    undefined;
  SportsPage:      undefined;
  DivertissementPage: undefined;
  ReportagesPage:  undefined;
  ArchivePage:     undefined;
  TeleRealitePage: undefined;
  EmissionCategory: { name: string; filterPath?: string; categoryId?: number | string; heroImage?: string };
  Programs:        undefined;
  Search:          undefined;
};

// ─── Emissions stack ─────────────────────────────────────────────────────────
export type EmissionsStackParams = {
  Emissions:        undefined;
  EmissionDetail:   { id: number | string; name?: string };
  EmissionCategory: { name: string; filterPath?: string; categoryId?: number | string; heroImage?: string };
  ShowDetail:       { id: number | string; type?: string };
};

// ─── Profile stack ───────────────────────────────────────────────────────────
export type ProfileStackParams = {
  Profile:        undefined;
  Favorites:      undefined;
  Notifications:  undefined;
  Settings:       undefined;
  Support:        undefined;
  About:          undefined;
  Login:          { redirect?: string };
  Register:       undefined;
  ForgotPassword: undefined;
  ShowDetail:     { id: number | string; type?: string };
};
