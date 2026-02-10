import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, shadows } from '../theme';

export const Card = ({
    children,
    onPress,
    style,
    theme = 'light',
    elevation = 'subtle',
}) => {
    const isDark = theme === 'dark';
    const containerStyle = {
        backgroundColor: isDark ? colors.background.cardDark : colors.background.cardLight,
        padding: spacing.padding.card,
        borderRadius: spacing.borderRadius,
        marginVertical: spacing.margin.card,
        ...shadows[elevation],
        borderWidth: 1,
        borderColor: isDark ? colors.border.dark : colors.border.default,
    };

    return (
        <View style={[containerStyle, style]}>
            {children}
        </View>
    );
};
