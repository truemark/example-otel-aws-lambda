import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as apigatewayv2Integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export class ExampleOtelLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ADOT Lambda Layer ARNs (region-agnostic using current versions)
    const adotLayers = {
      nodejs: lambda.LayerVersion.fromLayerVersionArn(this, 'AdotNodejsLayer', 
        `arn:aws:lambda:${this.region}:901920570463:layer:aws-otel-nodejs-amd64-ver-1-30-2:1`),
      python: lambda.LayerVersion.fromLayerVersionArn(this, 'AdotPythonLayer', 
        `arn:aws:lambda:${this.region}:901920570463:layer:aws-otel-python-amd64-ver-1-32-0:2`),
      dotnet: lambda.LayerVersion.fromLayerVersionArn(this, 'AdotDotnetLayer', 
        `arn:aws:lambda:${this.region}:901920570463:layer:aws-otel-collector-amd64-ver-0-117-0:1`),
      java: lambda.LayerVersion.fromLayerVersionArn(this, 'AdotJavaLayer', 
        `arn:aws:lambda:${this.region}:901920570463:layer:aws-otel-java-wrapper-amd64-ver-1-32-0:6`),
      collector: lambda.LayerVersion.fromLayerVersionArn(this, 'AdotCollectorLayer', 
        `arn:aws:lambda:${this.region}:901920570463:layer:aws-otel-collector-amd64-ver-0-117-0:1`)
    };

    // CloudWatch metrics policy for all Lambda functions
    const cloudWatchMetricsPolicy = new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'cloudwatch:PutMetricData'
      ],
      resources: ['*']
    });

    // NodeJS Lambda Function
    const nodejsFunction = new lambda.Function(this, 'NodejsHelloWorldFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/nodejs')),
      functionName: 'hello-world-nodejs',
      description: 'Hello World Lambda function in NodeJS with OTEL',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [adotLayers.nodejs],
      environment: {
        NODE_ENV: 'production',
        OTEL_METRICS_EXPORTER: 'cloudwatch',
        OTEL_RESOURCE_ATTRIBUTES: 'service.name=hello-world-nodejs',
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-handler'
      }
    });
    nodejsFunction.addToRolePolicy(cloudWatchMetricsPolicy);

    // Python Lambda Function
    const pythonFunction = new lambda.Function(this, 'PythonHelloWorldFunction', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/python')),
      functionName: 'hello-world-python',
      description: 'Hello World Lambda function in Python with OTEL',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [adotLayers.python],
      environment: {
        PYTHONPATH: '/var/runtime',
        OTEL_METRICS_EXPORTER: 'cloudwatch',
        OTEL_RESOURCE_ATTRIBUTES: 'service.name=hello-world-python',
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-instrument'
      }
    });
    pythonFunction.addToRolePolicy(cloudWatchMetricsPolicy);

    // .NET Lambda Function
    const dotnetFunction = new lambda.Function(this, 'DotnetHelloWorldFunction', {
      runtime: lambda.Runtime.DOTNET_8,
      handler: 'HelloWorldDotNet::HelloWorldDotNet.Function::FunctionHandler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/dotnet'), {
        bundling: {
          image: lambda.Runtime.DOTNET_8.bundlingImage,
          command: [
            '/bin/sh',
            '-c',
            'dotnet tool install -g Amazon.Lambda.Tools && ' +
            'dotnet lambda package --output-package /asset-output/function.zip'
          ]
        }
      }),
      functionName: 'hello-world-dotnet',
      description: 'Hello World Lambda function in .NET with OTEL',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [adotLayers.dotnet],
      environment: {
        OTEL_METRICS_EXPORTER: 'cloudwatch',
        OTEL_RESOURCE_ATTRIBUTES: 'service.name=hello-world-dotnet'
      }
    });
    dotnetFunction.addToRolePolicy(cloudWatchMetricsPolicy);

    // Java Lambda Function
    const javaFunction = new lambda.Function(this, 'JavaHelloWorldFunction', {
      runtime: lambda.Runtime.JAVA_21,
      handler: 'example.Handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/java'), {
        bundling: {
          image: lambda.Runtime.JAVA_21.bundlingImage,
          command: [
            '/bin/sh',
            '-c',
            'export MAVEN_OPTS="-Dmaven.repo.local=/tmp/.m2" && ' +
            'mvn clean package -Dmaven.repo.local=/tmp/.m2 && ' +
            'find /asset-input/target -name "*.jar" -not -name "original-*" -exec cp {} /asset-output/ \\; && ' +
            'cp /asset-input/collector.yaml /asset-output/ && ' +
            'ls -la /asset-output/'
          ],
          user: 'root'
        }
      }),
      functionName: 'hello-world-java',
      description: 'Hello World Lambda function in Java with OTEL',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [adotLayers.java],
      environment: {
        OTEL_METRICS_EXPORTER: 'otlp',
        OTEL_EXPORTER_OTLP_ENDPOINT: 'http://localhost:4318',
        OTEL_RESOURCE_ATTRIBUTES: 'service.name=hello-world-java',
        AWS_LAMBDA_EXEC_WRAPPER: '/opt/otel-handler',
        OPENTELEMETRY_COLLECTOR_CONFIG_URI: '/var/task/collector.yaml'
      }
    });
    javaFunction.addToRolePolicy(cloudWatchMetricsPolicy);

    // Go Lambda Function
    const goFunction = new lambda.Function(this, 'GoHelloWorldFunction', {
      runtime: lambda.Runtime.PROVIDED_AL2023,
      handler: 'bootstrap',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/go'), {
        bundling: {
          image: lambda.Runtime.PROVIDED_AL2023.bundlingImage,
          platform: 'linux/amd64', // Explicit platform for ARM Mac compatibility
          command: [
            '/bin/sh',
            '-c',
            'dnf install -y golang && ' +  // Use dnf instead of yum for AL2023
            'export GOPROXY=direct && ' +
            'export GOSUMDB=off && ' +
            'export CGO_ENABLED=0 && ' +
            'export GOOS=linux && ' +
            'export GOARCH=amd64 && ' +
            'cd /asset-input && ' +
            'go mod download && ' +
            'go build -ldflags="-s -w" -o /asset-output/bootstrap main.go'
          ],
          user: 'root'
        }
      }),
      functionName: 'hello-world-go',
      description: 'Hello World Lambda function in Go with OTEL',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      layers: [adotLayers.collector],
      environment: {
        OTEL_METRICS_EXPORTER: 'cloudwatch',
        OTEL_RESOURCE_ATTRIBUTES: 'service.name=hello-world-go'
      }
    });
    goFunction.addToRolePolicy(cloudWatchMetricsPolicy);

    // Create HTTP API (API Gateway v2) to test the functions
    const httpApi = new apigatewayv2.HttpApi(this, 'HelloWorldHttpApi', {
      apiName: 'Hello World HTTP API',
      description: 'HTTP API for Hello World Lambda functions',
      corsPreflight: {
        allowOrigins: ['*'],
        allowMethods: [apigatewayv2.CorsHttpMethod.GET, apigatewayv2.CorsHttpMethod.POST, apigatewayv2.CorsHttpMethod.OPTIONS],
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
      }
    });

    // Add HTTP API integrations
    const nodejsIntegration = new apigatewayv2Integrations.HttpLambdaIntegration('NodejsIntegration', nodejsFunction);
    const pythonIntegration = new apigatewayv2Integrations.HttpLambdaIntegration('PythonIntegration', pythonFunction);
    const dotnetIntegration = new apigatewayv2Integrations.HttpLambdaIntegration('DotnetIntegration', dotnetFunction);
    const javaIntegration = new apigatewayv2Integrations.HttpLambdaIntegration('JavaIntegration', javaFunction);
    const goIntegration = new apigatewayv2Integrations.HttpLambdaIntegration('GoIntegration', goFunction);

    // Create HTTP API routes
    httpApi.addRoutes({
      path: '/nodejs',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: nodejsIntegration
    });

    httpApi.addRoutes({
      path: '/python',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: pythonIntegration
    });

    httpApi.addRoutes({
      path: '/dotnet',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: dotnetIntegration
    });

    httpApi.addRoutes({
      path: '/java',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: javaIntegration
    });

    httpApi.addRoutes({
      path: '/go',
      methods: [apigatewayv2.HttpMethod.GET],
      integration: goIntegration
    });

    // Output the HTTP API URL
    new cdk.CfnOutput(this, 'HttpApiUrl', {
      value: httpApi.url!,
      description: 'URL of the HTTP API',
      exportName: 'HelloWorldHttpApiUrl'
    });

    // Output individual function ARNs
    new cdk.CfnOutput(this, 'NodejsFunctionArn', {
      value: nodejsFunction.functionArn,
      description: 'ARN of the NodeJS Lambda function'
    });

    new cdk.CfnOutput(this, 'PythonFunctionArn', {
      value: pythonFunction.functionArn,
      description: 'ARN of the Python Lambda function'
    });

    new cdk.CfnOutput(this, 'DotnetFunctionArn', {
      value: dotnetFunction.functionArn,
      description: 'ARN of the .NET Lambda function'
    });

    new cdk.CfnOutput(this, 'JavaFunctionArn', {
      value: javaFunction.functionArn,
      description: 'ARN of the Java Lambda function'
    });

    new cdk.CfnOutput(this, 'GoFunctionArn', {
      value: goFunction.functionArn,
      description: 'ARN of the Go Lambda function'
    });
  }
}
