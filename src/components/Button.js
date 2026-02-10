import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, typography, shadows } from '../theme';

export const Button = ({
    title,
    onPress,
    variant = 'primary', // primary, secondary, tertiary, danger
    size = 'medium',
    disabled = false,
    loading = false,
    style,
    textStyle,
    icon,
}) => {
    const getBackgroundColor = () => {
        if (disabled) return colors.lightGray;
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.lightGray;
            case 'tertiary': return 'transparent';
            case 'danger': return colors.error;
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return colors.mediumGray;
        switch (variant) {
            case 'primary': return colors.white;
            case 'secondary': return colors.text.dark; // Charcoal
            case 'tertiary': return colors.primary;
            case 'danger': return colors.white;
            default: return colors.white;
        }
    };

    const getBorder = () => {
        if (variant === 'secondary') return { borderWidth: 1, borderColor: colors.border.default };
        if (variant === 'tertiary') return { borderWidth: 1, borderColor: colors.primary };
        return {};
    };

    return (
        <TouchableOpacity
            style={[
                styles.container,
                {
                    backgroundColor: getBackgroundColor(),
                    paddingVertical: spacing.padding.button.vertical,
                    paddingHorizontal: spacing.padding.button.horizontal,
                    ...getBorder(),
                    ...(variant === 'primary' || variant === 'danger' ? shadows.medium : {}),
                },
                disabled && styles.disabled,
                style,
            ]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.8}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon && icon}
                    <Text
                        style={[
                            styles.text,
                            {
                                color: getTextColor(),
                                fontFamily: typography.semiBold,
                                fontSize: 16, // Button text size
                            },
                            textStyle,
                        ]}
                    >
                        {title}
                    </Text>
                </>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        minHeight: 48, // Touch target
    },
    disabled: {
        opacity: 0.6,
        elevation: 0,
        shadowOpacity: 0,
    },
    text: {
        textTransform: 'capitalize',
        textAlign: 'center',
    },
});
