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

const MAX_QUESTIONS = 5;
const MAX_WORDS_QUESTION = 20;
const MAX_WORDS_ANSWER = 40;

export default function FAQScreen() {
    const [faqs, setFaqs] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingFaq, setEditingFaq] = useState(null);

    // Form State
    const [question, setQuestion] = useState('');
    const [answer, setAnswer] = useState('');

    useEffect(() => {
        // Query FAQs, ordering by creation date or just default
        const q = query(collection(db, "FAQ"), orderBy("createdAt", "asc"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const faqData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setFaqs(faqData);
        }, (error) => {
            console.error("Error fetching FAQs: ", error);
            Alert.alert("Error", "Could not fetch FAQs.");
        });

        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setQuestion('');
        setAnswer('');
        setEditingFaq(null);
    };

    const countWords = (str) => {
        return str.trim().split(/\s+/).filter(word => word.length > 0).length;
    };

    const handleSaveFaq = async () => {
        // Basic validation
        if (!question.trim() || !answer.trim()) {
            Alert.alert('Error', 'Please fill in both question and answer.');
            return;
        }

        // Word count validation
        const questionWords = countWords(question);
        const answerWords = countWords(answer);

        if (questionWords > MAX_WORDS_QUESTION) {
            Alert.alert('Limit Exceeded', `Question must be ${MAX_WORDS_QUESTION} words or less. Current: ${questionWords}`);
            return;
        }

        if (answerWords > MAX_WORDS_ANSWER) {
            Alert.alert('Limit Exceeded', `Answer must be ${MAX_WORDS_ANSWER} words or less. Current: ${answerWords}`);
            return;
        }

        // Check Max Questions limit ONLY if adding new
        if (!editingFaq && faqs.length >= MAX_QUESTIONS) {
            Alert.alert('Limit Reached', `You can only have up to ${MAX_QUESTIONS} FAQs. Please delete one first.`);
            setModalVisible(false);
            return;
        }

        setLoading(true);

        try {
            const faqData = {
                question: question.trim(),
                answer: answer.trim(),
                updatedAt: new Date().toISOString(),
            };

            if (editingFaq) {
                await updateDoc(doc(db, "FAQ", editingFaq.id), faqData);
                Alert.alert("Success", "FAQ updated successfully!");
            } else {
                // Add new
                faqData.createdAt = new Date().toISOString();
                await addDoc(collection(db, "FAQ"), faqData);
                Alert.alert("Success", "FAQ added successfully!");
            }

            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error("Error saving FAQ: ", error);
            Alert.alert("Error", "Failed to save FAQ.");
        } finally {
            setLoading(false);
        }
    };

    const handleAddPress = () => {
        if (faqs.length >= MAX_QUESTIONS) {
            Alert.alert('Limit Reached', `You can only have up to ${MAX_QUESTIONS} FAQs. Please delete an old question to add a new one.`);
            return;
        }
        resetForm();
        setModalVisible(true);
    };

    const handleFaqPress = (faq) => {
        Alert.alert(
            "Manage FAQ",
            "Choose an action for this question:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDeleteFaq(faq.id)
                },
                {
                    text: "Edit",
                    onPress: () => {
                        setEditingFaq(faq);
                        setQuestion(faq.question);
                        setAnswer(faq.answer);
                        setModalVisible(true);
                    }
                }
            ]
        );
    };

    const handleDeleteFaq = async (id) => {
        try {
            await deleteDoc(doc(db, "FAQ", id));
            // Success feedback handled by UI update via snapshot
        } catch (error) {
            console.error("Error deleting FAQ: ", error);
            Alert.alert("Error", "Failed to delete FAQ.");
        }
    };

    const renderItem = ({ item, index }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleFaqPress(item)}
            activeOpacity={0.7}
        >
            <View style={styles.cardHeader}>
                <View style={styles.questionBadge}>
                    <Text style={styles.questionBadgeText}>Q{index + 1}</Text>
                </View>
                <Text style={styles.questionText}>{item.question}</Text>
            </View>
            <View style={styles.answerContainer}>
                <Text style={styles.answerText}>{item.answer}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.header}>FAQ</Text>
                    <Text style={styles.subHeader}>{faqs.length} / {MAX_QUESTIONS} Questions</Text>
                </View>
                <TouchableOpacity
                    onPress={handleAddPress}
                    style={[
                        styles.addButton,
                        faqs.length >= MAX_QUESTIONS && styles.addButtonDisabled
                    ]}
                    disabled={faqs.length >= MAX_QUESTIONS && false} // Let the handler show the alert instead of strict disable
                >
                    <Text style={styles.addButtonText}>+</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={faqs}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No FAQs added yet.</Text>
                        <Text style={styles.emptySubText}>Tap + to add frequently asked questions.</Text>
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
                                {editingFaq ? "Edit Question" : "Add New Question"}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>X</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={styles.inputWrapper}>
                                <Input
                                    label={`Question (Max ${MAX_WORDS_QUESTION} words)`}
                                    value={question}
                                    onChangeText={setQuestion}
                                    placeholder="e.g. What is the refund policy?"
                                    multiline
                                    style={styles.inputContainer}
                                />
                                <Text style={[
                                    styles.wordCount,
                                    countWords(question) > MAX_WORDS_QUESTION ? styles.limitExceeded : {}
                                ]}>
                                    {countWords(question)}/{MAX_WORDS_QUESTION} words
                                </Text>
                            </View>

                            <View style={styles.inputWrapper}>
                                <Input
                                    label={`Answer (Max ${MAX_WORDS_ANSWER} words)`}
                                    value={answer}
                                    onChangeText={setAnswer}
                                    placeholder="Provide a clear and concise answer..."
                                    multiline
                                    numberOfLines={4}
                                    style={styles.inputContainer}
                                    inputStyle={{ minHeight: 100, textAlignVertical: 'top' }}
                                />
                                <Text style={[
                                    styles.wordCount,
                                    countWords(answer) > MAX_WORDS_ANSWER ? styles.limitExceeded : {}
                                ]}>
                                    {countWords(answer)}/{MAX_WORDS_ANSWER} words
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
                                    title={editingFaq ? "Update" : "Save"}
                                    onPress={handleSaveFaq}
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
        alignItems: 'flex-start',
        marginBottom: spacing.s,
    },
    questionBadge: {
        backgroundColor: colors.background.light,
        borderRadius: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        marginRight: spacing.s,
        marginTop: 2,
    },
    questionBadgeText: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.caption,
        color: colors.primary,
    },
    questionText: {
        flex: 1,
        fontFamily: typography.semiBold,
        fontSize: typography.sizes.bodyLarge,
        color: colors.text.primary,
        lineHeight: 22,
    },
    answerContainer: {
        paddingLeft: spacing.s,
        borderLeftWidth: 2,
        borderLeftColor: colors.border.default,
        marginLeft: spacing.xs,
        marginTop: spacing.xs,
    },
    answerText: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.secondary,
        lineHeight: 20,
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
        textAlign: 'center',
        maxWidth: '80%',
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
        marginBottom: spacing.xs,
    },
    wordCount: {
        textAlign: 'right',
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
        fontFamily: typography.regular,
    },
    limitExceeded: {
        color: colors.error,
        fontFamily: typography.medium,
    },
});
