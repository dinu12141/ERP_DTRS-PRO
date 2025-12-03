const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Example trigger: On job creation
exports.onJobCreated = functions.firestore
    .document("jobs/{jobId}")
    .onCreate((snap, context) => {
        const newValue = snap.data();
        const jobId = context.params.jobId;
        console.log(`New job created: ${jobId}`, newValue);
        // Perform background tasks like sending email, updating stats, etc.
        return null;
    });
