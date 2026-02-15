import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { Card } from '../components/Card';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.header}>Roar Fitness Admin</Text>
                <Text style={styles.subHeader}>UI Theme & Design System</Text>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Buttons</Text>
                    <View style={styles.buttonRow}>
                        <Button title="Primary Button" onPress={() => { }} />
                        <Button title="Loading" loading onPress={() => { }} />
                    </View>
                    <View style={styles.buttonRow}>
                        <Button title="Secondary" variant="secondary" onPress={() => { }} />
                        <Button title="Danger" variant="danger" onPress={() => { }} />
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Inputs</Text>
                    <Input label="Email Address" placeholder="admin@fitmaker.com" />
                    <Input label="Password" placeholder="Enter password" secureTextEntry />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Cards</Text>
                    <Card>
                        <Text style={styles.cardTitle}>Dashboard Overview</Text>
                        <Text style={styles.bodyText}>
                            Welcome to the FitMaker admin panel. manage users, workouts, and more.
                        </Text>
                    </Card>
                    <Card elevation="subtle">
                        <Text style={styles.cardTitle}>Recent Activity</Text>
                        <Text style={styles.bodyText}>User John Doe signed up.</Text>
                    </Card>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Typography</Text>
                    <Text style={styles.h1}>Heading 1</Text>
                    <Text style={styles.h2}>Heading 2</Text>
                    <Text style={styles.h3}>Heading 3</Text>
                    <Text style={styles.body}>Body Regular Text. Clean and readable.</Text>
                </View>
            </ScrollView>
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
    },
    header: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.display,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    subHeader: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.h3,
        color: colors.text.secondary,
        marginBottom: spacing.margin.section,
    },
    section: {
        marginBottom: spacing.margin.section,
    },
    sectionTitle: {
        fontFamily: typography.semiBold,
        fontSize: typography.sizes.h4,
        color: colors.text.dark,
        marginBottom: spacing.margin.list,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.s,
        gap: spacing.s,
    },
    cardTitle: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h3,
        marginBottom: spacing.s,
    },
    bodyText: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.primary,
    },
    h1: { fontFamily: typography.bold, fontSize: typography.sizes.h1, marginBottom: spacing.xs },
    h2: { fontFamily: typography.bold, fontSize: typography.sizes.h2, marginBottom: spacing.xs },
    h3: { fontFamily: typography.semiBold, fontSize: typography.sizes.h3, marginBottom: spacing.xs },
    body: { fontFamily: typography.regular, fontSize: typography.sizes.bodyRegular },
});
