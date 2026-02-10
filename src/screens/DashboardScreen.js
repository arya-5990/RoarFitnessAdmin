import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components/Button';

export default function DashboardScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <Image
                    source={require('../../assets/gym_logo.jpeg')}
                    style={styles.logo}
                    resizeMode="contain"
                />
                <Text style={styles.header}>RoarFitness</Text>
                <Text style={styles.subHeader}>Admin Dashboard</Text>

                <View style={styles.actions}>
                    <Button
                        title="Manage Blogs"
                        onPress={() => navigation.navigate('BlogsList')}
                        style={styles.button}
                        variant="primary"
                    />
                </View>
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
        padding: spacing.padding.container,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logo: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: spacing.l,
    },
    header: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.display,
        color: colors.primary,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    subHeader: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.h3,
        color: colors.text.secondary,
        marginBottom: spacing.xl,
        textAlign: 'center',
    },
    actions: {
        width: '100%',
        maxWidth: 300,
        gap: spacing.m,
    },
    button: {
        width: '100%',
    }
});
