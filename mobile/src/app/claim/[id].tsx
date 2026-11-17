import { useCallback, useRef, useState } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '@/components/Button';
import ItemImage from '@/components/ItemImage';
import KeyboardAvoider from '@/components/KeyboardAvoider';
import TextField from '@/components/TextField';
import { ErrorBanner, ErrorState, Loading } from '@/components/StateViews';
import { claimsApi, getErrorMessage, isUncertainError, itemsApi } from '@/lib/api';
import { newRequestId } from '@/lib/requestId';
import { useBlockLeaving } from '@/lib/useBlockLeaving';
import { formatDate } from '@/lib/format';
import { useFocusData } from '@/lib/useFocusData';
import { cardShadow, radius, ThemeColors } from '@/constants';
import { useTheme } from '@/context/ThemeContext';
import { useBottomPadding } from '@/lib/useBottomPadding';

const MIN_LENGTH = 10;
const MAX_LENGTH = 1000;

/** Form where a student explains why a FOUND item belongs to them. */
export default function ClaimItemScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const { id } = useLocalSearchParams<{ id: string }>();
  const fetchItem = useCallback(() => itemsApi.get(id), [id]);
  const { data, loading, error, retry } = useFocusData(fetchItem);

  const [description, setDescription] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const bottomPadding = useBottomPadding();
  // Idempotency key for this claim, reused for every retry (see POST /api/items/:id/claims).
  const requestId = useRef(newRequestId());
  // Blocks a second submission from a fast double tap, before React has re-rendered.
  const inFlight = useRef(false);
  useBlockLeaving(submitting);

  if (loading) return <Loading />;
  if (error && !data) return <ErrorState message={error} onRetry={retry} />;
  if (!data) return null;
  const { item } = data;

  async function handleSubmit() {
    const text = description.trim();
    if (inFlight.current) return;
    setServerError('');
    if (text.length < MIN_LENGTH) {
      setFieldError(`Please write at least ${MIN_LENGTH} characters`);
      return;
    }
    setFieldError('');
    Keyboard.dismiss();
    inFlight.current = true;
    setSubmitting(true);
    try {
      const { alreadySaved } = await claimsApi.submit(item._id, text, requestId.current);
      Alert.alert(
        'Claim submitted',
        `${alreadySaved ? 'Your earlier attempt had already reached LostLink, so no duplicate was created. ' : ''}The student who found this item will review your claim. You can follow its status in My Activity → My Claims.`,
        [{ text: 'OK', onPress: () => router.back() }],
        { cancelable: false }
      );
    } catch (err) {
      setServerError(
        isUncertainError(err)
          ? 'Could not confirm your claim: the connection was lost before LostLink replied, so it may already be saved. Tap Submit Claim again. It is safe, no duplicate will be created.'
          : getErrorMessage(err)
      );
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoider>
      <Stack.Screen options={{ headerBackVisible: !submitting, gestureEnabled: !submitting, ...(submitting ? { headerRight: () => null } : {}) }} />
      <ScrollView contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]} keyboardShouldPersistTaps="handled">
        <View style={styles.itemCard}>
          <ItemImage uri={item.imageUrl} category={item.category} style={styles.thumb} />
          <View style={{ flex: 1 }}>
            <Text style={styles.itemTitle} numberOfLines={2}>
              {item.title}
            </Text>
            <Text style={styles.itemMeta}>
              Found at {item.location} · {formatDate(item.date)}
            </Text>
          </View>
        </View>

        <View style={styles.tips}>
          <View style={styles.tipsHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={colors.secondary} />
            <Text style={styles.tipsTitle}>Prove it is yours</Text>
          </View>
          <Text style={styles.tipText}>Mention details that are not visible in the listing, for example:</Text>
          <Text style={styles.tipText}>• Initials, name or marks inside the item</Text>
          <Text style={styles.tipText}>• What it contains (cards, notes, keys…)</Text>
          <Text style={styles.tipText}>• Stickers, scratches, a keychain or case</Text>
          <Text style={[styles.tipText, { marginTop: 6 }]}>
            Only the person who found the item can read your claim.
          </Text>
        </View>

        <TextField
          label="Why does this item belong to you?"
          value={description}
          editable={!submitting}
          onChangeText={setDescription}
          placeholder="e.g. It's my black wallet. My initials KS are written inside, and it has my library card and a small red keychain."
          multiline
          maxLength={MAX_LENGTH}
          error={fieldError}
          hint={`${description.trim().length}/${MAX_LENGTH} characters`}
        />

        <ErrorBanner message={serverError} />

        <Button title="Submit Claim" icon="send-outline" variant="purple" onPress={handleSubmit} loading={submitting} />
      </ScrollView>
    </KeyboardAvoider>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { padding: 16 },
    itemCard: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: radius.lg,
      padding: 12,
      marginBottom: 16,
      ...cardShadow,
    },
    thumb: { width: 64, height: 64, borderRadius: radius.md },
    itemTitle: { fontSize: 16, fontWeight: '800', color: colors.text },
    itemMeta: { fontSize: 13, color: colors.muted, marginTop: 4 },
    tips: { backgroundColor: colors.purpleSoft, borderRadius: radius.md, padding: 14, marginBottom: 18, gap: 3 },
    tipsHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    tipsTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
    tipText: { fontSize: 13, color: colors.text, lineHeight: 19 },
  });
