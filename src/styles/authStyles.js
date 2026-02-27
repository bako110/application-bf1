// styles/authStyles.js
import { StyleSheet, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

export const createAuthStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background || '#000000',
  },
  header: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary || '#DC143C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text || '#FFFFFF',
  },
  tagline: {
    fontSize: 14,
    color: colors.textSecondary || '#B0B0B0',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.card || '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text || '#FFFFFF',
    borderWidth: 1,
    borderColor: colors.border || '#3C3C3E',
  },
  inputFocused: {
    borderColor: colors.primary || '#DC143C',
  },
  inputError: {
    borderColor: '#FF0000',
  },
  errorText: {
    color: '#FF0000',
    fontSize: 12,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary || '#DC143C',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: colors.border || '#3C3C3E',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginBottom: 24,
  },
  forgotPasswordText: {
    color: colors.primary || '#DC143C',
    fontSize: 14,
  },
  switchMode: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  switchModeText: {
    color: colors.textSecondary || '#B0B0B0',
    fontSize: 14,
  },
  switchModeLink: {
    color: colors.primary || '#DC143C',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
