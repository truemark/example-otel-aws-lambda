exports.handler = async (event, context) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    
    const response = {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: 'Hello World from NodeJS Lambda!',
            runtime: 'nodejs',
            timestamp: new Date().toISOString(),
            requestId: context.requestId,
            functionName: context.functionName,
            functionVersion: context.functionVersion
        }),
    };
    
    console.log('Response:', JSON.stringify(response, null, 2));
    return response;
};
