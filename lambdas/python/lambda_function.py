import json
import datetime
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    AWS Lambda function handler for Python Hello World
    """
    logger.info(f"Event: {json.dumps(event)}")
    logger.info(f"Context: {vars(context)}")
    
    response_body = {
        "message": "Hello World from Python Lambda!",
        "runtime": "python",
        "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "requestId": context.aws_request_id,
        "functionName": context.function_name,
        "functionVersion": context.function_version,
        "memoryLimitInMB": context.memory_limit_in_mb,
        "remainingTimeInMillis": context.get_remaining_time_in_millis()
    }
    
    response = {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json"
        },
        "body": json.dumps(response_body)
    }
    
    logger.info(f"Response: {json.dumps(response)}")
    return response
