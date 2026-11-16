import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '@/components/Avatar';
import Button from '@/components/Button';
import ImagePickerSheet from '@/components/ImagePickerSheet';
import KeyboardAvoider from '@/components/KeyboardAvoider';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage, profileApi } from '@/lib/api';
import { formatTimestamp } from '@/lib/format';
import { cardShadow, colors, radius } from '@/constants';
import type { PickedImage } from '@/types';

/**
 * Profile, opened from the avatar at the top-right. Same screen for students and admins.
 * A new photo is previewed first and only uploaded after "Save Photo". The saved user goes
 * into AuthContext, so the header avatar and every other screen update straight away.
 */
export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [preview, setPreview] = useState<PickedImage | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState('');
  const [nameBusy, setNameBusy] = useState(false);

  if (!user) return null;
  const isAdmin = user.role === 'ADMIN';

  async function savePhoto() {
    if (!preview) return;
    setPhotoBusy(true);
    try {
      await updateUser(await profileApi.uploadPhoto(preview));
      setPreview(null);
    } catch (error) {
      Alert.alert('Could not upload photo', getErrorMessage(error));
    } finally {
      setPhotoBusy(false);
    }
  }

  function confirmRemovePhoto() {
    Alert.alert('Remove profile photo?', 'Your initials will be shown instead.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setPhotoBusy(true);
          try {
            await updateUser(await profileApi.removePhoto());
          } catch (error) {
            Alert.alert('Could not remove photo', getErrorMessage(error));
          } finally {
            setPhotoBusy(false);
          }
        },
      },
    ]);
  }

  async function saveName() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 60) {
      Alert.alert('Invalid name', 'Name must be 2 to 60 characters.');
      return;
    }
    setNameBusy(true);
    try {
      await updateUser(await profileApi.updateName(trimmed));
      setEditingName(false);
    } catch (error) {
      Alert.alert('Could not update name', getErrorMessage(error));
    } finally {
      setNameBusy(false);
    }
  }

  function confirmLogout() {
    Alert.alert('Log out?', 'You will need to log in again to use LostLink.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: () => logout() },
    ]);
  }

  const rows: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; color: string }[] = [
    { icon: 'mail', label: 'Email', value: user.email, color: colors.teal },
    { icon: 'shield-checkmark', label: 'Role', value: user.role, color: isAdmin ? colors.purple : colors.coral },
    { icon: 'calendar', label: 'Member since', value: formatTimestamp(user.createdAt), color: colors.green },
  ];

  return (
    <KeyboardAvoider>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.banner} />
          <Pressable onPress={() => setSheetOpen(true)} disabled={photoBusy} accessibilityLabel="Change profile photo">
            <View style={styles.avatarRing}>
              <Avatar name={user.name} uri={preview?.uri ?? user.profileImage} size={104} />
            </View>
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={16} color={colors.white} />
            </View>
          </Pressable>

          {preview ? (
            <View style={styles.photoActions}>
              <Button title="Save Photo" icon="checkmark" variant="teal" small loading={photoBusy} onPress={savePhoto} />
              <Button title="Cancel" variant="outline" small disabled={photoBusy} onPress={() => setPreview(null)} />
            </View>
          ) : (
            <View style={styles.photoActions}>
              <Button
                title={user.profileImage ? 'Change Photo' : 'Add Photo'}
                icon="camera-outline"
                variant="outline"
                small
                loading={photoBusy}
                onPress={() => setSheetOpen(true)}
              />
              {user.profileImage && <Button title="Remove" variant="dangerOutline" small disabled={photoBusy} onPress={confirmRemovePhoto} />}
            </View>
          )}
          {preview && <Text style={styles.previewHint}>Preview: tap Save Photo to keep it.</Text>}

          {editingName ? (
            <View style={styles.nameEdit}>
              <TextInput value={name} onChangeText={setName} style={styles.nameInput} autoFocus maxLength={60} />
              <Button title="Save" small variant="teal" loading={nameBusy} onPress={saveName} />
              <Button title="Cancel" variant="outline" small disabled={nameBusy} onPress={() => setEditingName(false)} />
            </View>
          ) : (
            <Pressable
              style={styles.nameRow}
              onPress={() => {
                setName(user.name);
                setEditingName(true);
              }}
            >
              <Text style={styles.name}>{user.name}</Text>
              <Ionicons name="pencil" size={16} color={colors.muted} />
            </Pressable>
          )}
          <View style={[styles.roleBadge, { backgroundColor: isAdmin ? colors.purpleSoft : colors.coralSoft }]}>
            <Text style={[styles.roleText, { color: isAdmin ? colors.purple : colors.coral }]}>{user.role}</Text>
          </View>
        </View>

        <View style={styles.card}>
          {rows.map((row, index) => (
            <View key={row.label} style={[styles.row, index > 0 && styles.rowBorder]}>
              <View style={[styles.rowIcon, { backgroundColor: `${row.color}1F` }]}>
                <Ionicons name={row.icon} size={18} color={row.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                <Text style={styles.rowValue}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Button title="Log Out" icon="log-out-outline" variant="dangerOutline" onPress={confirmLogout} />
      </ScrollView>

      <ImagePickerSheet visible={sheetOpen} onClose={() => setSheetOpen(false)} onPicked={setPreview} square />
    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 20 },
  banner: {
    position: 'absolute',
    top: -16,
    left: -16,
    right: -16,
    height: 90,
    backgroundColor: colors.navy,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  avatarRing: { marginTop: 24, padding: 4, borderRadius: 60, backgroundColor: colors.white },
  cameraBadge: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.coral,
    borderWidth: 3,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoActions: { flexDirection: 'row', gap: 8, marginTop: 12 },
  previewHint: { fontSize: 12, color: colors.teal, marginTop: 6, fontWeight: '600' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  name: { fontSize: 22, fontWeight: '800', color: colors.text },
  nameEdit: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, alignSelf: 'stretch' },
  nameInput: {
    flex: 1,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.teal,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 16,
    color: colors.text,
  },
  roleBadge: { marginTop: 8, paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill },
  roleText: { fontWeight: '800', fontSize: 12, letterSpacing: 0.6 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, paddingHorizontal: 16, marginBottom: 20, ...cardShadow },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  rowBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 12, color: colors.muted },
  rowValue: { fontSize: 16, color: colors.text, fontWeight: '600', marginTop: 2 },
});
