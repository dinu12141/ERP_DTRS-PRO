import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

const BrandingContext = createContext();

export const useBranding = () => useContext(BrandingContext);

export const BrandingProvider = ({ children }) => {
    const [logoUrl, setLogoUrl] = useState('/assets/logo.png');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onSnapshot(doc(db, 'settings', 'branding'), (doc) => {
            if (doc.exists() && doc.data().logoUrl) {
                setLogoUrl(doc.data().logoUrl);
            } else {
                // Fallback to default if no custom logo is set
                setLogoUrl('/assets/logo.png');
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching branding:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const value = {
        logoUrl,
        loading
    };

    return (
        <BrandingContext.Provider value={value}>
            {children}
        </BrandingContext.Provider>
    );
};
