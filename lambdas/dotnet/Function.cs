using System;
using System.Collections.Generic;
using System.Text.Json;
using System.Diagnostics;
using System.Diagnostics.Metrics;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace HelloWorldDotNet
{
    public class Function
    {
        // Initialize metrics
        private static readonly Meter _meter = new("hello-world-dotnet", "1.0.0");
        
        // Create metrics instruments
        private static readonly Counter<long> _invocationCounter = _meter.CreateCounter<long>(
            "lambda_invocations_total",
            description: "Total number of Lambda function invocations");
            
        private static readonly Histogram<double> _durationHistogram = _meter.CreateHistogram<double>(
            "lambda_duration_seconds",
            description: "Lambda function execution duration in seconds");
            
        private static readonly Counter<long> _statusCounter = _meter.CreateCounter<long>(
            "lambda_status_total",
            description: "Total number of Lambda responses by status");
            
        private static readonly Counter<long> _helloWorldCounter = _meter.CreateCounter<long>(
            "hello_world_requests_total",
            description: "Total number of hello world requests");
        /// <summary>
        /// A simple function that takes a string and does a ToUpper with OTEL metrics
        /// </summary>
        /// <param name="input"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public APIGatewayProxyResponse FunctionHandler(APIGatewayProxyRequest input, ILambdaContext context)
        {
            var startTime = DateTime.UtcNow;
            
            context.Logger.LogInformation($"Event: {JsonSerializer.Serialize(input)}");
            context.Logger.LogInformation($"Context: RequestId={context.AwsRequestId}, FunctionName={context.FunctionName}");

            // Emit invocation metric
            _invocationCounter.Add(1, new KeyValuePair<string, object?>("runtime", "dotnet"),
                                      new KeyValuePair<string, object?>("function_name", context.FunctionName),
                                      new KeyValuePair<string, object?>("function_version", context.FunctionVersion));
            
            // Emit hello world business metric
            _helloWorldCounter.Add(1, new KeyValuePair<string, object?>("runtime", "dotnet"));
            
            int statusCode = 200;
            string status = "success";
            
            try
            {
                var responseBody = new
                {
                    message = "Hello World from .NET Lambda!",
                    runtime = "dotnet",
                    timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                    requestId = context.AwsRequestId,
                    functionName = context.FunctionName,
                    functionVersion = context.FunctionVersion,
                    memoryLimitInMB = context.MemoryLimitInMB,
                    remainingTimeInMillis = context.RemainingTime.TotalMilliseconds,
                    otelEnabled = true
                };

                var response = new APIGatewayProxyResponse
                {
                    StatusCode = statusCode,
                    Headers = new Dictionary<string, string>
                    {
                        { "Content-Type", "application/json" }
                    },
                    Body = JsonSerializer.Serialize(responseBody)
                };

                context.Logger.LogInformation($"Response: {JsonSerializer.Serialize(response)}");
                
                // Emit metrics after successful processing
                var duration = (DateTime.UtcNow - startTime).TotalSeconds;
                _durationHistogram.Record(duration, new KeyValuePair<string, object?>("runtime", "dotnet"),
                                                   new KeyValuePair<string, object?>("function_name", context.FunctionName),
                                                   new KeyValuePair<string, object?>("status", status));
                
                _statusCounter.Add(1, new KeyValuePair<string, object?>("runtime", "dotnet"),
                                     new KeyValuePair<string, object?>("function_name", context.FunctionName),
                                     new KeyValuePair<string, object?>("status", status));
                
                return response;
            }
            catch (Exception ex)
            {
                context.Logger.LogError($"Error processing request: {ex.Message}");
                
                statusCode = 500;
                status = "error";
                
                // Emit error metrics
                var duration = (DateTime.UtcNow - startTime).TotalSeconds;
                _durationHistogram.Record(duration, new KeyValuePair<string, object?>("runtime", "dotnet"),
                                                   new KeyValuePair<string, object?>("function_name", context.FunctionName),
                                                   new KeyValuePair<string, object?>("status", status));
                
                _statusCounter.Add(1, new KeyValuePair<string, object?>("runtime", "dotnet"),
                                     new KeyValuePair<string, object?>("function_name", context.FunctionName),
                                     new KeyValuePair<string, object?>("status", status));
                
                return new APIGatewayProxyResponse
                {
                    StatusCode = statusCode,
                    Headers = new Dictionary<string, string>
                    {
                        { "Content-Type", "application/json" }
                    },
                    Body = JsonSerializer.Serialize(new
                    {
                        error = "Internal server error",
                        runtime = "dotnet",
                        timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                        requestId = context.AwsRequestId
                    })
                };
            }
        }

        /// <summary>
        /// Alternative handler for direct invocation (non-API Gateway)
        /// </summary>
        /// <param name="input"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public object DirectHandler(object input, ILambdaContext context)
        {
            context.Logger.LogInformation($"Event: {JsonSerializer.Serialize(input)}");
            context.Logger.LogInformation($"Context: RequestId={context.AwsRequestId}, FunctionName={context.FunctionName}");

            var response = new
            {
                message = "Hello World from .NET Lambda!",
                runtime = "dotnet",
                timestamp = DateTime.UtcNow.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                requestId = context.AwsRequestId,
                functionName = context.FunctionName,
                functionVersion = context.FunctionVersion,
                memoryLimitInMB = context.MemoryLimitInMB,
                remainingTimeInMillis = context.RemainingTime.TotalMilliseconds
            };

            context.Logger.LogInformation($"Response: {JsonSerializer.Serialize(response)}");
            return response;
        }
    }
}
