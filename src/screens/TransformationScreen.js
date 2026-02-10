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
    ScrollView,
    Image,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

const MAX_WORDS = 40;

export default function TransformationScreen() {
    const [transformations, setTransformations] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [quote, setQuote] = useState('');
    const [howWeDidIt, setHowWeDidIt] = useState('');
    const [beforeImage, setBeforeImage] = useState(null);
    const [afterImage, setAfterImage] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "transformations"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(collection(db, "transformations"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTransformations(data);
        }, (error) => {
            console.error("Error fetching transformations: ", error);
            Alert.alert("Error", "Could not fetch transformations.");
        });

        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setTitle('');
        setCategory('');
        setDuration('');
        setDescription('');
        setQuote('');
        setHowWeDidIt('');
        setBeforeImage(null);
        setAfterImage(null);
        setEditingItem(null);
    };

    const countWords = (str) => {
        if (!str) return 0;
        return str.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const pickImage = async (setImageFunc) => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [3, 4],
            quality: 1,
        });

        if (!result.canceled) {
            setImageFunc(result.assets[0].uri);
        }
    };

    const handleSave = async () => {
        // Validation
        if (!title.trim() || !category.trim() || !duration.trim() || !description.trim() || !quote.trim() || !howWeDidIt.trim()) {
            Alert.alert('Error', 'Please fill in all text fields');
            return;
        }

        if (!beforeImage || !afterImage) {
            Alert.alert('Error', 'Please select both Before and After images');
            return;
        }

        // Word Count Validation
        if (countWords(description) > MAX_WORDS) {
            Alert.alert('Limit Exceeded', `Description must be ${MAX_WORDS} words or less.`);
            return;
        }
        if (countWords(howWeDidIt) > MAX_WORDS) {
            Alert.alert('Limit Exceeded', `"How We Did It" must be ${MAX_WORDS} words or less.`);
            return;
        }

        setLoading(true);

        try {
            let beforeImageUrl = beforeImage;
            let afterImageUrl = afterImage;

            // Upload images if they are local URIs
            if (beforeImage && !beforeImage.startsWith('http')) {
                const url = await uploadImageToCloudinary(beforeImage);
                if (url) beforeImageUrl = url;
            }
            if (afterImage && !afterImage.startsWith('http')) {
                const url = await uploadImageToCloudinary(afterImage);
                if (url) afterImageUrl = url;
            }

            const data = {
                title: title.trim(),
                category: category.trim(),
                duration: duration.trim(),
                description: description.trim(),
                quote: quote.trim(),
                howWeDidIt: howWeDidIt.trim(),
                beforeImage: beforeImageUrl,
                afterImage: afterImageUrl,
            };

            if (editingItem) {
                const updateData = { ...data, updatedAt: new Date().toISOString() };
                await updateDoc(doc(db, "transformations", editingItem.id), updateData);
                Alert.alert("Success", "Transformation updated!");
            } else {
                data.createdAt = new Date().toISOString();
                await addDoc(collection(db, "transformations"), data);
                Alert.alert("Success", "Transformation added!");
            }

            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error("Error saving transformation: ", error);
            Alert.alert("Error", "Failed to save transformation.");
        } finally {
            setLoading(false);
        }
    };

    const handleActions = (item) => {
        Alert.alert(
            "Manage Transformation",
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
                        setEditingItem(item);
                        setTitle(item.title);
                        setCategory(item.category);
                        setDuration(item.duration);
                        setDescription(item.description);
                        setQuote(item.quote);
                        setHowWeDidIt(item.howWeDidIt);
                        setBeforeImage(item.beforeImage);
                        setAfterImage(item.afterImage);
                        setModalVisible(true);
                    }
                }
            ]
        );
    };

    const handleDeleteConfirm = (id) => {
        Alert.alert(
            "Delete Transformation",
            "Are you sure?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "transformations", id));
                        } catch (error) {
                            console.error("Error deleting: ", error);
                            Alert.alert("Error", "Failed to delete.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleActions(item)}
            activeOpacity={0.9}
        >
            <View style={styles.imageRow}>
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: item.beforeImage }} style={styles.cardImage} />
                    <View style={styles.imageLabelContainer}>
                        <Text style={styles.imageLabel}>Before</Text>
                    </View>
                </View>
                <View style={styles.arrowContainer}>
                    <Text style={styles.arrow}>→</Text>
                </View>
                <View style={styles.imageWrapper}>
                    <Image source={{ uri: item.afterImage }} style={styles.cardImage} />
                    <View style={styles.imageLabelContainer}>
                        <Text style={styles.imageLabel}>After</Text>
                    </View>
                </View>
            </View>

            <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardCategory}>{item.category} • {item.duration}</Text>
                <Text numberOfLines={2} style={styles.cardDescription}>{item.description}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.header}>Transformations</Text>
                    <Text style={styles.subHeader}>Success Stories</Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                        resetForm();
                        setModalVisible(true);
                    }}
                    style={styles.addButton}
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={transformations}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No stories yet.</Text>
                        <Text style={styles.emptySubText}>Add your first transformation story!</Text>
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
                                {editingItem ? "Edit Story" : "Add Transformation"}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>X</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Images Section */}
                            <View style={styles.imagesInputRow}>
                                <TouchableOpacity
                                    onPress={() => pickImage(setBeforeImage)}
                                    style={styles.imagePicker}
                                >
                                    {beforeImage ? (
                                        <Image source={{ uri: beforeImage }} style={styles.previewImage} />
                                    ) : (
                                        <Text style={styles.imagePickerText}>Before Photo</Text>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    onPress={() => pickImage(setAfterImage)}
                                    style={styles.imagePicker}
                                >
                                    {afterImage ? (
                                        <Image source={{ uri: afterImage }} style={styles.previewImage} />
                                    ) : (
                                        <Text style={styles.imagePickerText}>After Photo</Text>
                                    )}
                                </TouchableOpacity>
                            </View>

                            <Input
                                label="Client / Story Title"
                                value={title}
                                onChangeText={setTitle}
                                placeholder="e.g. John's 12 Week Journey"
                                style={styles.inputContainer}
                            />

                            <View style={styles.row}>
                                <Input
                                    label="Category"
                                    value={category}
                                    onChangeText={setCategory}
                                    placeholder="e.g. Fat Loss"
                                    style={[styles.inputContainer, { flex: 1, marginRight: spacing.s }]}
                                />
                                <Input
                                    label="Duration"
                                    value={duration}
                                    onChangeText={setDuration}
                                    placeholder="e.g. 3 Months"
                                    style={[styles.inputContainer, { flex: 1 }]}
                                />
                            </View>

                            <Input
                                label="Quote Line"
                                value={quote}
                                onChangeText={setQuote}
                                placeholder='"I feel stronger than ever!"'
                                style={styles.inputContainer}
                            />

                            <View style={styles.inputWrapper}>
                                <Input
                                    label={`Description (Max ${MAX_WORDS} words)`}
                                    value={description}
                                    onChangeText={setDescription}
                                    placeholder="Brief overview of the transformation..."
                                    multiline
                                    style={styles.inputContainer}
                                />
                                <Text style={[
                                    styles.wordCount,
                                    countWords(description) > MAX_WORDS ? styles.limitExceeded : {}
                                ]}>
                                    {countWords(description)}/{MAX_WORDS} words
                                </Text>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Input
                                    label={`How We Did It (Max ${MAX_WORDS} words)`}
                                    value={howWeDidIt}
                                    onChangeText={setHowWeDidIt}
                                    placeholder="Key strategies used..."
                                    multiline
                                    style={styles.inputContainer}
                                />
                                <Text style={[
                                    styles.wordCount,
                                    countWords(howWeDidIt) > MAX_WORDS ? styles.limitExceeded : {}
                                ]}>
                                    {countWords(howWeDidIt)}/{MAX_WORDS} words
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
                                    title={editingItem ? "Update" : "Save"}
                                    onPress={handleSave}
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
    imageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
    },
    imageWrapper: {
        width: '42%',
        aspectRatio: 3 / 4,
        borderRadius: 8,
        overflow: 'hidden',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    imageLabelContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingVertical: 2,
        alignItems: 'center',
    },
    imageLabel: {
        color: colors.white,
        fontFamily: typography.medium,
        fontSize: 10,
        textTransform: 'uppercase',
    },
    arrowContainer: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 24,
        color: colors.text.secondary,
        fontWeight: 'bold',
    },
    cardContent: {
        // paddingHorizontal: spacing.xs,
    },
    cardTitle: {
        fontFamily: typography.semiBold,
        fontSize: typography.sizes.h4,
        color: colors.text.primary,
        marginBottom: 2,
    },
    cardCategory: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.caption,
        color: colors.primary,
        marginBottom: spacing.s,
    },
    cardDescription: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.secondary,
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
    row: {
        flexDirection: 'row',
    },

    // Image Pickers
    imagesInputRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.m,
    },
    imagePicker: {
        width: '48%',
        aspectRatio: 3 / 4,
        backgroundColor: colors.background.light,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.default,
        borderStyle: 'dashed',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        resizeMode: 'cover',
    },
    imagePickerText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
    },
    wordCount: {
        textAlign: 'right',
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
        fontFamily: typography.regular,
        marginTop: -spacing.small,
    },
    limitExceeded: {
        color: colors.error,
        fontFamily: typography.medium,
    },
});
