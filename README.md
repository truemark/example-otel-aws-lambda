# Example OpenTelemetry AWS Lambda Multi-Runtime Project

This project demonstrates basic "Hello World" AWS Lambda functions implemented in four different runtimes:
- **NodeJS** (JavaScript)
- **Python**
- **.NET** (C#)
- **Java**

All functions are deployed using AWS CDK and exposed via API Gateway HTTP API (v2) for easy testing.

## Project Structure

```
├── cdk/                          # AWS CDK Infrastructure
│   ├── lib/
│   │   └── example-otel-lambda-stack.ts
│   ├── bin/
│   │   └── cdk.ts
│   └── package.json
├── lambdas/                      # Lambda Functions
│   ├── nodejs/
│   │   ├── index.js             # NodeJS Lambda handler
│   │   └── package.json
│   ├── python/
│   │   ├── lambda_function.py   # Python Lambda handler
│   │   └── requirements.txt
│   ├── dotnet/
│   │   ├── Function.cs          # .NET Lambda handler
│   │   └── HelloWorld.csproj
│   └── java/
│       ├── src/main/java/example/
│       │   └── Handler.java     # Java Lambda handler
│       └── pom.xml
└── README.md
```

## Lambda Functions

Each Lambda function returns a JSON response with:
- A "Hello World" message specific to its runtime
- Runtime information
- Timestamp
- AWS Lambda context information (request ID, function name, etc.)

### API Endpoints

Once deployed, you can test the functions via these API Gateway endpoints:
- `GET /nodejs` - NodeJS Lambda function
- `GET /python` - Python Lambda function  
- `GET /dotnet` - .NET Lambda function
- `GET /java` - Java Lambda function

## Prerequisites

- **AWS CLI** configured with appropriate credentials
- **Node.js** (v18 or later) for CDK
- **AWS CDK** installed globally: `npm install -g aws-cdk`
- **Docker** (required for .NET and Java Lambda bundling)

### ECR Authentication for Docker Bundling

The .NET and Java Lambda functions use Docker bundling during deployment, which pulls base images from AWS's public ECR repositories. You need to authenticate with public ECR before deployment:

```bash
aws ecr-public get-login-password --region us-east-1 | docker login --username AWS --password-stdin public.ecr.aws
```

**Important notes:**
- This authentication is required even for public ECR repositories
- The login token expires after 12 hours, so you may need to re-authenticate for subsequent deployments
- If you skip this step, you'll see Docker pull errors during `cdk deploy` or `cdk synth`

**Common error without authentication:**
```
Error response from daemon: pull access denied for public.ecr.aws/lambda/dotnet, repository does not exist or may require 'docker login'
```

### Optional (for local development):
- **Python 3.12** for Python Lambda development
- **.NET 8 SDK** for .NET Lambda development  
- **Java 17** and **Maven** for Java Lambda development

## Deployment

1. **Install CDK dependencies:**
   ```bash
   cd cdk
   npm install
   ```

2. **Bootstrap CDK (first time only):**
   ```bash
   cdk bootstrap
   ```

3. **Deploy the stack:**
   ```bash
   cdk deploy
   ```

4. **Note the outputs:** After deployment, CDK will output:
   - HTTP API URL
   - Individual Lambda function ARNs

## Testing the Functions

After deployment, you can test each function:

```bash
# Replace <HTTP_API_URL> with the actual URL from CDK output
curl <HTTP_API_URL>/nodejs
curl <HTTP_API_URL>/python
curl <HTTP_API_URL>/dotnet
curl <HTTP_API_URL>/java
```

Example response:
```json
{
  "message": "Hello World from NodeJS Lambda!",
  "runtime": "nodejs",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "12345678-1234-1234-1234-123456789012",
  "functionName": "hello-world-nodejs",
  "functionVersion": "$LATEST"
}
```

## Local Development

### NodeJS
```bash
cd lambdas/nodejs
node -e "console.log(require('./index').handler({}, {requestId: 'test', functionName: 'test'}))"
```

### Python
```bash
cd lambdas/python
python3 -c "
import lambda_function
class MockContext:
    aws_request_id = 'test'
    function_name = 'test'
    function_version = '$LATEST'
    memory_limit_in_mb = 128
    def get_remaining_time_in_millis(self): return 30000

print(lambda_function.lambda_handler({}, MockContext()))
"
```

### .NET
```bash
cd lambdas/dotnet
dotnet build
# Use AWS Lambda Test Tool or SAM CLI for local testing
```

### Java
```bash
cd lambdas/java
mvn clean compile
# Use AWS Lambda Test Tool or SAM CLI for local testing
```

## Cleanup

To remove all deployed resources:
```bash
cd cdk
cdk destroy
```

## Architecture

The CDK stack creates:
- 4 Lambda functions (one per runtime)
- 1 API Gateway HTTP API (v2) with 4 endpoints
- CloudWatch Log Groups for each function
- IAM roles and policies for Lambda execution

### HTTP API vs REST API

This project uses **API Gateway HTTP API (v2)** instead of REST API for the following benefits:
- **Up to 70% lower cost** compared to REST API
- **Lower latency** (up to 60% faster response times)
- **Simpler configuration** with built-in CORS support
- **Automatic deployments** without explicit deployment stages
- **Better performance** for high-throughput applications

## Future Enhancements

This project can be extended to include:
- OpenTelemetry instrumentation for distributed tracing
- AWS X-Ray integration
- Custom metrics and monitoring
- Environment-specific configurations
- CI/CD pipeline integration
- Unit and integration tests

## Cost Considerations

This setup uses:
- AWS Lambda (pay per invocation)
- API Gateway (pay per request)
- CloudWatch Logs (pay per GB stored)

The free tier should cover basic testing and development usage.
