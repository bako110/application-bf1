import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import api from '../config/api';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { createRegisterStyles } from '../styles/registerStyles'; // Import des styles séparés

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
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

  const styles = createRegisterStyles(colors);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
      
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textSecondary}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      
      <View style={styles.usernameContainer}>
        <TextInput
          style={[
            styles.input,
            usernameAvailable === true && styles.inputAvailable,
            usernameAvailable === false && styles.inputUnavailable
          ]}
          placeholder="Nom d'utilisateur"
          placeholderTextColor={colors.textSecondary}
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />
        {checkingUsername && (
          <ActivityIndicator 
            size="small" 
            color={colors.primary} 
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
        placeholderTextColor={colors.textSecondary}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      
      {error ? <Text style={styles.error}>{error}</Text> : null}
      
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleRegister} 
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>S'inscrire</Text>
        )}
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Déjà un compte ? Se connecter</Text>
      </TouchableOpacity>
    </View>
  );
}