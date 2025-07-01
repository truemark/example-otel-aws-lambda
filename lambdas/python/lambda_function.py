import json
import datetime
import logging
import time
from opentelemetry import metrics

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize metrics
meter = metrics.get_meter("hello-world-python", "1.0.0")

# Create metrics instruments
invocation_counter = meter.create_counter(
    "lambda_invocations_total",
    description="Total number of Lambda function invocations"
)

duration_histogram = meter.create_histogram(
    "lambda_duration_seconds",
    description="Lambda function execution duration in seconds"
)

status_counter = meter.create_counter(
    "lambda_status_total",
    description="Total number of Lambda responses by status"
)

hello_world_counter = meter.create_counter(
    "hello_world_requests_total",
    description="Total number of hello world requests"
)

def lambda_handler(event, context):
    """
    AWS Lambda function handler for Python Hello World with OTEL metrics
    """
    start_time = time.time()
    
    logger.info(f"Event: {json.dumps(event)}")
    logger.info(f"Context: {vars(context)}")
    
    # Emit invocation metric
    invocation_counter.add(1, {
        "runtime": "python",
        "function_name": context.function_name,
        "function_version": context.function_version
    })
    
    # Emit hello world business metric
    hello_world_counter.add(1, {
        "runtime": "python"
    })
    
    status_code = 200
    status = "success"
    
    try:
        response_body = {
            "message": "Hello World from Python Lambda!",
            "runtime": "python",
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "requestId": context.aws_request_id,
            "functionName": context.function_name,
            "functionVersion": context.function_version,
            "memoryLimitInMB": context.memory_limit_in_mb,
            "remainingTimeInMillis": context.get_remaining_time_in_millis(),
            "otelEnabled": True
        }
        
        response = {
            "statusCode": status_code,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps(response_body)
        }
        
        logger.info(f"Response: {json.dumps(response)}")
        
        # Emit metrics after successful processing
        duration = time.time() - start_time
        duration_histogram.record(duration, {
            "runtime": "python",
            "function_name": context.function_name,
            "status": status
        })
        
        status_counter.add(1, {
            "runtime": "python",
            "function_name": context.function_name,
            "status": status
        })
        
        return response
        
    except Exception as error:
        logger.error(f"Error processing request: {str(error)}")
        
        status_code = 500
        status = "error"
        
        # Emit error metrics
        duration = time.time() - start_time
        duration_histogram.record(duration, {
            "runtime": "python",
            "function_name": context.function_name,
            "status": status
        })
        
        status_counter.add(1, {
            "runtime": "python",
            "function_name": context.function_name,
            "status": status
        })
        
        return {
            "statusCode": status_code,
            "headers": {
                "Content-Type": "application/json"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "runtime": "python",
                "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
                "requestId": context.aws_request_id
            })
        }
