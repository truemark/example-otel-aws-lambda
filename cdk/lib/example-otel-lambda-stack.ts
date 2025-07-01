import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';
import * as path from 'path';

export class ExampleOtelLambdaStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // NodeJS Lambda Function
    const nodejsFunction = new lambda.Function(this, 'NodejsHelloWorldFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/nodejs')),
      functionName: 'hello-world-nodejs',
      description: 'Hello World Lambda function in NodeJS',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        NODE_ENV: 'production'
      }
    });

    // Python Lambda Function
    const pythonFunction = new lambda.Function(this, 'PythonHelloWorldFunction', {
      runtime: lambda.Runtime.PYTHON_3_13,
      handler: 'lambda_function.lambda_handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/python')),
      functionName: 'hello-world-python',
      description: 'Hello World Lambda function in Python',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      logRetention: logs.RetentionDays.ONE_WEEK,
      environment: {
        PYTHONPATH: '/var/runtime'
      }
    });

    // .NET Lambda Function
    const dotnetFunction = new lambda.Function(this, 'DotnetHelloWorldFunction', {
      runtime: lambda.Runtime.DOTNET_9,
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
      description: 'Hello World Lambda function in .NET',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // Java Lambda Function
    const javaFunction = new lambda.Function(this, 'JavaHelloWorldFunction', {
      runtime: lambda.Runtime.JAVA_21,
      handler: 'example.Handler::handleRequest',
      code: lambda.Code.fromAsset(path.join(__dirname, '../../lambdas/java'), {
        bundling: {
          image: lambda.Runtime.JAVA_17.bundlingImage,
          command: [
            '/bin/sh',
            '-c',
            'mvn clean install && cp /asset-input/target/*.jar /asset-output/'
          ]
        }
      }),
      functionName: 'hello-world-java',
      description: 'Hello World Lambda function in Java',
      timeout: cdk.Duration.seconds(30),
      memorySize: 512,
      logRetention: logs.RetentionDays.ONE_WEEK
    });

    // Create API Gateway to test the functions
    const api = new apigateway.RestApi(this, 'HelloWorldApi', {
      restApiName: 'Hello World Service',
      description: 'API Gateway for Hello World Lambda functions',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'X-Amz-Date', 'Authorization', 'X-Api-Key']
      }
    });

    // Add API Gateway integrations
    const nodejsIntegration = new apigateway.LambdaIntegration(nodejsFunction);
    const pythonIntegration = new apigateway.LambdaIntegration(pythonFunction);
    const dotnetIntegration = new apigateway.LambdaIntegration(dotnetFunction);
    const javaIntegration = new apigateway.LambdaIntegration(javaFunction);

    // Create API routes
    api.root.addResource('nodejs').addMethod('GET', nodejsIntegration);
    api.root.addResource('python').addMethod('GET', pythonIntegration);
    api.root.addResource('dotnet').addMethod('GET', dotnetIntegration);
    api.root.addResource('java').addMethod('GET', javaIntegration);

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: api.url,
      description: 'URL of the API Gateway',
      exportName: 'HelloWorldApiUrl'
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
  }
}
