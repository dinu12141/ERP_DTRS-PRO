// Mock data for DTRS PRO System

export const mockPartners = [
  {
    id: 'P001',
    companyName: 'Summit Roofing Solutions',
    taxId: '84-1234567',
    generalLiabilityPolicy: 'GL-2024-8765432',
    workersCompPolicy: 'WC-2024-9876543',
    type: 'Roofing Partner',
    status: 'Active',
    creditLimit: 50000,
    currentBalance: 12500,
    commissionModel: 'Percentage of Profit',
    commissionRate: 15,
    billingMethod: 'Net-Deduct',
    contacts: {
      owner: { name: 'John Anderson', email: 'j.anderson@summitroofing.com', phone: '(555) 123-4567' },
      productionManager: { name: 'Sarah Mitchell', email: 's.mitchell@summitroofing.com', phone: '(555) 123-4568' },
      admin: { name: 'Mike Johnson', email: 'm.johnson@summitroofing.com', phone: '(555) 123-4569' }
    },
    email: 'contact@summitroofing.com',
    phone: '(555) 123-4567',
    address: '123 Main St, Denver, CO 80202',
    totalJobs: 47,
    totalRevenue: 385000,
    certifications: ['GAF Master Elite', 'CertainTeed SELECT ShingleMaster'],
    serviceAreas: ['Denver', 'Boulder', 'Aurora', 'Lakewood'],
    createdDate: '2024-01-15',
    lastActivity: '2024-07-01'
  },
  {
    id: 'P002',
    companyName: 'Apex Roof Masters',
    taxId: '84-7654321',
    generalLiabilityPolicy: 'GL-2024-1234567',
    workersCompPolicy: 'WC-2024-2345678',
    type: 'Roofing Partner',
    status: 'Active',
    creditLimit: 75000,
    currentBalance: 8200,
    commissionModel: 'Flat Fee per kW',
    commissionRate: 150,
    billingMethod: 'Referral Payout',
    contacts: {
      owner: { name: 'Michael Chen', email: 'm.chen@apexroofmasters.com', phone: '(555) 234-5678' },
      productionManager: { name: 'Lisa Wong', email: 'l.wong@apexroofmasters.com', phone: '(555) 234-5679' },
      admin: { name: 'David Park', email: 'd.park@apexroofmasters.com', phone: '(555) 234-5680' }
    },
    email: 'info@apexroofmasters.com',
    phone: '(555) 234-5678',
    address: '456 Oak Ave, Boulder, CO 80301',
    totalJobs: 62,
    totalRevenue: 520000,
    certifications: ['Owens Corning Preferred Contractor', 'Tesla Certified Installer'],
    serviceAreas: ['Boulder', 'Longmont', 'Louisville', 'Lafayette'],
    createdDate: '2023-11-20',
    lastActivity: '2024-07-02'
  },
  {
    id: 'P003',
    companyName: 'Elite Roofing Co',
    taxId: '84-9876543',
    generalLiabilityPolicy: 'GL-2024-5555555',
    workersCompPolicy: 'WC-2024-6666666',
    type: 'Roofing Partner',
    status: 'Pending',
    creditLimit: 25000,
    currentBalance: 0,
    commissionModel: 'Percentage of Profit',
    commissionRate: 12,
    billingMethod: 'Net-Deduct',
    contacts: {
      owner: { name: 'Robert Taylor', email: 'r.taylor@eliteroofing.com', phone: '(555) 345-6789' },
      productionManager: { name: 'Jennifer Davis', email: 'j.davis@eliteroofing.com', phone: '(555) 345-6790' },
      admin: { name: 'Tom Wilson', email: 't.wilson@eliteroofing.com', phone: '(555) 345-6791' }
    },
    email: 'sales@eliteroofing.com',
    phone: '(555) 345-6789',
    address: '789 Pine Rd, Aurora, CO 80012',
    totalJobs: 0,
    totalRevenue: 0,
    certifications: ['Pending Verification'],
    serviceAreas: ['Aurora', 'Centennial', 'Parker'],
    createdDate: '2024-06-10',
    lastActivity: '2024-06-15'
  }
];

export const mockContacts = [
  {
    id: 'C001',
    partnerId: 'P001',
    partnerName: 'Summit Roofing Solutions',
    firstName: 'John',
    lastName: 'Anderson',
    role: 'Owner',
    email: 'j.anderson@summitroofing.com',
    phone: '(555) 123-4567',
    mobile: '(555) 987-6543',
    isPrimary: true,
    permissions: ['Commission Agreements', 'Job Approval', 'Billing']
  },
  {
    id: 'C002',
    partnerId: 'P001',
    partnerName: 'Summit Roofing Solutions',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    role: 'Production Manager',
    email: 's.mitchell@summitroofing.com',
    phone: '(555) 123-4568',
    mobile: '(555) 876-5432',
    isPrimary: false,
    permissions: ['Scheduling Coordination', 'Job Updates']
  },
  {
    id: 'C003',
    partnerId: 'P002',
    partnerName: 'Apex Roof Masters',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'Owner',
    email: 'm.chen@apexroofmasters.com',
    phone: '(555) 234-5678',
    mobile: '(555) 765-4321',
    isPrimary: true,
    permissions: ['Commission Agreements', 'Job Approval', 'Billing']
  },
  {
    id: 'C004',
    partnerId: 'P001',
    partnerName: 'Summit Roofing Solutions',
    firstName: 'Mike',
    lastName: 'Johnson',
    role: 'Admin',
    email: 'm.johnson@summitroofing.com',
    phone: '(555) 123-4569',
    mobile: '(555) 765-4322',
    isPrimary: false,
    permissions: ['Invoicing', 'Payment Processing']
  }
];

export const mockLeads = [
  {
    id: 'L001',
    customerName: 'Robert Johnson',
    address: '234 Maple Dr, Denver, CO 80203',
    phone: '(555) 111-2222',
    email: 'robert.j@email.com',
    source: 'Web Form',
    status: 'New',
    scoring: {
      totalScore: 85,
      distance: 12.5,
      distanceScore: 25,
      roofPitch: '6/12',
      pitchScore: 30,
      systemAge: 8,
      ageScore: 30,
      additionalFactors: 'Hail damage reported'
    },
    roofDetails: {
      material: 'Asphalt Shingle',
      age: 12,
      condition: 'Fair',
      sqFootage: 2400
    },
    solarSystem: {
      currentBrand: 'SunPower',
      age: 8,
      size: 7.2,
      hasIssues: true,
      issueDescription: 'Panel damage from hail'
    },
    estimatedValue: 18500,
    estimatedKW: 7.2,
    assignedTo: 'Summit Roofing Solutions',
    assignedDate: '2024-07-02',
    createdDate: '2024-07-02',
    notes: 'High-priority lead, roof damage from recent hail storm',
    insuranceClaim: true,
    insuranceAdjuster: 'State Farm - John Doe'
  },
  {
    id: 'L002',
    customerName: 'Emily Rodriguez',
    address: '567 Birch Ln, Boulder, CO 80302',
    phone: '(555) 222-3333',
    email: 'e.rodriguez@email.com',
    source: 'Roofer Portal',
    status: 'Qualified',
    scoring: {
      totalScore: 92,
      distance: 8.3,
      distanceScore: 30,
      roofPitch: '4/12',
      pitchScore: 32,
      systemAge: 12,
      ageScore: 30,
      additionalFactors: 'Interested in battery upgrade'
    },
    roofDetails: {
      material: 'Tile',
      age: 15,
      condition: 'Poor',
      sqFootage: 3200
    },
    solarSystem: {
      currentBrand: 'Tesla',
      age: 12,
      size: 9.6,
      hasIssues: true,
      issueDescription: 'Multiple inverter failures'
    },
    estimatedValue: 22000,
    estimatedKW: 9.6,
    assignedTo: 'Apex Roof Masters',
    assignedDate: '2024-06-28',
    createdDate: '2024-06-28',
    notes: 'Battery storage interested, urgent timeline',
    insuranceClaim: false,
    insuranceAdjuster: null
  },
  {
    id: 'L003',
    customerName: 'David Thompson',
    address: '890 Cedar St, Aurora, CO 80013',
    phone: '(555) 333-4444',
    email: 'd.thompson@email.com',
    source: 'Insurance Adjuster',
    status: 'Contacted',
    scoring: {
      totalScore: 68,
      distance: 25.7,
      distanceScore: 15,
      roofPitch: '8/12',
      pitchScore: 23,
      systemAge: 5,
      ageScore: 30,
      additionalFactors: 'Far distance, steep pitch'
    },
    roofDetails: {
      material: 'Metal',
      age: 8,
      condition: 'Good',
      sqFootage: 2000
    },
    solarSystem: {
      currentBrand: 'LG',
      age: 5,
      size: 6.0,
      hasIssues: false,
      issueDescription: null
    },
    estimatedValue: 15000,
    estimatedKW: 6.0,
    assignedTo: null,
    assignedDate: null,
    createdDate: '2024-07-01',
    notes: 'Waiting for callback to schedule survey',
    insuranceClaim: true,
    insuranceAdjuster: 'Allstate - Jane Smith'
  }
];

export const mockJobs = [
  {
    id: 'J-2024-001',
    customerName: 'Lisa Anderson',
    customerEmail: 'lisa.anderson@email.com',
    customerPhone: '(555) 444-5555',
    address: '123 Solar St, Denver, CO 80204',
    partnerId: 'P001',
    partnerName: 'Summit Roofing Solutions',
    status: 'Survey',
    stage: 'Survey',
    priority: 'High',
    systemType: 'Solar + Battery',
    systemSize: 9.6,
    panelBrand: 'Tesla Solar',
    panelModel: 'TS-400W',
    panelCount: 24,
    panelWattage: 400,
    inverterBrand: 'Enphase',
    inverterModel: 'IQ8+',
    inverterCount: 24,
    rackingType: 'IronRidge XR100',
    batterySystem: 'Tesla Powerwall 2',
    batteryCount: 1,
    batteryCapacity: 13.5,
    roofDetails: {
      pitch: '5/12',
      material: 'Asphalt Shingle',
      age: 10,
      condition: 'Fair',
      sqFootage: 2800,
      replacement: true
    },
    electrical: {
      mainPanelSize: 200,
      panelUpgradeNeeded: false,
      existingConduit: true,
      utilityCompany: 'Xcel Energy'
    },
    estimatedValue: 28500,
    actualCost: null,
    profitMargin: null,
    surveyDate: '2024-07-05',
    permitDate: null,
    permitNumber: null,
    detachDate: null,
    roofingDate: null,
    resetDate: null,
    inspectionDate: null,
    completionDate: null,
    createdDate: '2024-06-15',
    weather: 'Clear',
    notes: 'Customer wants expedited timeline',
    documents: [
      { type: 'Site Survey', url: '/docs/survey-J-2024-001.pdf', uploadDate: '2024-06-20' },
      { type: 'Photos - Before', url: '/docs/photos-before-J-2024-001.zip', uploadDate: '2024-06-20' }
    ],
    warranty: {
      panels: '25 years',
      inverter: '25 years',
      battery: '10 years',
      workmanship: '10 years'
    }
  },
  {
    id: 'J-2024-002',
    customerName: 'Mark Stevens',
    customerEmail: 'mark.stevens@email.com',
    customerPhone: '(555) 555-6666',
    address: '456 Energy Ave, Boulder, CO 80303',
    partnerId: 'P002',
    partnerName: 'Apex Roof Masters',
    status: 'Detach',
    stage: 'Detach',
    priority: 'Medium',
    systemType: 'Solar Only',
    systemSize: 7.2,
    panelBrand: 'LG',
    panelModel: 'NeON R',
    panelCount: 18,
    panelWattage: 400,
    inverterBrand: 'SolarEdge',
    inverterModel: 'SE7600H',
    inverterCount: 1,
    rackingType: 'Unirac SolarMount',
    batterySystem: null,
    batteryCount: 0,
    batteryCapacity: 0,
    roofDetails: {
      pitch: '4/12',
      material: 'Tile',
      age: 15,
      condition: 'Poor',
      sqFootage: 3000,
      replacement: true
    },
    electrical: {
      mainPanelSize: 200,
      panelUpgradeNeeded: false,
      existingConduit: true,
      utilityCompany: 'Boulder Electric'
    },
    estimatedValue: 19800,
    actualCost: 16500,
    profitMargin: 3300,
    surveyDate: '2024-06-20',
    permitDate: '2024-06-25',
    permitNumber: 'PERM-2024-8765',
    detachDate: '2024-07-03',
    roofingDate: null,
    resetDate: null,
    inspectionDate: null,
    completionDate: null,
    createdDate: '2024-06-10',
    weather: 'Partly Cloudy',
    notes: 'Old tile roof, extra care needed during detach',
    documents: [
      { type: 'Site Survey', url: '/docs/survey-J-2024-002.pdf', uploadDate: '2024-06-21' },
      { type: 'Permit Application', url: '/docs/permit-J-2024-002.pdf', uploadDate: '2024-06-25' },
      { type: 'JSA Checklist', url: '/docs/jsa-J-2024-002.pdf', uploadDate: '2024-07-03' }
    ],
    warranty: {
      panels: '25 years',
      inverter: '12 years',
      battery: 'N/A',
      workmanship: '10 years'
    }
  },
  {
    id: 'J-2024-003',
    customerName: 'Jennifer Walsh',
    customerEmail: 'jennifer.walsh@email.com',
    customerPhone: '(555) 666-7777',
    address: '789 Power Blvd, Aurora, CO 80014',
    partnerId: 'P001',
    partnerName: 'Summit Roofing Solutions',
    status: 'Reset',
    stage: 'Reset',
    priority: 'High',
    systemType: 'Solar + Battery',
    systemSize: 12.8,
    panelBrand: 'SunPower',
    panelModel: 'Maxeon 6',
    panelCount: 32,
    panelWattage: 400,
    inverterBrand: 'Enphase',
    inverterModel: 'IQ8M',
    inverterCount: 32,
    rackingType: 'IronRidge XR100',
    batterySystem: 'Enphase IQ Battery 5P',
    batteryCount: 2,
    batteryCapacity: 10.08,
    roofDetails: {
      pitch: '6/12',
      material: 'Asphalt Shingle',
      age: 18,
      condition: 'Poor',
      sqFootage: 3500,
      replacement: true
    },
    electrical: {
      mainPanelSize: 200,
      panelUpgradeNeeded: true,
      existingConduit: false,
      utilityCompany: 'Xcel Energy'
    },
    estimatedValue: 42000,
    actualCost: 35000,
    profitMargin: 7000,
    surveyDate: '2024-06-01',
    permitDate: '2024-06-08',
    permitNumber: 'PERM-2024-7654',
    detachDate: '2024-06-15',
    roofingDate: '2024-06-22',
    resetDate: '2024-07-02',
    inspectionDate: null,
    completionDate: null,
    createdDate: '2024-05-20',
    weather: 'Clear',
    notes: 'Premium system, VIP customer',
    documents: [
      { type: 'Site Survey', url: '/docs/survey-J-2024-003.pdf', uploadDate: '2024-06-02' },
      { type: 'Permit Application', url: '/docs/permit-J-2024-003.pdf', uploadDate: '2024-06-08' },
      { type: 'JSA Checklist - Detach', url: '/docs/jsa-detach-J-2024-003.pdf', uploadDate: '2024-06-15' },
      { type: 'Photos - Roof Complete', url: '/docs/photos-roof-J-2024-003.zip', uploadDate: '2024-06-23' },
      { type: 'JSA Checklist - Reset', url: '/docs/jsa-reset-J-2024-003.pdf', uploadDate: '2024-07-02' }
    ],
    warranty: {
      panels: '25 years',
      inverter: '25 years',
      battery: '15 years',
      workmanship: '10 years'
    }
  },
  {
    id: 'J-2024-004',
    customerName: 'Tom Bradley',
    customerEmail: 'tom.bradley@email.com',
    customerPhone: '(555) 777-8888',
    address: '321 Sunshine Rd, Denver, CO 80205',
    partnerId: 'P002',
    partnerName: 'Apex Roof Masters',
    status: 'Closed',
    stage: 'Closed',
    priority: 'Low',
    systemType: 'Solar Only',
    systemSize: 8.0,
    panelBrand: 'Tesla Solar',
    panelModel: 'TS-400W',
    panelCount: 20,
    panelWattage: 400,
    inverterBrand: 'SolarEdge',
    inverterModel: 'SE7600H',
    inverterCount: 1,
    rackingType: 'Unirac SolarMount',
    batterySystem: null,
    batteryCount: 0,
    batteryCapacity: 0,
    roofDetails: {
      pitch: '5/12',
      material: 'Metal',
      age: 5,
      condition: 'Good',
      sqFootage: 2200,
      replacement: false
    },
    electrical: {
      mainPanelSize: 200,
      panelUpgradeNeeded: false,
      existingConduit: true,
      utilityCompany: 'Xcel Energy'
    },
    estimatedValue: 21500,
    actualCost: 18000,
    profitMargin: 3500,
    surveyDate: '2024-05-10',
    permitDate: '2024-05-15',
    permitNumber: 'PERM-2024-6543',
    detachDate: '2024-05-22',
    roofingDate: '2024-05-28',
    resetDate: '2024-06-05',
    inspectionDate: '2024-06-12',
    completionDate: '2024-06-15',
    createdDate: '2024-05-01',
    weather: 'Clear',
    notes: 'Project completed successfully',
    documents: [
      { type: 'Site Survey', url: '/docs/survey-J-2024-004.pdf', uploadDate: '2024-05-11' },
      { type: 'Permit Application', url: '/docs/permit-J-2024-004.pdf', uploadDate: '2024-05-15' },
      { type: 'Final Inspection', url: '/docs/inspection-J-2024-004.pdf', uploadDate: '2024-06-12' },
      { type: 'Warranty Certificate', url: '/docs/warranty-J-2024-004.pdf', uploadDate: '2024-06-15' }
    ],
    warranty: {
      panels: '25 years',
      inverter: '12 years',
      battery: 'N/A',
      workmanship: '10 years'
    }
  }
];

export const mockCrews = [
  {
    id: 'CR001',
    name: 'Alpha Crew',
    lead: 'Carlos Martinez',
    leadPhone: '(555) 111-1111',
    members: [
      { name: 'Carlos Martinez', role: 'Lead Technician', certifications: ['NABCEP PV', 'OSHA 30'] },
      { name: 'Jake Wilson', role: 'Electrician', certifications: ['Master Electrician', 'OSHA 10'] },
      { name: 'Tony Rivera', role: 'Installer', certifications: ['NABCEP PV', 'OSHA 10'] },
      { name: 'Sam Davis', role: 'Installer', certifications: ['OSHA 10'] }
    ],
    capabilities: ['Detach', 'Reset', 'Electrical', 'Battery Install'],
    vehicleId: 'V001',
    vehicleName: 'Truck #1 - Ford F-350',
    vehicleCapacity: '2000 lbs',
    status: 'Available',
    currentJob: null,
    nextAvailable: '2024-07-05',
    hoursWorkedThisWeek: 32
  },
  {
    id: 'CR002',
    name: 'Beta Crew',
    lead: 'Maria Gonzalez',
    leadPhone: '(555) 222-2222',
    members: [
      { name: 'Maria Gonzalez', role: 'Lead Technician', certifications: ['NABCEP PV', 'OSHA 30'] },
      { name: 'Alex Kim', role: 'Installer', certifications: ['NABCEP PV', 'OSHA 10'] },
      { name: 'Jordan Lee', role: 'Installer', certifications: ['OSHA 10'] }
    ],
    capabilities: ['Detach', 'Reset'],
    vehicleId: 'V002',
    vehicleName: 'Truck #2 - RAM 2500',
    vehicleCapacity: '1500 lbs',
    status: 'On Job',
    currentJob: 'J-2024-002',
    nextAvailable: '2024-07-04',
    hoursWorkedThisWeek: 40
  },
  {
    id: 'CR003',
    name: 'Gamma Crew',
    lead: 'David Thompson',
    leadPhone: '(555) 333-3333',
    members: [
      { name: 'David Thompson', role: 'Lead Technician', certifications: ['NABCEP PV', 'Master Electrician', 'OSHA 30'] },
      { name: 'Lisa Chen', role: 'Electrician', certifications: ['Journeyman Electrician', 'OSHA 10'] },
      { name: 'Mike Johnson', role: 'Installer', certifications: ['NABCEP PV', 'OSHA 10'] },
      { name: 'Sarah Park', role: 'Installer', certifications: ['OSHA 10'] }
    ],
    capabilities: ['Reset', 'Electrical', 'Battery Install', 'Troubleshooting'],
    vehicleId: 'V003',
    vehicleName: 'Truck #3 - Ford F-450',
    vehicleCapacity: '2500 lbs',
    status: 'On Job',
    currentJob: 'J-2024-003',
    nextAvailable: '2024-07-05',
    hoursWorkedThisWeek: 38
  }
];

export const mockSchedule = [
  {
    id: 'SCH001',
    jobId: 'J-2024-002',
    jobName: 'Mark Stevens - Detach',
    customerAddress: '456 Energy Ave, Boulder, CO 80303',
    crewId: 'CR002',
    crewName: 'Beta Crew',
    date: '2024-07-03',
    startTime: '08:00',
    endTime: '16:00',
    type: 'Detach',
    status: 'In Progress',
    estimatedDuration: '8 hours',
    notes: 'Bring extra tile flashings',
    weatherForecast: 'Clear, 78°F'
  },
  {
    id: 'SCH002',
    jobId: 'J-2024-003',
    jobName: 'Jennifer Walsh - Reset',
    customerAddress: '789 Power Blvd, Aurora, CO 80014',
    crewId: 'CR003',
    crewName: 'Gamma Crew',
    date: '2024-07-02',
    startTime: '07:00',
    endTime: '17:00',
    type: 'Reset',
    status: 'In Progress',
    estimatedDuration: '10 hours',
    notes: 'Battery installation included',
    weatherForecast: 'Clear, 82°F'
  },
  {
    id: 'SCH003',
    jobId: 'J-2024-001',
    jobName: 'Lisa Anderson - Survey',
    customerAddress: '123 Solar St, Denver, CO 80204',
    crewId: 'CR001',
    crewName: 'Alpha Crew',
    date: '2024-07-05',
    startTime: '09:00',
    endTime: '12:00',
    type: 'Survey',
    status: 'Scheduled',
    estimatedDuration: '3 hours',
    notes: 'Initial site assessment',
    weatherForecast: 'Clear, 80°F'
  }
];

export const mockInvoices = [
  {
    id: 'INV-2024-001',
    invoiceNumber: 'INV-2024-001',
    jobId: 'J-2024-004',
    customerName: 'Tom Bradley',
    partnerId: 'P002',
    partnerName: 'Apex Roof Masters',
    type: 'Final',
    status: 'Paid',
    lineItems: [
      { description: 'Solar Panel Installation (20x Tesla 400W)', qty: 20, rate: 350, amount: 7000 },
      { description: 'SolarEdge Inverter SE7600H', qty: 1, rate: 1500, amount: 1500 },
      { description: 'Racking System', qty: 1, rate: 2500, amount: 2500 },
      { description: 'Electrical Work', qty: 1, rate: 3000, amount: 3000 },
      { description: 'Permit & Inspection Fees', qty: 1, rate: 1500, amount: 1500 },
      { description: 'Labor', qty: 40, rate: 125, amount: 5000 },
      { description: 'Commission to Roofer (15%)', qty: 1, rate: -3150, amount: -3150 }
    ],
    subtotal: 21500,
    tax: 0,
    amount: 21500,
    paidAmount: 21500,
    balanceDue: 0,
    dueDate: '2024-06-20',
    paidDate: '2024-06-18',
    paymentMethod: 'Wire Transfer',
    createdDate: '2024-06-15',
    sentDate: '2024-06-15'
  },
  {
    id: 'INV-2024-002',
    invoiceNumber: 'INV-2024-002',
    jobId: 'J-2024-003',
    customerName: 'Jennifer Walsh',
    partnerId: 'P001',
    partnerName: 'Summit Roofing Solutions',
    type: 'Deposit',
    status: 'Paid',
    lineItems: [
      { description: 'Deposit (30% of total project)', qty: 1, rate: 12600, amount: 12600 }
    ],
    subtotal: 12600,
    tax: 0,
    amount: 12600,
    paidAmount: 12600,
    balanceDue: 0,
    dueDate: '2024-05-25',
    paidDate: '2024-05-23',
    paymentMethod: 'Check',
    createdDate: '2024-05-20',
    sentDate: '2024-05-20'
  },
  {
    id: 'INV-2024-003',
    invoiceNumber: 'INV-2024-003',
    jobId: 'J-2024-003',
    customerName: 'Jennifer Walsh',
    partnerId: 'P001',
    partnerName: 'Summit Roofing Solutions',
    type: 'Progress',
    status: 'Paid',
    lineItems: [
      { description: 'Progress Payment (40% of total project)', qty: 1, rate: 16800, amount: 16800 }
    ],
    subtotal: 16800,
    tax: 0,
    amount: 16800,
    paidAmount: 16800,
    balanceDue: 0,
    dueDate: '2024-06-25',
    paidDate: '2024-06-24',
    paymentMethod: 'Wire Transfer',
    createdDate: '2024-06-22',
    sentDate: '2024-06-22'
  },
  {
    id: 'INV-2024-004',
    invoiceNumber: 'INV-2024-004',
    jobId: 'J-2024-003',
    customerName: 'Jennifer Walsh',
    partnerId: 'P001',
    partnerName: 'Summit Roofing Solutions',
    type: 'Final',
    status: 'Pending',
    lineItems: [
      { description: 'Final Payment (30% of total project)', qty: 1, rate: 12600, amount: 12600 },
      { description: 'Commission to Roofer (15%)', qty: 1, rate: -6300, amount: -6300 }
    ],
    subtotal: 12600,
    tax: 0,
    amount: 6300,
    paidAmount: 0,
    balanceDue: 6300,
    dueDate: '2024-07-10',
    paidDate: null,
    paymentMethod: null,
    createdDate: '2024-07-02',
    sentDate: '2024-07-02'
  },
  {
    id: 'INV-2024-005',
    invoiceNumber: 'INV-2024-005',
    jobId: 'J-2024-002',
    customerName: 'Mark Stevens',
    partnerId: 'P002',
    partnerName: 'Apex Roof Masters',
    type: 'Deposit',
    status: 'Paid',
    lineItems: [
      { description: 'Deposit (30% of total project)', qty: 1, rate: 5940, amount: 5940 }
    ],
    subtotal: 5940,
    tax: 0,
    amount: 5940,
    paidAmount: 5940,
    balanceDue: 0,
    dueDate: '2024-06-15',
    paidDate: '2024-06-12',
    paymentMethod: 'Credit Card',
    createdDate: '2024-06-10',
    sentDate: '2024-06-10'
  },
  {
    id: 'INV-2024-006',
    invoiceNumber: 'INV-2024-006',
    jobId: 'J-2024-001',
    customerName: 'Lisa Anderson',
    partnerId: 'P001',
    partnerName: 'Summit Roofing Solutions',
    type: 'Deposit',
    status: 'Pending',
    lineItems: [
      { description: 'Deposit (30% of total project)', qty: 1, rate: 8550, amount: 8550 }
    ],
    subtotal: 8550,
    tax: 0,
    amount: 8550,
    paidAmount: 0,
    balanceDue: 8550,
    dueDate: '2024-07-08',
    paidDate: null,
    paymentMethod: null,
    createdDate: '2024-06-15',
    sentDate: '2024-06-16'
  }
];

export const mockInventory = [
  {
    id: 'INV-SKU-001',
    sku: 'PANEL-TESLA-400',
    name: 'Tesla Solar Panel 400W',
    brand: 'Tesla',
    model: 'TS-400W',
    category: 'Panels',
    bins: {
      warehouse: { location: 'W-A-01', quantity: 125 },
      customerBins: [
        { jobId: 'J-2024-001', location: 'C-J2024001', quantity: 24, status: 'Bagged & Tagged' },
        { jobId: 'J-2024-002', location: 'C-J2024002', quantity: 18, status: 'In Transit' },
        { jobId: 'J-2024-003', location: 'C-J2024003', quantity: 0, status: 'Reinstalled' }
      ],
      truckStock: [
        { vehicleId: 'V001', quantity: 8 },
        { vehicleId: 'V003', quantity: 4 }
      ]
    },
    totalStock: 185,
    reorderPoint: 50,
    unitCost: 185,
    retailPrice: 350,
    supplier: 'Tesla Energy',
    leadTime: '2 weeks',
    status: 'In Stock',
    lastRestocked: '2024-06-15',
    warranty: '25 years'
  },
  {
    id: 'INV-SKU-002',
    sku: 'INV-ENPHASE-IQ8',
    name: 'Enphase IQ8+ Microinverter',
    brand: 'Enphase',
    model: 'IQ8+',
    category: 'Inverters',
    bins: {
      warehouse: { location: 'W-B-05', quantity: 240 },
      customerBins: [
        { jobId: 'J-2024-001', location: 'C-J2024001', quantity: 24, status: 'Bagged & Tagged' },
        { jobId: 'J-2024-002', location: 'C-J2024002', quantity: 18, status: 'In Transit' },
        { jobId: 'J-2024-003', location: 'C-J2024003', quantity: 32, status: 'Bagged & Tagged' }
      ],
      truckStock: [
        { vehicleId: 'V001', quantity: 12 },
        { vehicleId: 'V002', quantity: 6 },
        { vehicleId: 'V003', quantity: 6 }
      ]
    },
    totalStock: 360,
    reorderPoint: 100,
    unitCost: 195,
    retailPrice: 280,
    supplier: 'Enphase Energy',
    leadTime: '1 week',
    status: 'In Stock',
    lastRestocked: '2024-06-20',
    warranty: '25 years'
  },
  {
    id: 'INV-SKU-003',
    sku: 'BATT-TESLA-PW2',
    name: 'Tesla Powerwall 2',
    brand: 'Tesla',
    model: 'Powerwall 2',
    category: 'Batteries',
    bins: {
      warehouse: { location: 'W-C-02', quantity: 8 },
      customerBins: [
        { jobId: 'J-2024-001', location: 'C-J2024001', quantity: 1, status: 'Bagged & Tagged' },
        { jobId: 'J-2024-003', location: 'C-J2024003', quantity: 0, status: 'Reinstalled' }
      ],
      truckStock: []
    },
    totalStock: 11,
    reorderPoint: 10,
    unitCost: 8500,
    retailPrice: 11500,
    supplier: 'Tesla Energy',
    leadTime: '4 weeks',
    status: 'Low Stock',
    lastRestocked: '2024-05-10',
    warranty: '10 years'
  },
  {
    id: 'INV-SKU-004',
    sku: 'RACK-IRONRIDGE-XR',
    name: 'IronRidge XR100 Rail 168"',
    brand: 'IronRidge',
    model: 'XR100-168',
    category: 'Racking',
    bins: {
      warehouse: { location: 'W-D-10', quantity: 320 },
      customerBins: [
        { jobId: 'J-2024-001', location: 'C-J2024001', quantity: 16, status: 'Bagged & Tagged' },
        { jobId: 'J-2024-002', location: 'C-J2024002', quantity: 12, status: 'In Transit' },
        { jobId: 'J-2024-003', location: 'C-J2024003', quantity: 20, status: 'Bagged & Tagged' }
      ],
      truckStock: [
        { vehicleId: 'V001', quantity: 24 },
        { vehicleId: 'V002', quantity: 8 },
        { vehicleId: 'V003', quantity: 4 }
      ]
    },
    totalStock: 440,
    reorderPoint: 150,
    unitCost: 68,
    retailPrice: 125,
    supplier: 'IronRidge',
    leadTime: '1 week',
    status: 'In Stock',
    lastRestocked: '2024-06-25',
    warranty: '10 years'
  }
];

export const mockKPIs = {
  totalActiveJobs: 3,
  totalRevenue: 905000,
  monthlyRevenue: 92300,
  averageDaysInStorage: 18.5,
  goBackRate: 2.3,
  revenuePerTruckDay: 3240,
  activePartners: 2,
  pendingInvoices: 2,
  pendingInvoiceAmount: 14850,
  crewUtilization: 78,
  jobsThisMonth: 8,
  completedThisMonth: 3,
  totalSystemSize: 37.6,
  averageJobValue: 27950,
  customerSatisfaction: 4.8,
  onTimeCompletion: 92
};

export const workflowStages = [
  { key: 'Intake', label: 'Intake', color: 'bg-blue-500', description: 'Lead converted to job' },
  { key: 'Survey', label: 'Survey', color: 'bg-purple-500', description: 'Site assessment & measurements' },
  { key: 'Permit', label: 'Permit', color: 'bg-yellow-500', description: 'Permit application & approval' },
  { key: 'Detach', label: 'Detach', color: 'bg-orange-500', description: 'Solar system removal' },
  { key: 'Roofing', label: 'Roofing', color: 'bg-pink-500', description: 'Roof replacement by partner' },
  { key: 'Reset', label: 'Reset', color: 'bg-green-500', description: 'Solar system reinstallation' },
  { key: 'Inspection', label: 'Inspection', color: 'bg-indigo-500', description: 'Final inspection & PTO' },
  { key: 'Closed', label: 'Closed', color: 'bg-gray-500', description: 'Project completed' }
];

// Lead scoring calculation function
export const calculateLeadScore = (distance, roofPitch, systemAge) => {
  let score = 100;
  
  // Distance penalty (closer is better)
  if (distance > 10) {
    score -= (distance - 10) * 2;
  }
  
  // Roof pitch penalty (moderate pitch is better)
  const pitchValue = parseInt(roofPitch.split('/')[0]);
  if (pitchValue > 6) {
    score -= (pitchValue - 6) * 3;
  }
  
  // System age penalty (older systems more likely to have issues)
  if (systemAge > 10) {
    score -= (systemAge - 10) * 1;
  }
  
  return Math.max(0, Math.min(100, score));
};
