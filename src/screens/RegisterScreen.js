import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '../contexts/ThemeContext';
import api from '../config/api';
import Ionicons from 'react-native-vector-icons/Ionicons';

export default function RegisterScreen({ navigation }) {
  const { register, login } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestedUsername, setSuggestedUsername] = useState('');
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  // Suggérer un username quand l'email change
  useEffect(() => {
    const suggestUsername = async () => {
      if (email && email.includes('@')) {
        try {
          const response = await api.post('/username/suggest', { email });
          const suggested = response.data.username;
          setSuggestedUsername(suggested);
          
          // Si l'utilisateur n'a pas encore saisi de username, utiliser la suggestion
          if (!username) {
            setUsername(suggested);
            setUsernameAvailable(true);
          }
        } catch (error) {
          console.error('Erreur suggestion username:', error);
        }
      }
    };

    // Délai pour éviter trop de requêtes
    const timer = setTimeout(suggestUsername, 500);
    return () => clearTimeout(timer);
  }, [email]);

  // Vérifier la disponibilité du username quand il change
  useEffect(() => {
    const checkUsername = async () => {
      if (username && username.length >= 3) {
        setCheckingUsername(true);
        try {
          const response = await api.get(`/username/check/${username}`);
          setUsernameAvailable(response.data.is_available);
        } catch (error) {
          console.error('Erreur vérification username:', error);
          setUsernameAvailable(null);
        } finally {
          setCheckingUsername(false);
        }
      } else {
        setUsernameAvailable(null);
      }
    };

    // Délai pour éviter trop de requêtes
    const timer = setTimeout(checkUsername, 500);
    return () => clearTimeout(timer);
  }, [username]);

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
      <View style={styles.usernameContainer}>
        <TextInput
          style={[
            styles.input,
            usernameAvailable === true && styles.inputAvailable,
            usernameAvailable === false && styles.inputUnavailable
          ]}
          placeholder="Nom d'utilisateur"
          placeholderTextColor="#b0b0b0"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        {checkingUsername && (
          <ActivityIndicator 
            size="small" 
            color="#DC143C" 
            style={styles.usernameIndicator}
          />
        )}
        {!checkingUsername && usernameAvailable === true && (
          <Ionicons 
            name="checkmark-circle" 
            size={24} 
            color="#00FF00" 
            style={styles.usernameIndicator}
          />
        )}
        {!checkingUsername && usernameAvailable === false && (
          <Ionicons 
            name="close-circle" 
            size={24} 
            color="#FF0000" 
            style={styles.usernameIndicator}
          />
        )}
      </View>
      {suggestedUsername && username !== suggestedUsername && (
        <TouchableOpacity 
          style={styles.suggestionButton}
          onPress={() => setUsername(suggestedUsername)}
        >
          <Text style={styles.suggestionText}>
            💡 Suggestion: {suggestedUsername}
          </Text>
        </TouchableOpacity>
      )}
      {usernameAvailable === false && (
        <Text style={styles.warningText}>
          ⚠️ Ce nom d'utilisateur est déjà pris
        </Text>
      )}
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
    backgroundColor: '#DC143C',
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
    color: '#DC143C',
    marginTop: 16,
    fontSize: 15,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  usernameContainer: {
    width: '100%',
    position: 'relative',
  },
  usernameIndicator: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  inputAvailable: {
    borderColor: '#00FF00',
    borderWidth: 1,
  },
  inputUnavailable: {
    borderColor: '#FF0000',
    borderWidth: 1,
  },
  suggestionButton: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#DC143C',
  },
  suggestionText: {
    color: '#FFFFFF',
    fontSize: 14,
    textAlign: 'center',
  },
  warningText: {
    color: '#FF0000',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
  },
});
