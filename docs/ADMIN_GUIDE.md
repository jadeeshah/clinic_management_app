# Physical Therapy Clinic Management - Administrator Guide

## Table of Contents
1. [Overview](#overview)
2. [Services Management](#services-management)
3. [Packages Management](#packages-management)
4. [Doctor Management](#doctor-management)
5. [Investigations Configuration](#investigations-configuration)
6. [Clinic Settings](#clinic-settings)
7. [Data Management](#data-management)
8. [Backup & Recovery](#backup--recovery)
9. [System Maintenance](#system-maintenance)

---

## Overview

This guide covers administrative features available only to users with the **Admin** role. These features control the core configuration of the clinic management system.

### Admin-Only Features

| Feature | Location | Purpose |
|---------|----------|---------|
| Services | Sidebar | Manage billing catalog |
| Packages | Sidebar | Create session packages |
| Doctors | Sidebar | Manage therapists |
| Settings | Sidebar | Clinic configuration |
| Load Demo Data | Settings | Sample data for testing |
| Delete All Data | Settings | Reset system data |

---

## Services Management

Services are the billable items that appear on invoices.

### Viewing Services

Navigate to **Services** from the sidebar to see all catalog items.

### Adding a Service

1. Click **Add Service**
2. Fill in details:
   - **Code**: Unique identifier (e.g., `PT-SESSION`, `EVAL`)
   - **Name**: Display name (e.g., "Physical Therapy Session")
   - **Price**: Default price for billing
   - **Category**: Grouping (e.g., "Therapy", "Evaluation", "Supplies")
3. Click **Save**

### Default Services

The system includes these default services:

| Code | Name | Category |
|------|------|----------|
| PT-SESSION | PT Session | Therapy |
| EVAL | Evaluation | Assessment |
| TAPING | Kinesio Taping | Supplies |
| ELECTRO | Electrotherapy | Modality |
| HEP | Home Exercise Program | Education |

### Editing Services

1. Click the **Edit** icon on any service row
2. Modify fields as needed
3. Click **Save**

Note: Price changes only affect new invoices, not existing ones.

### Deactivating Services

Instead of deleting, you can deactivate services no longer offered:
1. Edit the service
2. Set status to **Inactive**
3. Service won't appear in new invoice dropdowns

---

## Packages Management

Packages allow patients to purchase multiple sessions at a discounted rate.

### Creating a Package

1. Navigate to **Services** > **Packages** tab
2. Click **Add Package**
3. Fill in details:
   - **Name**: Package title (e.g., "10 Session Package")
   - **Total Sessions**: Number of sessions included
   - **Price**: Total package price
   - **Validity (days)**: How long the package is valid
4. Click **Save**

The system automatically calculates the **per-session cost** for reference.

### Example Packages

| Name | Sessions | Price | Validity | Per Session |
|------|----------|-------|----------|-------------|
| Basic Package | 5 | 25,000 | 30 days | 5,000 |
| Standard Package | 10 | 45,000 | 60 days | 4,500 |
| Premium Package | 15 | 60,000 | 90 days | 4,000 |

### Assigning Packages to Patients

1. Go to **Patients** > Select patient > **Packages** tab
2. Click **Add Package**
3. Select package from dropdown
4. Set purchase date
5. Record payment details
6. Click **Save**

### Tracking Package Usage

When creating visits:
1. Select a patient with an active package
2. The package dropdown shows available packages
3. Select the package to use
4. Session count decreases after visit completion

View remaining sessions in patient profile > Packages tab.

---

## Doctor Management

Doctors (therapists) are assigned to visits and can have individual schedules.

### Adding a Doctor

1. Navigate to **Doctors**
2. Click **Add Doctor**
3. Fill in details:
   - **First Name** / **Last Name**
   - **Phone** / **Email**
   - **Specialization** (e.g., "Physical Therapy", "Sports Rehab")
   - **Session Charge**: Default rate (used for reference)
4. Click **Save**

### Doctor Schedule

Each doctor has an availability schedule:
1. Open doctor profile
2. Click **Set Availability**
3. For each day:
   - Enable/disable working day
   - Set start and end times
4. Save schedule

The weekly schedule view shows all doctors' availability at a glance.

### Schedule Validation

When doctors have schedules configured:
- **Automatic Validation**: System warns when booking visits outside doctor's hours
- **Day Validation**: Checks if doctor works on selected day
- **Time Validation**: Ensures visit time is within start/end times
- **Warning Display**: Shows doctor's availability for reference

Example schedule display:
```
Dr. Sarah Khan: Mon, Wed, Fri | 09:00 - 17:00
```

Validation is advisory - staff can override if needed for urgent appointments.

### Viewing Doctor Performance

Doctor profiles include:
- Total visits completed
- Revenue generated
- Patient count
- Average sessions per patient

---

## Investigations Configuration

The system supports tracking medical investigations ordered for patients.

### Built-in Investigation Types

| Type | Description | Common Use |
|------|-------------|------------|
| X-Ray | Radiographic imaging | Bone fractures, joint alignment |
| CT Scan | Computed tomography | Detailed bone/soft tissue imaging |
| MRI | Magnetic resonance imaging | Soft tissue, disc pathology |
| Ultrasound | Sonographic imaging | Muscle tears, tendon injuries |
| Blood Test | Laboratory analysis | Inflammatory markers, infections |
| ECG | Electrocardiogram | Cardiac screening |

### Investigation Workflow

Investigations follow a status workflow:

```
Ordered → Scheduled → Completed → Reviewed
```

Staff can update status as the investigation progresses:
1. **Ordered**: Doctor requests investigation
2. **Scheduled**: Patient appointment booked
3. **Completed**: Investigation performed
4. **Reviewed**: Results reviewed by treating doctor

### Managing Investigations

Investigations are managed per patient:
1. Navigate to patient profile
2. Select **Investigations** tab
3. View all investigations with status
4. Click to edit or update findings

### Recording Findings

After completion:
1. Open investigation record
2. Enter clinical findings
3. Add notes for follow-up
4. Update status to Reviewed
5. Optionally attach report files in Files tab

---

## Clinic Settings

### Accessing Settings

Navigate to **Settings** from the sidebar.

### Clinic Information

Configure your clinic's identity:

| Field | Purpose |
|-------|---------|
| **Clinic Name** | Appears on invoices and headers |
| **Address** | Printed on invoices |
| **Phone** | Contact number for patients |
| **WhatsApp** | For appointment reminders |
| **Email** | Business email |
| **Website** | Clinic website URL |

### Logo Upload

1. Click **Upload Logo**
2. Select an image file (PNG or JPG recommended)
3. Recommended size: 200x200 pixels
4. Click **Save Settings** to apply

The logo appears on:
- Invoice headers
- Print layouts
- Dashboard header

### Invoice Settings

| Setting | Description |
|---------|-------------|
| **Invoice Prefix** | Added before invoice numbers (e.g., "INV-") |
| **Currency Symbol** | Displayed on all amounts (e.g., "Rs.", "$") |
| **Tax Percentage** | Auto-applied to invoices (0 to disable) |
| **Default Visit Duration** | Pre-filled when scheduling (default: 45 min) |

### Saving Changes

Always click **Save Settings** after making changes. A success message confirms the save.

---

## Data Management

### Load Demo Data

For testing, training, or demonstrations:

1. Go to **Settings**
2. Click **Load Demo Data**
3. Confirm in the dialog
4. Wait for completion

Demo data includes:
- 4 doctors
- 10 patients
- 25 visits (various statuses)
- 15 invoices (Paid, Unpaid, Partial)
- 10 payments
- 8 expenses
- 3 packages
- 4 services

**Warning**: This clears existing data before loading demo data.

### Delete All Data

To reset the system while keeping settings:

1. Go to **Settings**
2. Click **Delete All Data**
3. Confirm deletion

This removes:
- All patients and records
- All doctors
- All visits and appointments
- All invoices and payments
- All packages and expenses

**Preserved**: Settings, services, and system configuration.

**Warning**: This action cannot be undone. Create a backup first.

---

## Backup & Recovery

### Automatic Backups

The system creates automatic backups:
- On every app startup
- Stored in your data folder under `backups/`
- Named with timestamp: `clinic_backup_2024-01-15_09-30-00.db`

### Manual Backup

1. Go to **Settings**
2. Click **Create Backup Now**
3. Backup file created immediately
4. Success message shows file path

### Backup Location

Backups are stored in:
```
[Your Data Folder]/backups/
```

### Restoring from Backup

To restore data:
1. Close the application
2. Navigate to your data folder
3. Rename current `clinic.db` to `clinic_old.db`
4. Copy desired backup file
5. Rename backup to `clinic.db`
6. Restart the application

### Backup Best Practices

| Practice | Recommendation |
|----------|----------------|
| **Frequency** | Daily (automatic) + before major changes |
| **Storage** | Copy backups to external drive weekly |
| **Retention** | Keep at least 7 days of backups |
| **Testing** | Periodically test restoring from backup |

---

## System Maintenance

### Data Folder Structure

```
[Data Folder]/
├── clinic.db          # Main SQLite database
├── files/             # Patient attachments
│   └── patients/
│       └── [PatientID]/
├── backups/           # Backup files
└── config.json        # App configuration
```

### Performance Tips

1. **Regular Backups**: Keep database healthy
2. **File Management**: Remove unnecessary attachments
3. **Archive Old Data**: Export old records periodically
4. **Restart App**: Clears memory, refreshes connections

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Slow performance | Restart app, check disk space |
| Login fails | Verify credentials, check caps lock |
| Missing data | Check filters, restore from backup |
| App crashes | Check Windows Event Log, reinstall app |

### Database Maintenance

The SQLite database is self-maintaining. For manual optimization:
1. Create a backup
2. Close the application
3. Use SQLite tools to run `VACUUM` on the database
4. Restart the application

### Logs and Diagnostics

The app logs errors to:
- Console (development mode)
- Windows Event Log (production)

For support, provide:
- Steps to reproduce the issue
- Screenshots if applicable
- Recent backup file (if safe to share)

---

## Security Recommendations

### Password Management

1. Change default admin password immediately
2. Use strong passwords (8+ characters, mixed case, numbers)
3. Don't share login credentials
4. Create individual user accounts

### Data Protection

1. Store data folder on encrypted drive if possible
2. Regular backups to secure external storage
3. Limit physical access to the computer
4. Log out when leaving the workstation

### Network Security

This is a standalone desktop application:
- No internet connection required
- No data sent to external servers
- All data stored locally

---

## What's New for Administrators in v2.0.0

### New Features

- **Investigations Module**: Track medical investigations (X-Ray, MRI, etc.) per patient
- **Doctor Schedule Validation**: Automatic warnings when booking outside doctor's hours
- **ICD-10 Diagnosis Codes**: Searchable diagnosis code database for standardized documentation
- **Patient Data Export**: Staff can export patient records to CSV format
- **Enhanced Printing**: Improved invoice and receipt layouts

### Database Changes

New tables added:
- `Investigations`: Stores investigation records linked to patients and doctors

Schema updates:
- `Patients`: Added `diagnosis` field for ICD-10 codes

---

*Physical Therapy Clinic Management System v2.0.0 - Administrator Guide*
