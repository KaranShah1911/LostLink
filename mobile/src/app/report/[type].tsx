import { useRef, useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Button from '@/components/Button';
import CategoryIcon, { categoryColor } from '@/components/CategoryIcon';
import KeyboardAvoider from '@/components/KeyboardAvoider';
import PhotoField from '@/components/PhotoField';
import SubmittingOverlay from '@/components/SubmittingOverlay';
import TextField from '@/components/TextField';
import { errorCode, errorData, getErrorMessage, isUncertainError, itemsApi } from '@/lib/api';
import { newRequestId } from '@/lib/requestId';
import { useBlockLeaving } from '@/lib/useBlockLeaving';
import { formatPickedDate, toDateString } from '@/lib/format';
import { CATEGORIES, radius, ThemeColors } from '@/constants';
import type { Item, ItemType, PickedImage } from '@/types';
import { useTheme } from '@/context/ThemeContext';
import { useBottomPadding } from '@/lib/useBottomPadding';

type Field = 'title' | 'category' | 'description' | 'location';

/** Report Lost Item / Report Found Item form (the URL decides which: /report/LOST or /report/FOUND). */
export default function ReportItemScreen() {
  const { colors, styles } = useTheme(makeStyles);
  const params = useLocalSearchParams<{ type: string }>();
  const type: ItemType = params.type === 'FOUND' ? 'FOUND' : 'LOST';
  const isLost = type === 'LOST';
  const accent = isLost ? colors.coral : colors.green;

  const bottomPadding = useBottomPadding();
  const emptyForm = { title: '', category: '', description: '', location: '' };
  const [form, setForm] = useState<Record<Field, string>>(emptyForm);
  const [date, setDate] = useState(new Date());
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [image, setImage] = useState<PickedImage>();
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  // Idempotency key for this report. It is created once and reused for every retry, so a retry
  // after a timeout can never create a second report. A new one is made only after a confirmed success.
  const submissionId = useRef(newRequestId());
  // Set synchronously on the first tap, so a fast double tap cannot start two submissions.
  const inFlight = useRef(false);

  // While sending, the user cannot leave the screen (back button / gesture / header arrow).
  useBlockLeaving(submitting);

  const update = (field: Field) => (value: string) => setForm((current) => ({ ...current, [field]: value }));

  function openDatePicker() {
    Keyboard.dismiss();
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: date,
        mode: 'date',
        maximumDate: new Date(),
        onValueChange: (_event, picked) => setDate(picked),
      });
    } else {
      setShowIosPicker((visible) => !visible);
    }
  }

  function validate() {
    const next: Partial<Record<Field, string>> = {};
    const title = form.title.trim();
    if (title.length < 2 || title.length > 80) next.title = 'Item name must be 2 to 80 characters';
    if (!form.category) next.category = 'Choose a category';
    // Description and location are optional for LOST items, required for FOUND items.
    const description = form.description.trim();
    if ((!isLost || description) && (description.length < 5 || description.length > 1000))
      next.description = 'Description must be 5 to 1000 characters';
    const location = form.location.trim();
    if ((!isLost || location) && (location.length < 2 || location.length > 120))
      next.location = 'Location must be 2 to 120 characters';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit() {
    if (inFlight.current || !validate()) return;
    inFlight.current = true;
    Keyboard.dismiss();
    setSubmitting(true); // locks the whole form (see SubmittingOverlay and the disabled fields)
    try {
      const { item, alreadySaved } = await itemsApi.create({
        title: form.title.trim(),
        type,
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        date: toDateString(date),
        image,
        submissionId: submissionId.current,
      });
      // Confirmed by the server: clear the form and prepare a fresh id for the next report.
      setForm(emptyForm);
      setImage(undefined);
      setDate(new Date());
      submissionId.current = newRequestId();
      Alert.alert(
        alreadySaved ? 'Report already saved' : 'Report submitted',
        alreadySaved
          ? 'Your earlier attempt had already reached LostLink, so no duplicate was created.'
          : isLost
            ? 'Your lost item report is live. Other students can now see it in Browse.'
            : 'Thank you! Your found item report is live. The owner can now submit a claim, which you will review.',
        [{ text: 'View report', onPress: () => router.replace(`/item/${item._id}`) }],
        { cancelable: false }
      );
    } catch (error) {
      showSubmitError(error);
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }

  /** Explains what happened. The form data, photo and submission id are always kept. */
  function showSubmitError(error: unknown) {
    if (isUncertainError(error)) {
      // No answer from the server: the report may or may not have been saved.
      Alert.alert(
        'Could not confirm your report',
        'The connection was lost before LostLink replied, so your report may already be saved.\n\nYour details and photo are kept. Tap Submit again: it is safe, LostLink will not create a duplicate.'
      );
      return;
    }
    if (errorCode(error) === 'SUBMISSION_CONFLICT') {
      // The first attempt was saved, but the details were changed before retrying.
      const existing = errorData<{ item: Item }>(error)?.item;
      Alert.alert('Report already saved', getErrorMessage(error), [
        { text: 'Stay here', style: 'cancel' },
        ...(existing ? [{ text: 'Open saved report', onPress: () => router.replace(`/item/${existing._id}`) }] : []),
      ]);
      return;
    }
    // The server answered with an error, so nothing was saved.
    Alert.alert('Could not submit report', `${getErrorMessage(error)}\n\nYour details are kept, so you can try again.`);
  }

  return (
    <KeyboardAvoider>
      <Stack.Screen
        options={{
          title: isLost ? 'Report Lost Item' : 'Report Found Item',
          headerStyle: { backgroundColor: accent },
          // While sending: no back arrow and no avatar button, so the user cannot leave mid-request.
          headerBackVisible: !submitting,
          gestureEnabled: !submitting,
          ...(submitting ? { headerRight: () => null } : {}),
        }}
      />
      <ScrollView
        // Bottom padding = the phone's navigation-bar height (safe area) + normal spacing.
        contentContainerStyle={[styles.container, { paddingBottom: bottomPadding }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.banner, { backgroundColor: isLost ? colors.coralSoft : colors.greenSoft }]}>
          <Ionicons name={isLost ? 'alert-circle' : 'checkmark-circle'} size={22} color={accent} />
          <Text style={styles.bannerText}>
            {isLost
              ? 'Tell others what you lost and where you last saw it.'
              : 'Describe the item you found. Keep one private detail back to check claims.'}
          </Text>
        </View>

        <TextField label="Item name" icon="pricetag-outline" value={form.title} onChangeText={update('title')} placeholder="e.g. Black leather wallet" error={errors.title} editable={!submitting} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((category) => {
            const selected = form.category === category;
            const color = categoryColor(category);
            return (
              <Pressable
                key={category}
                onPress={() => update('category')(category)}
                disabled={submitting}
                style={[styles.chip, selected && { backgroundColor: color, borderColor: color }]}
              >
                <CategoryIcon category={category} size={15} color={selected ? colors.white : color} />
                <Text style={[styles.chipText, selected && { color: colors.white }]}>{category}</Text>
              </Pressable>
            );
          })}
        </View>
        {!!errors.category && <Text style={styles.error}>{errors.category}</Text>}

        <TextField
          label={isLost ? 'Description (optional)' : 'Description'}
          value={form.description}
          onChangeText={update('description')}
          placeholder="Colour, brand, distinguishing marks..."
          multiline
          editable={!submitting}
          error={errors.description}
        />
        <TextField
          label={isLost ? 'Last seen location (optional)' : 'Found location'}
          icon="location-outline"
          value={form.location}
          onChangeText={update('location')}
          placeholder="e.g. Central Library, 2nd floor"
          editable={!submitting}
          error={errors.location}
        />

        <Text style={styles.label}>{isLost ? 'Date lost' : 'Date found'}</Text>
        <Pressable onPress={openDatePicker} disabled={submitting} style={styles.dateField}>
          <Ionicons name="calendar" size={20} color={colors.secondary} />
          <Text style={styles.dateText}>{formatPickedDate(date)}</Text>
          <Text style={styles.change}>Change</Text>
        </Pressable>
        {showIosPicker && (
          <DateTimePicker value={date} mode="date" display="inline" maximumDate={new Date()} onValueChange={(_event, picked) => setDate(picked)} />
        )}

        <PhotoField image={image} onChange={setImage} disabled={submitting} />

        <Button
          title={isLost ? 'Submit Lost Report' : 'Submit Found Report'}
          icon="send"
          variant={isLost ? 'coral' : 'success'}
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
      <SubmittingOverlay
        visible={submitting}
        title="Submitting your report..."
        message={image ? 'Uploading the photo and saving your report. Please keep the app open.' : 'Saving your report. Please keep the app open.'}
      />
    </KeyboardAvoider>
  );
}

const makeStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { padding: 16 },
    banner: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: radius.md, marginBottom: 20 },
    bannerText: { flex: 1, color: colors.text, fontSize: 14 },
    label: { fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 6 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
      backgroundColor: colors.white,
      borderWidth: 1.5,
      borderColor: colors.border,
    },
    chipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
    error: { color: colors.red, fontSize: 13, marginBottom: 8 },
    dateField: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: colors.white,
      borderWidth: 1.5,
      borderColor: colors.border,
      borderRadius: radius.md,
      padding: 14,
      marginBottom: 16,
    },
    dateText: { flex: 1, fontSize: 16, color: colors.text },
    change: { color: colors.secondary, fontWeight: '800' },
  });
