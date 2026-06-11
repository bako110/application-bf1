import React, { useEffect, useRef } from 'react';
import {
  Modal, View, Text, TouchableOpacity, Animated,
  StyleSheet, Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { COLORS, RADIUS, FONT_SIZE, FONT_WEIGHT, SPACING } from '../../constants';

interface Props {
  visible:   boolean;
  message?:  string;
  onLogin:   () => void;
  onDismiss: () => void;
}

export function LoginRequiredModal({ visible, message, onLogin, onDismiss }: Props) {
  const { theme } = useTheme();
  const { t }     = useTranslation();
  const slideAnim = useRef(new Animated.Value(500)).current;

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

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      {/* Backdrop — tap ferme */}
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        {/* Sheet — tap ne ferme PAS */}
        <Pressable onPress={() => {}} style={styles.sheetWrapper}>
          <Animated.View
            style={[
              styles.sheet,
              { backgroundColor: theme.bg2 ?? theme.surface, transform: [{ translateY: slideAnim }] },
            ]}
          >
            {/* Handle */}
            <View style={[styles.handle, { backgroundColor: theme.border }]} />

            {/* Icône */}
            <View style={[styles.iconWrap, { backgroundColor: COLORS.primary + '18' }]}>
              <Icon name="lock-closed" size={28} color={COLORS.primary} />
            </View>

            <Text style={[styles.title, { color: theme.text }]}>
              {t.auth.loginRequired}
            </Text>

            <Text style={[styles.msg, { color: theme.text3 }]}>
              {message ?? t.auth.loginToContinue}
            </Text>

            <TouchableOpacity
              style={styles.loginBtn}
              onPress={onLogin}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>{t.auth.login}</Text>
            </TouchableOpacity>

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

const styles = StyleSheet.create({
  backdrop: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
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
  iconWrap: {
    width:          64,
    height:         64,
    borderRadius:   32,
    alignItems:     'center',
    justifyContent: 'center',
    marginBottom:   SPACING.lg,
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
    marginBottom: SPACING.xxl,
    maxWidth:     280,
  },
  loginBtn: {
    width:            '100%',
    backgroundColor:  COLORS.primary,
    borderRadius:     RADIUS.lg,
    paddingVertical:  15,
    alignItems:       'center',
    marginBottom:     SPACING.sm,
  },
  loginBtnText: {
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
