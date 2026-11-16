import { Alert, Linking } from 'react-native';

/** Opens the phone's email app with the address, subject and body filled in (mailto: link). */
export async function openEmail(to: string, subject: string, body = '') {
  const url = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('No email app found', `You can send an email to ${to}`);
  }
}
