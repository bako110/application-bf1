/**
 * PremiumModal — bottom sheet 3 étapes (miroir de premiumModal.js)
 * Étape 1 : choix du plan (onglets Basic / Standard / Premium)
 * Étape 2 : méthode de paiement
 * Étape 3 : détails + confirmation
 * Étape 4 : succès
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Animated,
  ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../stores';
import * as api from '../../services/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants';

// ─── Constantes ───────────────────────────────────────────────────────────────

const CAT_STYLE: Record<string, { hex: string; bg: string }> = {
  basic:    { hex: '#3B82F6', bg: 'rgba(59,130,246,0.12)'  },
  standard: { hex: '#22C55E', bg: 'rgba(34,197,94,0.12)'   },
  premium:  { hex: '#EAB308', bg: 'rgba(234,179,8,0.12)'   },
};

function getCatLabels(t: any): Record<string, string> {
  return {
    basic:    t.subscription.basic,
    standard: t.subscription.standard,
    premium:  t.subscription.premium,
  };
}

function featsByCategory(cat: string, months: number, t: any): string[] {
  const map: Record<string, string[]> = {
    basic:    [t.subscription.featBasic1, t.subscription.featBasic2, t.subscription.featBasic3],
    standard: [t.subscription.featStd1, t.subscription.featStd2, t.subscription.featStd3, t.subscription.featStd4],
    premium:  [t.subscription.featPrem1, t.subscription.featPrem2, t.subscription.featPrem3, t.subscription.featPrem4, t.subscription.featPrem5],
  };
  const base = [...(map[cat] ?? map.basic)];
  if (months >= 3)  base.push(t.subscription.featPriority);
  if (months >= 12) base.push(t.subscription.featBestYear);
  return base;
}

function fmtPrice(n: number) {
  return Math.round(n).toLocaleString('fr-FR');
}

function catOf(plan: any): string {
  if (plan.category && ['basic','standard','premium'].includes(plan.category)) return plan.category;
  const s = (plan.code || plan.name || '').toLowerCase();
  if (s.includes('premium'))  return 'premium';
  if (s.includes('standard')) return 'standard';
  return 'basic';
}

function badgeOf(months: number, t: any): { label: string; color: string } | null {
  if (months >= 12) return { label: t.subscription.badgeBest,    color: '#EAB308' };
  if (months >= 3)  return { label: t.subscription.badgePopular, color: '#22C55E' };
  return null;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4;

interface EnrichedPlan {
  id: any; name: string; code: string; category: string;
  price: number; origPrice: number | null;
  duration_months: number; currency: string;
  features: string[]; badge: { label: string; color: string } | null;
  promo: { pct: number; eco: number } | null;
  isInCountry: boolean; multiplier: number;
}

interface Props {
  visible:           boolean;
  onClose:           () => void;
  requiredCategory?: string | null;
  onSuccess?:        (plan: any) => void;
}

// ─── Indicateur d'étapes ──────────────────────────────────────────────────────

function StepDots({ step }: { step: Step }) {
  return (
    <View style={sd.row}>
      {([1, 2, 3] as const).map((n, i) => {
        const active = n <= step && step < 4;
        const done   = n < step && step < 4;
        return (
          <React.Fragment key={n}>
            <View style={[sd.dot, active ? sd.dotActive : done ? sd.dotDone : sd.dotInactive]}>
              {done
                ? <Icon name="checkmark" size={12} color="#fff" />
                : <Text style={[sd.dotNum, active ? sd.dotNumActive : sd.dotNumInactive]}>{n}</Text>}
            </View>
            {i < 2 && (
              <View style={[sd.line, n < step && step < 4 ? sd.lineActive : sd.lineInactive]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const sd = StyleSheet.create({
  row:           { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  dot:           { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  dotActive:     { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dotDone:       { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  dotInactive:   { backgroundColor: 'transparent', borderColor: '#444' },
  dotNum:        { fontSize: 12, fontWeight: FONT_WEIGHT.bold },
  dotNumActive:  { color: '#fff' },
  dotNumInactive:{ color: '#666' },
  line:          { width: 32, height: 2, marginHorizontal: 2 },
  lineActive:    { backgroundColor: COLORS.primary },
  lineInactive:  { backgroundColor: '#333' },
});

// ─── Carte plan ───────────────────────────────────────────────────────────────

function PlanCard({ plan, onSelect, theme, t }: { plan: EnrichedPlan; onSelect: () => void; theme: any; t: any }) {
  const cs      = CAT_STYLE[plan.category] ?? CAT_STYLE.basic;
  const months  = plan.duration_months;
  const perMonth = months > 1 ? fmtPrice(plan.price / months) : null;

  return (
    <View style={[pc.card, { borderColor: plan.promo ? cs.hex : `${cs.hex}44` }]}>
      {plan.badge && (
        <View style={[pc.badge, { backgroundColor: plan.badge.color }]}>
          <Text style={pc.badgeText}>{plan.badge.label.toUpperCase()}</Text>
        </View>
      )}

      {/* Header */}
      <View style={pc.header}>
        <View style={[pc.iconWrap, { backgroundColor: cs.bg, borderColor: `${cs.hex}55` }]}>
          <Icon name="star" size={14} color={cs.hex} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[pc.name, { color: theme.text }]}>{plan.name || plan.code}</Text>
          <Text style={[pc.dur, { color: theme.text3 }]}>{months} {t.subscription.monthsAccess}</Text>
        </View>
        {plan.promo && (
          <View style={pc.promoBadge}>
            <Text style={pc.promoText}>−{plan.promo.pct}%</Text>
          </View>
        )}
      </View>

      {/* Prix */}
      <View style={[pc.priceBox, { backgroundColor: cs.bg }]}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 4, flexWrap: 'wrap' }}>
          {plan.origPrice != null && (
            <Text style={pc.origPrice}>{fmtPrice(plan.origPrice)} FCFA</Text>
          )}
          <Text style={[pc.price, { color: cs.hex }]}>{fmtPrice(plan.price)}</Text>
          <Text style={[pc.priceSuffix, { color: theme.text3 }]}>FCFA / {months} {t.subscription.monthsAccess}</Text>
        </View>
        {perMonth && (
          <View style={pc.perMonthRow}>
            <Text style={[pc.perMonth, { color: theme.text3 }]}>
              {t.subscription.perMonth.replace('{price}', perMonth)}
            </Text>
            {plan.promo && (
              <Text style={pc.eco}>{t.subscription.savings.replace('{amount}', fmtPrice(plan.promo.eco))}</Text>
            )}
          </View>
        )}
      </View>

      {/* Features */}
      <View style={{ marginBottom: 14 }}>
        {plan.features.map(f => (
          <View key={f} style={pc.featureRow}>
            <Icon name="checkmark-circle" size={13} color={cs.hex} />
            <Text style={[pc.featureText, { color: theme.text2 }]}>{f}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[pc.btn, { backgroundColor: cs.hex }]} onPress={onSelect} activeOpacity={0.85}>
        <Text style={pc.btnText}>{t.subscription.choosePlan}</Text>
        <Icon name="arrow-forward" size={14} color="#000" />
      </TouchableOpacity>
    </View>
  );
}

const pc = StyleSheet.create({
  card:       { borderWidth: 1.5, borderRadius: 18, padding: 18, marginBottom: 14, position: 'relative' },
  badge:      { position: 'absolute', top: -1, right: 18, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText:  { color: '#000', fontSize: 9, fontWeight: FONT_WEIGHT.extrabold, letterSpacing: 0.5 },
  header:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  iconWrap:   { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  name:       { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  dur:        { fontSize: FONT_SIZE.xxs },
  promoBadge: { borderRadius: 16, paddingHorizontal: 8, paddingVertical: 3, backgroundColor: 'rgba(226,62,62,0.14)', borderWidth: 1, borderColor: 'rgba(226,62,62,0.3)' },
  promoText:  { color: COLORS.primary, fontSize: 13, fontWeight: FONT_WEIGHT.bold },
  priceBox:   { borderRadius: 12, padding: 12, marginBottom: 14 },
  origPrice:  { fontSize: 13, color: '#666', textDecorationLine: 'line-through' },
  price:      { fontSize: 30, fontWeight: FONT_WEIGHT.bold, lineHeight: 34 },
  priceSuffix:{ fontSize: 12 },
  perMonthRow:{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  perMonth:   { fontSize: 12 },
  eco:        { fontSize: 11, fontWeight: FONT_WEIGHT.bold, color: '#22C55E' },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  featureText:{ fontSize: FONT_SIZE.sm },
  btn:        { borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  btnText:    { color: '#000', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
});

// ─── Modal principal ──────────────────────────────────────────────────────────

export function PremiumModal({ visible, onClose, requiredCategory = null, onSuccess }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const { user, isAuthenticated, setUser } = useAuthStore() as any;

  const [step,          setStep]          = useState<Step>(1);
  const [plans,         setPlans]         = useState<EnrichedPlan[]>([]);
  const [activeTab,     setActiveTab]     = useState<string>('basic');
  const [selectedPlan,  setSelectedPlan]  = useState<EnrichedPlan | null>(null);
  const [payMethod,     setPayMethod]     = useState<'orange'|'moov'|'card'|null>(null);
  const [loading,       setLoading]       = useState(false);
  const [error,         setError]         = useState('');
  const [isInCountry,   setIsInCountry]   = useState(true);
  const [multiplier,    setMultiplier]    = useState(1);

  // Formulaire
  const [phone,    setPhone]    = useState('');
  const [otp,      setOtp]      = useState('');
  const [cardNum,  setCardNum]  = useState('');
  const [expiry,   setExpiry]   = useState('');
  const [cvv,      setCvv]      = useState('');
  const [cardName, setCardName] = useState('');

  const slideAnim = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setStep(1); setError(''); setSelectedPlan(null); setPayMethod(null);
      setPhone(''); setOtp(''); setCardNum(''); setExpiry(''); setCvv(''); setCardName('');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
      loadPlans();
    } else {
      Animated.timing(slideAnim, { toValue: 600, duration: 280, useNativeDriver: true }).start();
    }
  }, [visible]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const [rawPlans, geoRes] = await Promise.all([
        api.getSubscriptionPlans(),
        (() => {
          const ctrl = new AbortController();
          const tid  = setTimeout(() => ctrl.abort(), 3000);
          return fetch('https://ipapi.co/json/', { signal: ctrl.signal })
            .then(r => r.json())
            .finally(() => clearTimeout(tid))
            .catch(() => ({ country_code: 'BF' }));
        })(),
      ]);
      const inBF = geoRes.country_code === 'BF';
      const mult = inBF ? 1 : 2;
      setIsInCountry(inBF);
      setMultiplier(mult);

      const enriched: EnrichedPlan[] = (Array.isArray(rawPlans) ? rawPlans : []).map((p: any) => {
        const cat    = catOf(p);
        const months = p.duration_months || 1;
        const pc2    = (p.price_cents || 0) / 100 * mult;
        const origPc = p.original_price_cents ? (p.original_price_cents / 100 * mult) : null;
        const hasPromo = origPc != null && origPc > pc2;
        return {
          id: p.id, name: p.name || p.code, code: p.code, category: cat,
          price:    pc2,
          origPrice: hasPromo ? origPc : null,
          duration_months: months, currency: 'FCFA',
          features: featsByCategory(cat, months, t),
          badge:    badgeOf(months, t),
          promo:    hasPromo ? { pct: Math.round(((origPc! - pc2) / origPc!) * 100), eco: origPc! - pc2 } : null,
          isInCountry: inBF, multiplier: mult,
        };
      });

      setPlans(enriched);
      const cats = ['basic','standard','premium'].filter(c => enriched.some(p => p.category === c));
      const defaultTab = requiredCategory && cats.includes(requiredCategory) ? requiredCategory : (cats[0] ?? 'basic');
      setActiveTab(defaultTab);
    } catch {
      setError(t.subscription.loadError);
    } finally {
      setLoading(false);
    }
  }, [requiredCategory, t]);

  const plansByTab = plans.filter(p => p.category === activeTab);
  const availableTabs = ['basic','standard','premium'].filter(c => plans.some(p => p.category === c));
  const catLabels = getCatLabels(t);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectPlan = useCallback((plan: EnrichedPlan) => {
    setSelectedPlan(plan); setError(''); setStep(2);
  }, []);

  const handleSelectMethod = useCallback((m: 'orange'|'moov'|'card') => {
    setPayMethod(m); setError(''); setStep(3);
  }, []);

  const handleBack = useCallback(() => {
    if (step === 3) { setPayMethod(null); setStep(2); }
    else if (step === 2) { setSelectedPlan(null); setStep(1); }
  }, [step]);

  const handleSubmit = useCallback(async () => {
    setError('');
    if (!selectedPlan || !payMethod) return;

    // Validation
    if (payMethod === 'orange' || payMethod === 'moov') {
      if (!phone || phone.replace(/\s/g,'').length < 8) { setError(t.subscription.errPhone); return; }
      if (!otp   || otp.length < 4)                     { setError(t.subscription.errOtp); return; }
    } else {
      if (!cardNum || cardNum.replace(/\s/g,'').length < 16) { setError(t.subscription.errCard); return; }
      if (!expiry  || !/^\d{2}\/\d{2}$/.test(expiry))       { setError(t.subscription.errExpiry); return; }
      if (!cvv     || cvv.length < 3)                        { setError(t.subscription.errCvv); return; }
      if (!cardName)                                          { setError(t.subscription.errHolder); return; }
    }

    setLoading(true);
    try {
      const now = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + (selectedPlan.duration_months || 1));
      const txId = `${payMethod.toUpperCase()}-${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

      const paymentDetails = payMethod === 'card'
        ? { method: payMethod, cardNumber: cardNum.replace(/\s/g,''), cardExpiry: expiry, cardCvv: cvv, cardName }
        : { method: payMethod, phoneNumber: phone.replace(/\s/g,''), otp };

      await api.createSubscription({
        user_id:          user?.id,
        plan_id:          selectedPlan.id,
        start_date:       now.toISOString(),
        end_date:         end.toISOString(),
        is_active:        true,
        payment_method:   payMethod,
        transaction_id:   txId,
        offer:            selectedPlan.code,
        is_in_country:    selectedPlan.isInCountry,
        price_multiplier: selectedPlan.multiplier,
        final_price:      Math.round(selectedPlan.price),
        payment_details:  paymentDetails,
      });

      // Refresh user pour mettre à jour is_premium
      const updated = await api.refreshUser();
      if (setUser && updated) setUser(updated);

      setStep(4);
      onSuccess?.(selectedPlan);
    } catch (e: any) {
      setError(e?.message || e?.detail || t.subscription.payError);
    } finally {
      setLoading(false);
    }
  }, [selectedPlan, payMethod, phone, otp, cardNum, expiry, cvv, cardName, user, setUser, onSuccess, t]);

  // ── Rendu step 1 ─────────────────────────────────────────────────────────────

  const renderStep1 = () => {
    if (!isAuthenticated) {
      return (
        <View style={[s.authBox, { borderColor: COLORS.primary }]}>
          <Icon name="lock-closed" size={40} color={COLORS.primary} />
          <Text style={[s.authTitle, { color: theme.text }]}>{t.subscription.loginRequired}</Text>
          <Text style={[s.authSub,   { color: theme.text3 }]}>{t.subscription.loginRequiredSub}</Text>
          <TouchableOpacity style={s.authBtn} onPress={onClose} activeOpacity={0.85}>
            <Icon name="log-in-outline" size={16} color="#fff" />
            <Text style={s.authBtnText}>{t.auth.login}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (loading) {
      return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
    }

    if (error && plans.length === 0) {
      return (
        <View style={s.center}>
          <Icon name="alert-circle-outline" size={40} color={COLORS.primary} />
          <Text style={[s.errText, { color: theme.text2 }]}>{error}</Text>
          <TouchableOpacity onPress={loadPlans} style={s.retryBtn}>
            <Text style={{ color: COLORS.primary, fontWeight: FONT_WEIGHT.semibold }}>{t.common.retry}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {!isInCountry && (
          <View style={[s.geoBanner, { backgroundColor: theme.surface }]}>
            <Icon name="location-outline" size={14} color={COLORS.primary} />
            <Text style={[s.geoText, { color: theme.text3 }]}>
              {t.subscription.internationalRate.replace('{mult}', String(multiplier))}
            </Text>
          </View>
        )}

        {/* Onglets */}
        {!requiredCategory && availableTabs.length > 1 && (
          <View style={s.tabs}>
            {availableTabs.map(c => {
              const cs     = CAT_STYLE[c] ?? CAT_STYLE.basic;
              const active = c === activeTab;
              return (
                <TouchableOpacity
                  key={c}
                  style={[s.tab, { backgroundColor: active ? cs.hex : theme.surface, borderColor: active ? cs.hex : theme.border }]}
                  onPress={() => setActiveTab(c)}
                  activeOpacity={0.75}
                >
                  <Text style={[s.tabText, { color: active ? '#000' : theme.text3 }]}>{catLabels[c]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Plans */}
        {plansByTab.length === 0
          ? <View style={s.center}><Text style={{ color: theme.text3, fontSize: FONT_SIZE.sm }}>{t.subscription.noPlans}</Text></View>
          : plansByTab.map(p => (
              <PlanCard key={p.id} plan={p} onSelect={() => handleSelectPlan(p)} theme={theme} t={t} />
            ))
        }

        <Text style={[s.noEngage, { color: theme.text3 }]}>{t.subscription.noCommitment}</Text>
      </>
    );
  };

  // ── Rendu step 2 ─────────────────────────────────────────────────────────────

  const renderStep2 = () => {
    if (!selectedPlan) return null;
    const PayRow = ({ method, icon, color, name, desc }: any) => (
      <TouchableOpacity
        style={[s.payRow, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => handleSelectMethod(method)}
        activeOpacity={0.8}
      >
        <View style={[s.payIcon, { backgroundColor: `${color}18`, borderColor: `${color}33` }]}>
          <Icon name={icon} size={22} color={color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.payName, { color: theme.text }]}>{name}</Text>
          <Text style={[s.payDesc, { color: theme.text3 }]}>{desc}</Text>
        </View>
        <Icon name="chevron-forward" size={16} color={theme.text3} />
      </TouchableOpacity>
    );
    return (
      <>
        <PlanSummary plan={selectedPlan} theme={theme} t={t} />
        <PayRow method="orange" icon="phone-portrait-outline" color="#FF6600" name={t.subscription.orangeMoney} desc={t.subscription.orangeDesc} />
        <PayRow method="moov"   icon="phone-portrait-outline" color="#0066CC" name={t.subscription.moovMoney}   desc={t.subscription.moovDesc}   />
        <PayRow method="card"   icon="card-outline"           color={COLORS.primary} name={t.subscription.bankCard} desc={t.subscription.bankCardDesc} />
      </>
    );
  };

  // ── Rendu step 3 ─────────────────────────────────────────────────────────────

  const renderStep3 = () => {
    if (!selectedPlan || !payMethod) return null;
    const methodLabel = payMethod === 'orange' ? t.subscription.orangeMoney
                      : payMethod === 'moov'   ? t.subscription.moovMoney
                      : t.subscription.bankCard;
    const ussd = payMethod === 'orange' ? '*144*4*6*montant*code#' : '*555*6#';

    const Field = ({ label: lbl, value, onChange, placeholder, keyboardType, maxLength, secureTextEntry }: any) => (
      <View style={{ marginBottom: 14 }}>
        <Text style={[s.fieldLabel, { color: theme.text3 }]}>{lbl.toUpperCase()}</Text>
        <TextInput
          style={[s.field, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
          value={value} onChangeText={onChange} placeholder={placeholder}
          placeholderTextColor={theme.text3} keyboardType={keyboardType ?? 'default'}
          maxLength={maxLength} secureTextEntry={secureTextEntry ?? false}
        />
      </View>
    );

    return (
      <>
        <PlanSummary plan={selectedPlan} theme={theme} t={t} label={methodLabel} />
        {payMethod === 'card' ? (
          <>
            <Field label={t.subscription.cardNumber} value={cardNum}  onChange={setCardNum}  placeholder={t.subscription.cardNumPh} keyboardType="numeric" maxLength={16} />
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}><Field label={t.subscription.expiry} value={expiry} onChange={setExpiry} placeholder={t.subscription.expiryPh} maxLength={5} /></View>
              <View style={{ flex: 1 }}><Field label={t.subscription.cvv} value={cvv} onChange={setCvv} placeholder={t.subscription.cvvPh} keyboardType="numeric" maxLength={3} secureTextEntry /></View>
            </View>
            <Field label={t.subscription.cardHolder} value={cardName} onChange={setCardName} placeholder={t.subscription.holderPh} />
          </>
        ) : (
          <>
            <Field label={t.subscription.phone} value={phone} onChange={setPhone} placeholder={t.subscription.phonePh} keyboardType="numeric" maxLength={10} />
            <Field label={t.subscription.otp} value={otp} onChange={setOtp} placeholder={t.subscription.otpPh} keyboardType="numeric" maxLength={6} />
            <View style={[s.ussdBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Icon name="information-circle" size={14} color={COLORS.primary} style={{ flexShrink: 0 }} />
              <Text style={[s.ussdText, { color: theme.text3 }]}>
                {t.subscription.otpHint.replace('{ussd}', ussd).split(ussd).reduce((acc: any[], part, i, arr) => {
                  acc.push(part);
                  if (i < arr.length - 1) acc.push(<Text key={i} style={{ color: theme.text2, fontWeight: FONT_WEIGHT.semibold }}>{ussd}</Text>);
                  return acc;
                }, [])}
              </Text>
            </View>
          </>
        )}
        {!!error && (
          <View style={s.errBox}>
            <Icon name="alert-circle-outline" size={14} color={COLORS.primary} />
            <Text style={s.errBoxText}>{error}</Text>
          </View>
        )}
        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator size="small" color="#fff" />
            : <>
                <Icon name="lock-closed" size={14} color="#fff" />
                <Text style={s.submitText}>{t.subscription.confirmPayment}</Text>
              </>
          }
        </TouchableOpacity>
        <View style={s.secureRow}>
          <Icon name="shield-checkmark" size={12} color="#4CAF50" />
          <Text style={[s.secureText, { color: theme.text3 }]}>{t.subscription.securePayment}</Text>
        </View>
      </>
    );
  };

  // ── Rendu step 4 succès ───────────────────────────────────────────────────────

  const renderStep4 = () => (
    <View style={s.successWrap}>
      <View style={s.successIcon}>
        <Icon name="checkmark" size={36} color="#22C55E" />
      </View>
      <Text style={[s.successTitle, { color: theme.text }]}>{t.subscription.successTitle}</Text>
      <Text style={[s.successPlan, { color: '#22C55E' }]}>{selectedPlan?.name}</Text>
      <Text style={[s.successSub, { color: theme.text3 }]}>{t.subscription.successSub}</Text>
      <TouchableOpacity style={s.successBtn} onPress={onClose} activeOpacity={0.85}>
        <Icon name="checkmark-circle" size={16} color="#000" />
        <Text style={s.successBtnText}>{t.subscription.viewProfile}</Text>
      </TouchableOpacity>
    </View>
  );

  // ── Titre par étape ────────────────────────────────────────────────────────

  const cat = requiredCategory ?? '';
  const catCap = cat ? (cat[0].toUpperCase() + cat.slice(1)) : '';

  const STEP_TITLES: Record<Step, string> = {
    1: requiredCategory
      ? t.subscription.requiredTitle.replace('{cat}', catCap)
      : t.subscription.goToPremium,
    2: t.subscription.choosePayment,
    3: t.subscription.paymentDetails,
    4: '',
  };
  const STEP_SUBS: Record<Step, string> = {
    1: requiredCategory
      ? t.subscription.requiredSub.replace('{cat}', cat)
      : t.subscription.goToPremiumSub,
    2: t.subscription.choosePaymentSub,
    3: payMethod === 'orange' ? t.subscription.orangeMoney
       : payMethod === 'moov' ? t.subscription.moovMoney
       : t.subscription.bankCard,
    4: '',
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={step < 4 ? onClose : undefined} />

      <Animated.View style={[s.sheet, { backgroundColor: theme.surface, transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Handle */}
          <View style={s.handleWrap}>
            <View style={[s.handle, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={s.sheetHeader}>
            {step > 1 && step < 4 && (
              <TouchableOpacity onPress={handleBack} style={s.backBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                <Icon name="arrow-back" size={18} color={theme.text2} />
              </TouchableOpacity>
            )}
            {step < 4 && <StepDots step={step} />}
            <TouchableOpacity onPress={onClose} style={s.closeBtn} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <Icon name="close" size={20} color={theme.text3} />
            </TouchableOpacity>
          </View>

          {step < 4 && (
            <View style={s.titleWrap}>
              <Text style={[s.sheetTitle, { color: theme.text }]}>{STEP_TITLES[step]}</Text>
              {!!STEP_SUBS[step] && <Text style={[s.sheetSub, { color: theme.text3 }]}>{STEP_SUBS[step]}</Text>}
            </View>
          )}

          {/* Corps */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ padding: SPACING.lg, paddingBottom: 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ─── Plan summary bar ─────────────────────────────────────────────────────────

function PlanSummary({ plan, theme, t, label }: { plan: EnrichedPlan; theme: any; t: any; label?: string }) {
  return (
    <View style={[ps.bar, { borderColor: 'rgba(226,62,62,0.2)', backgroundColor: theme.bg3 ?? theme.bg }]}>
      <View>
        {label && <Text style={[ps.top, { color: theme.text3 }]}>{label}</Text>}
        <Text style={[ps.top, { color: theme.text3 }]}>{t.subscription.planSelected}</Text>
        <Text style={[ps.name, { color: theme.text }]}>{plan.name || plan.code}</Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={ps.price}>{fmtPrice(plan.price)} {plan.currency}</Text>
        <Text style={[ps.dur, { color: theme.text3 }]}>/ {plan.duration_months} {t.subscription.monthsAccess}</Text>
      </View>
    </View>
  );
}
const ps = StyleSheet.create({
  bar:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 18 },
  top:   { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  name:  { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold, marginTop: 2 },
  price: { fontSize: 17, fontWeight: FONT_WEIGHT.bold, color: COLORS.primary },
  dur:   { fontSize: 11 },
});

// ─── Styles sheet ─────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  overlay:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, maxHeight: '92%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden' },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle:     { width: 36, height: 4, borderRadius: 2 },

  sheetHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.lg, paddingBottom: 4, position: 'relative' },
  backBtn:     { position: 'absolute', left: SPACING.lg },
  closeBtn:    { position: 'absolute', right: SPACING.lg, padding: 4 },

  titleWrap:  { alignItems: 'center', paddingHorizontal: SPACING.lg, paddingBottom: SPACING.md },
  sheetTitle: { fontSize: 20, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  sheetSub:   { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 18, marginTop: 4 },

  tabs:    { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab:     { flex: 1, borderWidth: 1, borderRadius: 10, paddingVertical: 9, alignItems: 'center' },
  tabText: { fontSize: 13, fontWeight: FONT_WEIGHT.bold },

  noEngage: { textAlign: 'center', fontSize: 12, marginTop: 4, marginBottom: 8 },

  geoBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 10, padding: 10, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(226,62,62,0.2)' },
  geoText:   { fontSize: 12 },

  center:   { alignItems: 'center', paddingVertical: 48, gap: SPACING.md },
  errText:  { fontSize: FONT_SIZE.sm, textAlign: 'center' },
  retryBtn: { borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.full, paddingHorizontal: 20, paddingVertical: 8 },

  authBox:   { borderWidth: 1.5, borderRadius: 18, padding: 28, alignItems: 'center', gap: SPACING.md },
  authTitle: { fontSize: FONT_SIZE.xl, fontWeight: FONT_WEIGHT.bold },
  authSub:   { fontSize: FONT_SIZE.sm, textAlign: 'center' },
  authBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 13, paddingHorizontal: 32, marginTop: 4 },
  authBtnText: { color: '#fff', fontWeight: FONT_WEIGHT.bold, fontSize: FONT_SIZE.base },

  payRow:  { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 10 },
  payIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  payName: { fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.semibold },
  payDesc: { fontSize: FONT_SIZE.sm, marginTop: 1 },

  fieldLabel: { fontSize: 11, fontWeight: FONT_WEIGHT.semibold, letterSpacing: 0.5, marginBottom: 6 },
  field:      { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: FONT_SIZE.base },

  ussdBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14 },
  ussdText: { fontSize: 12, lineHeight: 18, flex: 1 },

  errBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(226,62,62,0.08)', borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: COLORS.primary, marginBottom: 12 },
  errBoxText:{ color: COLORS.primary, fontSize: FONT_SIZE.sm, flex: 1 },

  submitBtn:  { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 },
  submitText: { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
  secureRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 },
  secureText: { fontSize: 11 },

  successWrap:  { alignItems: 'center', paddingVertical: 32, gap: SPACING.md },
  successIcon:  { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(34,197,94,0.14)', borderWidth: 3, borderColor: '#22C55E', alignItems: 'center', justifyContent: 'center' },
  successTitle: { fontSize: 22, fontWeight: FONT_WEIGHT.bold },
  successPlan:  { fontSize: 16, fontWeight: FONT_WEIGHT.semibold },
  successSub:   { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 22 },
  successBtn:   { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 13, paddingHorizontal: 36, marginTop: 4 },
  successBtnText: { color: '#000', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
});
