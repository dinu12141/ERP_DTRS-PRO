import { useState, useEffect } from 'react';
import {
    collection,
    query,
    onSnapshot,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    serverTimestamp,
    where,
    orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const useFirestore = (collectionName, queryConstraints = []) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!collectionName) return;

        setLoading(true);
        const colRef = collection(db, collectionName);
        const q = query(colRef, ...queryConstraints);

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const documents = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setData(documents);
            setLoading(false);
            setError(null);
        }, (err) => {
            console.error(`Error fetching ${collectionName}:`, err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, JSON.stringify(queryConstraints)]);

    const add = async (docData) => {
        try {
            const colRef = collection(db, collectionName);
            const docRef = await addDoc(colRef, {
                ...docData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });
            return docRef;
        } catch (err) {
            console.error(`Error adding to ${collectionName}:`, err);
            throw err;
        }
    };

    const update = async (id, docData) => {
        try {
            const docRef = doc(db, collectionName, id);
            await updateDoc(docRef, {
                ...docData,
                updatedAt: serverTimestamp()
            });
        } catch (err) {
            console.error(`Error updating ${collectionName}/${id}:`, err);
            throw err;
        }
    };

    const remove = async (id) => {
        try {
            const docRef = doc(db, collectionName, id);
            await deleteDoc(docRef);
        } catch (err) {
            console.error(`Error deleting ${collectionName}/${id}:`, err);
            throw err;
        }
    };

    return { data, loading, error, add, update, remove };
};

export const useFirestoreDocument = (collectionName, docId) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!collectionName || !docId) return;

        setLoading(true);
        const docRef = doc(db, collectionName, docId);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setData({ id: docSnap.id, ...docSnap.data() });
                setError(null);
            } else {
                setData(null);
                setError('Document not found');
            }
            setLoading(false);
        }, (err) => {
            console.error(`Error fetching ${collectionName}/${docId}:`, err);
            setError(err.message);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [collectionName, docId]);

    return { data, loading, error };
};
