#!/usr/bin/env node

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Paths
const API_SPEC_URL = 'http://localhost:3000/swagger/v1/swagger.yaml';
const OUTPUT_PATH = path.join(__dirname, '../app/types/api.ts');

// Create types directory if it doesn't exist
const typesDir = path.join(__dirname, '../app/types');
if (!fs.existsSync(typesDir)) {
  fs.mkdirSync(typesDir, { recursive: true });
}

// Generate types using openapi-typescript
const command = `npx openapi-typescript ${API_SPEC_URL} -o ${OUTPUT_PATH}`;

console.log('🔄 Generating TypeScript types from OpenAPI spec...');
console.log(`📍 API Spec: ${API_SPEC_URL}`);
console.log(`📄 Output: ${OUTPUT_PATH}`);

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Error generating types:', error.message);
    console.error('Make sure the API server is running on http://localhost:3000');
    process.exit(1);
  }

  if (stderr) {
    console.error('⚠️ Warnings:', stderr);
  }

  console.log('✅ TypeScript types generated successfully!');
  
  // Add custom type helpers
  const customTypes = `
// Custom type helpers
export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: {
    current_page: number;
    total_pages: number;
    total_count: number;
    per_page: number;
  };
};

// Extract types from paths
export type LoginRequest = paths['/api/v1/auth/login']['post']['requestBody']['content']['application/json'];
export type LoginResponse = paths['/api/v1/auth/login']['post']['responses']['200']['content']['application/json'];

export type User = LoginResponse['user'];
export type Conversation = paths['/api/v1/conversations']['get']['responses']['200']['content']['application/json']['conversations'][0];
export type Message = paths['/api/v1/conversations/{id}']['get']['responses']['200']['content']['application/json']['messages'][0];
export type Broadcast = paths['/api/v1/broadcasts']['get']['responses']['200']['content']['application/json']['broadcasts'][0];
`;

  // Append custom types to the generated file
  fs.appendFileSync(OUTPUT_PATH, customTypes);
  
  console.log('📝 Added custom type helpers');
});