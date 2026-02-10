import React, { useState } from 'react';
import { TextInput, View, StyleSheet, Text } from 'react-native';
import { colors, spacing, typography } from '../theme';

export const Input = ({
    label,
    value,
    onChangeText,
    placeholder,
    secureTextEntry = false,
    error = false,
    errorMessage,
    disabled = false,
    style,
    inputStyle,
    ...props
}) => {
    const [isFocused, setIsFocused] = useState(false);

    return (
        <View style={style}>
            {label && <Text style={styles.label}>{label}</Text>}
            <TextInput
                style={[
                    styles.input,
                    isFocused ? styles.focused : styles.default,
                    error ? styles.error : {},
                    disabled ? styles.disabled : {},
                    inputStyle,
                ]}
                value={value}
                onChangeText={onChangeText}
                placeholder={placeholder}
                placeholderTextColor={colors.mediumGray}
                secureTextEntry={secureTextEntry}
                editable={!disabled}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                {...props}
            />
            {error && errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    label: {
        fontFamily: typography.medium,
        color: colors.text.primary,
        marginBottom: spacing.xs,
        fontSize: typography.sizes.caption,
    },
    input: {
        fontFamily: typography.regular,
        color: colors.text.primary,
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 12, // vertical padding
        paddingHorizontal: 16, // horizontal padding
        fontSize: typography.sizes.bodyRegular,
        backgroundColor: colors.white,
        borderColor: colors.border.default,
    },
    focused: {
        borderColor: colors.primary,
        borderWidth: 2,
    },
    default: {
        borderColor: colors.border.default,
    },
    error: {
        borderColor: colors.error,
        borderWidth: 2,
        marginBottom: spacing.xs,
    },
    errorText: {
        color: colors.error,
        fontFamily: typography.regular,
        fontSize: typography.sizes.caption,
        marginTop: spacing.xs,
    },
    disabled: {
        backgroundColor: colors.lightGray,
        color: colors.mediumGray,
    },
});
