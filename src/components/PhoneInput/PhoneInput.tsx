import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { parsePhoneNumber, isValidPhoneNumber, formatNumber } from 'libphonenumber-js';
import { Flex, Input, InputField, Pressable, Text as UIText } from '~/components/ui';

interface PhoneInputProps {
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export function PhoneInput({
  value = '',
  onChange,
  error,
  placeholder = 'Enter phone number',
}: PhoneInputProps) {
  const [countryCode, setCountryCode] = useState<CountryCode>('US' as CountryCode);
  const [callingCode, setCallingCode] = useState<string>('1');
  const [showCountryPicker, setShowCountryPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(value);

  const onCountrySelect = (country: Country) => {
    setCountryCode(country.cca2 as CountryCode);
    setCallingCode(country.callingCode[0]);
    setShowCountryPicker(false);

    // Update the full phone number with new country code
    if (phoneNumber) {
      const fullNumber = `+${country.callingCode[0]}${phoneNumber.replace(/\D/g, '')}`;
      onChange(fullNumber);
    }
  };

  const handlePhoneChange = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    setPhoneNumber(digits);

    // Create full international number
    const fullNumber = `+${callingCode}${digits}`;
    onChange(fullNumber);
  };

  const formatDisplayNumber = (number: string) => {
    console.log(number);
    try {
      if (number && isValidPhoneNumber(number)) {
        console.log(formatNumber(number, 'NATIONAL'));
        return formatNumber(number, 'NATIONAL');
      }
    } catch (error) {
      // If formatting fails, return the raw number
    }
    return number.replace(``, '');
  };

  return (
    <Flex className="w-full rounded-2xl bg-white p-6" gap={10}>
      <Pressable onPress={() => setShowCountryPicker(true)}>
        <Flex direction="row" align="center">
          <CountryPicker
            countryCode={countryCode}
            withFilter
            withFlag
            withCallingCode
            withEmoji
            onSelect={onCountrySelect}
            visible={showCountryPicker}
            onClose={() => setShowCountryPicker(false)}
          />
          <Text>+{callingCode}</Text>
        </Flex>
      </Pressable>

      <Input className="w-[18rem]">
        <InputField
          value={formatDisplayNumber(value)}
          onChangeText={handlePhoneChange}
          placeholder={placeholder}
          keyboardType="phone-pad"
          textContentType="telephoneNumber"
        />
      </Input>

      {error && <Text style={{ marginTop: 4, color: '#ef4444', fontSize: 14 }}>{error}</Text>}
    </Flex>
  );
}
