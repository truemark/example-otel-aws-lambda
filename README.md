# Example OpenTelemetry AWS Lambda Multi-Runtime Project

This project demonstrates **OpenTelemetry (OTEL) metrics implementation** across AWS Lambda functions in five different runtimes:
- **NodeJS** (JavaScript)
- **Python**
- **.NET** (C#)
- **Java**
- **Go**

Each Lambda function emits custom OTEL metrics to **Amazon CloudWatch** using **AWS Distro for OpenTelemetry (ADOT)** layers. All functions are deployed using AWS CDK and exposed via API Gateway HTTP API (v2) for easy testing and metrics generation.

## 🔍 OpenTelemetry Features

### Metrics Implemented
Each Lambda function emits the following standardized metrics to CloudWatch:

1. **`lambda_invocations_total`** - Counter tracking function invocation count
   - Labels: `runtime`, `function_name`, `function_version`

2. **`lambda_duration_seconds`** - Histogram measuring execution duration
   - Labels: `runtime`, `function_name`, `status`

3. **`lambda_status_total`** - Counter tracking success/error responses
   - Labels: `runtime`, `function_name`, `status`

4. **`hello_world_requests_total`** - Custom business metric counter
   - Labels: `runtime`

### ADOT Integration
- **AWS Managed Layers**: Uses official ADOT Lambda layers (no custom layer building)
- **CloudWatch Export**: Direct metrics export to CloudWatch (no additional infrastructure)
- **Auto-Instrumentation**: Automatic OTEL setup via environment variables
- **Multi-Runtime Support**: Consistent metrics across all five runtimes

### Runtime-Specific Implementations
- **Node.js**: Uses `@opentelemetry/api` with ADOT layer auto-instrumentation
- **Python**: Uses `opentelemetry-api` and `opentelemetry-sdk` with ADOT layer
- **.NET**: Uses `System.Diagnostics.Metrics` with ADOT layer integration
- **Java**: Uses OpenTelemetry Java SDK with ADOT wrapper layer
- **Go**: Uses structured logging approach with ADOT collector layer

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
│   ├── java/
│   │   ├── src/main/java/example/
│   │   │   └── Handler.java     # Java Lambda handler
│   │   └── pom.xml
│   └── go/
│       ├── main.go              # Go Lambda handler
│       ├── go.mod               # Go module definition
│       └── go.sum               # Go dependencies
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
- `GET /go` - Go Lambda function

## Prerequisites

- **AWS CLI** configured with appropriate credentials
- **Node.js** (v18 or later) for CDK
- **AWS CDK** installed globally: `npm install -g aws-cdk`
- **Docker** (required for .NET, Java, and Go Lambda bundling)

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
- **Go 1.21+** for Go Lambda development

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
curl <HTTP_API_URL>/go
```

Example response (note the `otelEnabled: true` field):
```json
{
  "message": "Hello World from NodeJS Lambda!",
  "runtime": "nodejs",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "requestId": "12345678-1234-1234-1234-123456789012",
  "functionName": "hello-world-nodejs",
  "functionVersion": "$LATEST",
  "otelEnabled": true
}
```

## 📊 Viewing OpenTelemetry Metrics

### CloudWatch Metrics Console

1. **Navigate to CloudWatch** in the AWS Console
2. **Go to Metrics** → **All metrics**
3. **Look for custom namespaces** or search for metric names:
   - `lambda_invocations_total`
   - `lambda_duration_seconds`
   - `lambda_status_total`
   - `hello_world_requests_total`

### Metric Dimensions

Each metric includes dimensions for filtering and grouping:
- **runtime**: `nodejs`, `python`, `dotnet`, `java`, `go`
- **function_name**: `hello-world-nodejs`, `hello-world-python`, etc.
- **function_version**: `$LATEST`
- **status**: `success`, `error`

### Example CloudWatch Queries

**View invocation count by runtime:**
```
SELECT SUM(lambda_invocations_total) FROM SCHEMA("AWS/Lambda/CustomMetrics") 
GROUP BY runtime
```

**Monitor error rates:**
```
SELECT SUM(lambda_status_total) FROM SCHEMA("AWS/Lambda/CustomMetrics") 
WHERE status = 'error'
GROUP BY runtime, function_name
```

**Average response times:**
```
SELECT AVG(lambda_duration_seconds) FROM SCHEMA("AWS/Lambda/CustomMetrics") 
GROUP BY runtime
```

### Creating CloudWatch Dashboards

1. **Create a new dashboard** in CloudWatch
2. **Add widgets** for each metric type:
   - **Line charts** for invocation trends over time
   - **Number widgets** for current totals
   - **Bar charts** for comparing runtimes
   - **Pie charts** for success/error ratios

### Setting Up Alarms

Create CloudWatch alarms for monitoring:

```bash
# Example: Alert on high error rate
aws cloudwatch put-metric-alarm \
  --alarm-name "Lambda-High-Error-Rate" \
  --alarm-description "Alert when Lambda error rate exceeds 5%" \
  --metric-name lambda_status_total \
  --namespace "AWS/Lambda/CustomMetrics" \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --dimensions Name=status,Value=error \
  --evaluation-periods 2
```

### Troubleshooting Metrics

If metrics don't appear in CloudWatch:

1. **Check Lambda logs** for OTEL-related errors
2. **Verify ADOT layer** is attached to functions
3. **Confirm IAM permissions** for CloudWatch PutMetricData
4. **Wait 5-10 minutes** for metrics to appear (CloudWatch delay)
5. **Test function invocation** to generate metrics

**Common log patterns to look for:**
- `OTEL` initialization messages
- `CloudWatch` export confirmations
- Metric emission logs

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

### Go
```bash
cd lambdas/go
go run main.go
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
- 5 Lambda functions (one per runtime)
- 1 API Gateway HTTP API (v2) with 5 endpoints
- CloudWatch Log Groups for each function
- IAM roles and policies for Lambda execution

### HTTP API vs REST API

This project uses **API Gateway HTTP API (v2)** instead of REST API for the following benefits:
- **Up to 70% lower cost** compared to REST API
- **Lower latency** (up to 60% faster response times)
- **Simpler configuration** with built-in CORS support
- **Automatic deployments** without explicit deployment stages
- **Better performance** for high-throughput applications

## 🛠️ Technical Implementation Details

### ADOT Layer Configuration

Each Lambda function uses runtime-specific ADOT layers:

```typescript
// CDK Configuration Example
const adotLayers = {
  nodejs: 'arn:aws:lambda:us-east-1:901920570463:layer:aws-otel-nodejs-amd64-ver-1-18-1:4',
  python: 'arn:aws:lambda:us-east-1:901920570463:layer:aws-otel-python-amd64-ver-1-20-0:3',
  dotnet: 'arn:aws:lambda:us-east-1:901920570463:layer:aws-otel-dotnet-amd64-ver-1-2-0:2',
  java: 'arn:aws:lambda:us-east-1:901920570463:layer:aws-otel-java-wrapper-amd64-ver-1-32-0:3',
  collector: 'arn:aws:lambda:us-east-1:901920570463:layer:aws-otel-collector-amd64-ver-0-90-1:2'
};
```

### Environment Variables

Key OTEL configuration via environment variables:

```bash
OTEL_METRICS_EXPORTER=cloudwatch
OTEL_RESOURCE_ATTRIBUTES=service.name=hello-world-{runtime}
AWS_LAMBDA_EXEC_WRAPPER=/opt/otel-instrument  # For some runtimes
```

### Runtime-Specific Code Patterns

**Node.js Metrics Pattern:**
```javascript
const { metrics } = require('@opentelemetry/api');
const meter = metrics.getMeter('hello-world-nodejs', '1.0.0');
const counter = meter.createCounter('lambda_invocations_total');
counter.add(1, { runtime: 'nodejs', function_name: context.functionName });
```

**Python Metrics Pattern:**
```python
from opentelemetry import metrics
meter = metrics.get_meter("hello-world-python", "1.0.0")
counter = meter.create_counter("lambda_invocations_total")
counter.add(1, {"runtime": "python", "function_name": context.function_name})
```

**.NET Metrics Pattern:**
```csharp
using System.Diagnostics.Metrics;
private static readonly Meter _meter = new("hello-world-dotnet", "1.0.0");
private static readonly Counter<long> _counter = _meter.CreateCounter<long>("lambda_invocations_total");
_counter.Add(1, new KeyValuePair<string, object?>("runtime", "dotnet"));
```

**Java Metrics Pattern:**
```java
import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.metrics.*;
private static final Meter meter = GlobalOpenTelemetry.getMeter("hello-world-java");
private static final LongCounter counter = meter.counterBuilder("lambda_invocations_total").build();
counter.add(1, Attributes.of(AttributeKey.stringKey("runtime"), "java"));
```

**Go Metrics Pattern:**
```go
// Using structured logging for ADOT collector
log.Printf("METRIC lambda_invocations_total{runtime=\"go\",function_name=\"%s\"} %d", 
    functionName, invocationCount)
```

### IAM Permissions

Required CloudWatch permissions added to Lambda execution roles:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricData"
      ],
      "Resource": "*"
    }
  ]
}
```

### Metric Naming Conventions

Following OpenTelemetry semantic conventions:
- **Counters**: Use `_total` suffix (e.g., `lambda_invocations_total`)
- **Histograms**: Use descriptive units (e.g., `lambda_duration_seconds`)
- **Labels**: Use snake_case (e.g., `function_name`, `runtime`)
- **Values**: Use appropriate data types (counters increment, histograms record)

## Future Enhancements

This project can be extended to include:
- **Distributed Tracing**: Add OTEL tracing across Lambda functions
- **AWS X-Ray Integration**: Combine OTEL with X-Ray for comprehensive observability
- **Custom Metrics**: Add business-specific metrics (e.g., user actions, data processing)
- **Alerting**: Implement CloudWatch alarms and SNS notifications
- **Dashboards**: Create comprehensive CloudWatch dashboards
- **Environment-specific configurations**: Different OTEL settings per environment
- **CI/CD pipeline integration**: Automated testing and deployment
- **Unit and integration tests**: Test metric emission and OTEL functionality
- **Multi-region deployment**: Deploy across multiple AWS regions
- **Cost optimization**: Implement sampling and metric filtering

## Cost Considerations

This setup uses:
- **AWS Lambda**: Pay per invocation and duration
- **API Gateway**: Pay per request ($1.00 per million requests)
- **CloudWatch Logs**: Pay per GB stored and ingested
- **CloudWatch Metrics**: Pay per custom metric ($0.30 per metric per month)
- **ADOT Layers**: No additional cost (AWS managed)

**Estimated monthly costs for moderate usage:**
- 10,000 Lambda invocations: ~$0.20
- 10,000 API Gateway requests: ~$0.01
- CloudWatch custom metrics (4 metrics × 5 functions): ~$6.00
- CloudWatch Logs (1GB): ~$0.50

**Total estimated cost: ~$6.71/month**

The AWS free tier covers:
- 1M Lambda requests per month
- 1M API Gateway requests per month
- 5GB CloudWatch Logs storage
- 10 custom metrics for 12 months
