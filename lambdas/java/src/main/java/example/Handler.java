package example;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

import io.opentelemetry.api.GlobalOpenTelemetry;
import io.opentelemetry.api.metrics.LongCounter;
import io.opentelemetry.api.metrics.DoubleHistogram;
import io.opentelemetry.api.metrics.Meter;
import io.opentelemetry.api.common.Attributes;
import io.opentelemetry.api.common.AttributeKey;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Handler for requests to Lambda function.
 * Uses ADOT layer for automatic OpenTelemetry configuration.
 */
public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final ObjectMapper objectMapper = new ObjectMapper();
    
    // Initialize metrics - ADOT layer will configure the global OpenTelemetry instance
    private static final Meter meter = GlobalOpenTelemetry.getMeter("hello-world-java");
    
    // Create metrics instruments
    private static final LongCounter invocationCounter = meter
        .counterBuilder("lambda_invocations_total")
        .setDescription("Total number of Lambda function invocations")
        .build();
        
    private static final DoubleHistogram durationHistogram = meter
        .histogramBuilder("lambda_duration_seconds")
        .setDescription("Lambda function execution duration in seconds")
        .build();
        
    private static final LongCounter statusCounter = meter
        .counterBuilder("lambda_status_total")
        .setDescription("Total number of Lambda responses by status")
        .build();
        
    private static final LongCounter helloWorldCounter = meter
        .counterBuilder("hello_world_requests_total")
        .setDescription("Total number of hello world requests")
        .build();
        
    // Attribute keys
    private static final AttributeKey<String> RUNTIME_KEY = AttributeKey.stringKey("runtime");
    private static final AttributeKey<String> FUNCTION_NAME_KEY = AttributeKey.stringKey("function_name");
    private static final AttributeKey<String> FUNCTION_VERSION_KEY = AttributeKey.stringKey("function_version");
    private static final AttributeKey<String> STATUS_KEY = AttributeKey.stringKey("status");

    public APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent input, final Context context) {
        long startTime = System.currentTimeMillis();
        
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("X-Custom-Header", "application/json");

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent()
                .withHeaders(headers);

        // Emit invocation metric
        invocationCounter.add(1, Attributes.of(
            RUNTIME_KEY, "java",
            FUNCTION_NAME_KEY, context.getFunctionName(),
            FUNCTION_VERSION_KEY, context.getFunctionVersion()
        ));
        
        // Emit hello world business metric
        helloWorldCounter.add(1, Attributes.of(RUNTIME_KEY, "java"));
        
        int statusCode = 200;
        String status = "success";

        try {
            // Log the incoming event
            context.getLogger().log("Event: " + objectMapper.writeValueAsString(input));
            context.getLogger().log("Context: RequestId=" + context.getAwsRequestId() + 
                                  ", FunctionName=" + context.getFunctionName());

            // Create response body
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("message", "Hello World from Java Lambda!");
            responseBody.put("runtime", "java");
            responseBody.put("timestamp", Instant.now().toString());
            responseBody.put("requestId", context.getAwsRequestId());
            responseBody.put("functionName", context.getFunctionName());
            responseBody.put("functionVersion", context.getFunctionVersion());
            responseBody.put("memoryLimitInMB", context.getMemoryLimitInMB());
            responseBody.put("remainingTimeInMillis", context.getRemainingTimeInMillis());
            responseBody.put("otelEnabled", true);

            String output = objectMapper.writeValueAsString(responseBody);
            
            context.getLogger().log("Response: " + output);
            
            // Emit metrics after successful processing
            double duration = (System.currentTimeMillis() - startTime) / 1000.0;
            durationHistogram.record(duration, Attributes.of(
                RUNTIME_KEY, "java",
                FUNCTION_NAME_KEY, context.getFunctionName(),
                STATUS_KEY, status
            ));
            
            statusCounter.add(1, Attributes.of(
                RUNTIME_KEY, "java",
                FUNCTION_NAME_KEY, context.getFunctionName(),
                STATUS_KEY, status
            ));
            
            return response
                    .withStatusCode(statusCode)
                    .withBody(output);
        } catch (JsonProcessingException e) {
            context.getLogger().log("Error processing JSON: " + e.getMessage());
            
            statusCode = 500;
            status = "error";
            
            // Emit error metrics
            double duration = (System.currentTimeMillis() - startTime) / 1000.0;
            durationHistogram.record(duration, Attributes.of(
                RUNTIME_KEY, "java",
                FUNCTION_NAME_KEY, context.getFunctionName(),
                STATUS_KEY, status
            ));
            
            statusCounter.add(1, Attributes.of(
                RUNTIME_KEY, "java",
                FUNCTION_NAME_KEY, context.getFunctionName(),
                STATUS_KEY, status
            ));
            
            return response
                    .withBody("{\"error\":\"Internal server error\",\"runtime\":\"java\",\"timestamp\":\"" + 
                             Instant.now().toString() + "\",\"requestId\":\"" + context.getAwsRequestId() + "\"}")
                    .withStatusCode(statusCode);
        }
    }

    /**
     * Alternative handler for direct invocation (non-API Gateway)
     */
    public Map<String, Object> handleDirectRequest(final Object input, final Context context) {
        try {
            // Log the incoming event
            context.getLogger().log("Event: " + objectMapper.writeValueAsString(input));
            context.getLogger().log("Context: RequestId=" + context.getAwsRequestId() + 
                                  ", FunctionName=" + context.getFunctionName());

            // Create response
            Map<String, Object> response = new HashMap<>();
            response.put("message", "Hello World from Java Lambda!");
            response.put("runtime", "java");
            response.put("timestamp", Instant.now().toString());
            response.put("requestId", context.getAwsRequestId());
            response.put("functionName", context.getFunctionName());
            response.put("functionVersion", context.getFunctionVersion());
            response.put("memoryLimitInMB", context.getMemoryLimitInMB());
            response.put("remainingTimeInMillis", context.getRemainingTimeInMillis());

            context.getLogger().log("Response: " + objectMapper.writeValueAsString(response));
            
            return response;
        } catch (JsonProcessingException e) {
            context.getLogger().log("Error processing JSON: " + e.getMessage());
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("error", "Internal server error");
            return errorResponse;
        }
    }
}
