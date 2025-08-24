# ☁️ AWS S3 Setup Guide

## 1. AWS Account Setup

### Create AWS Account

1. Go to [aws.amazon.com](https://aws.amazon.com)
2. Create account or sign in
3. Add payment method
4. Complete verification

### Create IAM User

1. Go to **IAM Console > Users**
2. Click **Create user**
3. Username: `pro-dj-s3-user`
4. Select **Programmatic access**
5. Attach policy: `AmazonS3FullAccess` (or custom policy below)

### Custom S3 Policy (Recommended)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:PutObjectAcl"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": ["s3:ListBucket"],
      "Resource": "arn:aws:s3:::your-bucket-name"
    }
  ]
}
```

## 2. S3 Bucket Creation

### Create Bucket

```bash
# Using AWS CLI
aws s3 mb s3://pro-dj-production-files --region us-east-1
```

### Or via Console

1. Go to **S3 Console**
2. Click **Create bucket**
3. Name: `pro-dj-production-files` (must be globally unique)
4. Region: `us-east-1` (or closest to your users)
5. **Block all public access**: ✅ Enabled
6. **Bucket versioning**: Enable
7. **Default encryption**: Enable with AES-256

## 3. Bucket Configuration

### Folder Structure

```
pro-dj-production-files/
├── mixes/
│   ├── audio/
│   └── artwork/
├── profile-pictures/
├── event-photos/
├── documents/
└── videos/
    └── thumbnails/
```

### CORS Configuration

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "https://your-domain.com",
      "https://www.your-domain.com"
    ],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

### Lifecycle Policy

```json
{
  "Rules": [
    {
      "ID": "DeleteIncompleteMultipartUploads",
      "Status": "Enabled",
      "Filter": {},
      "AbortIncompleteMultipartUpload": {
        "DaysAfterInitiation": 7
      }
    },
    {
      "ID": "TransitionToIA",
      "Status": "Enabled",
      "Filter": {},
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        },
        {
          "Days": 90,
          "StorageClass": "GLACIER"
        }
      ]
    }
  ]
}
```

## 4. Environment Variables

Add these to your `.env.production`:

```bash
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=AKIA...your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET=pro-dj-production-files
```

## 5. CloudFront CDN Setup (Optional but Recommended)

### Create CloudFront Distribution

1. Go to **CloudFront Console**
2. Click **Create distribution**
3. **Origin domain**: Select your S3 bucket
4. **Origin access**: Origin access control settings
5. **Default cache behavior**: Compress objects automatically
6. **Price class**: Use all edge locations

### Update Environment Variables

```bash
# Add CloudFront domain
AWS_CLOUDFRONT_DOMAIN=d1234567890.cloudfront.net
```

## 6. File Upload Types & Limits

### Supported File Types

#### Audio Files (Mixes)

- MP3: `audio/mpeg`
- WAV: `audio/wav`
- FLAC: `audio/flac`
- Maximum size: 100MB

#### Images

- JPEG: `image/jpeg`
- PNG: `image/png`
- WebP: `image/webp`
- Maximum size: 10MB

#### Documents

- PDF: `application/pdf`
- Maximum size: 5MB

### File Validation

```typescript
// lib/aws.ts already includes validation
const ALLOWED_AUDIO_TYPES = ["audio/mpeg", "audio/wav", "audio/flac"];
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_AUDIO_SIZE = 100 * 1024 * 1024; // 100MB
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
```

## 7. Security Best Practices

### Access Control

- Use IAM roles instead of access keys when possible
- Implement least-privilege access
- Rotate access keys regularly

### Bucket Security

- Block all public access by default
- Use pre-signed URLs for file access
- Enable MFA delete for critical buckets

### Monitoring

- Enable CloudTrail for API logging
- Set up CloudWatch alarms for unusual activity
- Monitor storage costs

## 8. File Management

### Pre-signed URLs

Your app already generates pre-signed URLs for secure file access:

```typescript
// Automatically handled in lib/aws.ts
const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
```

### File Cleanup

Implement cleanup for:

- Orphaned files (files not referenced in database)
- Temporary uploads that failed
- Old profile pictures when updated

### Backup Strategy

- Enable versioning on bucket
- Set up cross-region replication for critical files
- Regular backup verification

## 9. Cost Optimization

### Storage Classes

- **Standard**: Active files (recent uploads)
- **Standard-IA**: Older files (30+ days)
- **Glacier**: Archive files (90+ days)

### Cost Monitoring

```bash
# Monitor S3 costs
aws s3api list-objects-v2 --bucket pro-dj-production-files --query 'sum(Contents[].Size)'
```

### Optimization Tips

- Compress images before upload
- Use efficient audio formats
- Implement file deduplication
- Regular cleanup of unused files

## 10. Testing & Validation

### Test Upload

```bash
# Test file upload
curl -X POST https://your-domain.com/api/test-upload \
  -F "file=@test-audio.mp3" \
  -H "Authorization: Bearer your-token"
```

### Validate Configuration

```bash
# Test AWS credentials
aws s3 ls s3://pro-dj-production-files

# Test file access
aws s3 cp test-file.txt s3://pro-dj-production-files/
aws s3 rm s3://pro-dj-production-files/test-file.txt
```

## 11. Troubleshooting

### Common Issues

#### Access Denied

- Check IAM permissions
- Verify bucket policy
- Check CORS configuration

#### Upload Failures

- Validate file size limits
- Check file type restrictions
- Verify network connectivity

#### Slow Performance

- Use CloudFront CDN
- Optimize file sizes
- Choose appropriate AWS region

### Debug Commands

```bash
# Check bucket permissions
aws s3api get-bucket-acl --bucket pro-dj-production-files

# List bucket contents
aws s3 ls s3://pro-dj-production-files --recursive

# Check bucket size
aws s3 ls s3://pro-dj-production-files --recursive --summarize
```

---

**Next Step**: Set up your AWS account and create the S3 bucket with proper permissions.
