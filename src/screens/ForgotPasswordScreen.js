import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../contexts/ThemeContext';
import authService from '../services/authService';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      await authService.forgotPassword(email);
      setMessage('Un email de réinitialisation a été envoyé.');
    } catch (e) {
      setError("Erreur lors de la demande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mot de passe oublié</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#b0b0b0"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {message ? <Text style={styles.success}>{message}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleForgotPassword} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Envoyer</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Retour à la connexion</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: colors.text,
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: colors.surface,
    borderRadius: 8,
    marginBottom: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: colors.primary,
    marginTop: 8,
    fontSize: 15,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  success: {
    color: 'green',
    marginBottom: 8,
  },
});
