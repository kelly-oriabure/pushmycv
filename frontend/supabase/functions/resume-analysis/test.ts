// Test script for resume-analysis edge function
// Run with: deno run --allow-net test.ts

const testEdgeFunction = async () => {
  const functionUrl = 'http://localhost:54329/functions/v1/resume-analysis'
  
  const testPayload = {
    analysisId: 'test-analysis-id-123',
    resumeUrl: 'https://example.com/test-resume.pdf',
    jobTitle: 'Software Developer',
    userId: 'test-user-id'
  }

  try {
    console.log('Testing edge function...')
    console.log('Payload:', JSON.stringify(testPayload, null, 2))
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE'
      },
      body: JSON.stringify(testPayload)
    })

    console.log('Response status:', response.status)
    
    const result = await response.json()
    console.log('Response body:', JSON.stringify(result, null, 2))
    
    if (response.ok) {
      console.log('✅ Test passed!')
    } else {
      console.log('❌ Test failed!')
    }
    
  } catch (error) {
    console.error('❌ Test error:', error)
  }
}

// Run the test
if (import.meta.main) {
  await testEdgeFunction()
}