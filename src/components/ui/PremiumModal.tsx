import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, Animated,
  StyleSheet, Pressable,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants';

interface Props {
  visible:       boolean;
  requiredPlan?: 'standard' | 'premium';
  onSubscribe:   () => void;
  onDismiss:     () => void;
}

export function PremiumModal({ visible, requiredPlan = 'premium', onSubscribe, onDismiss }: Props) {
  const { theme }  = useTheme();
  const { t }      = useTranslation();
  const slideAnim  = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(500);
      Animated.spring(slideAnim, {
        toValue:         0,
        useNativeDriver: true,
        tension:         65,
        friction:        11,
      }).start();
    }
  }, [visible]);

  const isPremium = requiredPlan === 'premium';
  const gradientColors: [string, string] = isPremium
    ? ['#9B59B6', '#7D3C98']
    : ['#F39C12', '#D68910'];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable onPress={() => {}} style={styles.sheetWrapper}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: theme.bg2 ?? theme.surface, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

            {/* Badge plan */}
            <LinearGradient colors={gradientColors} style={styles.planBadge} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
              <Icon name="star" size={22} color={COLORS.white} />
              <Text style={styles.planBadgeText}>
                {isPremium ? 'PREMIUM' : 'STANDARD'}
              </Text>
            </LinearGradient>

            <Text style={[styles.title, { color: theme.text }]}>
              {t.subscription.upgradeRequired}
            </Text>

            <Text style={[styles.msg, { color: theme.text3 }]}>
              {isPremium ? t.subscription.premiumContent : t.subscription.standardContent}
            </Text>

            {/* Features */}
            <View style={styles.features}>
              {(isPremium ? premiumFeatures : standardFeatures).map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Icon name="checkmark-circle" size={16} color={isPremium ? '#9B59B6' : '#F39C12'} />
                  <Text style={[styles.featureText, { color: theme.text2 }]}>{f}</Text>
                </View>
              ))}
            </View>

            <LinearGradient
              colors={gradientColors}
              style={styles.subscribeBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <TouchableOpacity style={styles.subscribeBtnInner} onPress={onSubscribe} activeOpacity={0.85}>
                <Text style={styles.subscribeBtnText}>{t.subscription.subscribe}</Text>
              </TouchableOpacity>
            </LinearGradient>

            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: theme.border }]}
              onPress={onDismiss}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelText, { color: theme.text3 }]}>
                {t.common.cancel}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const premiumFeatures = [
  'Accès illimité à tous les contenus',
  'Qualité HD sans publicité',
  'Téléchargement hors-ligne',
  'Accès prioritaire aux nouveautés',
];

const standardFeatures = [
  'Accès aux émissions exclusives',
  'Qualité HD',
  'Contenu sans publicité',
];

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent:  'flex-end',
  },
  sheetWrapper: {
    width: '100%',
  },
  sheet: {
    borderTopLeftRadius:  RADIUS.xxl,
    borderTopRightRadius: RADIUS.xxl,
    paddingHorizontal:    SPACING.xxl,
    paddingBottom:        SPACING.xxxl,
    alignItems:           'center',
  },
  handle: {
    width:        40,
    height:       4,
    borderRadius: 2,
    marginTop:    14,
    marginBottom: SPACING.xxl,
  },
  planBadge: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               8,
    paddingHorizontal: SPACING.xl,
    paddingVertical:   10,
    borderRadius:      RADIUS.full,
    marginBottom:      SPACING.xl,
  },
  planBadgeText: {
    color:         COLORS.white,
    fontSize:      FONT_SIZE.sm,
    fontWeight:    FONT_WEIGHT.bold,
    letterSpacing: 1,
  },
  title: {
    fontSize:     FONT_SIZE.xl,
    fontWeight:   FONT_WEIGHT.bold,
    marginBottom: SPACING.sm,
    textAlign:    'center',
  },
  msg: {
    fontSize:     FONT_SIZE.md,
    lineHeight:   22,
    textAlign:    'center',
    marginBottom: SPACING.xl,
    maxWidth:     280,
  },
  features: {
    width:        '100%',
    marginBottom: SPACING.xxl,
    gap:          10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           10,
  },
  featureText: {
    fontSize: FONT_SIZE.md,
  },
  subscribeBtn: {
    width:        '100%',
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
  },
  subscribeBtnInner: {
    width:           '100%',
    paddingVertical: 15,
    alignItems:      'center',
  },
  subscribeBtnText: {
    color:      COLORS.white,
    fontSize:   FONT_SIZE.base,
    fontWeight: FONT_WEIGHT.bold,
  },
  cancelBtn: {
    width:           '100%',
    borderWidth:     1,
    borderRadius:    RADIUS.lg,
    paddingVertical: 14,
    alignItems:      'center',
  },
  cancelText: {
    fontSize:   FONT_SIZE.md,
    fontWeight: FONT_WEIGHT.medium,
  },
});
