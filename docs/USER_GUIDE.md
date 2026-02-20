# Physical Therapy Clinic Management - User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Patient Management](#patient-management)
4. [Investigations](#investigations)
5. [Visit Scheduling](#visit-scheduling)
6. [Billing & Invoices](#billing--invoices)
7. [Finance Tracking](#finance-tracking)
8. [Key Workflows](#key-workflows)
9. [Troubleshooting](#troubleshooting)

---

## Getting Started

### First-Time Setup

When you launch the application for the first time, you'll see the **Setup Wizard**:

1. **Select Data Folder**: Choose where to store your clinic data (database, files, backups)
   - Recommended: A dedicated folder on your main drive (e.g., `C:\ClinicData`)
   - For portable use: A folder on a USB drive
2. Click **Complete Setup** to initialize the database

### Default Login

After setup, log in with the default administrator account:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `admin123` |

**Important**: Change this password immediately after first login via Settings.

### Recommended First Steps

1. Update clinic information (name, address, phone) in **Settings**
2. Upload your clinic logo
3. Configure invoice prefix and currency
4. Add doctors to the system
5. Set up your service catalog

---

## Dashboard

The Dashboard is your home screen, providing quick access to key functions and today's overview.

### Quick Search

The search bar at the top allows you to find patients by:
- **Phone number** (exact or partial match)
- **Patient name** (first or last name)
- **MRN** (Medical Record Number)

Simply type and results appear instantly.

### Today's Schedule

View all appointments scheduled for today:
- Patient name and phone
- Scheduled time
- Assigned doctor
- Visit status (Scheduled/In Progress/Completed)

Click on any visit to view details or update status.

### Stats Cards

Quick statistics at a glance:
- **Today's Visits**: Total appointments for today
- **Completed**: Sessions completed today
- **Pending**: Upcoming appointments
- **Revenue**: Today's collections

### Action Shortcuts

Quick access buttons:
- **New Patient**: Register a new patient
- **New Visit**: Schedule an appointment
- **New Invoice**: Create a billing invoice

---

## Patient Management

### Viewing Patients

Navigate to **Patients** from the sidebar to see all registered patients.

Features:
- **Search**: Filter by name, phone, or MRN
- **Pagination**: Navigate through large patient lists
- **Quick View**: Click any row to open patient profile

### Adding a New Patient

1. Click **New Patient** button
2. Fill in required fields:
   - First Name
   - Last Name
   - Phone Number (used for search and communication)
3. Optional fields:
   - Date of Birth
   - Gender
   - CNIC (National ID)
   - Address
   - Email
   - Emergency Contact
   - **Diagnosis** (with ICD-10 code search)

### Diagnosis & ICD-10 Codes

The diagnosis field supports ICD-10 code lookup:

1. Click the **ICD-10** button next to the diagnosis field
2. Search by code or description (e.g., "M54" or "back pain")
3. Browse categories:
   - Musculoskeletal (M00-M99)
   - Injury & Trauma (S00-T98)
   - Neurological (G00-G99)
   - Symptoms & Signs (R00-R99)
4. Click a code to insert it into the diagnosis field
5. Multiple codes can be added for complex cases

### Patient Profile

The patient profile has multiple tabs:

#### Contact Tab
- View/edit contact information
- Phone, email, address details

#### Demographics Tab
- Personal information
- Date of birth, gender, CNIC

#### Timeline Tab
- Chronological history of all interactions
- Visits, payments, package purchases

#### Packages Tab
- Active session packages
- Remaining sessions
- Package validity dates

#### Visits Tab
- All visits for this patient
- Visit dates, doctors, status
- Quick access to visit details

#### Invoices Tab
- All invoices for this patient
- Payment status (Paid/Partial/Unpaid)
- Quick access to invoice details

#### Investigations Tab
- Medical investigations (X-Ray, MRI, CT Scan, etc.)
- Order new investigations
- Track status (Ordered/Scheduled/Completed/Reviewed)
- Record findings and attach reports

#### Files Tab
- Attached documents
- Upload medical reports, prescriptions, images
- Open or download files

### Exporting Patient Data

Export patient records to CSV for reporting or backup:

1. Open patient profile
2. Click **Export** button
3. Choose export type:
   - **Full Record**: Patient info, visits, invoices, packages
   - **Visit History**: All visits with dates and status
4. CSV file downloads to your computer

### Attaching Files

1. Go to patient profile > **Files** tab
2. Click **Upload File**
3. Select file(s) from your computer
4. Files are saved securely with the patient record

---

## Investigations

Track medical investigations ordered for patients.

### Investigation Types

| Type | Description |
|------|-------------|
| X-Ray | Radiographic imaging |
| CT Scan | Computed tomography |
| MRI | Magnetic resonance imaging |
| Ultrasound | Sonographic imaging |
| Blood Test | Laboratory blood work |
| ECG | Electrocardiogram |

### Adding an Investigation

1. Go to patient profile > **Investigations** tab
2. Click **Add Investigation**
3. Fill in details:
   - **Investigation Type**: Select from dropdown
   - **Date**: When investigation was/will be performed
   - **Ordered By**: Select referring doctor
   - **Body Part**: Area being investigated (e.g., "Lumbar Spine")
   - **Status**: Ordered, Scheduled, Completed, Reviewed
4. Click **Create**

### Recording Findings

After an investigation is completed:

1. Open the investigation record
2. Update status to **Completed**
3. Enter **Findings** (clinical observations)
4. Add any **Notes**
5. Click **Update**

### Investigation Status Workflow

```
Ordered → Scheduled → Completed → Reviewed
```

- **Ordered**: Investigation requested
- **Scheduled**: Appointment booked at imaging center
- **Completed**: Imaging/test performed, awaiting results
- **Reviewed**: Results reviewed by doctor

---

## Visit Scheduling

### Viewing Visits

Navigate to **Visits** to see all scheduled and completed appointments.

Filter options:
- **Date range**: Today, This Week, This Month, Custom
- **Doctor**: Filter by assigned therapist
- **Status**: Scheduled, In Progress, Completed, Cancelled

### Creating a New Visit

1. Click **New Visit** button (or from patient profile)
2. Select **Patient** (search by name or phone)
3. Select **Doctor** (therapist)
4. Choose **Date and Time**
5. Select **Visit Type**:
   - Evaluation (initial assessment)
   - Therapy Session (regular treatment)
   - Follow Up (check-in visit)
6. Optionally link to a **Package** (for session-based billing)
7. Add any **Notes**
8. Click **Save**

### Doctor Schedule Validation

The system validates visits against doctor availability:

- **Available Days**: Shows warning if doctor doesn't work on selected day
- **Working Hours**: Validates time is within doctor's start/end times
- **Schedule Display**: Doctor's availability shown below selection

Example warnings:
- "Dr. Sarah is not available on Sundays. Available days: Mon, Wed, Fri"
- "Time is before Dr. Sarah's start time (09:00)"
- "Time is after Dr. Sarah's end time (17:00)"

These are warnings only - you can still save the visit if needed.

### Visit Status Workflow

Visits follow this status progression:

```
Scheduled → In Progress → Completed
                ↓
            Cancelled
```

To update status:
1. Open the visit
2. Click the status chip or use status buttons
3. Select new status

### Creating Invoice from Visit

After completing a visit:
1. Open the visit details
2. Click **Create Invoice**
3. System pre-fills patient, doctor, and service information
4. Review and adjust line items
5. Save the invoice

---

## Billing & Invoices

### Viewing Invoices

Navigate to **Billing** to see all invoices.

Filter options:
- **Status**: All, Paid, Unpaid, Partial
- **Date range**: Filter by invoice date
- **Patient**: Search by patient name

### Creating an Invoice

1. Click **New Invoice**
2. Select **Patient**
3. Select **Doctor** (for services rendered)
4. Add **Line Items**:
   - Select service from catalog
   - Adjust quantity if needed
   - Price auto-fills from service catalog
5. Apply **Discount** (optional):
   - Percentage or fixed amount
6. Review **Totals**:
   - Subtotal
   - Discount
   - Tax (if configured)
   - Grand Total
7. Click **Save**

### Recording Payments

1. Open an invoice
2. Click **Add Payment**
3. Enter **Amount**
4. Select **Payment Method**:
   - Cash
   - Card
   - Bank Transfer
5. Add **Reference** (optional - receipt number, transaction ID)
6. Click **Save Payment**

### Invoice Status

Invoices automatically update status based on payments:
- **Unpaid**: No payments recorded
- **Partial**: Some payment received, balance remaining
- **Paid**: Full amount collected

### Printing Invoices

1. Open the invoice
2. Click **Print** button
3. Invoice opens in print preview with:
   - Clinic logo and information
   - Patient details
   - Line items with prices
   - Payment summary
   - Balance due

---

## Finance Tracking

### Finance Overview

Navigate to **Finance** for revenue and expense tracking.

### Revenue View

See all payments received:
- Date and amount
- Patient name
- Payment method
- Invoice reference

Filter by:
- Date range (Today, This Week, This Month, Custom)
- Payment method

### Expense Tracking

Record clinic expenses:
1. Click **Add Expense**
2. Enter details:
   - Description
   - Amount
   - Category (Rent, Utilities, Supplies, Salaries, Equipment, Other)
   - Date
3. Click **Save**

### Export to CSV

Export financial data for accounting:
1. Set your date range filters
2. Click **Export CSV**
3. File downloads with all transactions in the selected period

---

## Key Workflows

### Complete Patient Journey

```
1. Register Patient
      ↓
2. Schedule Visit
      ↓
3. Patient Arrives → Mark "In Progress"
      ↓
4. Session Complete → Mark "Completed"
      ↓
5. Create Invoice
      ↓
6. Record Payment
      ↓
7. Print Receipt
```

### Package-Based Billing

For patients purchasing session packages:

1. **Admin creates package** (e.g., "10 Sessions Package")
2. **Assign package to patient**:
   - Go to patient profile > Packages tab
   - Click "Add Package"
   - Select package and payment details
3. **Schedule visits linked to package**:
   - When creating visit, select the patient's active package
   - Session count decreases automatically
4. **Track remaining sessions**:
   - View in patient profile > Packages tab

### Daily Backup

Data is automatically backed up on app startup. For manual backup:
1. Go to **Settings**
2. Click **Create Backup Now**
3. Backup file saved to your data folder with timestamp

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| App won't start | Check if another instance is running. Restart computer. |
| Database error | Restore from backup in data folder. |
| Printer not working | Check printer connection and try "Print to PDF" first. |
| Search not finding patient | Try searching by phone number (most reliable). |
| Payment not showing | Refresh the invoice view. Check payment was saved. |
| Files not uploading | Check file size (max 10MB). Try different file format. |

### Data Location

Your data is stored in the folder you selected during setup:
- `clinic.db` - Main database
- `files/` - Patient attachments
- `backups/` - Automatic and manual backups

### Getting Help

For technical support or feature requests:
- Contact your system administrator
- Check the Admin Guide for advanced settings

---

*Physical Therapy Clinic Management System v2.0.0*

---

## What's New in v2.0.0

### New Features

- **Diagnosis with ICD-10 Codes**: Search and select standardized diagnosis codes
- **Investigations Module**: Track X-Ray, MRI, CT Scan, and other medical investigations
- **Doctor Schedule Validation**: Warnings when booking outside doctor's working hours
- **Patient Data Export**: Export patient records to CSV format
- **Enhanced Invoice Printing**: Improved print layout with better formatting
