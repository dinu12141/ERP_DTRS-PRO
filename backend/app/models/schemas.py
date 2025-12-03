from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Any, Dict
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

class Job(BaseModel):
    id: Optional[str] = None
    customerId: str
    status: JobStatus = JobStatus.SCHEDULED
    type: JobType
    scheduledDate: datetime
    technicianIds: List[str] = []
    address: Address
    notes: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)

class InventoryItem(BaseModel):
    id: Optional[str] = None
    itemName: str
    sku: str
    quantity: int
    category: str
    unitPrice: float
    updatedAt: datetime = Field(default_factory=datetime.utcnow)
