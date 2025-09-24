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

type HostSelectModalProps = {
  title: string;
  modalType: 'host';
  value?: string; // whichever you prefer to store
  onChange: (v: string) => void;
  data: UsersRow[]; // required for select
};

type AgeLimitSelectModalProps = {
  title: string;
  modalType: 'age';
  value?: string; // whichever you prefer to store
  onChange: (v: string) => void;
  data: string[]; // required for select
};

interface TimePickerProps {
  temp: Date;
  setTemp: (date: Date) => void;
  onSave: () => void;
  onClose: () => void;
}

interface HostSelectProps {
  defaultValue?: string;
  value: string;
  onChange: (val: string) => void;
  data?: UsersRow[];
}

interface AgeLimitSelectProps {
  defaultValue?: string;
  value: string;
  onChange: (val: string) => void;
  data?: string[];
}

type MultiModalProps = TimeModalProps | HostSelectModalProps | AgeLimitSelectModalProps;

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

export function MultiModal({ title, modalType, value, onChange, data }: MultiModalProps) {
  const [open, setOpen] = useState(false);

  const openModal = () => setOpen(true);
  const closeModal = () => setOpen(false);

  if (modalType === 'time') {
    const [temp, setTemp] = useState<Date>(() => toDate(value));

    const saveTimeOnPress = () => {
      onChange(formatTime(temp));
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

  if (modalType === 'age') {
    const onSaveAgeLimit = (age: string) => {
      onChange(age);
      closeModal();
    };

    return (
      <Flex className="w-full">
        <Pressable onPress={openModal}>
          <Flex className="h-14 w-full justify-center rounded-xl bg-background-900 px-4">
            <Text className={cn(!value ? 'text-background-700' : 'text-white', 'text-base')}>
              {value || title}
            </Text>
          </Flex>
        </Pressable>

        <Modal visible={open} transparent animationType="fade" onRequestClose={closeModal}>
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={closeModal} />
          <View className="absolute bottom-0 left-0 right-0 h-1/3 rounded-t-3xl bg-background-dark p-4">
            <AgeLimitSelect data={data ?? []} value={value ?? ''} onChange={onSaveAgeLimit} />
          </View>
        </Modal>
      </Flex>
    );
  }

  const onSaveHost = (hostId: string) => {
    onChange(hostId);
    setOpen(false);
  };

  return (
    <Flex className="w-full">
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
        <View className="absolute bottom-0 left-0 right-0  h-1/3 rounded-t-3xl bg-background-dark p-4">
          <HostSelect data={data ?? []} value={value ?? ''} onChange={onSaveHost} />
        </View>
      </Modal>
    </Flex>
  );
}

function TimePicker({ temp, setTemp, onSave, onClose }: TimePickerProps) {
  return (
    <>
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

function HostSelect({ value, onChange, data }: HostSelectProps) {
  return (
    <View>
      <FlatList
        data={data}
        keyExtractor={(host) => host.id}
        renderItem={({ item: host }) => {
          const selected = host.id === value;
          return (
            <Pressable onPress={() => onChange(host.id)} className="px-4">
              <Text
                size="lg"
                bold={selected ? true : false}
                className={cn(selected ? 'text-primary' : 'text-white', 'py-2')}>
                {(host.first_name ?? '').trim()} {(host.last_name ?? '').trim()}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function AgeLimitSelect({ value, onChange, data }: AgeLimitSelectProps) {
  return (
    <View>
      <FlatList
        data={data}
        keyExtractor={(age) => age}
        renderItem={({ item }) => {
          const selected = item === value;
          return (
            <Pressable onPress={() => onChange(item)} className="px-4">
              <Text
                size="lg"
                bold={selected ? true : false}
                className={cn(selected ? 'text-primary' : 'text-white', 'py-2')}>
                {item}
              </Text>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
