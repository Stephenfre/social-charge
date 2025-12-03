import React, { useEffect, useMemo, useState } from 'react';
import { Keyboard, Modal, Platform, Text as RNText, useColorScheme, View } from 'react-native';
import { Picker } from '@react-native-picker/picker';

import { Flex, Input, InputField, Pressable, Text } from '~/components/ui';
import { cn } from '~/utils/cn';

interface DatePickerInputProps {
  label: string;
  value?: Date;
  onChange: (date: Date) => void;
  error?: string;
  containerClassName?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  inputClassName?: string;
  inputFieldClassName?: string;
  labelClassName?: string;
  floatingLabelWrapperClassName?: string;
  activeLabelClassName?: string;
  onFocus?: () => void;
  onBlur?: () => void;
}

const monthNames = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function DatePickerInput({
  label,
  value,
  onChange,
  error,
  containerClassName,
  minimumDate,
  maximumDate,
  inputClassName,
  inputFieldClassName,
  labelClassName,
  floatingLabelWrapperClassName,
  activeLabelClassName,
  onFocus,
  onBlur,
}: DatePickerInputProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showPicker, setShowPicker] = useState(false);

  const today = useMemo(() => new Date(), []);
  const fallbackMin = useMemo(() => new Date(today.getFullYear() - 100, 0, 1), [today]);
  const fallbackMax = useMemo(() => new Date(today.getFullYear() - 18, 11, 31), [today]);
  const minDate = minimumDate ?? fallbackMin;
  const maxDate = maximumDate ?? fallbackMax;

  const clampDate = (date: Date) => {
    if (date < minDate) return minDate;
    if (date > maxDate) return maxDate;
    return date;
  };

  const initialDate = clampDate(value ?? maxDate);

  const [tempMonth, setTempMonth] = useState(initialDate.getMonth() + 1);
  const [tempDay, setTempDay] = useState(initialDate.getDate());
  const [tempYear, setTempYear] = useState(initialDate.getFullYear());

  useEffect(() => {
    if (value) {
      const safeDate = clampDate(value);
      setTempMonth(safeDate.getMonth() + 1);
      setTempDay(safeDate.getDate());
      setTempYear(safeDate.getFullYear());
    }
  }, [value]);

  const months = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const years = useMemo(() => {
    const minYear = minDate.getFullYear();
    const maxYear = maxDate.getFullYear();
    return Array.from({ length: maxYear - minYear + 1 }, (_, i) => maxYear - i);
  }, [minDate, maxDate]);

  const daysInMonth = useMemo(
    () => new Date(tempYear, tempMonth, 0).getDate(),
    [tempMonth, tempYear]
  );

  useEffect(() => {
    if (tempDay > daysInMonth) {
      setTempDay(daysInMonth);
    }
  }, [daysInMonth, tempDay]);

  const days = useMemo(() => Array.from({ length: daysInMonth }, (_, i) => i + 1), [daysInMonth]);

  const formattedValue = useMemo(() => {
    if (!value) return '';
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    const year = value.getFullYear();
    return `${month}/${day}/${year}`;
  }, [value]);

  const openPicker = () => {
    Keyboard.dismiss();
    onFocus?.();
    setShowPicker(true);
  };

  const closePicker = () => {
    setShowPicker(false);
    onBlur?.();
  };

  const persistTempDate = () => {
    const nextDate = clampDate(new Date(tempYear, tempMonth - 1, tempDay));
    onChange(nextDate);
    closePicker();
  };

  const setTempAndPersist = (nextYear: number, nextMonth: number, nextDay: number) => {
    const normalizedDay = Math.min(nextDay, new Date(nextYear, nextMonth, 0).getDate());
    const normalizedDate = clampDate(new Date(nextYear, nextMonth - 1, normalizedDay));
    setTempYear(normalizedDate.getFullYear());
    setTempMonth(normalizedDate.getMonth() + 1);
    setTempDay(normalizedDate.getDate());
    onChange(normalizedDate);
  };

  const baseLabelElement = (
    <Text size="sm" bold className={cn('text-typography-900', labelClassName)}>
      {label}
    </Text>
  );

  return (
    <Flex className={cn('w-full gap-2', containerClassName)}>
      {!inputClassName && baseLabelElement}
      <Pressable onPress={openPicker} accessibilityRole="button" hitSlop={8}>
        <Input
          size="2xl"
          pointerEvents="none"
          className={cn('rounded-2xl border-background-100 bg-white', inputClassName)}>
          <InputField
            pointerEvents="none"
            editable={false}
            value={formattedValue}
            placeholder="MM/DD/YYYY"
            className={inputFieldClassName}
          />
          {inputClassName && (
            <View
              pointerEvents="none"
              className={cn(
                'absolute left-3 top-0 -translate-y-1/2',
                floatingLabelWrapperClassName
              )}>
              <Text
                size="sm"
                bold
                className={cn(labelClassName, showPicker && activeLabelClassName)}>
                {label}
              </Text>
            </View>
          )}
        </Input>
      </Pressable>
      {error && (
        <Text size="sm" className="text-error-500">
          {error}
        </Text>
      )}

      {Platform.OS === 'ios' && (
        <Modal visible={showPicker} transparent animationType="slide">
          <View className="flex-1 justify-end">
            <Pressable className="flex-1" onPress={closePicker} />
            <View className="rounded-t-3xl bg-background-900">
              <View className="flex-row items-center justify-between px-4 py-2">
                <Pressable onPress={closePicker}>
                  <RNText className="text-base font-bold text-primary-500">Cancel</RNText>
                </Pressable>
                <Pressable onPress={persistTempDate}>
                  <RNText className="text-base font-bold text-primary-500">Done</RNText>
                </Pressable>
              </View>

              <View className="flex-row" style={{ width: '100%' }}>
                <View style={{ flex: 3 }}>
                  <Picker
                    selectedValue={tempMonth}
                    onValueChange={(itemValue) => setTempMonth(itemValue as number)}
                    itemStyle={{
                      color: 'white',
                    }}>
                    {months.map((m) => (
                      <Picker.Item key={m} label={monthNames[m - 1]} value={m} />
                    ))}
                  </Picker>
                </View>

                <View style={{ flex: 2 }}>
                  <Picker
                    selectedValue={tempDay}
                    onValueChange={(itemValue) => setTempDay(itemValue as number)}
                    itemStyle={{
                      color: 'white',
                    }}>
                    {days.map((d) => (
                      <Picker.Item key={d} label={`${d}`} value={d} />
                    ))}
                  </Picker>
                </View>

                <View style={{ flex: 2 }}>
                  <Picker
                    selectedValue={tempYear}
                    onValueChange={(itemValue) => setTempYear(itemValue as number)}
                    itemStyle={{
                      color: 'white',
                    }}>
                    {years.map((y) => (
                      <Picker.Item key={y} label={`${y}`} value={y} />
                    ))}
                  </Picker>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {Platform.OS === 'android' && showPicker && (
        <View className="mb-4 overflow-hidden rounded-2xl border border-background-100 bg-white">
          <View className="flex-row" style={{ width: '100%' }}>
            <View style={{ flex: 3 }}>
              <Picker
                selectedValue={tempMonth}
                onValueChange={(itemValue) => {
                  const month = itemValue as number;
                  setTempMonth(month);
                  setTempAndPersist(tempYear, month, tempDay);
                }}>
                {months.map((m) => (
                  <Picker.Item key={m} label={monthNames[m - 1]} value={m} />
                ))}
              </Picker>
            </View>

            <View style={{ flex: 2 }}>
              <Picker
                selectedValue={tempDay}
                onValueChange={(itemValue) => {
                  const day = itemValue as number;
                  setTempDay(day);
                  setTempAndPersist(tempYear, tempMonth, day);
                }}>
                {days.map((d) => (
                  <Picker.Item key={d} label={`${d}`} value={d} />
                ))}
              </Picker>
            </View>

            <View style={{ flex: 2 }}>
              <Picker
                selectedValue={tempYear}
                onValueChange={(itemValue) => {
                  const year = itemValue as number;
                  setTempYear(year);
                  setTempAndPersist(year, tempMonth, tempDay);
                }}>
                {years.map((y) => (
                  <Picker.Item key={y} label={`${y}`} value={y} />
                ))}
              </Picker>
            </View>
          </View>
        </View>
      )}
    </Flex>
  );
}
