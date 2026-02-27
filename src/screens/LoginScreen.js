import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../contexts/ThemeContext';

export default function LoginScreen({ navigation, route }) {
  const { login } = useAuth();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Récupérer le paramètre pour savoir si on doit revenir au modal de souscription
  const returnToSubscription = route?.params?.returnToSubscription;

  const handleLogin = async () => {
    if (!identifier.trim() || !password.trim()) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(identifier.trim(), password);
      
      console.log('✅ [LoginScreen] Connexion réussie, redirection...');
      
      // Petit délai pour s'assurer que l'état est mis à jour
      setTimeout(() => {
        // Rediriger vers le profil après connexion réussie
        // Si returnToSubscription est true, ProfileMain affichera automatiquement le modal
        navigation.replace('ProfileMain', { 
          showSubscriptionModal: returnToSubscription 
        });
      }, 100);
      
    } catch (e) {
      console.error('❌ [LoginScreen] Erreur de connexion:', e);
      setError(e?.detail || e?.message || 'Identifiants invalides. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        style={styles.input}
        placeholder="Email ou nom d'utilisateur"
        placeholderTextColor="#b0b0b0"
        value={identifier}
        onChangeText={setIdentifier}
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
      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Se connecter</Text>}
      </TouchableOpacity>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%' }}>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.link}>Créer un compte</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>Mot de passe oublié ?</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    color: '#FFFFFF',
  },
  input: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#1A0000',
    borderRadius: 8,
    marginBottom: 16,
    color: '#FFFFFF',
    backgroundColor: '#1A0000',
  },
  button: {
    width: '100%',
    backgroundColor: '#E23E3E',
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
    color: '#E23E3E',
    marginTop: 8,
    fontSize: 15,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
});
