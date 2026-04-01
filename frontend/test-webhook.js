// Test script to check n8n webhook response structure
// Using built-in fetch (Node.js 18+)

async function testWebhook() {
  const webhookUrl = 'https://agents.flowsyntax.com/webhook/ff6d33b5-6184-4814-a945-efb3c5ac1052';
  
  // Sample resume data for testing
  const sampleData = {
    fileName: 'sample-resume.pdf',
    jobTitle: 'Software Developer',
    resumeUrl: 'https://example.com/sample-resume.pdf',
    pdfUrl: 'https://example.com/sample-resume.pdf',
    timestamp: new Date().toISOString(),
    analysisId: 'test-analysis-123',
    userId: 'test-user-456'
  };
  
  console.log('Testing n8n webhook with POST request...');
  console.log('URL:', webhookUrl);
  console.log('Sample data:', JSON.stringify(sampleData, null, 2));
  console.log('\n--- Making Request ---');
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sampleData)
    });
    
    console.log('Response Status:', response.status);
    console.log('Response Status Text:', response.statusText);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('\n--- Raw Response ---');
    console.log(responseText);
    
    // Try to parse as JSON
    try {
      const responseData = JSON.parse(responseText);
      console.log('\n--- Parsed JSON Response ---');
      console.log(JSON.stringify(responseData, null, 2));
      
      // Analyze the structure for ScoreDashboard mapping
      console.log('\n--- Response Structure Analysis ---');
      console.log('Available fields:', Object.keys(responseData));
      
      // Check for expected score fields
      const expectedFields = ['overall_score', 'skills_match', 'experience', 'formatting', 'keywords', 'analysis_summary', 'recommendations'];
      expectedFields.forEach(field => {
        if (responseData.hasOwnProperty(field)) {
          console.log(`✓ Found expected field: ${field} = ${responseData[field]}`);
        } else {
          console.log(`✗ Missing expected field: ${field}`);
        }
      });
      
    } catch (parseError) {
      console.log('\n--- Response is not valid JSON ---');
      console.log('Parse error:', parseError.message);
    }
    
  } catch (error) {
    console.error('\n--- Request Failed ---');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testWebhook().catch(console.error);

// Also test if fetch is available
console.log('Node.js version:', process.version);
console.log('Fetch available:', typeof fetch !== 'undefined');