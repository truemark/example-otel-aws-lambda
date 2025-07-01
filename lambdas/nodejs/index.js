const { metrics } = require('@opentelemetry/api');

// Initialize metrics
const meter = metrics.getMeter('hello-world-nodejs', '1.0.0');

// Create metrics instruments
const invocationCounter = meter.createCounter('lambda_invocations_total', {
    description: 'Total number of Lambda function invocations'
});

const durationHistogram = meter.createHistogram('lambda_duration_seconds', {
    description: 'Lambda function execution duration in seconds'
});

const statusCounter = meter.createCounter('lambda_status_total', {
    description: 'Total number of Lambda responses by status'
});

const helloWorldCounter = meter.createCounter('hello_world_requests_total', {
    description: 'Total number of hello world requests'
});

exports.handler = async (event, context) => {
    const startTime = Date.now();
    
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    
    // Emit invocation metric
    invocationCounter.add(1, {
        runtime: 'nodejs',
        function_name: context.functionName,
        function_version: context.functionVersion
    });
    
    // Emit hello world business metric
    helloWorldCounter.add(1, {
        runtime: 'nodejs'
    });
    
    let statusCode = 200;
    let status = 'success';
    
    try {
        const response = {
            statusCode: statusCode,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Hello World from NodeJS Lambda!',
                runtime: 'nodejs',
                timestamp: new Date().toISOString(),
                requestId: context.requestId,
                functionName: context.functionName,
                functionVersion: context.functionVersion,
                otelEnabled: true
            }),
        };
        
        console.log('Response:', JSON.stringify(response, null, 2));
        
        // Emit metrics after successful processing
        const duration = (Date.now() - startTime) / 1000;
        durationHistogram.record(duration, {
            runtime: 'nodejs',
            function_name: context.functionName,
            status: status
        });
        
        statusCounter.add(1, {
            runtime: 'nodejs',
            function_name: context.functionName,
            status: status
        });
        
        return response;
        
    } catch (error) {
        console.error('Error processing request:', error);
        
        statusCode = 500;
        status = 'error';
        
        // Emit error metrics
        const duration = (Date.now() - startTime) / 1000;
        durationHistogram.record(duration, {
            runtime: 'nodejs',
            function_name: context.functionName,
            status: status
        });
        
        statusCounter.add(1, {
            runtime: 'nodejs',
            function_name: context.functionName,
            status: status
        });
        
        return {
            statusCode: statusCode,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                error: 'Internal server error',
                runtime: 'nodejs',
                timestamp: new Date().toISOString(),
                requestId: context.requestId
            }),
        };
    }
};
