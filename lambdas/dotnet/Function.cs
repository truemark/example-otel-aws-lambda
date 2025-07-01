using System;
using System.Collections.Generic;
using System.Text.Json;
using Amazon.Lambda.Core;
using Amazon.Lambda.APIGatewayEvents;

// Assembly attribute to enable the Lambda function's JSON input to be converted into a .NET class.
[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace HelloWorldDotNet
{
    public class Function
    {
        /// <summary>
        /// A simple function that takes a string and does a ToUpper
        /// </summary>
        /// <param name="input"></param>
        /// <param name="context"></param>
        /// <returns></returns>
        public APIGatewayProxyResponse FunctionHandler(APIGatewayProxyRequest input, ILambdaContext context)
        {
            context.Logger.LogInformation($"Event: {JsonSerializer.Serialize(input)}");
            context.Logger.LogInformation($"Context: RequestId={context.AwsRequestId}, FunctionName={context.FunctionName}");

            var responseBody = new
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

            var response = new APIGatewayProxyResponse
            {
                StatusCode = 200,
                Headers = new Dictionary<string, string>
                {
                    { "Content-Type", "application/json" }
                },
                Body = JsonSerializer.Serialize(responseBody)
            };

            context.Logger.LogInformation($"Response: {JsonSerializer.Serialize(response)}");
            return response;
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
