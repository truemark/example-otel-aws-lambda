package example;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

/**
 * Handler for requests to Lambda function.
 */
public class Handler implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {

    private final ObjectMapper objectMapper = new ObjectMapper();

    public APIGatewayProxyResponseEvent handleRequest(final APIGatewayProxyRequestEvent input, final Context context) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("X-Custom-Header", "application/json");

        APIGatewayProxyResponseEvent response = new APIGatewayProxyResponseEvent()
                .withHeaders(headers);

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

            String output = objectMapper.writeValueAsString(responseBody);
            
            context.getLogger().log("Response: " + output);
            
            return response
                    .withStatusCode(200)
                    .withBody(output);
        } catch (JsonProcessingException e) {
            context.getLogger().log("Error processing JSON: " + e.getMessage());
            return response
                    .withBody("{\"error\":\"Internal server error\"}")
                    .withStatusCode(500);
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
