import { useState } from 'react';
import { Flex, Input, Pressable, Text } from '../ui';
import { FlatList, Modal, Platform, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { cn } from '~/utils/cn';
import { UsersRow } from '~/types/user.type';

type TimeModalProps = {
  title: string;
  modalType: 'time';
  value: string; // time picker uses string
  onChange: (v: string) => void;
  data?: never; // not used
};

type SelectModalProps = {
  title: string;
  modalType: 'select';
  value?: string | undefined; // whichever you prefer to store
  onChange: (v: string) => void;
  data: UsersRow[]; // required for select
};

type MultiModalProps = TimeModalProps | SelectModalProps;

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

function fullName(u?: UsersRow | string): string | undefined {
  if (!u) return undefined;
  if (typeof u === 'string') return u;
  return [u.first_name ?? '', u.last_name ?? ''].join(' ').trim() || undefined;
}

export function MultiModal({ title, modalType, value, onChange, data }: MultiModalProps) {
  const [open, setOpen] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  if (modalType === 'time') {
    // ✅ value is string here
    const [temp, setTemp] = useState<Date>(() => toDate(value));

    const saveTimeOnPress = () => {
      onChange(formatTime(temp)); // onChange expects string
      closeModal();
    };

    return (
      <Flex className="w-52">
        <Pressable onPress={openModal}>
          <Flex className="h-14 w-full justify-center rounded-xl bg-background-900 px-4">
            <Text className={cn(!value ? 'text-background-700' : 'text-white', 'text-base')}>
              {value || title}
            </Text>
          </Flex>
        </Pressable>

        <Modal visible={open} transparent animationType="fade" onRequestClose={closeModal}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={closeModal} />
          <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-background-dark p-4">
            <TimePicker
              temp={temp}
              setTemp={setTemp}
              onSave={saveTimeOnPress}
              onClose={closeModal}
            />
          </View>
        </Modal>
      </Flex>
    );
  }

  return (
    <Flex className="w-52">
      <Pressable onPress={() => setOpen(true)}>
        <Flex className="h-14 w-full justify-center rounded-xl bg-background-900 px-4">
          <Text className={cn(!title ? 'text-background-700' : 'text-white', 'text-base')}>
            {title}
          </Text>
        </Flex>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          onPress={() => setOpen(false)}
        />
        <View className="absolute bottom-0 left-0 right-0 rounded-t-3xl bg-background-dark p-4">
          <HostSelect data={data ?? []} value={value ?? ''} onChange={onChange} />
        </View>
      </Modal>
    </Flex>
  );
}
interface TimePickerProps {
  temp: Date;
  setTemp: (date: Date) => void;
  onSave: () => void;
  onClose: () => void;
}

function TimePicker({ temp, setTemp, onSave, onClose }: TimePickerProps) {
  return (
    <>
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
      <Pressable onPress={onSave} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
        <Text weight="600" size="xl" className="text-center text-primary">
          Save
        </Text>
      </Pressable>
      <Pressable onPress={onClose} style={{ paddingVertical: 10, paddingHorizontal: 14 }}>
        <Text weight="600" size="xl" className="text-center text-white">
          Cancel
        </Text>
      </Pressable>
    </>
  );
}
interface HostSelectProps {
  defaultValue?: string;
  value: string;
  onChange: (val: string) => void; // better signature
  data?: UsersRow[]; // 👈 allow undefined
}
function HostSelect({ defaultValue, value, onChange, data }: HostSelectProps) {
  return (
    <View>
      <FlatList
        data={data}
        keyExtractor={(host) => host.id}
        renderItem={({ item: host }) => {
          const selected = host.id === value;
          return (
            <Pressable onPress={() => onChange(host.id)} className="px-4">
              <Text className={cn(selected ? 'text-red' : 'text-white', 'py-2')}>
                {(host.first_name ?? '').trim()} {(host.last_name ?? '').trim()}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
