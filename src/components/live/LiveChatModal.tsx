import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  FlatList, Image, Modal, Animated, KeyboardAvoidingView,
  Platform, Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { useTranslation } from '../../hooks/useTranslation';
import { ChatMessage } from '../../hooks/useLiveChat';
import { COLORS, FONT_SIZE, FONT_WEIGHT, SPACING, RADIUS } from '../../constants';

// ─── Couleur avatar déterministe ───────────────────────────────────────────────
const AVATAR_COLORS = ['#E23E3E','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#14B8A6'];
function avatarBg(username: string): string {
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = (username.charCodeAt(i) + hash * 31) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function timeAgo(iso: string): string {
  if (!iso) return '';
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60)    return "à l'instant";
  if (s < 3600)  return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return `${Math.floor(s / 86400)}j`;
}

// ─── Composant un message ──────────────────────────────────────────────────────

interface MessageRowProps {
  item:          ChatMessage;
  currentUserId: string | number | null | undefined;
  theme:         any;
  onEdit:        (id: string, currentText: string) => void;
  onDelete:      (id: string) => void;
}

function MessageRow({ item, currentUserId, theme, onEdit, onDelete }: MessageRowProps) {
  const isMine  = currentUserId && item.user_id && String(item.user_id) === String(currentUserId);
  const bg      = item.avatar_url ? 'transparent' : avatarBg(item.username || '?');
  const letter  = (item.username || '?')[0].toUpperCase();

  return (
    <View style={styles.msgRow}>
      {/* Avatar */}
      <View style={[styles.avatar, { backgroundColor: bg }]}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} />
        ) : (
          <Text style={styles.avatarLetter}>{letter}</Text>
        )}
      </View>

      {/* Corps */}
      <View style={styles.msgBody}>
        <View style={styles.msgMeta}>
          <Text style={[styles.msgName, { color: theme.text }]}>{item.username || 'Anonyme'}</Text>
          <Text style={[styles.msgTime, { color: theme.text3 }]}>{timeAgo(item.created_at)}</Text>
          {item.edited && <Text style={[styles.msgEdited, { color: theme.text3 }]}>modifié</Text>}
          {isMine && (
            <View style={styles.msgActions}>
              <TouchableOpacity onPress={() => onEdit(item.id, item.text)} style={styles.actionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Icon name="pencil-outline" size={11} color={theme.text3} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionBtn} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                <Icon name="trash-outline" size={11} color={theme.text3} />
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text style={[styles.msgText, { color: theme.text2 }]}>{item.text}</Text>
      </View>
    </View>
  );
}

// ─── Props du modal ────────────────────────────────────────────────────────────

interface LiveChatModalProps {
  visible:         boolean;
  onClose:         () => void;
  currentUser:     { id?: any; username?: string; avatar_url?: string | null } | null;
  isAuthenticated: boolean;
  onLoginPress:    () => void;
  // Données injectées depuis le hook instancié dans LiveScreen
  messages:        ChatMessage[];
  chatOpen:        boolean;
  wsStatus:        'connecting' | 'connected' | 'fallback' | 'error';
  sendMessage:     (text: string, user: any) => Promise<boolean>;
  deleteMessage:   (id: string) => Promise<boolean>;
  editMessage:     (id: string, text: string) => Promise<boolean>;
}

// ─── Modal ─────────────────────────────────────────────────────────────────────

export function LiveChatModal({
  visible, onClose, currentUser, isAuthenticated, onLoginPress,
  messages, chatOpen, wsStatus, sendMessage, deleteMessage, editMessage,
}: LiveChatModalProps) {
  const { theme } = useTheme();
  const { t }     = useTranslation();

  const [text, setText]         = useState('');
  const [sending, setSending]   = useState(false);
  const [editingId, setEditingId]   = useState<string | null>(null);
  const [editText,  setEditText]    = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;
  const listRef   = useRef<FlatList>(null);

  // Slide up quand visible
  useEffect(() => {
    if (visible) {
      slideAnim.setValue(300);
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 300, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  // Scroll vers le haut quand nouveau message (liste inversée)
  useEffect(() => {
    if (visible && messages.length) {
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    }
  }, [messages.length, visible]);

  const handleSend = useCallback(async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    await sendMessage(text, currentUser ?? null);
    setText('');
    setSending(false);
  }, [text, sending, sendMessage, currentUser]);

  const handleDelete = useCallback((id: string) => {
    Alert.alert(t.chat.deleteTitle, t.chat.deleteConfirm, [
      { text: t.common.cancel, style: 'cancel' },
      { text: t.chat.deleteTitle, style: 'destructive', onPress: () => deleteMessage(id) },
    ]);
  }, [deleteMessage, t]);

  const handleEdit = useCallback((id: string, current: string) => {
    setEditingId(id);
    setEditText(current);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (!editingId || !editText.trim()) return;
    await editMessage(editingId, editText);
    setEditingId(null);
    setEditText('');
  }, [editingId, editText, editMessage]);

  const wsDot = wsStatus === 'connected' ? COLORS.success : wsStatus === 'fallback' ? COLORS.warning : theme.text3;

  // Liste inversée : messages récents en haut
  const reversed = [...messages].reverse();

  const renderItem = useCallback(({ item }: { item: ChatMessage }) => (
    <MessageRow
      item={item}
      currentUserId={currentUser?.id}
      theme={theme}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ), [currentUser?.id, theme, handleEdit, handleDelete]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Overlay */}
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />

      {/* Sheet */}
      <Animated.View style={[styles.sheet, { backgroundColor: theme.bg2 ?? theme.surface, transform: [{ translateY: slideAnim }] }]}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          {/* Drag handle */}
          <View style={styles.dragHandleWrapper}>
            <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
          </View>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.divider }]}>
            <View style={styles.headerLeft}>
              <Text style={[styles.headerTitle, { color: theme.text }]}>{t.chat.title}</Text>
              <View style={[styles.wsDot, { backgroundColor: wsDot }]} />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Icon name="close" size={20} color={theme.text3} />
            </TouchableOpacity>
          </View>

          {/* Liste messages */}
          {reversed.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Icon name="chatbubble-ellipses-outline" size={36} color={theme.text3} />
              <Text style={[styles.emptyText, { color: theme.text3 }]}>{t.chat.empty}</Text>
            </View>
          ) : (
            <FlatList
              ref={listRef}
              data={reversed}
              keyExtractor={item => item.id}
              renderItem={renderItem}
              style={styles.list}
              contentContainerStyle={{ paddingVertical: SPACING.sm }}
              showsVerticalScrollIndicator={false}
              inverted={false}
            />
          )}

          {/* Chat fermé par admin */}
          {!chatOpen && (
            <View style={[styles.closedBanner, { backgroundColor: theme.surface }]}>
              <Icon name="lock-closed-outline" size={13} color={theme.text3} />
              <Text style={[styles.closedText, { color: theme.text3 }]}>{t.chat.closed}</Text>
            </View>
          )}

          {/* Zone d'édition */}
          {editingId && (
            <View style={[styles.editArea, { backgroundColor: theme.surface, borderTopColor: theme.divider }]}>
              <TextInput
                style={[styles.editInput, { color: theme.text, borderColor: COLORS.primary }]}
                value={editText}
                onChangeText={setEditText}
                maxLength={300}
                autoFocus
                multiline
              />
              <View style={styles.editBtns}>
                <TouchableOpacity onPress={() => { setEditingId(null); setEditText(''); }}
                  style={[styles.editCancelBtn, { borderColor: theme.border }]}>
                  <Text style={[styles.editCancelLabel, { color: theme.text3 }]}>{t.common.cancel}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSaveEdit}
                  style={styles.editSaveBtn}>
                  <Text style={styles.editSaveLabel}>{t.common.save}</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Input */}
          {!editingId && isAuthenticated && chatOpen && (
            <View style={[styles.inputRow, { borderTopColor: theme.divider }]}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.bg3 ?? theme.surface, color: theme.text, borderColor: theme.border }]}
                value={text}
                onChangeText={t => setText(t.slice(0, 300))}
                placeholder={t.chat.placeholder}
                placeholderTextColor={theme.text3}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!sending}
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!text.trim() || sending}
                style={[styles.sendBtn, { backgroundColor: text.trim() && !sending ? COLORS.primary : theme.border }]}
              >
                <Icon name="send" size={15} color={COLORS.white} />
              </TouchableOpacity>
            </View>
          )}

          {/* Login prompt */}
          {!editingId && !isAuthenticated && (
            <View style={[styles.loginPrompt, { borderTopColor: theme.divider }]}>
              <TouchableOpacity onPress={onLoginPress} style={styles.loginBtn}>
                <Text style={styles.loginBtnText}>{t.chat.loginPrompt}</Text>
              </TouchableOpacity>
            </View>
          )}
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    maxHeight: '82%',
    borderTopLeftRadius: RADIUS.xxl, borderTopRightRadius: RADIUS.xxl,
    overflow: 'hidden',
  },
  dragHandleWrapper: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  dragHandle: { width: 36, height: 4, borderRadius: 2 },

  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingBottom: SPACING.sm,
    borderBottomWidth: 0.5,
  },
  headerLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: FONT_SIZE.md, fontWeight: FONT_WEIGHT.bold },
  wsDot:       { width: 7, height: 7, borderRadius: 4 },
  closeBtn:    { padding: 4 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, gap: SPACING.md, minHeight: 120 },
  emptyText: { fontSize: FONT_SIZE.sm, textAlign: 'center' },

  list: { flex: 1 },

  msgRow: { flexDirection: 'row', gap: SPACING.sm, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm },
  avatar: {
    width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0,
  },
  avatarImg:    { width: '100%', height: '100%' },
  avatarLetter: { color: COLORS.white, fontSize: 13, fontWeight: FONT_WEIGHT.bold },

  msgBody: { flex: 1, minWidth: 0 },
  msgMeta: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 2 },
  msgName: { fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.bold },
  msgTime: { fontSize: FONT_SIZE.xxs },
  msgEdited: { fontSize: FONT_SIZE.xxs, fontStyle: 'italic' },
  msgActions: { flexDirection: 'row', gap: 2, marginLeft: 'auto' },
  actionBtn:  { padding: 3 },
  msgText:    { fontSize: FONT_SIZE.sm, lineHeight: 18 },

  closedBanner: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, padding: SPACING.sm,
  },
  closedText: { fontSize: FONT_SIZE.sm, fontStyle: 'italic' },

  editArea: {
    padding: SPACING.md, borderTopWidth: 0.5,
  },
  editInput: {
    borderWidth: 1, borderRadius: RADIUS.md, padding: SPACING.sm,
    fontSize: FONT_SIZE.sm, minHeight: 60, textAlignVertical: 'top',
  },
  editBtns:      { flexDirection: 'row', justifyContent: 'flex-end', gap: SPACING.sm, marginTop: SPACING.sm },
  editCancelBtn: { borderWidth: 1, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: 5 },
  editCancelLabel: { fontSize: FONT_SIZE.sm },
  editSaveBtn:   { backgroundColor: COLORS.primary, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: 5 },
  editSaveLabel: { fontSize: FONT_SIZE.sm, color: COLORS.white, fontWeight: FONT_WEIGHT.semibold },

  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    paddingHorizontal: SPACING.lg, paddingTop: SPACING.sm, paddingBottom: SPACING.md,
    borderTopWidth: 0.5,
  },
  input: {
    flex: 1, height: 40, borderRadius: RADIUS.full, borderWidth: 1,
    paddingHorizontal: SPACING.md, fontSize: FONT_SIZE.sm,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  loginPrompt: {
    alignItems: 'center', paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg, borderTopWidth: 0.5,
  },
  loginBtn: {
    borderWidth: 1, borderColor: COLORS.primary, borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.sm,
  },
  loginBtnText: { color: COLORS.primary, fontSize: FONT_SIZE.sm, fontWeight: FONT_WEIGHT.semibold },
});
