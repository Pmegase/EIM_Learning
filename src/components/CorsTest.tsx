// src/components/CorsTest.tsx
import React, { useState } from 'react';
import { apiClient } from '@/services/apiClient';
import { Button } from '@/components/ui/button';

export const CorsTest: React.FC = () => {
    const [status, setStatus] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const testConnection = async () => {
        setLoading(true);
        setStatus('Testing CORS connection...');

        try {
            const result = await apiClient.testCors();
            setStatus(`✅ CORS Test Successful: ${JSON.stringify(result)}`);
        } catch (error: any) {
            setStatus(`❌ CORS Test Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 border rounded bg-gray-50">
            <h3 className="text-lg font-bold mb-2">CORS Connection Test</h3>
            <Button
                onClick={testConnection}
                disabled={loading}
                variant="outline"
            >
                {loading ? 'Testing...' : 'Test CORS'}
            </Button>
            {status && (
                <pre className="mt-2 p-2 bg-white border rounded text-sm overflow-auto">
                    {status}
                </pre>
            )}
        </div>
    );
};