import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components/Button';

const { width } = Dimensions.get('window');
const BUTTON_GAP = spacing.m;
const BUTTON_WIDTH = (width - (spacing.padding.container * 2) - BUTTON_GAP) / 2;

export default function DashboardScreen({ navigation }) {
    const menuItems = [
        { title: 'Manage Blogs', route: 'BlogsList' },
        { title: 'Programs', route: 'Programs' },
        { title: 'FAQ', route: 'FAQ' },
        { title: 'Testimonials', route: 'Testimonials' },
        { title: 'Basic Details', route: 'BasicDetails' },
        { title: 'Trainers', route: 'Trainers' },
        { title: 'Transformation', route: 'Transformation' },
    ];

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.headerSection}>
                    <Image
                        source={require('../../assets/gym_logo.jpeg')}
                        style={styles.logo}
                        resizeMode="contain"
                    />
                    <Text style={styles.header}>RoarFitness</Text>
                    <Text style={styles.subHeader}>Admin Dashboard</Text>
                </View>

                <View style={styles.gridContainer}>
                    {menuItems.map((item, index) => (
                        <View key={index} style={styles.gridItem}>
                            <Button
                                title={item.title}
                                onPress={() => navigation.navigate(item.route)}
                                style={styles.button}
                                variant="primary"
                            />
                        </View>
                    ))}
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
    scrollContent: {
        padding: spacing.padding.container,
        paddingBottom: spacing.xl,
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 50,
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
        textAlign: 'center',
    },
    gridContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: BUTTON_GAP,
        justifyContent: 'flex-start', // Start from left, but with gap it works out
    },
    gridItem: {
        width: BUTTON_WIDTH,
        marginBottom: spacing.s,
    },
    button: {
        width: '100%',
        minHeight: 100, // Make them taller like tiles
    }
});
