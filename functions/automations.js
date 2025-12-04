/**
 * Automation Logic Cloud Functions
 * Handles: Rain check, Stalled jobs, Inventory alerts, Collection bot
 */

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const axios = require("axios");

// Email service (using SendGrid or similar - placeholder)
const sendEmail = async (to, subject, htmlBody) => {
    // TODO: Integrate with SendGrid, Mailgun, or similar
    // For now, log the email
    console.log(`[EMAIL] To: ${to}, Subject: ${subject}`);
    console.log(`[EMAIL BODY] ${htmlBody}`);
    
    // In production, use:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, from: 'noreply@dtrspro.com', subject, html: htmlBody });
    
    return { success: true };
};

// SMS service via Twilio
const sendSMS = async (to, message) => {
    const TWILIO_ACCOUNT_SID = functions.config().twilio?.account_sid || "";
    const TWILIO_AUTH_TOKEN = functions.config().twilio?.auth_token || "";
    const TWILIO_PHONE_NUMBER = functions.config().twilio?.phone_number || "";

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
        console.log(`[SMS] To: ${to}, Message: ${message}`);
        console.log("[SMS] Twilio not configured - message logged only");
        return { success: true, sid: "mock_sid" };
    }

    try {
        const twilio = require("twilio");
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        const result = await client.messages.create({
            body: message,
            from: TWILIO_PHONE_NUMBER,
            to: to,
        });

        return { success: true, sid: result.sid };
    } catch (error) {
        console.error("Twilio SMS error:", error);
        return { success: false, error: error.message };
    }
};

// Email templates
const emailTemplates = {
    rainCheck: (jobId, address, newDate) => ({
        subject: `Job Rescheduled Due to Weather - Job ${jobId}`,
        html: `
            <h2>Job Rescheduled Due to Weather</h2>
            <p>Hello,</p>
            <p>Your scheduled work at <strong>${address}</strong> (Job ${jobId}) has been rescheduled due to forecasted rain.</p>
            <p><strong>New Date:</strong> ${newDate}</p>
            <p>We will contact you to confirm the new schedule.</p>
            <p>Thank you for your understanding.</p>
            <p>DTRS PRO Team</p>
        `,
    }),
    stalledJob: (jobId, address, daysStalled) => ({
        subject: `Action Required: Job ${jobId} Has Not Progressed`,
        html: `
            <h2>Stalled Job Alert</h2>
            <p>Hello,</p>
            <p>Job <strong>${jobId}</strong> at ${address} has not progressed in ${daysStalled} days.</p>
            <p>Please review and take appropriate action.</p>
            <p>DTRS PRO Team</p>
        `,
    }),
    inventoryAlert: (itemName, sku, currentStock, reorderPoint) => ({
        subject: `Low Stock Alert: ${itemName}`,
        html: `
            <h2>Low Stock Alert</h2>
            <p>Hello,</p>
            <p>The following inventory item is below reorder point:</p>
            <ul>
                <li><strong>Item:</strong> ${itemName}</li>
                <li><strong>SKU:</strong> ${sku}</li>
                <li><strong>Current Stock:</strong> ${currentStock}</li>
                <li><strong>Reorder Point:</strong> ${reorderPoint}</li>
            </ul>
            <p>Please reorder soon to avoid stockouts.</p>
            <p>DTRS PRO Team</p>
        `,
    }),
    collectionReminder: (invoiceNumber, customerName, amount, daysOverdue) => ({
        subject: `Payment Reminder: Invoice ${invoiceNumber}`,
        html: `
            <h2>Payment Reminder</h2>
            <p>Hello ${customerName},</p>
            <p>This is a friendly reminder that invoice <strong>${invoiceNumber}</strong> is ${daysOverdue} days overdue.</p>
            <p><strong>Amount Due:</strong> $${amount.toFixed(2)}</p>
            <p>Please make payment at your earliest convenience.</p>
            <p>You can pay online through your portal or contact us for assistance.</p>
            <p>Thank you,<br>DTRS PRO Team</p>
        `,
    }),
};

/**
 * Rain Check Automation:
 * Checks weather for scheduled jobs and reschedules if rain is forecast
 * Runs daily at 6 AM
 */
exports.rainCheckAutomation = functions.pubsub
    .schedule("0 6 * * *")
    .timeZone("America/Denver")
    .onRun(async (context) => {
        const db = admin.firestore();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // Get schedule entries for today and tomorrow
        const scheduleRef = db.collection("schedule");
        const schedules = await scheduleRef
            .where("date", ">=", today.toISOString().split("T")[0])
            .where("date", "<=", tomorrow.toISOString().split("T")[0])
            .get();

        const WEATHER_API_KEY = functions.config().weather?.api_key || "";
        let rescheduledCount = 0;

        for (const scheduleDoc of schedules.docs) {
            const schedule = scheduleDoc.data();
            
            // Skip if already rescheduled
            if (schedule.rescheduledDueToWeather) {
                continue;
            }

            // Get job for address
            const jobRef = db.collection("jobs").doc(schedule.jobId);
            const jobDoc = await jobRef.get();
            
            if (!jobDoc.exists) continue;

            const job = jobDoc.data();
            const weather = schedule.weather;

            // Check if rain is forecast
            if (weather && (weather.condition === "Rain" || weather.precipitation > 0.1)) {
                // Reschedule to next available day (3 days later)
                const newDate = new Date(schedule.date);
                newDate.setDate(newDate.getDate() + 3);
                const newDateStr = newDate.toISOString().split("T")[0];

                // Update schedule
                await scheduleDoc.ref.update({
                    date: newDateStr,
                    rescheduledDueToWeather: true,
                    originalDate: schedule.date,
                    rescheduledAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Get customer contact info
                const customerRef = db.collection("users").where("customerId", "==", job.customerId).limit(1);
                const customerDocs = await customerRef.get();
                
                if (!customerDocs.empty) {
                    const customer = customerDocs.docs[0].data();
                    const email = customer.email;
                    const phone = customer.phone;

                    // Send email
                    const emailTemplate = emailTemplates.rainCheck(
                        schedule.jobId,
                        job.address?.street || "your location",
                        newDateStr
                    );
                    await sendEmail(email, emailTemplate.subject, emailTemplate.html);

                    // Send SMS if phone available
                    if (phone) {
                        await sendSMS(
                            phone,
                            `DTRS PRO: Job ${schedule.jobId} rescheduled to ${newDateStr} due to weather. Check email for details.`
                        );
                    }
                }

                // Create notification
                await db.collection("notifications").add({
                    userId: job.assignedTo || "admin",
                    userRole: "admin",
                    title: "Job Rescheduled Due to Weather",
                    message: `Job ${schedule.jobId} rescheduled from ${schedule.date} to ${newDateStr} due to rain forecast`,
                    type: "info",
                    relatedEntityType: "job",
                    relatedEntityId: schedule.jobId,
                    createdAt: new Date().toISOString(),
                    isRead: false,
                });

                rescheduledCount++;
            }
        }

        console.log(`Rain check completed: ${rescheduledCount} jobs rescheduled`);

        return null;
    });

/**
 * Stalled Job Detection:
 * Detects jobs that haven't progressed in X days and sends alerts
 * Runs daily at 8 AM
 */
exports.stalledJobDetection = functions.pubsub
    .schedule("0 8 * * *")
    .timeZone("America/Denver")
    .onRun(async (context) => {
        const db = admin.firestore();
        const daysThreshold = 7; // Alert if no progress in 7 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysThreshold);

        // Get active jobs
        const jobsRef = db.collection("jobs");
        const activeJobs = await jobsRef
            .where("workflowState", "!=", "closed")
            .get();

        let stalledCount = 0;

        for (const jobDoc of activeJobs.docs) {
            const job = jobDoc.data();
            const lastUpdate = job.updatedAt ? new Date(job.updatedAt) : new Date(job.createdAt);
            
            if (lastUpdate < cutoffDate) {
                const daysStalled = Math.floor((new Date() - lastUpdate) / (1000 * 60 * 60 * 24));

                // Get customer
                const customerRef = db.collection("users").where("customerId", "==", job.customerId).limit(1);
                const customerDocs = await customerRef.get();
                
                if (!customerDocs.empty) {
                    const customer = customerDocs.docs[0].data();
                    const email = customer.email;

                    // Send email
                    const emailTemplate = emailTemplates.stalledJob(
                        jobDoc.id,
                        job.address?.street || "your location",
                        daysStalled
                    );
                    await sendEmail(email, emailTemplate.subject, emailTemplate.html);
                }

                // Create notification for admin
                await db.collection("notifications").add({
                    userId: "admin",
                    userRole: "admin",
                    title: "Stalled Job Alert",
                    message: `Job ${jobDoc.id} has not progressed in ${daysStalled} days`,
                    type: "warning",
                    relatedEntityType: "job",
                    relatedEntityId: jobDoc.id,
                    createdAt: new Date().toISOString(),
                    isRead: false,
                });

                // Mark job as stalled
                await jobDoc.ref.update({
                    isStalled: true,
                    daysStalled: daysStalled,
                    stalledSince: lastUpdate.toISOString(),
                });

                stalledCount++;
            }
        }

        console.log(`Stalled job detection completed: ${stalledCount} jobs flagged`);

        return null;
    });

/**
 * Inventory Alert Automation:
 * Checks inventory levels and sends alerts when below reorder point
 * Runs daily at 9 AM
 */
exports.inventoryAlertAutomation = functions.pubsub
    .schedule("0 9 * * *")
    .timeZone("America/Denver")
    .onRun(async (context) => {
        const db = admin.firestore();
        const inventoryRef = db.collection("inventory_items");
        const items = await inventoryRef.get();

        let alertCount = 0;

        for (const itemDoc of items.docs) {
            const item = itemDoc.data();
            const currentStock = item.totalStock || item.totalQuantity || 0;
            const reorderPoint = item.reorderPoint || 0;

            if (currentStock < reorderPoint && !item.lowStockAlertSent) {
                // Get admin emails
                const adminsRef = db.collection("users").where("role", "==", "admin");
                const admins = await adminsRef.get();

                const emailTemplate = emailTemplates.inventoryAlert(
                    item.name || item.itemName || "Unknown Item",
                    item.sku || itemDoc.id,
                    currentStock,
                    reorderPoint
                );

                // Send to all admins
                for (const adminDoc of admins.docs) {
                    const admin = adminDoc.data();
                    if (admin.email) {
                        await sendEmail(admin.email, emailTemplate.subject, emailTemplate.html);
                    }
                }

                // Mark alert as sent
                await itemDoc.ref.update({
                    lowStockAlertSent: true,
                    lowStockAlertSentAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Create notification
                await db.collection("notifications").add({
                    userId: "admin",
                    userRole: "admin",
                    title: "Low Stock Alert",
                    message: `${item.name || item.sku} is below reorder point (${currentStock} < ${reorderPoint})`,
                    type: "warning",
                    relatedEntityType: "inventory",
                    relatedEntityId: itemDoc.id,
                    createdAt: new Date().toISOString(),
                    isRead: false,
                });

                alertCount++;
            }
        }

        console.log(`Inventory alert completed: ${alertCount} items below reorder point`);

        return null;
    });

/**
 * Collection Bot Automation:
 * Sends payment reminders for overdue invoices
 * Runs daily at 10 AM
 */
exports.collectionBotAutomation = functions.pubsub
    .schedule("0 10 * * *")
    .timeZone("America/Denver")
    .onRun(async (context) => {
        const db = admin.firestore();
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Get overdue invoices
        const invoicesRef = db.collection("invoices");
        const overdueInvoices = await invoicesRef
            .where("status", "==", "Pending")
            .where("balanceDue", ">", 0)
            .get();

        let reminderCount = 0;

        for (const invoiceDoc of overdueInvoices.docs) {
            const invoice = invoiceDoc.data();
            const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : null;

            if (!dueDate || dueDate >= today) {
                continue; // Not overdue yet
            }

            const daysOverdue = Math.floor((today - dueDate) / (1000 * 60 * 60 * 24));

            // Only send reminders on specific days (e.g., 7, 14, 21, 30 days overdue)
            if (![7, 14, 21, 30].includes(daysOverdue)) {
                continue;
            }

            // Get customer
            const customerRef = db.collection("users").where("customerId", "==", invoice.customerId).limit(1);
            const customerDocs = await customerRef.get();
            
            if (!customerDocs.empty) {
                const customer = customerDocs.docs[0].data();
                const email = customer.email;
                const phone = customer.phone;

                // Send email
                const emailTemplate = emailTemplates.collectionReminder(
                    invoice.invoiceNumber || invoiceDoc.id,
                    invoice.customerName || "Customer",
                    invoice.balanceDue || invoice.total,
                    daysOverdue
                );
                await sendEmail(email, emailTemplate.subject, emailTemplate.html);

                // Send SMS if phone available and 30+ days overdue
                if (phone && daysOverdue >= 30) {
                    await sendSMS(
                        phone,
                        `DTRS PRO: Invoice ${invoice.invoiceNumber || invoiceDoc.id} is ${daysOverdue} days overdue. Amount: $${(invoice.balanceDue || invoice.total).toFixed(2)}. Please pay at your earliest convenience.`
                    );
                }

                // Log reminder
                await db.collection("invoice_reminders").add({
                    invoiceId: invoiceDoc.id,
                    customerId: invoice.customerId,
                    daysOverdue: daysOverdue,
                    reminderType: daysOverdue === 7 ? "first" : daysOverdue === 14 ? "second" : daysOverdue === 21 ? "third" : "final",
                    sentAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                reminderCount++;
            }
        }

        console.log(`Collection bot completed: ${reminderCount} reminders sent`);

        return null;
    });

