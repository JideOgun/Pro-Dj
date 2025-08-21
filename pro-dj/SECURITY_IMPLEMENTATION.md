# Security Implementation for Tax Information

This document outlines the comprehensive security improvements implemented for handling sensitive tax information (SSN/EIN numbers) in the Pro-DJ platform.

## Overview

Previously, sensitive tax information was stored in plain text in the User table, which posed significant security risks. We have implemented a robust security solution that isolates, encrypts, and audits access to this sensitive data.

## Security Features Implemented

### 1. Data Separation and Isolation

- **New SecurityClearance Model**: Created a separate, secure table for sensitive tax information
- **Removed from User Table**: Moved all sensitive tax data out of the main User table
- **One-to-One Relationship**: Each user can have only one security clearance record

### 2. Encryption at Rest

- **AES-256-GCM Encryption**: All tax IDs are encrypted using industry-standard encryption
- **Unique Initialization Vectors**: Each encrypted record uses a unique IV for maximum security
- **Authentication Tags**: Prevents tampering with encrypted data
- **Last Four Digits**: Stored separately for display purposes without exposing full numbers

### 3. Access Controls

- **Admin-Only Access**: Only admin users can view/manage tax information
- **Self-Access**: Users can only access their own tax data
- **API-Level Protection**: All endpoints have strict permission checks
- **Session-Based Authorization**: Uses NextAuth sessions for authentication

### 4. Audit Trail

- **Comprehensive Logging**: Every access to tax data is logged with:
  - User ID accessing the data
  - Admin ID performing the access
  - IP address and user agent
  - Timestamp of access
  - Type of operation (VIEW, CREATE, UPDATE, DELETE)
  - Specific data fields accessed
- **Access Counter**: Tracks total number of times data has been accessed
- **Last Access Tracking**: Records when and by whom data was last accessed

### 5. Data Verification

- **Verification Status**: Tracks whether tax information has been verified by admin
- **Verification Timestamp**: Records when verification was completed
- **Verification Authority**: Tracks which admin verified the information

### 6. Compliance and Data Retention

- **Automatic Retention Calculation**: Sets data retention dates based on IRS requirements (8 years)
- **Retention Monitoring**: Admin interface shows when data retention periods expire
- **Retention Suspension**: Ability to suspend retention for active legal matters
- **Compliance Alerts**: Visual indicators for retention due dates

## Database Schema Changes

### SecurityClearance Model

```prisma
model SecurityClearance {
  id String @id @default(uuid())
  userId String @unique
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  // Encrypted sensitive tax information
  encryptedTaxId String? // Encrypted SSN or EIN
  taxIdLastFour String? // Last 4 digits for display purposes
  taxIdType String? // "SSN" or "EIN" for validation
  businessName String? // Legal business name
  businessAddress String? // Business address
  businessPhone String? // Business phone

  // Business structure information
  isCorporation Boolean @default(false)
  isSoleProprietor Boolean @default(true)
  businessType String? // "SOLE_PROPRIETOR", "LLC", "CORPORATION", "PARTNERSHIP"

  // Security and audit fields
  lastAccessedAt DateTime?
  lastAccessedBy String?
  accessCount Int @default(0)
  ipAddress String?

  // Data verification
  isVerified Boolean @default(false)
  verifiedAt DateTime?
  verifiedBy String?

  // Compliance and retention
  dataRetentionDate DateTime?
  isRetentionSuspended Boolean @default(false)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([userId])
  @@index([isVerified])
  @@index([dataRetentionDate])
}
```

### User Model Changes

```prisma
// Removed from User model:
// - taxId
// - businessName
// - businessAddress
// - businessPhone
// - isCorporation
// - isSoleProprietor

// Added to User model:
securityClearance SecurityClearance?
```

## API Endpoints

### 1. Tax Information Management

- **GET `/api/security/tax-info`**: Retrieve tax information (admin or self)
- **POST `/api/security/tax-info`**: Create/update tax information
- **DELETE `/api/security/tax-info`**: Delete tax information (admin only)

### 2. Security Clearance Management

- **GET `/api/security/clearances`**: List all security clearances (admin only)
- **POST `/api/security/tax-info/verify`**: Verify tax information (admin only)

### 3. Admin Interface

- **`/dashboard/admin/security`**: Security management dashboard for admins

## Security Utilities

### Encryption Functions

- `encryptTaxId()`: Encrypts tax ID with AES-256-GCM
- `decryptTaxId()`: Decrypts tax ID (internal use only)
- `getTaxIdLastFour()`: Extracts last 4 digits for display

### Validation Functions

- `validateTaxId()`: Validates SSN/EIN format
- `determineTaxIdType()`: Determines if input is SSN or EIN
- `sanitizeTaxIdForLogging()`: Creates safe version for logs

### Security Functions

- `hasSecurityClearance()`: Checks user permissions
- `logTaxDataAccess()`: Logs all access for audit
- `calculateDataRetentionDate()`: Calculates retention dates

## Migration Process

### 1. Data Migration

```bash
# Migrate existing tax data to SecurityClearance
npm run migrate-tax-data migrate

# After verification, cleanup old data
npm run migrate-tax-data cleanup
```

### 2. Environment Variables

Add to your `.env` file:

```
TAX_DATA_ENCRYPTION_KEY=your-secure-encryption-key-here
```

## Admin Interface Features

### Security Dashboard

- **Overview**: List of all security clearances
- **Status Indicators**: Verification status, retention alerts
- **Access Tracking**: Last access times and access counts
- **Quick Actions**: Verify, view details, delete records

### Detail View

- **User Information**: Name, email, role
- **Tax Information**: Type and last 4 digits (never full number)
- **Business Details**: Business name, type, structure
- **Verification Status**: Whether verified and by whom
- **Access History**: Detailed access tracking
- **Retention Information**: Retention dates and alerts

## Security Best Practices

### For Developers

1. **Never log full tax IDs**: Always use sanitized versions
2. **Limit API responses**: Never return encrypted data via API
3. **Validate permissions**: Check access rights at every endpoint
4. **Audit everything**: Log all access to sensitive data
5. **Use HTTPS only**: Ensure all communication is encrypted in transit

### For Administrators

1. **Regular audits**: Review access logs periodically
2. **Verify promptly**: Verify tax information when received
3. **Monitor retention**: Watch for retention due dates
4. **Limit access**: Only access data when necessary
5. **Secure workstations**: Ensure admin workstations are secure

## Compliance Features

### IRS Compliance

- **8-year retention**: Automatically calculates retention dates
- **Secure storage**: Encrypted at rest and in transit
- **Access controls**: Restricted access to authorized personnel
- **Audit trail**: Complete history of data access

### GDPR Considerations

- **Right to deletion**: Admin can delete records when appropriate
- **Data minimization**: Only stores necessary tax information
- **Access transparency**: Users can see when their data is accessed
- **Retention limits**: Automatic retention date calculation

## Monitoring and Alerts

### Security Monitoring

- **Failed access attempts**: Logged and monitored
- **Unusual access patterns**: Can be detected in logs
- **IP tracking**: All access tracked by IP address
- **Session monitoring**: Tied to authenticated sessions

### Compliance Alerts

- **Retention due**: Visual indicators for expiring retention
- **Unverified data**: Highlights unverified tax information
- **High access counts**: Identifies frequently accessed records
- **Stale data**: Shows old or inactive records

## Future Enhancements

### Planned Improvements

1. **Real-time alerts**: Email notifications for security events
2. **Advanced encryption**: Key rotation and HSM integration
3. **API rate limiting**: Prevent brute force attacks
4. **Automated compliance**: Automatic data deletion after retention
5. **Enhanced audit**: More detailed audit trails and reporting

### Security Hardening

1. **Field-level encryption**: Encrypt additional sensitive fields
2. **Zero-knowledge architecture**: Further isolate sensitive data
3. **Multi-factor authentication**: Require MFA for tax data access
4. **Role-based permissions**: More granular access controls
5. **Data loss prevention**: Prevent unauthorized data export

## Testing

### Security Testing

- **Penetration testing**: Regular security assessments
- **Access control testing**: Verify permission enforcement
- **Encryption testing**: Validate encryption/decryption
- **Audit testing**: Ensure logging completeness

### Compliance Testing

- **Retention testing**: Verify retention date calculations
- **Deletion testing**: Test secure data deletion
- **Access testing**: Verify authorized access only
- **Audit testing**: Validate audit trail completeness

This security implementation provides a robust foundation for protecting sensitive tax information while maintaining compliance with relevant regulations and providing administrators with the tools they need to manage this data securely.
