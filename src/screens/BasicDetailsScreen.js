import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';

const GYM_DETAILS_ID = 'gym_info'; // Fixed ID for single document

export default function BasicDetailsScreen() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Form State
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');

    useEffect(() => {
        // Listen for real-time updates to the single document
        const unsubscribe = onSnapshot(doc(db, "basic_details", GYM_DETAILS_ID), (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setPhone(data.phone || '');
                setEmail(data.email || '');
                setAddress(data.address || '');
            }
            setFetching(false);
        }, (error) => {
            console.error("Error fetching details: ", error);
            Alert.alert("Error", "Could not fetch details.");
            setFetching(false);
        });

        return () => unsubscribe();
    }, []);

    const handleSave = async () => {
        if (!phone.trim() || !email.trim() || !address.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        // Basic Info Validation
        // Email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            Alert.alert('Error', 'Please enter a valid email address');
            return;
        }

        // Phone (simple check for now)
        if (phone.length < 10) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return;
        }

        setLoading(true);

        try {
            await setDoc(doc(db, "basic_details", GYM_DETAILS_ID), {
                phone: phone.trim(),
                email: email.trim(),
                address: address.trim(),
                updatedAt: new Date().toISOString()
            }, { merge: true });

            Alert.alert("Success", "Basic details updated successfully!");
        } catch (error) {
            console.error("Error saving details: ", error);
            Alert.alert("Error", "Failed to update details.");
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.headerContainer}>
                        <Text style={styles.header}>Basic Details</Text>
                        <Text style={styles.subHeader}>Manage your gym's contact information</Text>
                    </View>

                    <View style={styles.formCard}>
                        {/* Phone */}
                        <Input
                            label="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="+91 98765 43210"
                            keyboardType="phone-pad"
                            style={styles.inputContainer}
                        />

                        {/* Email */}
                        <Input
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            placeholder="contact@roarfitness.com"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            style={styles.inputContainer}
                        />

                        {/* Address */}
                        <Input
                            label="Gym Address"
                            value={address}
                            onChangeText={setAddress}
                            placeholder="Enter full address..."
                            multiline
                            numberOfLines={4}
                            style={styles.inputContainer}
                            inputStyle={{ minHeight: 100, textAlignVertical: 'top' }}
                        />

                        <Button
                            title="Update Details"
                            onPress={handleSave}
                            loading={loading}
                            style={styles.saveButton}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.light,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: spacing.padding.container,
    },
    headerContainer: {
        marginBottom: spacing.l,
    },
    header: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h1,
        color: colors.primary,
        marginBottom: spacing.xs,
    },
    subHeader: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.secondary,
    },
    formCard: {
        backgroundColor: colors.background.cardLight,
        borderRadius: 16,
        padding: spacing.l,
        borderWidth: 1,
        borderColor: colors.border.default,
        ...shadows.subtle,
    },
    inputContainer: {
        marginBottom: spacing.l,
    },
    saveButton: {
        marginTop: spacing.m,
    },
});
