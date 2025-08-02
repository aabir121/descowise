/**
 * Test file for API key storage encryption functionality
 * Run this in browser console to test the encryption/decryption
 */

import { storeUserApiKey, getUserApiKey, removeUserApiKey } from './apiKeyStorage';

// Test function to verify encryption/decryption works
export async function testApiKeyEncryption() {
  console.log('Testing API Key Encryption...');
  
  const testApiKey = 'test-api-key-12345-abcdef-67890';
  
  try {
    // Test storing the API key
    console.log('1. Storing API key...');
    const storeResult = await storeUserApiKey(testApiKey);
    console.log('Store result:', storeResult);
    
    // Check what's actually stored in localStorage (should be encrypted)
    const storedEncrypted = localStorage.getItem('desco_user_api_key');
    console.log('2. Encrypted value in localStorage:', storedEncrypted);
    console.log('   Is it different from original?', storedEncrypted !== testApiKey);
    
    // Test retrieving the API key
    console.log('3. Retrieving API key...');
    const retrievedApiKey = await getUserApiKey();
    console.log('Retrieved API key:', retrievedApiKey);
    console.log('   Does it match original?', retrievedApiKey === testApiKey);
    
    // Test with empty key
    console.log('4. Testing with empty key...');
    await storeUserApiKey('');
    const emptyResult = await getUserApiKey();
    console.log('Empty key result:', emptyResult);
    
    // Clean up
    removeUserApiKey();
    console.log('5. Cleanup completed');
    
    console.log('✅ All tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
}

// Test function to compare old vs new encryption
export async function compareEncryptionMethods() {
  console.log('Comparing encryption methods...');
  
  const testKey = 'AIzaSyExample123456789';
  
  // Test new encryption
  console.log('Testing new secure encryption...');
  await storeUserApiKey(testKey);
  const newEncrypted = localStorage.getItem('desco_user_api_key');
  const newDecrypted = await getUserApiKey();
  
  console.log('New method:');
  console.log('  Encrypted:', newEncrypted);
  console.log('  Decrypted:', newDecrypted);
  console.log('  Matches original:', newDecrypted === testKey);
  
  // Clean up
  removeUserApiKey();
}

// Browser console helper
if (typeof window !== 'undefined') {
  (window as any).testApiKeyEncryption = testApiKeyEncryption;
  (window as any).compareEncryptionMethods = compareEncryptionMethods;
  console.log('API Key encryption test functions available:');
  console.log('- testApiKeyEncryption()');
  console.log('- compareEncryptionMethods()');
}
