import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    Linking,
    TouchableOpacity,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, shadows } from '../theme';
import { collection, onSnapshot, query, orderBy, getDocs, doc, updateDoc } from 'firebase/firestore';
import { db } from '../services/firebase';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';

export default function UserDataScreen() {
    const [userData, setUserData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState('created_at'); // 'created_at' or 'id_desc'

    useEffect(() => {
        // We will fetch all data and sort client-side to dynamically switch without re-querying if possible,
        // or just use query. However, Data_id might be a number or string.
        // Let's stick to the query for the initial load, but for switching sort, client-side is faster for small datasets.
        // Given this is an admin app, client-side sort for "optimum sorting method" (likely meaning customized) is better.

        const q = query(collection(db, "user_data"));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setUserData(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching user data: ", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    // Derived state for sorted data
    const getSortedData = () => {
        const data = [...userData];
        if (sortBy === 'id_desc') {
            return data.sort((a, b) => {
                // Parse int just in case, assuming Data_id is number-like
                const idA = parseInt(a.Data_id) || 0;
                const idB = parseInt(b.Data_id) || 0;
                return idB - idA; // Descending
            });
        }
        // Default: Sort by created_at desc (newest first)
        // If created_at is timestamp
        return data.sort((a, b) => {
            const timeA = a.created_at?.toDate ? a.created_at.toDate().getTime() : new Date(a.created_at || 0).getTime();
            const timeB = b.created_at?.toDate ? b.created_at.toDate().getTime() : new Date(b.created_at || 0).getTime();
            return timeB - timeA;
        });
    };

    const handleMarkAsRead = async (id, currentStatus) => {
        if (currentStatus === 'read') return;

        try {
            await updateDoc(doc(db, "user_data", id), {
                status: 'read'
            });
            // No need to manually update state, onSnapshot will handle it
        } catch (error) {
            console.error("Error updating status: ", error);
            Alert.alert("Error", "Failed to mark as read.");
        }
    };

    const formatDate = (dateField) => {
        if (!dateField) return 'N/A';
        if (dateField.toDate) {
            return dateField.toDate().toLocaleString();
        }
        return new Date(dateField).toLocaleString();
    };

    const handleExport = async () => {
        if (userData.length === 0) {
            Alert.alert("Info", "No data to export");
            return;
        }

        try {
            setLoading(true);
            const sortedData = getSortedData();

            // Prepare data for Excel
            const exportData = sortedData.map(item => ({
                "ID": item.Data_id,
                "Name": item.user_name || 'N/A',
                "Age": item.user_age || 'N/A',
                "Contact": item.user_contact || 'N/A',
                "Date": formatDate(item.created_at),
                "Status": item.status === 'read' ? 'Read' : 'Unread'
            }));

            // Create worksheet
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Create workbook
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "UserData");

            // Write to base64
            const wbout = XLSX.write(wb, { type: 'base64', bookType: 'xlsx' });

            // Save file
            const fileName = `user_data_${Date.now()}.xlsx`;
            const uri = FileSystem.cacheDirectory + fileName;

            await FileSystem.writeAsStringAsync(uri, wbout, {
                encoding: 'base64'
            });

            setLoading(false);

            // Share file
            await Sharing.shareAsync(uri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Export User Data',
                UTI: 'com.microsoft.excel.xlsx'
            });

        } catch (error) {
            console.error("Export Error:", error);
            setLoading(false);
            Alert.alert("Error", "Failed to export data");
        }
    };

    const handleCall = (phoneNumber) => {
        if (phoneNumber) {
            Linking.openURL(`tel:${phoneNumber}`);
        }
    };

    const renderItem = ({ item }) => {
        const isRead = item.status === 'read';

        return (
            <View style={[styles.card, isRead && styles.cardRead]}>
                <View style={styles.cardHeader}>
                    <View style={styles.headerLeft}>
                        {/* Status Dot */}
                        <View style={[styles.statusDot, isRead ? styles.statusRead : styles.statusUnread]} />
                        <Text style={styles.userName}>{item.user_name || 'N/A'}</Text>
                    </View>
                    <View style={styles.idBadge}>
                        <Text style={styles.idText}>ID: {item.Data_id}</Text>
                    </View>
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Age:</Text>
                        <Text style={styles.value}>{item.user_age || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Contact:</Text>
                        <TouchableOpacity onPress={() => handleCall(item.user_contact)}>
                            <Text style={[styles.value, styles.link]}>{item.user_contact || 'N/A'}</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.detailRow}>
                        <Text style={styles.label}>Date:</Text>
                        <Text style={styles.value}>{formatDate(item.created_at)}</Text>
                    </View>
                </View>

                {!isRead && (
                    <TouchableOpacity
                        style={styles.markReadButton}
                        onPress={() => handleMarkAsRead(item.id, item.status)}
                    >
                        <Text style={styles.markReadText}>Mark as Read</Text>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    const sortedData = getSortedData();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.headerContainer}>
                <View>
                    <Text style={styles.header}>User Data</Text>
                    <Text style={styles.subHeader}>Leads from Explore Programs</Text>
                </View>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => setSortBy(prev => prev === 'id_desc' ? 'created_at' : 'id_desc')}
                    >
                        <Text style={styles.actionButtonText}>
                            {sortBy === 'id_desc' ? 'Sort: ID' : 'Sort: Date'}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, styles.exportButton]}
                        onPress={handleExport}
                    >
                        <Text style={[styles.actionButtonText, styles.exportButtonText]}>
                            Export
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            <FlatList
                data={sortedData}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>No user data found.</Text>
                    </View>
                }
            />
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
    headerContainer: {
        paddingHorizontal: spacing.padding.container,
        paddingVertical: spacing.m,
        marginBottom: spacing.s,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    header: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h1,
        color: colors.primary,
        marginBottom: 4,
    },
    subHeader: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.secondary,
    },
    headerActions: {
        flexDirection: 'row',
        gap: spacing.s,
    },
    actionButton: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
        backgroundColor: colors.background.cardLight,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border.default,
        minWidth: 80,
        alignItems: 'center',
    },
    exportButton: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    actionButtonText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.caption,
        color: colors.primary,
    },
    exportButtonText: {
        color: colors.white,
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
    cardRead: {
        opacity: 0.7,
        backgroundColor: '#F5F5F5', // Slightly darker/grayed out
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
        paddingBottom: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: colors.border.default,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: spacing.s,
    },
    statusUnread: {
        backgroundColor: colors.primary, // Or a bright color like green/red
    },
    statusRead: {
        backgroundColor: colors.text.secondary,
    },
    userName: {
        fontFamily: typography.bold,
        fontSize: typography.sizes.h3,
        color: colors.text.primary,
    },
    idBadge: {
        backgroundColor: colors.background.light,
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border.default,
    },
    idText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.caption,
        color: colors.text.secondary,
    },
    detailsContainer: {
        gap: spacing.s,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    label: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.secondary,
        width: 80,
    },
    value: {
        fontFamily: typography.regular,
        fontSize: typography.sizes.bodyRegular,
        color: colors.text.primary,
        flex: 1,
    },
    link: {
        color: colors.primary,
        textDecorationLine: 'underline',
    },
    markReadButton: {
        marginTop: spacing.m,
        paddingVertical: spacing.s,
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.05)',
        borderRadius: 8,
    },
    markReadText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.bodyRegular,
        color: colors.primary,
    },
    emptyContainer: {
        alignItems: 'center',
        marginTop: spacing.xl * 2,
    },
    emptyText: {
        fontFamily: typography.medium,
        fontSize: typography.sizes.h4,
        color: colors.text.secondary,
    },
});
