import { useState } from 'react';
import { Flex, Pressable, Text } from '../ui';
import { Modal, Platform, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { cn } from '~/utils/cn';

const formatTime = (d: Date) => {
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12; // midnight or noon -> 12
  const mm = String(minutes).padStart(2, '0');
  return `${hours}:${mm} ${ampm}`;
};

const toDate = (t?: string) => {
  const base = new Date();
  if (!t) return base;

  // handle "hh:mm AM/PM"
  const [time, meridian] = t.split(' ');
  if (time) {
    const [hh, mm] = time.split(':').map(Number);
    let hours = hh;
    if (meridian?.toUpperCase() === 'PM' && hh < 12) hours += 12;
    if (meridian?.toUpperCase() === 'AM' && hh === 12) hours = 0;
    base.setHours(hours, mm || 0, 0, 0);
  }
  return base;
};
export function TimePickerModal({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Date>(toDate(value));

  const openModal = () => {
    setOpen(true);
  };
  const closeModal = () => setOpen(false);
  const save = () => {
    onChange(formatTime(temp));
    closeModal();
  };

  return (
    <Flex className="w-52">
      <Pressable onPress={openModal}>
        <Flex className="h-14 w-full justify-center rounded-xl bg-background-900 px-4">
          <Text className={cn(!value ? 'text-background-700' : 'text-white', 'text-base')}>
            {value || 'Pick start time'}
          </Text>
        </Flex>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={closeModal}>
        {/* Backdrop */}
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={closeModal} />

        {/* Sheet */}
        <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-background-dark p-4">
          {/* Inline picker inside modal */}
          <DateTimePicker
            mode="time"
            value={temp}
            is24Hour={false}
            minuteInterval={5}
            display={Platform.OS === 'android' ? 'spinner' : 'spinner'}
            onChange={(_, d) => {
              if (d) setTemp(d);
            }}
            textColor="white"
          />

          {/* Actions */}

          <Pressable onPress={save} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
            <Text weight="600" size="xl" className="text-center text-primary">
              Save
            </Text>
          </Pressable>
          <Pressable onPress={closeModal} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
            <Text weight="600" size="xl" className="text-center text-white">
              Cancel
            </Text>
          </Pressable>
        </View>
      </Modal>
    </Flex>
  );
}
