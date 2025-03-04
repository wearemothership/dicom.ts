import { describe, it, expect } from 'vitest'
const { readFileSync } = require('fs');
const { resolve } = require('path');

describe('UMD Build', () => {
  it('should have the correct global variable name and UMD structure', () => {
    const umdContent = readFileSync(resolve(__dirname, '../dist/index.umd.cjs'), 'utf-8')
    
    // Check for the global variable declaration
    expect(umdContent).toContain('dicom.ts')
    
    // Check for essential UMD functionality without relying on specific formatting
    expect(umdContent).toMatch(/\(function\s*\([^)]*\)\s*\{/);  // Check for UMD wrapper function
    expect(umdContent).toMatch(/typeof\s+exports\s*==\s*["']object["']/);  // CommonJS check
    expect(umdContent).toMatch(/typeof\s+module\s*<\s*["']u["']/);  // CommonJS check
    expect(umdContent).toMatch(/typeof\s+define\s*==\s*["']function["']\s*&&\s*define\.amd/);  // AMD check
    expect(umdContent).toMatch(/K1\s*=\s*typeof\s+globalThis\s*<\s*["']u["']\s*\?\s*globalThis\s*:\s*K1\s*\|\|\s*self/);  // Global assignment
    
    // Check for external dependencies
    expect(umdContent).toContain('DicomCharacterSet')
    expect(umdContent).toContain('JpegLosslessDecoder')
    expect(umdContent).toContain('pako')
    expect(umdContent).toContain('sha1')
    expect(umdContent).toContain('twgl')
  })
})
