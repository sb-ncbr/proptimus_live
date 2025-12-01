import { NextRequest, NextResponse } from 'next/server';

const ALPHA_FIND_URL = process.env.NEXT_PUBLIC_ALPHA_FIND_URL || "https://dev.af2.alphafind.dyn.cloud.e-infra.cz";

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const value = searchParams.get('value');

        if (!value) {
            return NextResponse.json({ error: 'Value parameter is required' }, { status: 400 });
        }

        // Make the request to the external API server-side (no CORS issues)
        const response = await fetch(`${ALPHA_FIND_URL}/api/input-hinting?value=${encodeURIComponent(value)}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
            },
        });

        if (!response.ok) {
            console.error('External API error:', response.status, response.statusText);
            return NextResponse.json(
                { error: `External API error: ${response.status} ${response.statusText}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Return the data with proper CORS headers
        return NextResponse.json(data, {
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Accept',
            },
        });
    } catch (error) {
        console.error('Proxy error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Handle preflight requests
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Accept',
        },
    });
}
