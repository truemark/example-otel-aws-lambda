#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { ExampleOtelLambdaStack } from '../lib/example-otel-lambda-stack';

const app = new cdk.App();
new ExampleOtelLambdaStack(app, 'ExampleOtelLambda', {



});