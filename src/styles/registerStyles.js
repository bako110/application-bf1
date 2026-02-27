import { StyleSheet } from 'react-native';

export const createRegisterStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    color: colors.text,
  },
  input: {
    width: '100%',
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border || '#1A0000',
    borderRadius: 10,
    marginBottom: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: 16,
  },
  inputAvailable: {
    borderColor: '#00FF00',
    borderWidth: 2,
  },
  inputUnavailable: {
    borderColor: '#FF0000',
    borderWidth: 2,
  },
  button: {
    width: '100%',
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  link: {
    color: colors.primary,
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  error: {
    color: '#FF0000',
    marginBottom: 12,
    fontSize: 14,
    textAlign: 'center',
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
  suggestionButton: {
    width: '100%',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  suggestionText: {
    color: colors.text,
    fontSize: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  warningText: {
    color: '#FF0000',
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    width: '100%',
  },
});