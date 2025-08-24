# AWS S3 Setup Guide for Pro-DJ Production

## Overview
This guide will help you set up AWS S3 for file storage in production, enabling profile pictures, mix uploads, and gallery photos.

## Prerequisites
- AWS Account
- AWS CLI (optional but recommended)

## Step 1: Create S3 Bucket

### Via AWS Console:
1. **Go to [AWS S3 Console](https://s3.console.aws.amazon.com/)**
2. **Click "Create bucket"**
3. **Bucket name:** `pro-dj-production-files` (or your preferred name)
4. **Region:** `us-east-2` (your bucket region)
5. **Block Public Access:** ✅ **Keep all blocks enabled** (we'll use presigned URLs)
6. **Click "Create bucket"**

### Via AWS CLI:
```bash
aws s3 mb s3://pro-dj-production-files --region us-east-1
```

## Step 2: Create IAM User for S3 Access

### Via AWS Console:
1. **Go to [IAM Console](https://console.aws.amazon.com/iam/)**
2. **Click "Users" → "Create user"**
3. **Username:** `pro-dj-s3-user`
4. **Access type:** ✅ **Programmatic access**
5. **Click "Next: Permissions"**

### Create Custom Policy:
1. **Click "Create policy"**
2. **JSON tab, paste this policy:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:PutObjectAcl"
            ],
            "Resource": "arn:aws:s3:::pro-dj-production-files/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket"
            ],
            "Resource": "arn:aws:s3:::pro-dj-production-files"
        }
    ]
}
```
3. **Name:** `ProDJ-S3-Access`
4. **Attach policy to user**

### Get Access Keys:
1. **After creating user, click "Security credentials"**
2. **Create access key**
3. **Save the Access Key ID and Secret Access Key**

## Step 3: Configure CORS (Cross-Origin Resource Sharing)

### Via AWS Console:
1. **Go to your S3 bucket**
2. **Click "Permissions" tab**
3. **Scroll to "Cross-origin resource sharing (CORS)"**
4. **Click "Edit" and paste:**

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "PUT",
            "POST",
            "DELETE"
        ],
        "AllowedOrigins": [
            "https://pro-dj.vercel.app",
            "http://localhost:3000"
        ],
        "ExposeHeaders": [
            "ETag"
        ]
    }
]
```

## Step 4: Add Environment Variables to Vercel

### Go to Vercel Dashboard:
1. **Project Settings → Environment Variables**
2. **Add these variables:**

```
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_REGION=us-east-2
AWS_S3_BUCKET_NAME=pro-dj-production-files
```

## Step 5: Test Configuration

After adding environment variables, the app will automatically:
- ✅ Enable file uploads
- ✅ Process images with Sharp
- ✅ Store files in S3
- ✅ Generate secure URLs

## Security Notes

- ✅ **Never commit AWS keys to Git**
- ✅ **Use IAM roles with minimal permissions**
- ✅ **Enable bucket versioning for backup**
- ✅ **Set up CloudTrail for audit logs**

## Cost Optimization

- **S3 Standard storage:** ~$0.023/GB/month
- **Data transfer:** ~$0.09/GB (outbound)
- **Requests:** ~$0.0004 per 1,000 requests

Estimated monthly cost for 100 users: ~$5-15/month
