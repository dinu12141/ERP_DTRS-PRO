from pydantic import BaseModel, Field, EmailStr, constr, conint, confloat
from typing import List, Optional, Any, Dict, Literal
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in-progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class JobType(str, Enum):
    DETACH = "detach"
    RESET = "reset"
    DETACH_RESET = "detach-reset"


class JobWorkflowState(str, Enum):
    INTAKE_QUOTING = "intake_quoting"
    SITE_SURVEY_PENDING = "site_survey_pending"
    SITE_SURVEY_COMPLETE = "site_survey_complete"
    PERMIT_SUBMITTED = "permit_submitted"
    PERMIT_APPROVED = "permit_approved"
    SCHEDULED_DETACH = "scheduled_detach"
    DETACH_COMPLETE_HOLD = "detach_complete_hold"
    ROOFING_COMPLETE = "roofing_complete"
    READY_FOR_RESET = "ready_for_reset"
    SCHEDULED_RESET = "scheduled_reset"
    RESET_COMPLETE = "reset_complete"
    INSPECTION_PTO_PASSED = "inspection_pto_passed"
    CLOSED = "closed"

class Address(BaseModel):
    street: str
    city: str
    state: str
    zip: str

class Customer(BaseModel):
    id: Optional[str] = None
    firstName: str
    lastName: str
    email: EmailStr
    phone: str
    address: Address
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class PanelData(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    count: Optional[conint(ge=0)] = None
    wattage: Optional[conint(ge=0)] = None
    totalKw: Optional[confloat(ge=0)] = None


class InverterData(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    count: Optional[conint(ge=0)] = None
    type: Optional[str] = None


class MonitoringData(BaseModel):
    provider: Optional[str] = None
    portalUrl: Optional[str] = None
    accountId: Optional[str] = None


class RackingData(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    roofMaterial: Optional[str] = None
    roofPitch: Optional[confloat(ge=0, le=24)] = None
    roofAgeYears: Optional[confloat(ge=0, le=50)] = None


class ElectricalData(BaseModel):
    mainPanelSizeAmps: Optional[conint(ge=0)] = None
    panelUpgradeNeeded: Optional[bool] = None
    utilityCompany: Optional[str] = None
    existingConduit: Optional[bool] = None


class BatteryData(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    count: Optional[conint(ge=0)] = None
    totalKwh: Optional[confloat(ge=0)] = None


class JobPhoto(BaseModel):
    url: str
    label: Optional[str] = None
    category: Optional[str] = Field(
        default=None,
        description="e.g. 'roof_before', 'roof_after', 'electrical', 'panels', etc.",
    )
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)
    uploadedBy: Optional[str] = None


class Job(BaseModel):
    id: Optional[str] = None
    customerId: str
    status: JobStatus = JobStatus.SCHEDULED
    type: JobType
    scheduledDate: datetime
    assignedCrewId: Optional[str] = None
    technicianIds: List[str] = []
    address: Address

    # Workflow state machine
    workflowState: JobWorkflowState = JobWorkflowState.INTAKE_QUOTING

    # Milestone dates (optional – align to workflow)
    siteSurveyCompletedAt: Optional[datetime] = None
    permitSubmittedAt: Optional[datetime] = None
    permitApprovedAt: Optional[datetime] = None
    detachScheduledAt: Optional[datetime] = None
    detachCompletedAt: Optional[datetime] = None
    roofingCompletedAt: Optional[datetime] = None
    resetScheduledAt: Optional[datetime] = None
    resetCompletedAt: Optional[datetime] = None
    inspectionPtoPassedAt: Optional[datetime] = None
    closedAt: Optional[datetime] = None

    # Technical specs
    systemType: Optional[str] = None
    systemSizeKw: Optional[confloat(ge=0)] = None
    panel: Optional[PanelData] = None
    inverter: Optional[InverterData] = None
    monitoring: Optional[MonitoringData] = None
    racking: Optional[RackingData] = None
    electrical: Optional[ElectricalData] = None
    battery: Optional[BatteryData] = None

    photos: List[JobPhoto] = []

    notes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class InventoryBinLocationType(str, Enum):
    WAREHOUSE = "warehouse"
    TRUCK = "truck"
    JOB = "job"
    RMA = "rma"


class InventoryBin(BaseModel):
    id: Optional[str] = None
    itemId: str
    binCode: str  # value encoded in QR
    locationType: InventoryBinLocationType
    locationRefId: str  # e.g., warehouse code, vehicleId, jobId, or rmaId
    quantity: conint(ge=0) = 0
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class InventoryItem(BaseModel):
    id: Optional[str] = None
    itemName: str
    sku: str
    category: str
    unitPrice: float
    totalQuantity: conint(ge=0) = 0
    reorderPoint: conint(ge=0) = 0
    lowStockAlertSent: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class InventoryActivityType(str, Enum):
    ADJUSTMENT = "adjustment"
    TRANSFER = "transfer"
    BOM_DEDUCT = "bom_deduct"
    RMA = "rma"


class InventoryActivity(BaseModel):
    id: Optional[str] = None
    itemId: str
    type: InventoryActivityType
    quantityChange: int
    fromBinId: Optional[str] = None
    toBinId: Optional[str] = None
    reference: Optional[str] = Field(
        default=None, description="e.g. jobId, rmaId, invoiceId"
    )
    metadata: Dict[str, Any] = {}
    createdAt: datetime = Field(default_factory=datetime.utcnow)


# ---------- CRM & Partner Management ----------

class CommissionModel(str, Enum):
    FLAT_FEE_PER_KW = "flat_fee_per_kw"
    PERCENT_OF_PROFIT = "percent_of_profit"


class BillingMethod(str, Enum):
    NET_DEDUCT = "net_deduct"
    REFERRAL_PAYOUT = "referral_payout"


class ContactRole(str, Enum):
    OWNER = "owner"
    PRODUCTION_MANAGER = "production_manager"
    ADMIN = "admin"


class PartnerContact(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None


class RoofingPartnerContacts(BaseModel):
    owner: PartnerContact
    productionManager: PartnerContact
    admin: PartnerContact


class Contact(BaseModel):
    id: Optional[str] = None
    partnerId: str
    partnerName: Optional[str] = None  # Denormalized for display
    firstName: str
    lastName: str
    role: str
    email: EmailStr
    phone: Optional[str] = None
    mobile: Optional[str] = None
    isPrimary: bool = False
    permissions: List[str] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class RoofingPartner(BaseModel):
    id: Optional[str] = None
    companyName: constr(min_length=1)
    taxId: constr(min_length=3, max_length=32) = Field(..., description="Tax ID / EIN")
    generalLiabilityPolicy: Optional[str] = None
    workersCompPolicy: Optional[str] = None
    contacts: RoofingPartnerContacts
    commissionModel: CommissionModel
    commissionRate: confloat(ge=0) = Field(
        ..., description="Either flat fee per kW or percent of profit depending on commissionModel"
    )
    billingMethod: BillingMethod
    creditLimit: confloat(ge=0) = 0
    currentBalance: confloat(ge=0) = 0
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    certifications: List[str] = []
    serviceAreas: List[str] = []
    status: Literal["Active", "Pending", "Inactive"] = "Active"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class LeadStatus(str, Enum):
    NEW = "New"
    CONTACTED = "Contacted"
    QUALIFIED = "Qualified"
    LOST = "Lost"


class LeadIntakeSource(str, Enum):
    WEB_FORM = "web_form"
    PHONE = "phone"
    PARTNER_REFERRAL = "partner_referral"
    FIELD_REP = "field_rep"
    OTHER = "other"


class Lead(BaseModel):
    id: Optional[str] = None
    customerName: constr(min_length=1)
    email: EmailStr
    phone: Optional[str] = None
    address: constr(min_length=1)
    partnerId: Optional[str] = Field(
        default=None, description="Optional roofing partner that owns this lead"
    )
    source: LeadIntakeSource

    # Lead scoring inputs
    distance: confloat(ge=0, le=500) = Field(..., description="Distance from service hub in miles")
    roofPitch: confloat(ge=0, le=24) = Field(..., description="Roof pitch expressed as rise over 12")
    systemAge: confloat(ge=0, le=50) = Field(..., description="System age in years")

    # Calculated score (0–100) written by Cloud Function
    score: Optional[conint(ge=0, le=100)] = None

    estimatedValue: confloat(ge=0) = 0
    status: LeadStatus = LeadStatus.NEW
    notes: Optional[str] = None
    assignedTo: Optional[str] = None

    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


# ---------- Job workflow helpers ----------

ALLOWED_JOB_TRANSITIONS = {
    JobWorkflowState.INTAKE_QUOTING: {JobWorkflowState.SITE_SURVEY_PENDING},
    JobWorkflowState.SITE_SURVEY_PENDING: {
        JobWorkflowState.SITE_SURVEY_COMPLETE,
    },
    JobWorkflowState.SITE_SURVEY_COMPLETE: {
        JobWorkflowState.PERMIT_SUBMITTED,
    },
    JobWorkflowState.PERMIT_SUBMITTED: {
        JobWorkflowState.PERMIT_APPROVED,
    },
    JobWorkflowState.PERMIT_APPROVED: {
        JobWorkflowState.SCHEDULED_DETACH,
    },
    JobWorkflowState.SCHEDULED_DETACH: {
        JobWorkflowState.DETACH_COMPLETE_HOLD,
    },
    JobWorkflowState.DETACH_COMPLETE_HOLD: {
        JobWorkflowState.ROOFING_COMPLETE,
    },
    JobWorkflowState.ROOFING_COMPLETE: {
        JobWorkflowState.READY_FOR_RESET,
    },
    JobWorkflowState.READY_FOR_RESET: {
        JobWorkflowState.SCHEDULED_RESET,
    },
    JobWorkflowState.SCHEDULED_RESET: {
        JobWorkflowState.RESET_COMPLETE,
    },
    JobWorkflowState.RESET_COMPLETE: {
        JobWorkflowState.INSPECTION_PTO_PASSED,
    },
    JobWorkflowState.INSPECTION_PTO_PASSED: {
        JobWorkflowState.CLOSED,
    },
    JobWorkflowState.CLOSED: set(),
}


def validate_job_state_transition(
    current: JobWorkflowState, new: JobWorkflowState
) -> None:
    """
    Raises ValueError if a transition from current -> new is not allowed.
    Allows no-op (current == new).
    """
    if current == new:
        return

    allowed = ALLOWED_JOB_TRANSITIONS.get(current, set())
    if new not in allowed:
        raise ValueError(f"Invalid job workflow transition: {current} -> {new}")


# ---------- Operations & Dispatch ----------

class CrewStatus(str, Enum):
    AVAILABLE = "Available"
    ON_JOB = "On Job"
    OFF_DUTY = "Off Duty"


class Crew(BaseModel):
    id: Optional[str] = None
    name: str
    lead: str
    homeBase: str
    capabilityTags: List[str] = []
    vehicleId: Optional[str] = None
    status: CrewStatus = CrewStatus.AVAILABLE
    members: List[Dict[str, Any]] = []
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class Vehicle(BaseModel):
    id: Optional[str] = None
    name: str
    vin: str
    plate: str
    maxPanelCapacity: conint(ge=0) = 0
    homeBase: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class ScheduleType(str, Enum):
    SURVEY = "survey"
    DETACH = "detach"
    ROOFING = "roofing"
    RESET = "reset"
    INSPECTION = "inspection"
    OTHER = "other"


class ScheduleStatus(str, Enum):
    SCHEDULED = "Scheduled"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"


class ScheduleEntry(BaseModel):
    id: Optional[str] = None
    jobId: str
    crewId: str
    vehicleId: Optional[str] = None
    type: ScheduleType
    status: ScheduleStatus = ScheduleStatus.SCHEDULED

    # YYYY-MM-DD for easy querying and UI mapping
    date: constr(regex=r"^\d{4}-\d{2}-\d{2}$")
    # HH:MM 24h format
    startTime: constr(regex=r"^\d{2}:\d{2}$")
    endTime: constr(regex=r"^\d{2}:\d{2}$")

    # Optional weather overlay stored on each entry
    weather: Optional[Dict[str, Any]] = None

    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


def validate_schedule_constraints(job: Job, entry: ScheduleEntry) -> None:
    """
    Enforce high-level scheduling rules:
    - Cannot schedule RESET before DETACH is complete
    - Cannot schedule RESET if ROOFING is not complete
    """
    from datetime import datetime as _dt

    if entry.type != ScheduleType.RESET:
        return

    # Must have detach and roofing completed
    if job.detachCompletedAt is None:
        raise ValueError("Cannot schedule reset before detach is complete")
    if job.roofingCompletedAt is None:
        raise ValueError("Cannot schedule reset before roofing is complete")

    entry_date = _dt.strptime(entry.date, "%Y-%m-%d").date()

    # Cannot schedule reset before detach completion date
    if job.detachCompletedAt.date() > entry_date:
        raise ValueError("Cannot schedule reset before detach completion date")

    # Cannot schedule reset before roofing completion date
    if job.roofingCompletedAt.date() > entry_date:
        raise ValueError("Cannot schedule reset before roofing completion date")


# ---------- Financial & Invoicing ----------


class SKUType(str, Enum):
    PRODUCT = "product"
    SERVICE = "service"


class ProductServiceSKU(BaseModel):
    id: Optional[str] = None
    sku: constr(min_length=1)
    name: str
    description: Optional[str] = None
    type: SKUType
    unitPrice: confloat(ge=0)
    unit: str = Field(default="each", description="e.g. 'each', 'hour', 'kW', 'sqft'")
    category: Optional[str] = None
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class EstimateLineItem(BaseModel):
    skuId: str
    sku: Optional[str] = None  # Denormalized SKU code for display
    description: str
    quantity: confloat(ge=0)
    unitPrice: confloat(ge=0)
    unit: str = "each"
    total: confloat(ge=0) = Field(..., description="quantity * unitPrice")


class Estimate(BaseModel):
    id: Optional[str] = None
    jobId: Optional[str] = None
    customerId: Optional[str] = None
    customerName: Optional[str] = None
    lineItems: List[EstimateLineItem] = []
    subtotal: confloat(ge=0) = 0
    taxRate: confloat(ge=0, le=1) = 0
    taxAmount: confloat(ge=0) = 0
    total: confloat(ge=0) = 0
    notes: Optional[str] = None
    status: Literal["draft", "sent", "accepted", "rejected"] = "draft"
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class InvoiceStatus(str, Enum):
    DRAFT = "Draft"
    PENDING = "Pending"
    PAID = "Paid"
    OVERDUE = "Overdue"
    CANCELLED = "Cancelled"


class InvoiceType(str, Enum):
    DEPOSIT = "Deposit"
    PROGRESS = "Progress"
    FINAL = "Final"


class InvoiceLineItem(BaseModel):
    skuId: Optional[str] = None
    description: str
    quantity: confloat(ge=0)
    unitPrice: confloat(ge=0)
    unit: str = "each"
    total: confloat(ge=0) = Field(..., description="quantity * unitPrice")


class Invoice(BaseModel):
    id: Optional[str] = None
    invoiceNumber: str
    jobId: str
    customerId: str
    customerName: str
    partnerId: Optional[str] = None
    partnerName: Optional[str] = None
    type: InvoiceType
    status: InvoiceStatus = InvoiceStatus.DRAFT
    lineItems: List[InvoiceLineItem] = []
    subtotal: confloat(ge=0) = 0
    taxRate: confloat(ge=0, le=1) = 0
    taxAmount: confloat(ge=0) = 0
    total: confloat(ge=0) = 0
    paidAmount: confloat(ge=0) = 0
    balanceDue: confloat(ge=0) = 0
    dueDate: datetime
    paidDate: Optional[datetime] = None
    paymentMethod: Optional[str] = None
    pdfUrl: Optional[str] = None
    notes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
    sentDate: Optional[datetime] = None


# ---------- Authentication & Authorization ----------

class UserRole(str, Enum):
    ADMIN = "admin"
    MANAGER = "manager"
    CREW_LEAD = "crew_lead"
    PARTNER = "partner"
    HOMEOWNER = "homeowner"


class User(BaseModel):
    id: Optional[str] = None
    email: EmailStr
    passwordHash: str  # bcrypt hash
    role: UserRole
    customerId: Optional[str] = None  # For homeowners
    partnerId: Optional[str] = None  # For roofers/partners
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    isActive: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    userId: str


# ---------- Portal Models ----------

class PortalDocument(BaseModel):
    id: Optional[str] = None
    jobId: str
    customerId: str
    documentType: Literal["contract", "permit", "invoice", "photo", "report", "other"]
    fileName: str
    fileUrl: str
    uploadedAt: datetime = Field(default_factory=datetime.utcnow)
    uploadedBy: Optional[str] = None
    description: Optional[str] = None


class PaymentIntent(BaseModel):
    id: Optional[str] = None
    invoiceId: str
    customerId: str
    amount: confloat(ge=0)
    currency: str = "usd"
    stripePaymentIntentId: Optional[str] = None
    status: Literal["pending", "succeeded", "failed", "canceled"] = "pending"
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class Notification(BaseModel):
    id: Optional[str] = None
    userId: str
    userRole: UserRole
    title: str
    message: str
    type: Literal["info", "warning", "success", "error"] = "info"
    relatedEntityType: Optional[Literal["job", "invoice", "document"]] = None
    relatedEntityId: Optional[str] = None
    isRead: bool = False
    createdAt: datetime = Field(default_factory=datetime.utcnow)


# ---------- Tech / Field App ----------

class TechJSA(BaseModel):
    id: Optional[str] = None
    jobId: str
    technicianId: str
    location: str
    hazardsReviewed: bool
    ppeChecked: bool
    lockoutTagout: bool
    notes: Optional[str] = None
    signatureName: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class TechDamageScan(BaseModel):
    id: Optional[str] = None
    jobId: str
    technicianId: str
    roofDamagePhotos: List[str] = []
    equipmentDamagePhotos: List[str] = []
    notes: str
    invoiceNote: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class TechDetach(BaseModel):
    id: Optional[str] = None
    jobId: str
    technicianId: str
    productionBaselineKw: float
    inverterSerialPhotos: List[str] = []
    assetTags: str
    equipmentLocationNotes: str
    createdAt: datetime = Field(default_factory=datetime.utcnow)


class TechReset(BaseModel):
    id: Optional[str] = None
    jobId: str
    technicianId: str
    stringVoltage: float
    inverterMpptWindowMin: float
    inverterMpptWindowMax: float
    commissioningChecklistComplete: bool
    commissioningPhotos: List[str] = []
    notes: Optional[str] = None
    stringSizingValid: bool = True
    createdAt: datetime = Field(default_factory=datetime.utcnow)
