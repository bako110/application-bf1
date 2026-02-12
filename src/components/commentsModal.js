import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { colors } from '../contexts/ThemeContext';
import commentService from '../services/commentService';
import authService from '../services/authService';
import { formatRelativeTime } from '../utils/dateUtils';

const CommentsModal = ({ visible, onClose, contentId, contentType, onLoginRequired, onCommentChange }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    if (visible) {
      loadComments();
      loadCurrentUser();
    }
  }, [visible, contentId]);

  const loadCurrentUser = async () => {
    const user = await authService.getCurrentUser();
    setCurrentUser(user);
  };

  const loadComments = async () => {
    setLoading(true);
    try {
      const data = await commentService.getCommentsByContent(contentId, contentType);
      setComments(data);
    } catch (error) {
      console.error('Erreur chargement commentaires:', error);
    }
    setLoading(false);
  };

  const handleSubmitComment = async () => {
    // Vérifier l'authentification
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      onClose();
      if (onLoginRequired) onLoginRequired();
      return;
    }

    if (!commentText.trim()) {
      Alert.alert('Erreur', 'Veuillez saisir un commentaire');
      return;
    }

    setSubmitting(true);
    try {
      await commentService.createComment(contentId, contentType, commentText.trim());
      setCommentText('');
      await loadComments();
      if (onCommentChange) onCommentChange();
      Alert.alert('Succès', 'Commentaire ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible d\'ajouter le commentaire');
    }
    setSubmitting(false);
  };

  const handleEditComment = (comment) => {
    setEditingCommentId(comment.id);
    setEditText(comment.text);
  };

  const handleUpdateComment = async (commentId) => {
    if (!editText.trim()) {
      Alert.alert('Erreur', 'Le commentaire ne peut pas être vide');
      return;
    }

    try {
      await commentService.updateComment(commentId, editText.trim());
      setEditingCommentId(null);
      setEditText('');
      await loadComments();
      if (onCommentChange) onCommentChange();
      Alert.alert('Succès', 'Commentaire modifié');
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de modifier le commentaire');
    }
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditText('');
  };

  const handleDeleteComment = async (commentId) => {
    Alert.alert(
      'Supprimer le commentaire',
      'Êtes-vous sûr de vouloir supprimer ce commentaire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await commentService.deleteComment(commentId);
              await loadComments();
              if (onCommentChange) onCommentChange();
              Alert.alert('Succès', 'Commentaire supprimé');
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de supprimer le commentaire');
            }
          },
        },
      ]
    );
  };

  const renderComment = ({ item }) => {
    const isOwner = currentUser && item.user_id === currentUser.id;
    const username = item.username || 'Utilisateur';
    
    return (
      <View style={styles.commentItem}>
        <View style={styles.commentHeader}>
          <View style={styles.userAvatar}>
            <Text style={styles.avatarText}>
              {username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.commentInfo}>
            <Text style={styles.username}>{username}</Text>
            <Text style={styles.timestamp}>
              {new Date(item.created_at).toLocaleDateString('fr-FR')}
            </Text>
          </View>
          {isOwner && (
            <TouchableOpacity
              onPress={() => handleDeleteComment(item.id)}
              style={styles.deleteButton}
            >
              <Text style={styles.deleteButtonText}>×</Text>
            </TouchableOpacity>
          )}
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Commentaires</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={'#FFFFFF'} />
            </TouchableOpacity>
          </View>

          {/* Liste des commentaires */}
          <ScrollView style={styles.commentsList}>
            {loading ? (
              <ActivityIndicator size="large" color={'#DC143C'} style={{ marginTop: 20 }} />
            ) : comments.length > 0 ? (
              comments.map((comment) => {
                const isOwner = currentUser && comment.user_id === currentUser.id;
                const username = comment.username || 'Utilisateur';
                
                return (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentAvatar}>
                      <Ionicons name="person" size={16} color="#fff" />
                    </View>
                    <View style={styles.commentContent}>
                      <Text style={styles.commentUsername}>{username}</Text>
                      {editingCommentId === comment.id ? (
                        <View style={styles.editContainer}>
                          <TextInput
                            style={styles.editInput}
                            value={editText}
                            onChangeText={setEditText}
                            multiline
                            autoFocus
                          />
                          <View style={styles.editActions}>
                            <TouchableOpacity
                              style={styles.cancelButton}
                              onPress={handleCancelEdit}
                            >
                              <Text style={styles.cancelButtonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.saveButton}
                              onPress={() => handleUpdateComment(comment.id)}
                            >
                              <Text style={styles.saveButtonText}>Enregistrer</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ) : (
                        <>
                          <Text style={styles.commentText}>{comment.text}</Text>
                          <Text style={styles.commentTime}>
                            {formatRelativeTime(comment.created_at)}
                          </Text>
                        </>
                      )}
                    </View>
                    {isOwner && editingCommentId !== comment.id && (
                      <View style={styles.commentActions}>
                        <TouchableOpacity
                          onPress={() => handleEditComment(comment)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="create-outline" size={18} color={'#DC143C'} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(comment.id)}
                          style={styles.actionButton}
                        >
                          <Ionicons name="trash-outline" size={18} color={'#FF0000'} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyComments}>
                <Ionicons name="chatbubble-outline" size={48} color="#B0B0B0" />
                <Text style={styles.emptyCommentsText}>Aucun commentaire</Text>
                <Text style={styles.emptyCommentsSubtext}>Soyez le premier à commenter</Text>
              </View>
            )}
          </ScrollView>

          {/* Input commentaire */}
          <View style={styles.commentInputContainer}>
            <TextInput
              style={styles.commentInput}
              placeholder={currentUser ? "Ajouter un commentaire..." : "Connectez-vous pour commenter"}
              placeholderTextColor="#B0B0B0"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              editable={!!currentUser}
              onFocus={async () => {
                const isAuth = await authService.isAuthenticated();
                if (!isAuth) {
                  onClose();
                  if (onLoginRequired) onLoginRequired();
                }
              }}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!commentText.trim() || submitting) && styles.sendButtonDisabled]}
              onPress={handleSubmitComment}
              disabled={!commentText.trim() || submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color={'#DC143C'} />
              ) : (
                <Ionicons
                  name="send"
                  size={20}
                  color={commentText.trim() ? '#DC143C' : '#B0B0B0'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#000000',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingTop: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#330000',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  commentsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  commentItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#330000',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  commentText: {
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 4,
  },
  commentTime: {
    color: '#B0B0B0' || '#999',
    fontSize: 12,
  },
  commentActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editContainer: {
    marginTop: 8,
  },
  editInput: {
    backgroundColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#FFFFFF',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#DC143C',
    marginBottom: 8,
    minHeight: 60,
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#330000',
  },
  cancelButtonText: {
    color: '#B0B0B0' || '#999',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#DC143C',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyComments: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyCommentsText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptyCommentsSubtext: {
    color: '#B0B0B0' || '#999',
    fontSize: 14,
    marginTop: 4,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#330000',
    backgroundColor: '#000000',
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#1A0000',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    color: '#FFFFFF',
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A0000',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

export default CommentsModal;
