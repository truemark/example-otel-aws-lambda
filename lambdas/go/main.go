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
}

// Handler is the Lambda function handler
func Handler(ctx context.Context, request events.APIGatewayV2HTTPRequest) (Response, error) {
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
	}

	// Convert response body to JSON
	bodyJSON, err := json.Marshal(responseBody)
	if err != nil {
		log.Printf("Error marshaling response body: %v", err)
		return Response{
			StatusCode: 500,
			Headers: map[string]string{
				"Content-Type": "application/json",
			},
			Body: `{"error": "Internal server error"}`,
		}, err
	}

	// Create HTTP response
	response := Response{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type": "application/json",
		},
		Body: string(bodyJSON),
	}

	// Log the response
	responseJSON, _ := json.Marshal(response)
	log.Printf("Response: %s", string(responseJSON))

	return response, nil
}

func main() {
	lambda.Start(Handler)
}
