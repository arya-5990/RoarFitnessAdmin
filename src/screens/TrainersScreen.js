import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';

export default function TrainersScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>Manage Trainers</Text>
                <Text style={styles.subtitle}>Coming Soon</Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.light,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.padding.container,
    },
    title: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h2,
        color: colors.primary,
        marginBottom: spacing.s,
    },
    subtitle: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.secondary,
    },
});
