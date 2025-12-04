import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, updateDoc, doc, limit, writeBatch } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContextFirebase';
import { toast } from 'sonner';

const NotificationContext = createContext();

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [settings, setSettings] = useState({
        job_created: true,
        invoice_paid: true,
        job_status_change: true,
        stock_alert: true,
        system_alert: true
    });

    // Listen for user settings
    useEffect(() => {
        if (!user) return;

        const settingsRef = doc(db, 'user_settings', user.uid);
        const unsubscribe = onSnapshot(settingsRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.notificationSettings) {
                    setSettings(prev => ({ ...prev, ...data.notificationSettings }));
                }
            }
        });

        return () => unsubscribe();
    }, [user]);

    // Listen for notifications
    useEffect(() => {
        if (!user) return;

        // Query for notifications targeted to this user or global ones
        // Note: Firestore OR queries can be tricky, so we might need separate listeners or a better structure.
        // For simplicity, we'll assume notifications have a 'userId' field which can be the user's ID or 'all'.
        // A better approach for 'all' is to fan-out notifications to all users, but for this scale, querying is fine if indexed.
        // However, 'array-contains' is better for targeting multiple users/roles.

        // Let's stick to a simple model: Notifications collection.
        // Fields: recipientId (user uid), type, title, message, read (bool), createdAt, link, metadata.

        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', user.uid),
            orderBy('createdAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [user]);

    const addNotification = async (notificationData) => {
        // This function is usually called by backend triggers, but for this client-side demo we'll allow it.
        // In a real app, you'd likely use Cloud Functions to create notifications to ensure security and fan-out.
        // Here we will create a notification for the CURRENT user for demo purposes, 
        // OR if we want to notify others, we need to know their IDs.
        // For the "New Job" scenario, we probably want to notify ALL admins/managers.
        // Since we don't have a list of all users easily accessible here without querying, 
        // we will just log it for the current user to demonstrate the UI.
        // TODO: Move to Cloud Functions for real multi-user targeting.

        try {
            await addDoc(collection(db, 'notifications'), {
                ...notificationData,
                recipientId: user.uid, // Self-notification for demo
                read: false,
                createdAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error adding notification:", error);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const notifRef = doc(db, 'notifications', notificationId);
            await updateDoc(notifRef, { read: true });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const batch = writeBatch(db);
            const unread = notifications.filter(n => !n.read);

            unread.forEach(n => {
                const ref = doc(db, 'notifications', n.id);
                batch.update(ref, { read: true });
            });

            if (unread.length > 0) {
                await batch.commit();
                toast.success('All notifications marked as read');
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
            toast.error('Failed to mark all as read');
        }
    };

    const updateSettings = async (newSettings) => {
        if (!user) return;
        try {
            const settingsRef = doc(db, 'user_settings', user.uid);
            // We use set with merge to create if not exists
            await updateDoc(settingsRef, { notificationSettings: newSettings }).catch(async () => {
                // If update fails (doc doesn't exist), try set
                const { setDoc } = await import('firebase/firestore');
                await setDoc(settingsRef, { notificationSettings: newSettings }, { merge: true });
            });
            setSettings(newSettings);
            toast.success('Notification settings updated');
        } catch (error) {
            console.error("Error updating settings:", error);
            toast.error('Failed to update settings');
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            settings,
            addNotification,
            markAsRead,
            markAllAsRead,
            updateSettings
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
