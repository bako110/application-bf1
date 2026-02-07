import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../contexts/ThemeContext';

export default function RegisterScreen({ navigation }) {
  const { register, login } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    // Validation
    if (!email.trim() || !username.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (!email.includes('@')) {
      setError('Veuillez entrer une adresse email valide');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Inscription
      await register({ email: email.trim(), username: username.trim(), password });
      
      // Auto-connexion après inscription réussie
      try {
        await login(email.trim(), password);
        // Rediriger vers le profil
        navigation.replace('ProfileMain');
      } catch (loginError) {
        // Si auto-connexion échoue, rediriger vers login
        navigation.replace('Login');
      }
    } catch (e) {
      console.error('Register error:', e);
      setError(e?.detail || e?.message || "Erreur lors de l'inscription. Cet email ou nom d'utilisateur existe peut-être déjà.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#b0b0b0"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Nom d'utilisateur"
        placeholderTextColor="#b0b0b0"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        placeholderTextColor="#b0b0b0"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>S'inscrire</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
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
});
