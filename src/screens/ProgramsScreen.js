import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Modal,
    Alert,
    TouchableWithoutFeedback,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '../theme';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';

// Dropdown Component Helper
const SelectInput = ({ label, value, options, onSelect, placeholder = "Select an option" }) => {
    const [visible, setVisible] = useState(false);

    return (
        <View style={styles.inputContainer}>
            {label && <Text style={styles.inputLabel}>{label}</Text>}
            <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setVisible(true)}
                activeOpacity={0.7}
            >
                <Text style={[styles.selectText, !value && styles.placeholderText]}>
                    {value || placeholder}
                </Text>
                <Text style={styles.chevron}>▼</Text>
            </TouchableOpacity>

            <Modal
                transparent={true}
                visible={visible}
                animationType="fade"
                onRequestClose={() => setVisible(false)}
            >
                <TouchableWithoutFeedback onPress={() => setVisible(false)}>
                    <View style={styles.modalOverlay}>
                        <View style={styles.optionsContainer}>
                            <Text style={styles.optionsHeader}>{label || "Select"}</Text>
                            {options.map((option, index) => (
                                <TouchableOpacity
                                    key={index}
                                    style={styles.optionItem}
                                    onPress={() => {
                                        onSelect(option);
                                        setVisible(false);
                                    }}
                                >
                                    <Text style={[
                                        styles.optionText,
                                        value === option && styles.selectedOptionText
                                    ]}>
                                        {option}
                                    </Text>
                                    {value === option && <Text style={styles.checkMark}>✓</Text>}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    );
};

export default function ProgramsScreen() {
    const [programs, setPrograms] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);
    const [editingProgram, setEditingProgram] = useState(null);

    // Form State
    const [programType, setProgramType] = useState('');
    const [planType, setPlanType] = useState('');
    const [price, setPrice] = useState('');
    const [duration, setDuration] = useState('');
    const [description, setDescription] = useState('');
    const [facilities, setFacilities] = useState([]);
    const [currentFacility, setCurrentFacility] = useState('');

    // Fetch Programs
    useEffect(() => {
        const q = query(collection(db, "programs"), orderBy("createdAt", "desc")); // Assuming createdAt field; if not, remove orderBy or add it
        // Or just basic query for now
        // const q = query(collection(db, "programs")); 

        const unsubscribe = onSnapshot(collection(db, "programs"), (snapshot) => {
            const programsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setPrograms(programsData);
        }, (error) => {
            console.error("Error fetching programs: ", error);
            Alert.alert("Error", "Could not fetch programs.");
        });

        return () => unsubscribe();
    }, []);

    const resetForm = () => {
        setProgramType('');
        setPlanType('');
        setPrice('');
        setDuration('');
        setDescription('');
        setFacilities([]);
        setCurrentFacility('');
        setEditingProgram(null);
    };

    const handleAddFacility = () => {
        if (currentFacility.trim().length === 0) return;
        if (facilities.length >= 4) {
            Alert.alert("Limit Reached", "You can only add up to 4 facilities.");
            return;
        }
        setFacilities([...facilities, currentFacility.trim()]);
        setCurrentFacility('');
    };

    const handleRemoveFacility = (index) => {
        const newFacilities = [...facilities];
        newFacilities.splice(index, 1);
        setFacilities(newFacilities);
    };

    const handleSaveProgram = async () => {
        // Validation
        if (!programType || !planType || !price || !duration || !description) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }

        setLoading(true);

        try {
            const programData = {
                programType,
                planType,
                price: parseFloat(price),
                duration,
                description,
                facilities,
            };

            if (editingProgram) {
                const updateData = { ...programData, updatedAt: new Date().toISOString() };
                await updateDoc(doc(db, "programs", editingProgram.id), updateData);
                Alert.alert("Success", "Program updated successfully!");
            } else {
                programData.createdAt = new Date().toISOString();
                await addDoc(collection(db, "programs"), programData);
                Alert.alert("Success", "Program added successfully!");
            }

            setModalVisible(false);
            resetForm();
        } catch (error) {
            console.error("Error saving program: ", error);
            Alert.alert("Error", "Failed to save program.");
        } finally {
            setLoading(false);
        }
    };

    const handleProgramActions = (program) => {
        Alert.alert(
            "Manage Program",
            "Choose an action for this program:",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: () => handleDeleteConfirm(program.id)
                },
                {
                    text: "Edit",
                    onPress: () => {
                        setEditingProgram(program);
                        setProgramType(program.programType);
                        setPlanType(program.planType);
                        setPrice(program.price.toString());
                        setDuration(program.duration);
                        setDescription(program.description || '');
                        setFacilities(program.facilities || []);
                        setModalVisible(true);
                    }
                }
            ]
        );
    };

    const handleDeleteConfirm = (id) => {
        Alert.alert(
            "Delete Program",
            "Are you sure you want to delete this program?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "programs", id));
                        } catch (error) {
                            console.error("Error deleting program: ", error);
                            Alert.alert("Error", "Failed to delete program.");
                        }
                    }
                }
            ]
        );
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={styles.card}
            onPress={() => handleProgramActions(item)}
            activeOpacity={0.9}
        >
            <View style={styles.cardHeader}>
                <Text style={styles.programType}>{item.programType}</Text>
                <View style={[styles.badge, item.planType === 'Annually' ? styles.badgeAnnual : styles.badgeMonthly]}>
                    <Text style={[styles.badgeText, item.planType === 'Annually' ? styles.textAnnual : styles.textMonthly]}>
                        {item.planType}
                    </Text>
                </View>
            </View>

            <View style={styles.detailsRow}>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Price</Text>
                    <Text style={styles.price}>₹{item.price}</Text>
                </View>
                <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.duration}>{item.duration}</Text>
                </View>
            </View>

            {item.description ? (
                <Text style={styles.descriptionText} numberOfLines={2}>
                    {item.description}
                </Text>
            ) : null}

            {item.facilities && item.facilities.length > 0 && (
                <View style={styles.facilitiesContainer}>
                    {item.facilities.map((facility, index) => (
                        <View key={index} style={styles.facilityBadge}>
                            <Text style={styles.facilityBadgeText}>{facility}</Text>
                        </View>
                    ))}
                </View>
            )}
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Programs</Text>
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
                data={programs}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No programs found.</Text>
                        <Text style={styles.emptySubText}>Tap + to create a new program.</Text>
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
                            <Text style={styles.modalTitle}>{editingProgram ? "Edit Program" : "Add New Program"}</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeButton}>X</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <SelectInput
                                label="Program Type"
                                value={programType}
                                options={['General Program', 'Supervised Program']}
                                onSelect={setProgramType}
                                placeholder="Select Program Type"
                            />

                            <SelectInput
                                label="Plan Type"
                                value={planType}
                                options={['Monthly', 'Annually']}
                                onSelect={setPlanType}
                                placeholder="Select Plan Type"
                            />

                            <Input
                                label="Price (INR)"
                                value={price}
                                onChangeText={setPrice}
                                placeholder="e.g. 5000"
                                keyboardType="numeric"
                                style={styles.inputContainer}
                            />

                            <Input
                                label="Duration"
                                value={duration}
                                onChangeText={setDuration}
                                placeholder="e.g. 4 Weeks, 12 Months"
                                style={styles.inputContainer}
                            />

                            <Input
                                label="Description"
                                value={description}
                                onChangeText={setDescription}
                                placeholder="Program Description"
                                multiline
                                numberOfLines={3}
                                style={styles.inputContainer}
                                inputStyle={{ height: 100, textAlignVertical: 'top' }}
                            />

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Facilities (Max 4)</Text>
                                <View style={styles.addFacilityRow}>
                                    <View style={{ flex: 1, marginRight: spacing.s }}>
                                        <Input
                                            value={currentFacility}
                                            onChangeText={setCurrentFacility}
                                            placeholder="Add facility"
                                            style={{ marginBottom: 0 }}
                                        />
                                    </View>
                                    <TouchableOpacity
                                        style={[
                                            styles.addFacilityButton,
                                            (facilities.length >= 4 || !currentFacility.trim()) && styles.disabledButton
                                        ]}
                                        onPress={handleAddFacility}
                                        disabled={facilities.length >= 4 || !currentFacility.trim()}
                                    >
                                        <Text style={styles.addFacilityButtonText}>Add</Text>
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.facilitiesList}>
                                    {facilities.map((facility, index) => (
                                        <View key={index} style={styles.facilityChip}>
                                            <Text style={styles.facilityChipText}>{facility}</Text>
                                            <TouchableOpacity
                                                onPress={() => handleRemoveFacility(index)}
                                                style={styles.removeFacilityButton}
                                            >
                                                <Text style={styles.removeFacilityText}>×</Text>
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            <View style={styles.modalActions}>
                                <Button
                                    title="Cancel"
                                    onPress={() => setModalVisible(false)}
                                    variant="secondary"
                                    style={{ flex: 1, marginRight: spacing.s }}
                                />
                                <Button
                                    title={editingProgram ? "Update Program" : "Save Program"}
                                    onPress={handleSaveProgram}
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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    programType: {
        fontFamily: typography.semiBold,
        fontSize: typography.sizes.h4,
        color: colors.text.primary,
    },
    badge: {
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    badgeMonthly: {
        backgroundColor: '#E3F2FD',
        borderColor: '#90CAF9',
    },
    badgeAnnual: {
        backgroundColor: '#FFF8E1',
        borderColor: '#FFE082',
    },
    badgeText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.caption,
        textTransform: 'uppercase',
    },
    textMonthly: {
        color: '#1976D2',
    },
    textAnnual: {
        color: '#FFA000',
    },
    detailsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingTop: spacing.s,
        borderTopWidth: 1,
        borderTopColor: colors.border.default,
    },
    detailItem: {
        flex: 1,
    },
    detailLabel: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
        marginBottom: 2,
    },
    price: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h4,
        color: colors.primary,
    },
    duration: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.primary,
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

    // Select Input Styles
    inputContainer: {
        marginBottom: spacing.m,
    },
    inputLabel: {
        fontFamily: typography.medium,
        fontSize: 14,
        color: colors.text.primary,
        marginBottom: 8,
    },
    selectButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border.default,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.background.cardLight,
        minHeight: 48,
    },
    selectText: {
        fontFamily: typography.regular,
        fontSize: 16,
        color: colors.text.primary,
    },
    placeholderText: {
        color: colors.text.secondary,
    },
    chevron: {
        fontSize: 12,
        color: colors.text.secondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: spacing.m,
    },
    optionsContainer: {
        backgroundColor: colors.background.cardLight,
        borderRadius: 12,
        padding: spacing.m,
        ...shadows.medium,
    },
    optionsHeader: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h4,
        marginBottom: spacing.m,
        textAlign: 'center',
        color: colors.text.primary,
    },
    optionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    optionText: {
        fontFamily: typography.regular,
        fontSize: 16,
        color: colors.text.primary,
    },
    selectedOptionText: {
        fontFamily: typography.semiBold,
        color: colors.primary,
    },
    checkMark: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    descriptionText: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.secondary,
        marginTop: spacing.s,
    },
    facilitiesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: spacing.s,
        gap: spacing.xs,
    },
    facilityBadge: {
        backgroundColor: colors.background.light,
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border.default,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
    facilityBadgeText: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
    },
    addFacilityRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    addFacilityButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.m,
        paddingVertical: 12,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: colors.border.default,
    },
    addFacilityButtonText: {
        color: colors.white,
        fontFamily: typography.medium,
        fontSize: 14,
    },
    facilitiesList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    facilityChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E3F2FD',
        borderRadius: 20,
        paddingHorizontal: spacing.m,
        paddingVertical: 6,
        marginRight: spacing.xs,
        marginBottom: spacing.xs,
    },
    facilityChipText: {
        color: colors.primary,
        fontFamily: typography.medium,
        fontSize: 14,
        marginRight: spacing.xs,
    },
    removeFacilityButton: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: 'rgba(255,255,255,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    removeFacilityText: {
        color: colors.primary,
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: -2,
    },
});
