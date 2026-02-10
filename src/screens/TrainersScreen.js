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
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../services/firebase';

export default function TrainersScreen() {
    const [trainers, setTrainers] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingTrainer, setEditingTrainer] = useState(null);

    // Form State
    const [name, setName] = useState('');
    const [speciality, setSpeciality] = useState('');
    const [image, setImage] = useState(null);

    useEffect(() => {
        const q = query(collection(db, "trainers"), orderBy("createdAt", "desc"));

        const unsubscribe = onSnapshot(collection(db, "trainers"), (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setTrainers(data);
        }, (error) => {
            console.error("Error fetching trainers: ", error);
            Alert.alert("Error", "Could not fetch trainers.");
        });

        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setName('');
        setSpeciality('');
        setImage(null);
        setEditingTrainer(null);
    };

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSaveTrainer = async () => {
        // Validation
        if (!name.trim() || !speciality.trim()) {
            Alert.alert('Error', 'Please fill in name and speciality');
            return;
        }

        if (!image) {
            Alert.alert('Error', 'Please select an image');
            return;
        }

        setLoading(true);

        try {
            let imageUrl = image;
            // Upload only if it's a local file (new image picked)
            if (image && !image.startsWith('http')) {
                imageUrl = await uploadImageToCloudinary(image);
            }

            const trainerData = {
                name: name.trim(),
                speciality: speciality.trim(),
                imageUrl: imageUrl,
                // Don't update createdAt on edit
            };

            if (editingTrainer) {
                const updateData = { ...trainerData, updatedAt: new Date().toISOString() };
                await updateDoc(doc(db, "trainers", editingTrainer.id), updateData);
                Alert.alert("Success", "Trainer updated successfully!");
            } else {
                trainerData.createdAt = new Date().toISOString();
                await addDoc(collection(db, "trainers"), trainerData);
                Alert.alert("Success", "Trainer added successfully!");
            }

            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error("Error saving trainer: ", error);
            Alert.alert("Error", "Failed to save trainer.");
        } finally {
            setLoading(false);
        }
    };

    const handleTrainerActions = (item) => {
        Alert.alert(
            "Manage Trainer",
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
                        setEditingTrainer(item);
                        setName(item.name);
                        setSpeciality(item.speciality);
                        setImage(item.imageUrl);
                        setModalVisible(true);
                    }
                }
            ]
        );
    };

    const handleDeleteConfirm = (id) => {
        Alert.alert(
            "Delete Trainer",
            "Are you sure you want to delete this trainer?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "trainers", id));
                        } catch (error) {
                            console.error("Error deleting trainer: ", error);
                            Alert.alert("Error", "Failed to delete trainer.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleTrainerActions(item)}
            activeOpacity={0.9}
        >
            <Image source={{ uri: item.imageUrl }} style={styles.trainerImage} />
            <View style={styles.infoContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.speciality}>{item.speciality}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.header}>Trainers</Text>
                    <Text style={styles.subHeader}>{trainers.length} Professionals</Text>
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
                data={trainers}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No trainers added.</Text>
                        <Text style={styles.emptySubText}>Add your expert trainers here.</Text>
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
                                {editingTrainer ? "Edit Trainer" : "Add New Trainer"}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>X</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>

                            <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, image && styles.imagePickerSelected]}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.previewImage} />
                                ) : (
                                    <View style={styles.placeholderContainer}>
                                        <Text style={styles.imagePickerText}>tap to add photo</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <Input
                                label="Trainer Name"
                                value={name}
                                onChangeText={setName}
                                placeholder="e.g. Michael Jordan"
                                style={styles.inputContainer}
                            />

                            <Input
                                label="Speciality"
                                value={speciality}
                                onChangeText={setSpeciality}
                                placeholder="e.g. Strength Training, Yoga"
                                style={styles.inputContainer}
                            />

                            <View style={styles.modalActions}>
                                <Button
                                    title="Cancel"
                                    onPress={() => setModalVisible(false)}
                                    variant="secondary"
                                    style={{ flex: 1, marginRight: spacing.s }}
                                />
                                <Button
                                    title={editingTrainer ? "Update" : "Save"}
                                    onPress={handleSaveTrainer}
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
        flexDirection: 'row',
        alignItems: 'center',
    },
    trainerImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.background.light,
        marginRight: spacing.m,
    },
    infoContainer: {
        flex: 1,
    },
    name: {
        fontFamily: typography.semiBold,
        fontSize: typography.sizes.h4,
        color: colors.text.primary,
    },
    speciality: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.bodyRegular,
        color: colors.primary,
        marginTop: 2,
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
    inputContainer: {
        marginBottom: spacing.m,
    },

    // Image Picker
    imagePicker: {
        height: 120,
        backgroundColor: colors.background.light,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: colors.border.default,
        borderStyle: 'dashed',
        width: 120,
        alignSelf: 'center',
    },
    imagePickerSelected: {
        borderStyle: 'solid',
        overflow: 'hidden',
    },
    imagePickerText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
        textAlign: 'center',
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    placeholderContainer: {
        alignItems: 'center',
    }
});
