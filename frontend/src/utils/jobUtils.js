import { doc, runTransaction } from "firebase/firestore";
import { db } from "../config/firebase";

/**
 * Generates the next sequential Job ID (e.g., "000001").
 * Uses a Firestore transaction to ensure atomicity.
 */
export const generateNextJobId = async () => {
    const counterRef = doc(db, "counters", "jobs");

    try {
        const newId = await runTransaction(db, async (transaction) => {
            const counterDoc = await transaction.get(counterRef);

            let currentCount = 0;
            if (counterDoc.exists()) {
                currentCount = counterDoc.data().count || 0;
            }

            const nextCount = currentCount + 1;
            transaction.set(counterRef, { count: nextCount });

            return nextCount;
        });

        // Format as 6-digit string with leading zeros
        return String(newId).padStart(6, '0');
    } catch (error) {
        console.error("Error generating job ID:", error);
        throw error;
    }
};
