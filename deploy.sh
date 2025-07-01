#!/bin/bash

# Deploy script for Hello World Lambda functions
set -e

echo "🚀 Deploying Hello World Lambda Functions..."
echo ""

# Check if AWS CLI is configured
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo "❌ AWS CLI is not configured or credentials are invalid"
    echo "Please run 'aws configure' to set up your credentials"
    exit 1
fi

echo "✅ AWS credentials verified"

# Check if CDK is installed
if ! command -v cdk &> /dev/null; then
    echo "❌ AWS CDK is not installed"
    echo "Please install CDK globally: npm install -g aws-cdk"
    exit 1
fi

echo "✅ AWS CDK found"

# Navigate to CDK directory
cd cdk

# Install dependencies
echo "📦 Installing CDK dependencies..."
npm install

# Build the project
echo "🔨 Building CDK project..."
npm run build

# Check if CDK is bootstrapped
echo "🔍 Checking CDK bootstrap status..."
if ! cdk list > /dev/null 2>&1; then
    echo "⚠️  CDK might not be bootstrapped in this region"
    echo "Running CDK bootstrap..."
    cdk bootstrap
fi

# Deploy the stack
echo "🚀 Deploying the stack..."
cdk deploy --require-approval never

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Check the CDK outputs above for the API Gateway URL"
echo "2. Test your functions using the provided endpoints"
echo "3. View logs in CloudWatch"
echo ""
echo "🧹 To clean up resources later, run: cdk destroy"
