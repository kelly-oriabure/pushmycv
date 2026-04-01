import { NextRequest, NextResponse } from 'next/server';

const N8N_WEBHOOK_URL = process.env.N8N_PARSE_CV_WEBHOOK_URL;

export async function POST(req: NextRequest) {
    // TEMPORARILY COMMENTED OUT: n8n webhook call for UI testing
    // if (!N8N_WEBHOOK_URL) {
    //     console.error('N8N_PARSE_CV_WEBHOOK_URL is not set.');
    //     return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    // }

    try {
        // TEMPORARILY COMMENTED OUT: Forward the request body to n8n webhook
        // const n8nResponse = await fetch(N8N_WEBHOOK_URL, {
        //     method: 'POST',
        //     headers: {
        //         // Forward original content-type header to preserve boundary
        //         'Content-Type': req.headers.get('content-type')!,
        //     },
        //     body: req.body,
        // });

        // // Check if the response from n8n is ok
        // if (!n8nResponse.ok) {
        //     const errorBody = await n8nResponse.text();
        //     console.error('n8n webhook returned an error:', n8nResponse.status, errorBody);
        //     return NextResponse.json({ error: 'Failed to parse CV via webhook' }, { status: n8nResponse.status });
        // }

        // // Return the successful response from n8n to the client
        // const data = await n8nResponse.json();
        // return NextResponse.json(data);
        
        // MOCK RESPONSE for UI testing
        console.log('Using mock parse-cv response for UI testing');
        const mockData = {
            success: true,
            message: 'Mock CV parsing response - webhook temporarily disabled for UI testing',
            parsedData: {
                name: 'John Doe',
                email: 'john.doe@example.com',
                phone: '+1-555-0123',
                experience: 'Software Developer with 5 years experience',
                skills: ['JavaScript', 'React', 'Node.js', 'Python']
            }
        };
        return NextResponse.json(mockData);

    } catch (error: any) {
        console.error('Error in parse-cv mock response:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}