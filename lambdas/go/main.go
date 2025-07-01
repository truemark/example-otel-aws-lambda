package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/aws/aws-lambda-go/lambda"
	"github.com/aws/aws-lambda-go/lambdacontext"
)

// Response represents the HTTP response structure
type Response struct {
	StatusCode int               `json:"statusCode"`
	Headers    map[string]string `json:"headers"`
	Body       string            `json:"body"`
}

// ResponseBody represents the JSON response body
type ResponseBody struct {
	Message         string `json:"message"`
	Runtime         string `json:"runtime"`
	Timestamp       string `json:"timestamp"`
	RequestID       string `json:"requestId"`
	FunctionName    string `json:"functionName"`
	FunctionVersion string `json:"functionVersion"`
	MemoryLimitMB   int32  `json:"memoryLimitInMB"`
	RemainingTimeMS int64  `json:"remainingTimeInMillis"`
	OtelEnabled     bool   `json:"otelEnabled"`
}

// Metrics counters (simple approach for ADOT collector)
var (
	invocationCount = 0
	successCount    = 0
	errorCount      = 0
)

// Handler is the Lambda function handler
func Handler(ctx context.Context, request events.APIGatewayV2HTTPRequest) (Response, error) {
	startTime := time.Now()

	// Increment invocation counter
	invocationCount++

	// Log the incoming event
	eventJSON, _ := json.Marshal(request)
	log.Printf("Event: %s", string(eventJSON))

	// Get Lambda context information
	lc, _ := lambdacontext.FromContext(ctx)

	// Calculate remaining time from context deadline
	var remainingTimeMS int64
	if deadline, ok := ctx.Deadline(); ok {
		remainingTimeMS = int64(time.Until(deadline) / time.Millisecond)
	}

	// Log metrics for ADOT collector to pick up
	log.Printf("METRIC lambda_invocations_total{runtime=\"go\",function_name=\"%s\",function_version=\"%s\"} %d",
		lambdacontext.FunctionName, lambdacontext.FunctionVersion, invocationCount)
	log.Printf("METRIC hello_world_requests_total{runtime=\"go\"} %d", invocationCount)

	statusCode := 200
	status := "success"

	// Create response body
	responseBody := ResponseBody{
		Message:         "Hello World from Go Lambda!",
		Runtime:         "go",
		Timestamp:       time.Now().UTC().Format(time.RFC3339),
		RequestID:       lc.AwsRequestID,
		FunctionName:    lambdacontext.FunctionName,
		FunctionVersion: lambdacontext.FunctionVersion,
		MemoryLimitMB:   int32(lambdacontext.MemoryLimitInMB),
		RemainingTimeMS: remainingTimeMS,
		OtelEnabled:     true,
	}

	// Convert response body to JSON
	bodyJSON, err := json.Marshal(responseBody)
	if err != nil {
		log.Printf("Error marshaling response body: %v", err)

		statusCode = 500
		status = "error"
		errorCount++

		// Log error metrics
		duration := time.Since(startTime).Seconds()
		log.Printf("METRIC lambda_duration_seconds{runtime=\"go\",function_name=\"%s\",status=\"%s\"} %f",
			lambdacontext.FunctionName, status, duration)
		log.Printf("METRIC lambda_status_total{runtime=\"go\",function_name=\"%s\",status=\"%s\"} %d",
			lambdacontext.FunctionName, status, errorCount)

		return Response{
			StatusCode: statusCode,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: `{"error": "Internal server error", "runtime": "go", "otelEnabled": true}`,
		}, err
	}

	successCount++

	// Create HTTP response
	response := Response{
		StatusCode: statusCode,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(bodyJSON),
	}

	// Log the response
	responseJSON, _ := json.Marshal(response)
	log.Printf("Response: %s", string(responseJSON))

	// Log success metrics
	duration := time.Since(startTime).Seconds()
	log.Printf("METRIC lambda_duration_seconds{runtime=\"go\",function_name=\"%s\",status=\"%s\"} %f",
		lambdacontext.FunctionName, status, duration)
	log.Printf("METRIC lambda_status_total{runtime=\"go\",function_name=\"%s\",status=\"%s\"} %d",
		lambdacontext.FunctionName, status, successCount)

	return response, nil
}

func main() {
	lambda.Start(Handler)
}
