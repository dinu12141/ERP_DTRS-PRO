const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

// Import weather integration functions
const weatherIntegration = require("./weather-integration");
exports.updateScheduleWeather = weatherIntegration.updateScheduleWeather;
exports.batchUpdateWeather = weatherIntegration.batchUpdateWeather;

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

/**
 * Lead scoring helper.
 * Simple heuristic:
 * - Start from 100
 * - Distance: >10 miles reduces score by 2 points per mile over 10
 * - Roof pitch: >6/12 reduces score by 3 points per unit over 6
 * - System age: >10 years reduces score by 1 point per year over 10
 */
function calculateLeadScore(distance, roofPitch, systemAge) {
    let score = 100;

    if (typeof distance === "number" && distance > 10) {
        score -= (distance - 10) * 2;
    }

    if (typeof roofPitch === "number" && roofPitch > 6) {
        score -= (roofPitch - 6) * 3;
    }

    if (typeof systemAge === "number" && systemAge > 10) {
        score -= (systemAge - 10) * 1;
    }

    score = Math.max(0, Math.min(100, Math.round(score)));
    return score;
}

/**
 * Cloud Function: on write to leads collection, recompute lead.score
 * based on distance, roofPitch, and systemAge fields.
 */
exports.onLeadWritten = functions.firestore
    .document("leads/{leadId}")
    .onWrite((change, context) => {
        const after = change.after.exists ? change.after.data() : null;
        if (!after) {
            return null;
        }

        const distance = after.distance;
        const roofPitch = after.roofPitch;
        const systemAge = after.systemAge;

        const score = calculateLeadScore(distance, roofPitch, systemAge);

        // Avoid infinite loops: only update if score actually changed
        if (after.score === score) {
            return null;
        }

        const docRef = change.after.ref;
        return docRef.update({ score });
    });

/**
 * Auto-log Cloud Function: when a technician submits a JSA document,
 * create an audit log entry under the related job.
 *
 * Expected JSA doc shape:
 * { jobId, location, hazardsReviewed, ppeChecked, lockoutTagout, notes, signatureName }
 */
exports.onJsaSubmitted = functions.firestore
    .document("tech_jsa/{jsaId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const jobId = data.jobId;
        if (!jobId) {
            return null;
        }

        const db = admin.firestore();
        const logRef = db
            .collection("jobs")
            .doc(jobId)
            .collection("logs")
            .doc();

        await logRef.set({
            type: "jsa",
            sourceId: snap.id,
            message: `Pre-work JSA completed by ${data.signatureName || "technician"}`,
            payload: data,
            createdAt: new Date().toISOString(),
        });

        return null;
    });

/**
 * Auto-log Cloud Function: when a damage scan is created, append a note
 * to the related job that can be used for invoicing.
 *
 * Expected damage doc shape:
 * { jobId, roofDamagePhotos, equipmentDamagePhotos, notes }
 */
exports.onDamageScanCreated = functions.firestore
    .document("damage_scans/{scanId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const jobId = data.jobId;
        if (!jobId) {
            return null;
        }

        const db = admin.firestore();
        const jobRef = db.collection("jobs").doc(jobId);
        const jobSnap = await jobRef.get();
        if (!jobSnap.exists) {
            return null;
        }

        const message = `Damage scan recorded: ${data.notes || "no notes provided"}`;

        // Append to a logs subcollection for the job
        const logRef = jobRef.collection("logs").doc();
        await logRef.set({
            type: "damage_scan",
            sourceId: snap.id,
            message,
            payload: data,
            createdAt: new Date().toISOString(),
        });

        return null;
    });

// Weather integration is now in weather-integration.js
// Import it here or keep separate

/**
 * BOM auto-deduct:
 * When a job reaches RESET_COMPLETE, look up any BOM rules for that job type
 * and deduct inventory quantities accordingly.
 *
 * Expected BOM rule collection: bomRules/{ruleId}
 * { jobType, components: [{ itemId, quantity }] }
 */
exports.onJobWorkflowForBom = functions.firestore
    .document("jobs/{jobId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        if (!before || !after) {
            return null;
        }

        if (before.workflowState === after.workflowState) {
            return null;
        }

        // Only trigger on transition into RESET_COMPLETE
        if (after.workflowState !== "reset_complete") {
            return null;
        }

        const jobType = after.type;
        const db = admin.firestore();

        const rulesSnap = await db
            .collection("bomRules")
            .where("jobType", "==", jobType)
            .get();

        if (rulesSnap.empty) {
            return null;
        }

        const batch = db.batch();
        const activityCol = db.collection("inventoryActivity");

        rulesSnap.forEach((ruleDoc) => {
            const rule = ruleDoc.data();
            const components = rule.components || [];

            components.forEach((comp) => {
                const itemRef = db.collection("inventoryItems").doc(comp.itemId);
                batch.update(itemRef, {
                    totalQuantity: admin.firestore.FieldValue.increment(-Math.abs(comp.quantity)),
                });

                const activityRef = activityCol.doc();
                batch.set(activityRef, {
                    itemId: comp.itemId,
                    type: "bom_deduct",
                    quantityChange: -Math.abs(comp.quantity),
                    reference: context.params.jobId,
                    metadata: { ruleId: ruleDoc.id },
                    createdAt: new Date().toISOString(),
                });
            });
        });

        await batch.commit();
        return null;
    });

/**
 * Low stock email alerts:
 * When an inventory item is updated and falls below its reorderPoint,
 * send an email notification (implementation stubbed here).
 */
exports.onInventoryLowStock = functions.firestore
    .document("inventoryItems/{itemId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        if (!before || !after) {
            return null;
        }

        if (after.totalQuantity >= after.reorderPoint) {
            return null;
        }

        if (after.lowStockAlertSent) {
            return null;
        }

        const db = admin.firestore();

        // TODO: Integrate with real email provider (e.g. SendGrid, Mailgun).
        console.log(
            `LOW STOCK ALERT: ${after.itemName} (${after.sku}) quantity=${after.totalQuantity}, reorderPoint=${after.reorderPoint}`,
        );

        await db
            .collection("inventoryItems")
            .doc(context.params.itemId)
            .update({ lowStockAlertSent: true });

        // Optionally log alert
        await db.collection("inventoryActivity").add({
            itemId: context.params.itemId,
            type: "adjustment",
            quantityChange: 0,
            reference: "low_stock_alert",
            metadata: {
                totalQuantity: after.totalQuantity,
                reorderPoint: after.reorderPoint,
            },
            createdAt: new Date().toISOString(),
        });

        return null;
    });

/**
 * PDF Invoice Generation:
 * When an invoice document is created or updated with pdfGenerationRequested=true,
 * generate a PDF and store the URL back on the invoice.
 *
 * NOTE: This is a stub implementation. In production, you would:
 * 1. Use a PDF library like pdfkit, puppeteer, or a service like DocRaptor
 * 2. Upload the PDF to Firebase Storage or Cloud Storage
 * 3. Set the pdfUrl field on the invoice document
 */
exports.generateInvoicePDF = functions.firestore
    .document("invoices/{invoiceId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        if (!before || !after) {
            return null;
        }

        // Only trigger if pdfGenerationRequested flag is set
        if (!after.pdfGenerationRequested || before.pdfGenerationRequested === after.pdfGenerationRequested) {
            return null;
        }

        const invoiceId = context.params.invoiceId;
        const db = admin.firestore();
        const storage = admin.storage();

        // Fetch invoice data
        const invoiceDoc = await db.collection("invoices").doc(invoiceId).get();
        if (!invoiceDoc.exists) {
            console.error(`Invoice ${invoiceId} not found`);
            return null;
        }

        const invoice = invoiceDoc.data();

        // Generate PDF HTML
        const pdfHtml = generateInvoiceHTML(invoice);

        // NOTE: For production, install puppeteer or use a PDF service
        // For now, we'll store HTML and use a service to convert
        // Option 1: Use puppeteer (install: npm install puppeteer)
        // Option 2: Use a PDF service API
        // Option 3: Use html-pdf (install: npm install html-pdf)
        
        const bucket = storage.bucket();
        const fileName = `invoices/${invoiceId}.pdf`;
        const file = bucket.file(fileName);

        // TODO: Replace with actual PDF generation
        // Example with puppeteer:
        // const puppeteer = require('puppeteer');
        // const browser = await puppeteer.launch();
        // const page = await browser.newPage();
        // await page.setContent(pdfHtml);
        // const pdfBuffer = await page.pdf({ format: 'A4' });
        // await browser.close();
        
        // For now, create a placeholder that stores HTML
        // In production, convert HTML to PDF using one of the methods above
        const htmlFileName = `invoices/${invoiceId}.html`;
        const htmlFile = bucket.file(htmlFileName);
        await htmlFile.save(pdfHtml, {
            metadata: {
                contentType: 'text/html',
            },
        });
        await htmlFile.makePublic();
        
        // Placeholder PDF URL - replace with actual PDF generation
        const pdfUrl = `https://storage.googleapis.com/${bucket.name}/${htmlFileName}`;
        
        console.log(`PDF generation placeholder created for invoice ${invoiceId}`);
        console.log(`Install puppeteer or html-pdf to generate actual PDFs`);

        console.log(`PDF generated for invoice ${invoiceId}: ${pdfUrl}`);

        // Update invoice with PDF URL
        await db
            .collection("invoices")
            .doc(invoiceId)
            .update({
                pdfUrl,
                pdfGeneratedAt: new Date().toISOString(),
                pdfGenerationRequested: false, // Reset flag
            });

        return null;
    });

/**
 * Generate HTML for invoice PDF
 */
function generateInvoiceHTML(invoice) {
    const lineItemsHtml = (invoice.lineItems || []).map(item => `
        <tr>
            <td>${item.description || ''}</td>
            <td style="text-align: center;">${item.quantity || 0}</td>
            <td style="text-align: right;">$${(item.unitPrice || 0).toFixed(2)}</td>
            <td style="text-align: right;">$${(item.total || 0).toFixed(2)}</td>
        </tr>
    `).join('');

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; padding: 40px; }
                .header { border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
                .invoice-info { float: right; text-align: right; }
                .details { margin: 30px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th { background-color: #f0f0f0; padding: 10px; text-align: left; border-bottom: 2px solid #333; }
                td { padding: 8px; border-bottom: 1px solid #ddd; }
                .totals { float: right; width: 300px; margin-top: 20px; }
                .total-row { font-weight: bold; font-size: 1.1em; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>DTRS PRO</h1>
                <div class="invoice-info">
                    <h2>INVOICE</h2>
                    <p><strong>Invoice #:</strong> ${invoice.invoiceNumber || invoice.id}</p>
                    <p><strong>Date:</strong> ${new Date(invoice.createdAt).toLocaleDateString()}</p>
                    <p><strong>Due Date:</strong> ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}</p>
                </div>
            </div>
            
            <div class="details">
                <p><strong>Bill To:</strong></p>
                <p>${invoice.customerName || 'Customer'}</p>
                ${invoice.jobId ? `<p><strong>Job ID:</strong> ${invoice.jobId}</p>` : ''}
            </div>

            <table>
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${lineItemsHtml}
                </tbody>
            </table>

            <div class="totals">
                <table>
                    <tr>
                        <td>Subtotal:</td>
                        <td style="text-align: right;">$${(invoice.subtotal || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Tax (${((invoice.taxRate || 0) * 100).toFixed(2)}%):</td>
                        <td style="text-align: right;">$${(invoice.taxAmount || 0).toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Total:</td>
                        <td style="text-align: right;">$${(invoice.total || 0).toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Paid:</td>
                        <td style="text-align: right;">$${(invoice.paidAmount || 0).toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td>Balance Due:</td>
                        <td style="text-align: right;">$${(invoice.balanceDue || invoice.total || 0).toFixed(2)}</td>
                    </tr>
                </table>
            </div>

            ${invoice.notes ? `<div style="margin-top: 40px;"><p><strong>Notes:</strong></p><p>${invoice.notes}</p></div>` : ''}
        </body>
        </html>
    `;
}

/**
 * Auto-Invoice Based on Job Status:
 * When a job transitions to certain workflow states, automatically create invoices.
 *
 * Triggers:
 * - SCHEDULED_DETACH -> Deposit invoice (30% of estimate)
 * - ROOFING_COMPLETE -> Progress invoice (40% of estimate)
 * - RESET_COMPLETE -> Final invoice (30% of estimate, minus commission if applicable)
 */
exports.autoInvoiceOnJobStatus = functions.firestore
    .document("jobs/{jobId}")
    .onUpdate(async (change, context) => {
        const before = change.before.data();
        const after = change.after.data();

        if (!before || !after) {
            return null;
        }

        // Only trigger on workflow state changes
        if (before.workflowState === after.workflowState) {
            return null;
        }

        const jobId = context.params.jobId;
        const db = admin.firestore();

        // Find related estimate for this job
        const estimatesSnap = await db
            .collection("estimates")
            .where("jobId", "==", jobId)
            .limit(1)
            .get();

        if (estimatesSnap.empty) {
            console.log(`No estimate found for job ${jobId}, skipping auto-invoice`);
            return null;
        }

        const estimate = estimatesSnap.docs[0].data();
        const estimateTotal = estimate.total || 0;

        // Check if invoice already exists for this job/type combination
        const checkExistingInvoice = async (invoiceType) => {
            const existing = await db
                .collection("invoices")
                .where("jobId", "==", jobId)
                .where("type", "==", invoiceType)
                .limit(1)
                .get();
            return !existing.empty;
        };

        let invoiceType = null;
        let invoiceAmount = 0;
        let invoiceLineItems = [];

        // Determine invoice type and amount based on workflow state
        if (after.workflowState === "scheduled_detach") {
            invoiceType = "Deposit";
            invoiceAmount = estimateTotal * 0.3; // 30%
            invoiceLineItems = [
                {
                    description: "Deposit (30% of total project)",
                    quantity: 1,
                    unitPrice: invoiceAmount,
                    unit: "each",
                    total: invoiceAmount,
                },
            ];
        } else if (after.workflowState === "roofing_complete") {
            invoiceType = "Progress";
            invoiceAmount = estimateTotal * 0.4; // 40%
            invoiceLineItems = [
                {
                    description: "Progress Payment (40% of total project)",
                    quantity: 1,
                    unitPrice: invoiceAmount,
                    unit: "each",
                    total: invoiceAmount,
                },
            ];
        } else if (after.workflowState === "reset_complete") {
            invoiceType = "Final";
            const finalAmount = estimateTotal * 0.3; // 30%

            // If there's a partner, calculate commission deduction
            let commissionDeduction = 0;
            if (after.partnerId) {
                const partnerSnap = await db.collection("roofingPartners").doc(after.partnerId).get();
                if (partnerSnap.exists) {
                    const partner = partnerSnap.data();
                    if (partner.commissionModel === "percent_of_profit") {
                        // Assume profit margin is 20% for this calculation
                        const profit = estimateTotal * 0.2;
                        commissionDeduction = profit * (partner.commissionRate / 100);
                    } else if (partner.commissionModel === "flat_fee_per_kw") {
                        const systemSizeKw = after.systemSizeKw || 0;
                        commissionDeduction = systemSizeKw * partner.commissionRate;
                    }
                }
            }

            invoiceAmount = finalAmount - commissionDeduction;
            invoiceLineItems = [
                {
                    description: "Final Payment (30% of total project)",
                    quantity: 1,
                    unitPrice: finalAmount,
                    unit: "each",
                    total: finalAmount,
                },
            ];

            if (commissionDeduction > 0) {
                invoiceLineItems.push({
                    description: `Commission to Roofer (${after.partnerName || "Partner"})`,
                    quantity: 1,
                    unitPrice: -commissionDeduction,
                    unit: "each",
                    total: -commissionDeduction,
                });
            }
        }

        if (!invoiceType) {
            return null; // No invoice needed for this state
        }

        // Check if invoice already exists
        const exists = await checkExistingInvoice(invoiceType);
        if (exists) {
            console.log(`Invoice of type ${invoiceType} already exists for job ${jobId}`);
            return null;
        }

        // Generate invoice number
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, "0")}`;

        // Calculate due date (30 days from now)
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);

        // Create invoice document
        const invoiceData = {
            invoiceNumber,
            jobId,
            customerId: after.customerId || "",
            customerName: estimate.customerName || "Customer",
            partnerId: after.partnerId || null,
            partnerName: after.partnerName || null,
            type: invoiceType,
            status: "Pending",
            lineItems: invoiceLineItems,
            subtotal: invoiceAmount,
            taxRate: estimate.taxRate || 0,
            taxAmount: invoiceAmount * (estimate.taxRate || 0),
            total: invoiceAmount + invoiceAmount * (estimate.taxRate || 0),
            paidAmount: 0,
            balanceDue: invoiceAmount + invoiceAmount * (estimate.taxRate || 0),
            dueDate: dueDate.toISOString(),
            pdfUrl: null,
            notes: `Auto-generated invoice for job ${jobId} at workflow state: ${after.workflowState}`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        await db.collection("invoices").add(invoiceData);

        console.log(`Auto-generated ${invoiceType} invoice for job ${jobId}: ${invoiceNumber}`);

        return null;
    });

/**
 * Auto-log Cloud Function: when a detach workflow is created,
 * create an audit log entry under the related job.
 *
 * Expected detach doc shape:
 * { jobId, productionBaselineKw, inverterSerialPhotos, assetTags, equipmentLocationNotes }
 */
exports.onDetachWorkflowCreated = functions.firestore
    .document("detach_workflows/{workflowId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const jobId = data.jobId;
        if (!jobId) {
            return null;
        }

        const db = admin.firestore();
        const logRef = db
            .collection("jobs")
            .doc(jobId)
            .collection("logs")
            .doc();

        await logRef.set({
            type: "detach_workflow",
            sourceId: snap.id,
            message: `Detach workflow completed. Production baseline: ${data.productionBaselineKw}kW. Equipment location: ${data.equipmentLocationNotes}`,
            payload: data,
            createdAt: new Date().toISOString(),
        });

        return null;
    });

/**
 * Auto-log Cloud Function: when a reset workflow is created,
 * create an audit log entry under the related job.
 *
 * Expected reset doc shape:
 * { jobId, stringVoltage, inverterMpptWindowMin, inverterMpptWindowMax, commissioningChecklistComplete, commissioningPhotos, notes }
 */
exports.onResetWorkflowCreated = functions.firestore
    .document("reset_workflows/{workflowId}")
    .onCreate(async (snap, context) => {
        const data = snap.data();
        const jobId = data.jobId;
        if (!jobId) {
            return null;
        }

        const db = admin.firestore();
        const logRef = db
            .collection("jobs")
            .doc(jobId)
            .collection("logs")
            .doc();

        const stringSizingStatus = data.stringSizingValid
            ? "valid"
            : "warning - outside MPPT window";

        await logRef.set({
            type: "reset_workflow",
            sourceId: snap.id,
            message: `Reset workflow completed. String voltage: ${data.stringVoltage}V (${stringSizingStatus}). Commissioning: ${data.commissioningChecklistComplete ? "complete" : "incomplete"}`,
            payload: data,
            createdAt: new Date().toISOString(),
        });

        return null;
    });

/**
 * Daily KPI Aggregation Cloud Function:
 * Aggregates daily KPIs and stores them for reporting.
 * Runs daily at midnight.
 */
exports.aggregateDailyKPIs = functions.pubsub
    .schedule("0 0 * * *")
    .timeZone("America/Denver")
    .onRun(async (context) => {
        const db = admin.firestore();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        yesterday.setHours(0, 0, 0, 0);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Aggregate revenue
        const invoices = await db
            .collection("invoices")
            .where("createdAt", ">=", yesterday.toISOString())
            .where("createdAt", "<", today.toISOString())
            .get();

        let totalRevenue = 0;
        let totalPaid = 0;
        invoices.forEach((doc) => {
            const data = doc.data();
            totalRevenue += data.total || 0;
            totalPaid += data.paidAmount || 0;
        });

        // Aggregate jobs
        const jobs = await db
            .collection("jobs")
            .where("createdAt", ">=", yesterday.toISOString())
            .where("createdAt", "<", today.toISOString())
            .get();

        // Aggregate compliance
        const jsas = await db
            .collection("tech_jsa")
            .where("createdAt", ">=", yesterday.toISOString())
            .where("createdAt", "<", today.toISOString())
            .get();

        // Store aggregated data
        const kpiDoc = {
            date: yesterday.toISOString().split("T")[0],
            revenue: {
                total: totalRevenue,
                paid: totalPaid,
                pending: totalRevenue - totalPaid,
                invoiceCount: invoices.size,
            },
            jobs: {
                created: jobs.size,
                byStatus: {},
            },
            compliance: {
                jsasCompleted: jsas.size,
                jsaCompletionRate: jobs.size > 0 ? (jsas.size / jobs.size) * 100 : 0,
            },
            createdAt: new Date().toISOString(),
        };

        // Group jobs by status
        jobs.forEach((doc) => {
            const status = doc.data().workflowState || "unknown";
            kpiDoc.jobs.byStatus[status] = (kpiDoc.jobs.byStatus[status] || 0) + 1;
        });

        await db.collection("kpi_aggregations").add(kpiDoc);

        console.log(`Daily KPI aggregation completed for ${kpiDoc.date}`);

        return null;
    });

/**
 * Weekly Compliance Report:
 * Generates weekly compliance summary and sends notifications.
 */
exports.generateWeeklyComplianceReport = functions.pubsub
    .schedule("0 9 * * 1")
    .timeZone("America/Denver")
    .onRun(async (context) => {
        const db = admin.firestore();
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        // Get all jobs from last week
        const jobs = await db
            .collection("jobs")
            .where("createdAt", ">=", weekAgo.toISOString())
            .get();

        const jobIds = jobs.docs.map((doc) => doc.id);
        const totalJobs = jobIds.length;

        // Get JSAs for these jobs
        let jsasCount = 0;
        for (const jobId of jobIds) {
            const jsas = await db
                .collection("tech_jsa")
                .where("jobId", "==", jobId)
                .get();
            if (jsas.size > 0) {
                jsasCount++;
            }
        }

        const complianceRate = totalJobs > 0 ? (jsasCount / totalJobs) * 100 : 0;

        // Store weekly report
        const reportDoc = {
            period: {
                start: weekAgo.toISOString(),
                end: new Date().toISOString(),
            },
            totalJobs,
            jsasCompleted: jsasCount,
            complianceRate: Math.round(complianceRate * 100) / 100,
            missingJSAs: totalJobs - jsasCount,
            generatedAt: new Date().toISOString(),
        };

        await db.collection("compliance_reports").add(reportDoc);

        // Create notification for admins if compliance is low
        if (complianceRate < 90) {
            const admins = await db
                .collection("users")
                .where("role", "==", "admin")
                .get();

            admins.forEach((adminDoc) => {
                db.collection("notifications").add({
                    userId: adminDoc.id,
                    userRole: "admin",
                    title: "Low Compliance Rate Alert",
                    message: `Weekly compliance rate is ${complianceRate.toFixed(1)}% (${jsasCount}/${totalJobs} jobs with JSA)`,
                    type: "warning",
                    relatedEntityType: "compliance_report",
                    createdAt: new Date().toISOString(),
                    isRead: false,
                });
            });
        }

        console.log(`Weekly compliance report generated: ${complianceRate.toFixed(1)}%`);

        return null;
    });

// Import automation functions
const automations = require("./automations");
exports.rainCheckAutomation = automations.rainCheckAutomation;
exports.stalledJobDetection = automations.stalledJobDetection;
exports.inventoryAlertAutomation = automations.inventoryAlertAutomation;
exports.collectionBotAutomation = automations.collectionBotAutomation;