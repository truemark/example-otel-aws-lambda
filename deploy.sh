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
    echo "Please install CDK globally: pnpm install -g aws-cdk"
    exit 1
fi

echo "✅ AWS CDK found"

# Navigate to CDK directory
cd cdk

# Install dependencies
echo "📦 Installing CDK dependencies..."
pnpm install

# Build the project
echo "🔨 Building CDK project..."
pnpm run build

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

# Test the deployed Lambda functions
echo "🧪 Testing deployed Lambda functions..."
echo ""

# Get the API Gateway URL from CloudFormation outputs
echo "📡 Retrieving API Gateway URL..."
API_URL=$(aws cloudformation describe-stacks \
    --stack-name ExampleOtelLambda \
    --query 'Stacks[0].Outputs[?OutputKey==`HttpApiUrl`].OutputValue' \
    --output text 2>/dev/null)

if [ -z "$API_URL" ]; then
    echo "❌ Could not retrieve API Gateway URL from CloudFormation outputs"
    echo "Please check the stack deployment status"
    exit 1
fi

echo "✅ API Gateway URL: $API_URL"
echo ""

# Wait a moment for API Gateway to be fully ready
echo "⏳ Waiting for API Gateway to be ready..."
sleep 5

# Function to test an endpoint
test_endpoint() {
    local endpoint=$1
    local function_name=$2

    echo "🔍 Testing $function_name function..."
    echo "   Endpoint: $API_URL$endpoint"
    echo "   Running: curl \"$API_URL$endpoint\""
    echo ""

    # Show the actual curl command output with clear formatting
    echo "   📡 Curl Request & Response:"
    echo "   =========================="

    # Make the curl request showing headers and response with timing
    echo "   > GET $endpoint HTTP/1.1"
    echo "   > Host: $(echo "$API_URL" | sed 's|https\?://||' | sed 's|/.*||')"
    echo "   > User-Agent: curl"
    echo "   >"

    # Execute curl and capture response with timing
    response=$(curl -s -w "\n%{http_code}|%{time_total}" "$API_URL$endpoint" 2>/dev/null)

    # Extract response body and metadata
    body=$(echo "$response" | sed '$d')
    metadata=$(echo "$response" | tail -n 1)
    http_code=$(echo "$metadata" | cut -d'|' -f1)
    time_total=$(echo "$metadata" | cut -d'|' -f2)

    # Show response headers and status
    echo "   < HTTP/1.1 $http_code"
    echo "   < Content-Type: application/json"
    echo "   <"

    # Show response body with proper formatting
    if command -v jq &> /dev/null && [ "$http_code" = "200" ]; then
        echo "$body" | jq '.' | sed 's/^/   /'
    else
        echo "   $body"
    fi

    # Show timing and status summary
    echo ""
    if [ "$http_code" = "200" ]; then
        echo "   ✅ SUCCESS - Status: $http_code, Time: ${time_total}s"
    else
        echo "   ❌ FAILED - Status: $http_code, Time: ${time_total}s"
    fi
    echo "   =========================="
    echo ""
}

# Test all Lambda functions
test_endpoint "/nodejs" "NodeJS"
test_endpoint "/python" "Python"
test_endpoint "/dotnet" ".NET"
test_endpoint "/java" "Java"
test_endpoint "/go" "Go"

echo "🎉 Function testing completed!"
echo ""
echo "📋 Next steps:"
echo "1. Review the test results above"
echo "2. Check CloudWatch logs for detailed function execution logs"
echo "3. Monitor your functions in the AWS Lambda console"
echo ""
echo "🔗 Useful commands:"
echo "   • View logs: aws logs tail /aws/lambda/hello-world-nodejs --follow"
echo "   • Test individual function: curl $API_URL/nodejs"
echo ""
echo "🧹 To clean up resources later, run: cdk destroy"
