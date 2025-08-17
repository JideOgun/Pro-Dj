# AWS Setup for DJ Mix Uploads

## 🚀 **Required AWS Services**

### 1. **S3 Bucket** - File Storage

- Store DJ mix files securely
- Configure CORS for browser uploads
- Set up lifecycle policies for cost optimization

### 2. **CloudFront Distribution** - CDN

- Fast global delivery of audio files
- Reduce bandwidth costs
- Improve user experience

### 3. **IAM User** - Access Control

- Secure API access
- Limited permissions for security

---

## 📋 **Setup Steps**

### **Step 1: Create S3 Bucket**

1. **Go to AWS S3 Console**
2. **Create Bucket:**

   - Bucket name: `pro-dj-mixes` (or your preferred name)
   - Region: Choose closest to your users
   - Block all public access: **Enabled** (we'll use CloudFront for public access)

3. **Configure CORS:**

   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": ["ETag"]
     }
   ]
   ```

4. **Bucket Policy:**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AllowCloudFrontAccess",
         "Effect": "Allow",
         "Principal": {
           "Service": "cloudfront.amazonaws.com"
         },
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::pro-dj-mixes/*",
         "Condition": {
           "StringEquals": {
             "AWS:SourceArn": "arn:aws:cloudfront::YOUR_ACCOUNT_ID:distribution/YOUR_DISTRIBUTION_ID"
           }
         }
       }
     ]
   }
   ```

### **Step 2: Create IAM User**

1. **Go to AWS IAM Console**
2. **Create User:**

   - Username: `pro-dj-uploads`
   - Access type: Programmatic access

3. **Attach Policy:**

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
         "Resource": "arn:aws:s3:::pro-dj-mixes/*"
       },
       {
         "Effect": "Allow",
         "Action": ["s3:ListBucket"],
         "Resource": "arn:aws:s3:::pro-dj-mixes"
       }
     ]
   }
   ```

4. **Save Access Keys:**
   - Access Key ID
   - Secret Access Key

### **Step 3: Create CloudFront Distribution**

1. **Go to AWS CloudFront Console**
2. **Create Distribution:**

   - Origin Domain: Your S3 bucket
   - Origin Access: Origin access control settings (recommended)
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Cache Policy: CachingOptimized
   - Price Class: Use All Edge Locations

3. **Configure Cache Behavior:**

   - Path Pattern: `/*`
   - Viewer Protocol Policy: Redirect HTTP to HTTPS
   - Cache Policy: CachingOptimized
   - Origin Request Policy: CORS-S3Origin

4. **Save Distribution Domain Name**

---

## 🔧 **Environment Variables**

Add these to your `.env.local` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
AWS_S3_BUCKET_NAME=pro-dj-mixes
AWS_CLOUDFRONT_DOMAIN=your_cloudfront_domain.cloudfront.net
```

---

## 📊 **Cost Optimization**

### **S3 Lifecycle Policy**

```json
{
  "Rules": [
    {
      "ID": "MoveToIA",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "mixes/"
      },
      "Transitions": [
        {
          "Days": 30,
          "StorageClass": "STANDARD_IA"
        }
      ]
    },
    {
      "ID": "DeleteOldVersions",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "mixes/"
      },
      "NoncurrentVersionTransitions": [
        {
          "NoncurrentDays": 30,
          "StorageClass": "STANDARD_IA"
        }
      ],
      "NoncurrentVersionExpiration": {
        "NoncurrentDays": 90
      }
    }
  ]
}
```

### **CloudFront Cache Optimization**

- Set TTL for audio files: 24 hours
- Enable compression
- Use price class: Use Only North America and Europe

---

## 🔒 **Security Best Practices**

1. **IAM Roles:**

   - Use least privilege principle
   - Rotate access keys regularly
   - Use IAM roles for EC2 if applicable

2. **S3 Security:**

   - Enable bucket versioning
   - Enable server-side encryption
   - Block public access

3. **CloudFront Security:**
   - Use HTTPS only
   - Enable WAF for additional protection
   - Monitor access logs

---

## 🧪 **Testing**

### **Test Upload:**

```bash
# Test presigned URL generation
curl -X POST http://localhost:3000/api/mixes/upload-url \
  -H "Content-Type: application/json" \
  -d '{"fileName":"test.mp3","fileSize":1024,"mimeType":"audio/mpeg"}'
```

### **Test File Access:**

```bash
# Test CloudFront URL
curl -I https://your-cloudfront-domain.cloudfront.net/mixes/test.mp3
```

---

## 📈 **Monitoring**

### **CloudWatch Metrics:**

- S3: RequestCount, BytesDownloaded, BytesUploaded
- CloudFront: Requests, DataTransfer, ErrorRate

### **Cost Monitoring:**

- Set up billing alerts
- Monitor usage patterns
- Optimize based on usage

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **CORS Errors:**

   - Check S3 CORS configuration
   - Verify CloudFront cache behavior

2. **Upload Failures:**

   - Check IAM permissions
   - Verify presigned URL expiration

3. **Slow Downloads:**
   - Check CloudFront cache hit ratio
   - Consider regional edge caches

---

## 📞 **Support**

For AWS-related issues:

- AWS Documentation: https://docs.aws.amazon.com/
- AWS Support: https://aws.amazon.com/support/

For application issues:

- Check application logs
- Verify environment variables
- Test with smaller files first

