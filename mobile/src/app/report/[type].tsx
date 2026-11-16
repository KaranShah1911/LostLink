import { useState } from 'react';
import { Alert, Keyboard, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import Button from '@/components/Button';
import CategoryIcon, { categoryColor } from '@/components/CategoryIcon';
import KeyboardAvoider from '@/components/KeyboardAvoider';
import PhotoField from '@/components/PhotoField';
import TextField from '@/components/TextField';
import { getErrorMessage, itemsApi } from '@/lib/api';
import { formatPickedDate, toDateString } from '@/lib/format';
import { CATEGORIES, colors, radius } from '@/constants';
import type { ItemType, PickedImage } from '@/types';

type Field = 'title' | 'category' | 'description' | 'location';

/** Report Lost Item / Report Found Item form (the URL decides which: /report/LOST or /report/FOUND). */
export default function ReportItemScreen() {
  const params = useLocalSearchParams<{ type: string }>();
  const type: ItemType = params.type === 'FOUND' ? 'FOUND' : 'LOST';
  const isLost = type === 'LOST';
  const accent = isLost ? colors.coral : colors.green;

  const [form, setForm] = useState<Record<Field, string>>({ title: '', category: '', description: '', location: '' });
  const [date, setDate] = useState(new Date());
  const [showIosPicker, setShowIosPicker] = useState(false);
  const [image, setImage] = useState<PickedImage>();
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [submitting, setSubmitting] = useState(false);

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
    if (!validate()) return;
    Keyboard.dismiss();
    setSubmitting(true);
    try {
      const item = await itemsApi.create({
        title: form.title.trim(),
        type,
        category: form.category,
        description: form.description.trim(),
        location: form.location.trim(),
        date: toDateString(date),
        image,
      });
      Alert.alert(
        'Report submitted',
        isLost
          ? 'Your lost item report is live. Other students can now see it in Browse.'
          : 'Thank you! Your found item report is live. The owner can now submit a claim, which you will review.',
        [{ text: 'View report', onPress: () => router.replace(`/item/${item._id}`) }],
        { cancelable: false }
      );
    } catch (error) {
      Alert.alert('Could not submit report', getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoider>
      <Stack.Screen options={{ title: isLost ? 'Report Lost Item' : 'Report Found Item', headerStyle: { backgroundColor: accent } }} />
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={[styles.banner, { backgroundColor: isLost ? colors.coralSoft : colors.greenSoft }]}>
          <Ionicons name={isLost ? 'alert-circle' : 'checkmark-circle'} size={22} color={accent} />
          <Text style={styles.bannerText}>
            {isLost
              ? 'Tell others what you lost and where you last saw it.'
              : 'Describe the item you found. Keep one private detail back to check claims.'}
          </Text>
        </View>

        <TextField label="Item name" icon="pricetag-outline" value={form.title} onChangeText={update('title')} placeholder="e.g. Black leather wallet" error={errors.title} />

        <Text style={styles.label}>Category</Text>
        <View style={styles.chips}>
          {CATEGORIES.map((category) => {
            const selected = form.category === category;
            const color = categoryColor(category);
            return (
              <Pressable
                key={category}
                onPress={() => update('category')(category)}
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
          error={errors.description}
        />
        <TextField
          label={isLost ? 'Last seen location (optional)' : 'Found location'}
          icon="location-outline"
          value={form.location}
          onChangeText={update('location')}
          placeholder="e.g. Central Library, 2nd floor"
          error={errors.location}
        />

        <Text style={styles.label}>{isLost ? 'Date lost' : 'Date found'}</Text>
        <Pressable onPress={openDatePicker} style={styles.dateField}>
          <Ionicons name="calendar" size={20} color={colors.teal} />
          <Text style={styles.dateText}>{formatPickedDate(date)}</Text>
          <Text style={styles.change}>Change</Text>
        </Pressable>
        {showIosPicker && (
          <DateTimePicker value={date} mode="date" display="inline" maximumDate={new Date()} onValueChange={(_event, picked) => setDate(picked)} />
        )}

        <PhotoField image={image} onChange={setImage} />

        <Button
          title={isLost ? 'Submit Lost Report' : 'Submit Found Report'}
          icon="send"
          variant={isLost ? 'coral' : 'success'}
          onPress={handleSubmit}
          loading={submitting}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
    </KeyboardAvoider>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40 },
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
  change: { color: colors.teal, fontWeight: '800' },
});
