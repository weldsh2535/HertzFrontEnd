import { StyleSheet } from 'react-native';

export const colors = {
  darkBackground: '#121212',
  darkerBackground: '#000000',
  golden: '#FFD700',
  goldenLight: '#FFECB3',
  lightText: '#F5F5F5',
  secondaryText: '#BDBDBD',
  error: '#CF6679',
  white: '#FFFFFF',
};

export const commonStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.darkBackground,
    paddingHorizontal: 16,
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    color: colors.lightText,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    backgroundColor: colors.darkerBackground,
    color: colors.lightText,
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.golden,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 10,
  },
  buttonText: {
    color: colors.darkBackground,
    fontWeight: 'bold',
    fontSize: 16,
  },
  text: {
    color: colors.lightText,
    fontSize: 16,
  },
  secondaryText: {
    color: colors.secondaryText,
    fontSize: 14,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 10,
  },
});