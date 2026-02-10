import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Modal, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import * as ImagePicker from 'expo-image-picker';
import { uploadImageToCloudinary } from '../services/cloudinary';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import { Image } from 'react-native';

// Dummy data
// Dummy data removed

export default function BlogsListScreen() {
    const [blogs, setBlogs] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingBlog, setEditingBlog] = useState(null);

    React.useEffect(() => {
        const q = query(collection(db, "blogs"));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const blogsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setBlogs(blogsData);
        });
        return () => unsubscribe();
    }, []);

    // Form State
    const [title, setTitle] = useState('');
    const [readingTime, setReadingTime] = useState('');
    const [category, setCategory] = useState('');

    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const pickImage = async () => {
        // No permissions request is necessary for launching the image library
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const handleSaveBlog = async () => {
        // Validation
        if (!title.trim() || !readingTime.trim() || !category.trim() || !content.trim()) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        if (!image) {
            Alert.alert('Error', 'Please select an image');
            return;
        }

        // Category one word validation
        if (category.trim().split(/\s+/).length > 1) {
            Alert.alert('Error', 'Category must be a single word');
            return;
        }

        // Content word count
        if (content.trim().split(/\s+/).length > 1000) {
            Alert.alert('Error', 'Content exceeds 1000 words limit');
            return;
        }

        setLoading(true);

        try {
            let imageUrl = image;
            // Only upload if the image is a local file URI (starts with file:// or content://)
            // If it's already a remote URL (https://), we don't need to re-upload unless changed
            if (image && !image.startsWith('http')) {
                imageUrl = await uploadImageToCloudinary(image);
            }

            const blogData = {
                title: title.trim(),
                readingTime: readingTime.trim(),
                category: category.trim(),
                content: content.trim(),
                imageUrl: imageUrl,
                // Only update dateUploaded if creating new, or keep existing? 
                // Usually dateUploaded shouldn't change on edit, but updateTime might.
                // For now, if editing, keep original date, else new date.
                dateUploaded: editingBlog ? editingBlog.dateUploaded : new Date().toLocaleDateString(),
            };

            if (editingBlog) {
                await updateDoc(doc(db, "blogs", editingBlog.id), blogData);
                Alert.alert("Success", "Blog updated successfully!");
            } else {
                await addDoc(collection(db, "blogs"), blogData);
                Alert.alert("Success", "Blog uploaded successfully!");
            }

            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error("Error saving blog: ", error);
            Alert.alert("Error", "Failed to save blog. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleBlogPress = (blog) => {
        Alert.alert(
            "Manage Blog",
            "What would you like to do?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => handleDeleteBlog(blog.id) },
                { text: "Edit", onPress: () => openEditModal(blog) }
            ]
        );
    };

    const handleDeleteBlog = async (blogId) => {
        try {
            await deleteDoc(doc(db, "blogs", blogId));
            Alert.alert("Success", "Blog deleted successfully");
        } catch (error) {
            console.error("Error deleting blog: ", error);
            Alert.alert("Error", "Failed to delete blog");
        }
    };

    const openEditModal = (blog) => {
        setEditingBlog(blog);
        setTitle(blog.title);
        setReadingTime(blog.readingTime);
        setCategory(blog.category);
        setContent(blog.content);
        setImage(blog.imageUrl);
        setModalVisible(true);
    };

    const resetForm = () => {
        setTitle('');
        setReadingTime('');
        setCategory('');

        setContent('');
        setContent('');
        setImage(null);
        setEditingBlog(null);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity style={styles.card} onPress={() => handleBlogPress(item)}>
            <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDate}>{item.dateUploaded}</Text>
                </View>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.category}</Text>
                </View>
            </View>
            <Text style={styles.readingTime}>{item.readingTime} read</Text>
            <Text numberOfLines={3} style={styles.cardContent}>{item.content}</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Blogs</Text>
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
                data={blogs}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No blogs found. Add your first blog post!</Text>
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
                            <Text style={styles.modalTitle}>{editingBlog ? "Edit Blog" : "Add New Blog"}</Text>
                            <TouchableOpacity onPress={() => {
                                setModalVisible(false);
                                resetForm();
                            }}>
                                <Text style={styles.closeButton}>X</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formContainer}>
                            <Input
                                label="Title"
                                value={title}
                                onChangeText={setTitle}
                                placeholder="Enter blog title"
                                style={styles.inputContainer}

                            />

                            <TouchableOpacity onPress={pickImage} style={[styles.imagePicker, image && styles.imagePickerSelected]}>
                                {image ? (
                                    <Image source={{ uri: image }} style={styles.previewImage} />
                                ) : (
                                    <Text style={styles.imagePickerText}>Pick an Image for Blog</Text>
                                )}
                            </TouchableOpacity>

                            <View style={styles.row}>
                                <Input
                                    label="Reading Time"
                                    value={readingTime}
                                    onChangeText={setReadingTime}
                                    placeholder="e.g. 5 min"
                                    style={[styles.inputContainer, { flex: 1, marginRight: spacing.s }]}
                                />
                                <Input
                                    label="Category (One Word)"
                                    value={category}
                                    onChangeText={setCategory}
                                    placeholder="e.g. Wellness"
                                    style={[styles.inputContainer, { flex: 1 }]}
                                />
                            </View>

                            <Input
                                label="Content"
                                value={content}
                                onChangeText={setContent}
                                placeholder="Write your blog content here..."
                                multiline
                                numberOfLines={6}
                                style={styles.inputContainer}
                                inputStyle={styles.textArea}
                                textAlignVertical="top"
                            />

                            <View style={styles.modalActions}>
                                <Button
                                    title="Cancel"
                                    onPress={() => {
                                        setModalVisible(false);
                                        resetForm();
                                    }}
                                    variant="secondary"
                                    style={{ flex: 1, marginRight: spacing.s }}
                                />
                                <Button
                                    title={editingBlog ? "Update Blog" : "Add Blog"}
                                    onPress={handleSaveBlog}
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
        marginBottom: spacing.m,
    },
    header: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h1,
        color: colors.primary,
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
        paddingBottom: spacing.l,
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
        marginBottom: spacing.xs,
    },
    cardTitle: {
        fontFamily: typography.semiBold,
        fontSize: typography.sizes.h4,
        color: colors.text.primary,
        marginRight: spacing.s,
    },
    cardDate: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
        marginTop: 2,
    },
    badge: {
        backgroundColor: colors.background.light, // Or secondary color light variant
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    badgeText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.caption,
        color: colors.primary,
        textTransform: 'uppercase',
    },
    readingTime: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
        marginBottom: spacing.s,
    },
    cardContent: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.primary,
        lineHeight: 20,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: spacing.xl,
    },
    emptyText: {
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
        maxHeight: '85%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
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
    formContainer: {
        paddingBottom: spacing.xl,
    },
    inputContainer: {
        marginBottom: spacing.m,
    },
    row: {
        flexDirection: 'row',
    },
    textArea: {
        minHeight: 120, // Taller for content
    },
    modalActions: {
        flexDirection: 'row',
        marginTop: spacing.m,
    },
    imagePicker: {
        height: 150,
        backgroundColor: colors.background.light,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.m,
        borderWidth: 1,
        borderColor: colors.border.default,
        borderStyle: 'dashed',
    },
    imagePickerSelected: {
        borderStyle: 'solid',
        overflow: 'hidden',
    },
    imagePickerText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.secondary,
    },
    previewImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
});
