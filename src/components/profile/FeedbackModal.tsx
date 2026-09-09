/**
 * FeedbackModal — feuille de retour d'expérience.
 * Note en étoiles (optionnelle) + type (chips) + message + e-mail facultatif.
 * Persisté côté backend via api.sendFeedback ; l'admin le récupère dans le
 * panneau "Retours".
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Modal, Animated,
  ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView,
  Platform, StatusBar,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../stores';
import * as api from '../../services/api';
import type { FeedbackCategory } from '../../services/api';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const APP_VERSION = '1.0.0';

export function FeedbackModal({ visible, onClose }: Props) {
  const { theme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore() as any;

  const [rating,   setRating]   = useState(0);
  const [category, setCategory] = useState<FeedbackCategory>('idea');
  const [message,  setMessage]  = useState('');
  const [email,    setEmail]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [error,    setError]    = useState('');
  const [done,     setDone]     = useState(false);

  const slide = useRef(new Animated.Value(600)).current;

  useEffect(() => {
    if (visible) {
      setRating(0); setCategory('idea'); setMessage(''); setEmail('');
      setSending(false); setError(''); setDone(false);
      Animated.spring(slide, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slide, { toValue: 600, duration: 260, useNativeDriver: true }).start();
    }
  }, [visible]);

  const cats: { key: FeedbackCategory; label: string; icon: string }[] = [
    { key: 'bug',        label: t.feedback.catBug,        icon: 'bug-outline' },
    { key: 'idea',       label: t.feedback.catIdea,       icon: 'bulb-outline' },
    { key: 'compliment', label: t.feedback.catCompliment, icon: 'heart-outline' },
    { key: 'other',      label: t.feedback.catOther,      icon: 'ellipsis-horizontal' },
  ];

  const handleSend = useCallback(async () => {
    const msg = message.trim();
    if (msg.length < 3) { setError(t.feedback.errorEmpty); return; }
    setSending(true);
    setError('');
    try {
      await api.sendFeedback({
        message: msg,
        rating: rating > 0 ? rating : null,
        category,
        email: email.trim() || null,
        app_version: APP_VERSION,
        platform: Platform.OS,
        device_info: `${Platform.OS} ${Platform.Version}`,
      });
      setDone(true);
    } catch {
      setError(t.feedback.errorSend);
    } finally {
      setSending(false);
    }
  }, [message, rating, category, email, t]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {visible && <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />}
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose} />

      <Animated.View style={[s.sheet, { backgroundColor: theme.surface, transform: [{ translateY: slide }] }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <View style={s.handleWrap}>
            <View style={[s.handle, { backgroundColor: theme.border }]} />
          </View>

          {done ? (
            <View style={[s.doneWrap, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}>
              <View style={s.doneIcon}>
                <Icon name="checkmark" size={34} color={COLORS.success} />
              </View>
              <Text style={[s.doneTitle, { color: theme.text }]}>{t.feedback.successTitle}</Text>
              <Text style={[s.doneBody, { color: theme.text3 }]}>{t.feedback.successBody}</Text>
              <TouchableOpacity style={s.doneBtn} onPress={onClose} activeOpacity={0.88}>
                <Text style={s.doneBtnText}>{t.feedback.close}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={s.header}>
                <Text style={[s.title, { color: theme.text }]}>{t.feedback.title}</Text>
                <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <Icon name="close" size={20} color={theme.text3} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ padding: SPACING.lg, paddingBottom: Math.max(insets.bottom, 16) + 24, gap: SPACING.lg }}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <Text style={[s.subtitle, { color: theme.text3 }]}>{t.feedback.subtitle}</Text>

                {/* Note en étoiles */}
                <View style={s.block}>
                  <Text style={[s.blockLabel, { color: theme.text3 }]}>{t.feedback.ratingLabel}</Text>
                  <View style={s.starsRow}>
                    {[1, 2, 3, 4, 5].map(n => (
                      <TouchableOpacity
                        key={n}
                        onPress={() => setRating(n === rating ? 0 : n)}
                        hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        activeOpacity={0.7}
                      >
                        <Icon
                          name={n <= rating ? 'star' : 'star-outline'}
                          size={30}
                          color={n <= rating ? '#F5A623' : theme.border}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Type de retour */}
                <View style={s.block}>
                  <Text style={[s.blockLabel, { color: theme.text3 }]}>{t.feedback.categoryLabel}</Text>
                  <View style={s.chipsRow}>
                    {cats.map(c => {
                      const active = c.key === category;
                      return (
                        <TouchableOpacity
                          key={c.key}
                          style={[
                            s.chip,
                            { borderColor: active ? COLORS.primary : theme.border,
                              backgroundColor: active ? COLORS.redAlpha12 : 'transparent' },
                          ]}
                          onPress={() => setCategory(c.key)}
                          activeOpacity={0.8}
                        >
                          <Icon name={c.icon as any} size={14} color={active ? COLORS.primary : theme.text3} />
                          <Text style={[s.chipText, { color: active ? COLORS.primary : theme.text2 }]}>{c.label}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                {/* Message */}
                <View style={s.block}>
                  <TextInput
                    style={[s.textarea, { backgroundColor: theme.bg, borderColor: error && !message.trim() ? COLORS.error : theme.border, color: theme.text }]}
                    value={message}
                    onChangeText={v => { setMessage(v); if (error) setError(''); }}
                    placeholder={t.feedback.placeholder}
                    placeholderTextColor={theme.text3}
                    multiline
                    maxLength={2000}
                    textAlignVertical="top"
                  />
                  <Text style={[s.counter, { color: theme.text3 }]}>{message.length}/2000</Text>
                </View>

                {/* E-mail facultatif */}
                <View style={s.block}>
                  <Text style={[s.blockLabel, { color: theme.text3 }]}>{t.feedback.emailLabel}</Text>
                  <TextInput
                    style={[s.input, { backgroundColor: theme.bg, borderColor: theme.border, color: theme.text }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder={t.feedback.emailPh}
                    placeholderTextColor={theme.text3}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                {!!error && (
                  <View style={s.errBox}>
                    <Icon name="alert-circle-outline" size={14} color={COLORS.error} />
                    <Text style={s.errText}>{error}</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[s.sendBtn, sending && { opacity: 0.7 }]}
                  onPress={handleSend}
                  disabled={sending}
                  activeOpacity={0.88}
                >
                  {sending
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Icon name="send" size={15} color="#fff" />
                        <Text style={s.sendText}>{t.feedback.send}</Text>
                      </>
                  }
                </TouchableOpacity>
              </ScrollView>
            </>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.75)' },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '90%', borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
  },
  handleWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  handle:     { width: 36, height: 4, borderRadius: 2 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: 6, paddingBottom: 8,
  },
  title:    { fontSize: 19, fontWeight: FONT_WEIGHT.bold },
  subtitle: { fontSize: FONT_SIZE.sm, lineHeight: 19 },

  block:      { gap: 8 },
  blockLabel: { fontSize: FONT_SIZE.xs, fontWeight: FONT_WEIGHT.semibold, letterSpacing: 0.4, textTransform: 'uppercase' },

  starsRow: { flexDirection: 'row', gap: 10 },

  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: RADIUS.full, borderWidth: 1,
  },
  chipText: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.medium },

  textarea: {
    minHeight: 120, borderWidth: 1, borderRadius: RADIUS.lg,
    padding: SPACING.md, fontSize: FONT_SIZE.base,
  },
  counter: { alignSelf: 'flex-end', fontSize: FONT_SIZE.xxs },

  input: {
    height: 46, borderWidth: 1, borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.base,
  },

  errBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,59,48,0.08)', borderRadius: 8, padding: 10,
    borderLeftWidth: 3, borderLeftColor: COLORS.error,
  },
  errText: { color: COLORS.error, fontSize: FONT_SIZE.sm, flex: 1 },

  sendBtn: {
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg,
    paddingVertical: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  sendText: { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },

  doneWrap:  { alignItems: 'center', paddingHorizontal: 28, paddingTop: 20, gap: 12 },
  doneIcon:  {
    width: 76, height: 76, borderRadius: 38,
    backgroundColor: 'rgba(52,199,89,0.14)', borderWidth: 2, borderColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center', marginBottom: 4,
  },
  doneTitle: { fontSize: 19, fontWeight: FONT_WEIGHT.bold, textAlign: 'center' },
  doneBody:  { fontSize: FONT_SIZE.sm, textAlign: 'center', lineHeight: 20, maxWidth: 300 },
  doneBtn: {
    marginTop: 10, alignSelf: 'stretch',
    backgroundColor: COLORS.primary, borderRadius: RADIUS.lg, paddingVertical: 14, alignItems: 'center',
  },
  doneBtnText: { color: '#fff', fontSize: FONT_SIZE.base, fontWeight: FONT_WEIGHT.bold },
});
