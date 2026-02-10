import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

const MAX_REVIEWS = 10;
const MAX_WORDS = 60;
const MAX_RATING = 5;

// Simple Star Component
const StarRating = ({ rating, setRating, readOnly = false, size = 24 }) => {
    return (
        <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                    key={star}
                    disabled={readOnly}
                    onPress={() => setRating && setRating(star)}
                    activeOpacity={0.7}
                >
                    <Text style={[styles.star, { fontSize: size, color: star <= rating ? '#FFD700' : '#E0E0E0' }]}>
                        ★
                    </Text>
                </TouchableOpacity>
            ))}
        </View>
    );
};

export default function TestimonialsScreen() {
    const [testimonials, setTestimonials] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingReview, setEditingReview] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [programType, setProgramType] = useState('');
    const [review, setReview] = useState('');
    const [rating, setRating] = useState(5);

    useEffect(() => {
        const q = query(collection(db, "testimonials"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(collection(db, "testimonials"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTestimonials(data);
        }, (error) => {
            console.error("Error fetching testimonials: ", error);
            Alert.alert("Error", "Could not fetch testimonials.");
        });

        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setName('');
        setProgramType('');
        setReview('');
        setRating(5);
        setEditingReview(null);
    };

    const countWords = (str) => {
        return str.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const handleSaveReview = async () => {
        // Validation
        if (!name.trim() || !programType.trim() || !review.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        const wordCount = countWords(review);
        if (wordCount > MAX_WORDS) {
            Alert.alert('Limit Exceeded', `Review must be ${MAX_WORDS} words or less. Current: ${wordCount}`);
            return;
        }

        if (!editingReview && testimonials.length >= MAX_REVIEWS) {
            Alert.alert('Limit Reached', `You can only show up to ${MAX_REVIEWS} testimonials.`);
            return;
        }

        setLoading(true);

        try {
            const reviewData = {
                name: name.trim(),
                programType: programType.trim(),
                review: review.trim(),
                rating,
            };

            if (editingReview) {
                const updateData = { ...reviewData, updatedAt: new Date().toISOString() };
                await updateDoc(doc(db, "testimonials", editingReview.id), updateData);
                Alert.alert("Success", "Testimonial updated successfully!");
            } else {
                reviewData.createdAt = new Date().toISOString();
                await addDoc(collection(db, "testimonials"), reviewData);
                Alert.alert("Success", "Testimonial added successfully!");
            }

            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error("Error saving testimonial: ", error);
            Alert.alert("Error", "Failed to save testimonial.");
        } finally {
            setLoading(false);
        }
    };

    const handleReviewActions = (item) => {
        Alert.alert(
            "Manage Testimonial",
            "Choose an action:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDeleteConfirm(item.id)
                },
                {
                    text: "Edit",
                    onPress: () => {
                        setEditingReview(item);
                        setName(item.name);
                        setProgramType(item.programType);
                        setReview(item.review);
                        setRating(item.rating);
                        setModalVisible(true);
                    }
                }
            ]
        );
    };

    const handleDeleteConfirm = (id) => {
        Alert.alert(
            "Delete Testimonial",
            "Are you sure you want to delete this review?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "testimonials", id));
                        } catch (error) {
                            console.error("Error deleting review: ", error);
                            Alert.alert("Error", "Failed to delete review.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleReviewActions(item)}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <View>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.programType}>{item.programType}</Text>
                </View>
                <StarRating rating={item.rating} readOnly size={16} />
            </View>
            <Text style={styles.reviewText}>"{item.review}"</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.header}>Testimonials</Text>
                    <Text style={styles.subHeader}>{testimonials.length} / {MAX_REVIEWS} Reviews</Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        if (testimonials.length >= MAX_REVIEWS) {
                            Alert.alert('Limit Reached', `You can only show up to ${MAX_REVIEWS} testimonials.`);
                            return;
                        }
                        resetForm();
                        setModalVisible(true);
                    }}
                    style={[
                        styles.addButton,
                        testimonials.length >= MAX_REVIEWS && styles.addButtonDisabled
                    ]}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={testimonials}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No testimonials yet.</Text>
                        <Text style={styles.emptySubText}>Add reviews from happy clients.</Text>
                    </View>
                }
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.modalContainer}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingReview ? "Edit Review" : "Add Review"}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>X</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Input
                                label="Customer Name"
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. John Doe"
                                style={styles.inputContainer}
                            />

                            <Input
                                label="Program Type"
                                value={programType}
                                onChangeText={setProgramType}
                                placeholder="e.g. Weight Loss"
                                style={styles.inputContainer}
                            />

                            <View style={styles.ratingContainer}>
                                <Text style={styles.ratingLabel}>Rating</Text>
                                <StarRating rating={rating} setRating={setRating} size={32} />
                            </View>

                            <View style={styles.inputWrapper}>
                                <Input
                                    label={`Review (Max ${MAX_WORDS} words)`}
                                    value={review}
                                    onChangeText={setReview}
                                    placeholder="Write the customer's review here..."
                                    multiline
                                    numberOfLines={4}
                                    style={styles.inputContainer}
                                    inputStyle={{ minHeight: 100, textAlignVertical: 'top' }}
                                />
                                <Text style={[
                                    styles.wordCount,
                                    countWords(review) > MAX_WORDS ? styles.limitExceeded : {}
                                ]}>
                                    {countWords(review)}/{MAX_WORDS} words
                                </Text>
                            </View>

                            <View style={styles.modalActions}>
                                <Button
                                    title="Cancel"
                                    onPress={() => setModalVisible(false)}
                                    variant="secondary"
                                    style={{ flex: 1, marginRight: spacing.s }}
                                />
                                <Button
                                    title={editingReview ? "Update" : "Save"}
                                    onPress={handleSaveReview}
                                    style={{ flex: 1, marginLeft: spacing.s }}
                                    loading={loading}
                                />
                            </View>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background.light,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: spacing.padding.container,
        paddingVertical: spacing.m,
    },
    header: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h1,
        color: colors.primary,
    },
    subHeader: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
    },
    addButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        ...shadows.subtle,
    },
    addButtonDisabled: {
        backgroundColor: colors.mediumGray,
        opacity: 0.7,
    },
    addButtonText: {
        color: colors.white,
        fontSize: 24,
        fontFamily: typography.medium,
        lineHeight: 28,
    },
    listContent: {
        paddingHorizontal: spacing.padding.container,
        paddingBottom: spacing.xl,
    },
    card: {
        backgroundColor: colors.background.cardLight,
        borderRadius: 16,
        padding: spacing.m,
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border.default,
        ...shadows.subtle,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: spacing.s,
    },
    name: {
        fontFamily: typography.semiBold,
        fontSize: typography.sizes.h4,
        color: colors.text.primary,
    },
    programType: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
        textTransform: 'uppercase',
    },
    reviewText: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.primary,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: spacing.xl * 2,
    },
    emptyText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.h4,
        color: colors.text.secondary,
        marginBottom: spacing.xs,
    },
    emptySubText: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.secondary,
    },

    // Stars
    starsContainer: {
        flexDirection: 'row',
    },
    star: {
        marginHorizontal: 1,
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: colors.background.cardLight,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: spacing.l,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
        paddingBottom: spacing.s,
    },
    modalTitle: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h3,
        color: colors.text.primary,
    },
    closeButton: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h4,
        color: colors.text.secondary,
        padding: spacing.xs,
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: spacing.l,
    },
    inputWrapper: {
        marginBottom: spacing.m,
    },
    inputContainer: {
        marginBottom: spacing.m,
    },
    ratingContainer: {
        marginBottom: spacing.m,
        alignItems: 'flex-start',
    },
    ratingLabel: {
        fontFamily: typography.medium,
        fontSize: 14,
        color: colors.text.primary,
        marginBottom: 8,
    },
    wordCount: {
        textAlign: 'right',
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
        fontFamily: typography.regular,
        marginTop: -spacing.small, // Pull up closer to input
    },
    limitExceeded: {
        color: colors.error,
        fontFamily: typography.medium,
    },
});
