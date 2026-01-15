import { useCallback, useRef, useState } from 'react';
import { supabase } from '~/lib/supabase';

export function useEmailAvailability() {
  const [checkingEmail, setCheckingEmail] = useState(false);
  const checkingRef = useRef(false);

  const setChecking = (value: boolean) => {
    checkingRef.current = value;
    setCheckingEmail(value);
  };

  const checkEmailExists = useCallback(
    async (rawEmail: string | undefined | null) => {
      const emailToCheck = rawEmail?.trim();

      if (!emailToCheck || checkingRef.current) {
        return false;
      }

      setChecking(true);

      try {
        const { data, error } = await supabase
          .from('users')
          .select('id')
          .ilike('email', emailToCheck)
          .maybeSingle();

        if (error) {
          console.warn('Failed to verify email availability', error);
          return false;
        }

        return Boolean(data);
      } finally {
        setChecking(false);
      }
    },
    []
  );

  return { checkEmailExists, checkingEmail };
}
