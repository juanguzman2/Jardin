import { useEffect, useRef, useState } from 'react';
import { StyleSheet, TextInput, type TextInputProps, View } from 'react-native';

import { T } from './Text';
import { font, radius, spacing, touch, useTheme } from './theme';

interface FieldProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  help?: string;
  error?: string | null;
}

export function Field({ label, help, error, multiline, ...props }: FieldProps) {
  const { c } = useTheme();
  return (
    <View style={styles.wrap}>
      {label ? <T style={styles.label}>{label}</T> : null}
      {help ? <T variant="small">{help}</T> : null}
      <TextInput
        placeholderTextColor={c.muted}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        accessibilityLabel={label ?? props.placeholder}
        {...props}
        style={[
          styles.input,
          multiline && styles.multiline,
          { color: c.text, backgroundColor: c.cardAlt, borderColor: error ? c.away : c.border },
        ]}
      />
      {error ? <T variant="small" color={c.away}>{error}</T> : null}
    </View>
  );
}

/**
 * Campo que se guarda solo (con pausa de medio segundo y al salir del campo).
 * `resetKey` reinicia el valor local cuando cambia el registro (p. ej. el día).
 */
export function AutoSaveField({
  value,
  onSave,
  resetKey,
  ...props
}: Omit<FieldProps, 'value' | 'onChangeText'> & {
  value: string | null | undefined;
  onSave: (text: string) => void;
  resetKey: string;
}) {
  const [text, setText] = useState(value ?? '');
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  const flush = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    if (pending.current !== null) {
      saveRef.current(pending.current);
      pending.current = null;
    }
  };

  useEffect(() => {
    setText(value ?? '');
    return flush;
    // Solo al cambiar de registro: no pisar lo que se está escribiendo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  return (
    <Field
      {...props}
      value={text}
      onChangeText={(t) => {
        setText(t);
        pending.current = t;
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(flush, 500);
      }}
      onBlur={flush}
    />
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.xs },
  label: { fontWeight: '600' },
  input: {
    minHeight: touch,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.body,
  },
  multiline: { minHeight: 72, paddingTop: spacing.md },
});
