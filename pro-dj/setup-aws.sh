#!/bin/bash

echo "🔧 AWS S3 Setup for Pro-DJ"
echo "=========================="
echo ""

echo "This script will help you configure AWS credentials for S3 file uploads."
echo "You'll need:"
echo "- AWS Access Key ID"
echo "- AWS Secret Access Key"
echo "- AWS Region (default: us-east-2)"
echo "- S3 Bucket Name (default: pro-dj-mixes-v2)"
echo ""

read -p "Do you want to configure AWS S3? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ AWS setup cancelled."
    echo "📝 Note: Mix uploads will be saved locally in /app/public/uploads/mixes"
    exit 1
fi

echo ""
echo "Please enter your AWS credentials:"
echo ""

read -p "AWS Access Key ID: " aws_access_key
read -s -p "AWS Secret Access Key: " aws_secret_key
echo ""
read -p "AWS Region [us-east-2]: " aws_region
aws_region=${aws_region:-us-east-2}

read -p "S3 Bucket Name [pro-dj-mixes-v2]: " s3_bucket
s3_bucket=${s3_bucket:-pro-dj-mixes-v2}

echo ""
echo "🔧 Updating docker-compose.dev.yml with AWS credentials..."

# Create a backup of the original file
cp docker-compose.dev.yml docker-compose.dev.yml.backup

# Update the environment variables in docker-compose.dev.yml
sed -i '' "s/# - AWS_ACCESS_KEY_ID=your_aws_key/- AWS_ACCESS_KEY_ID=$aws_access_key/" docker-compose.dev.yml
sed -i '' "s/# - AWS_SECRET_ACCESS_KEY=your_aws_secret/- AWS_SECRET_ACCESS_KEY=$aws_secret_key/" docker-compose.dev.yml
sed -i '' "s/# - AWS_REGION=your_aws_region/- AWS_REGION=$aws_region/" docker-compose.dev.yml
sed -i '' "s/# - AWS_S3_BUCKET=your_s3_bucket/- AWS_S3_BUCKET_NAME=$s3_bucket/" docker-compose.dev.yml

echo "✅ AWS credentials configured!"
echo ""
echo "🔄 Restarting containers with new configuration..."

# Restart the containers to apply the new environment variables
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "✅ AWS S3 setup complete!"
echo "🌐 Your application is now configured to upload mixes to S3."
echo "📝 Backup of original config saved as: docker-compose.dev.yml.backup"
echo ""
echo "🔗 Access your application at: http://localhost:3000"
