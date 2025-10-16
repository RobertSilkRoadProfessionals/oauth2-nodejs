/**
 * Diagnostics helper for OAuth2 flow debugging
 */

var config = require('../config.json')

var Diagnostics = function() {
  
  /**
   * Analyze callback parameters and provide diagnostic information
   */
  this.analyzeCallback = function(req) {
    var analysis = {
      timestamp: new Date().toISOString(),
      originalUrl: req.originalUrl,
      queryParams: req.query,
      hasCode: !!req.query.code,
      hasState: !!req.query.state,
      hasRealmId: !!req.query.realmId,
      sessionInfo: {
        hasSession: !!req.session,
        sessionKeys: req.session ? Object.keys(req.session) : []
      }
    }
    
    // Detailed analysis
    analysis.diagnosis = this.diagnoseCallback(analysis)
    
    return analysis
  }
  
  /**
   * Provide diagnosis based on callback analysis
   */
  this.diagnoseCallback = function(analysis) {
    var diagnosis = {
      status: 'unknown',
      issues: [],
      recommendations: []
    }
    
    if (!analysis.hasCode) {
      diagnosis.status = 'error'
      diagnosis.issues.push('Authorization code missing from callback')
      diagnosis.recommendations.push('Check if user completed OAuth authorization')
    }
    
    if (!analysis.hasState) {
      diagnosis.status = 'error'
      diagnosis.issues.push('State parameter missing (CSRF protection)')
      diagnosis.recommendations.push('Check anti-forgery token generation')
    }
    
    if (!analysis.hasRealmId) {
      diagnosis.status = 'warning'
      diagnosis.issues.push('RealmId missing from callback')
      diagnosis.recommendations.push('Ensure user is using "Connect to QuickBooks" flow')
      diagnosis.recommendations.push('Verify OAuth app has QuickBooks API access enabled')
      diagnosis.recommendations.push('Check that accounting scopes are requested')
      diagnosis.recommendations.push('Confirm user granted company access during authorization')
    }
    
    if (analysis.hasCode && analysis.hasState && analysis.hasRealmId) {
      diagnosis.status = 'success'
      diagnosis.issues.push('All required parameters present')
    }
    
    return diagnosis
  }
  
  /**
   * Check OAuth configuration
   */
  this.checkConfiguration = function() {
    var configCheck = {
      timestamp: new Date().toISOString(),
      clientId: config.clientId ? 'present' : 'missing',
      clientSecret: config.clientSecret ? 'present' : 'missing',
      redirectUri: config.redirectUri,
      scopes: config.scopes,
      issues: [],
      recommendations: []
    }
    
    if (!config.clientId) {
      configCheck.issues.push('Client ID is missing')
      configCheck.recommendations.push('Add clientId to config.json')
    }
    
    if (!config.clientSecret) {
      configCheck.issues.push('Client Secret is missing')  
      configCheck.recommendations.push('Add clientSecret to config.json')
    }
    
    if (!config.redirectUri) {
      configCheck.issues.push('Redirect URI is missing')
      configCheck.recommendations.push('Add redirectUri to config.json')
    }
    
    if (!config.scopes || !config.scopes.connect_to_quickbooks) {
      configCheck.issues.push('QuickBooks scopes not configured')
      configCheck.recommendations.push('Ensure connect_to_quickbooks scopes include accounting scope')
    }
    
    // Check if QuickBooks scopes are present
    var qbScopes = config.scopes.connect_to_quickbooks || []
    if (!qbScopes.includes('com.intuit.quickbooks.accounting')) {
      configCheck.issues.push('Missing QuickBooks accounting scope')
      configCheck.recommendations.push('Add "com.intuit.quickbooks.accounting" to connect_to_quickbooks scopes')
    }
    
    return configCheck
  }
  
  /**
   * Generate a comprehensive report
   */
  this.generateReport = function(req) {
    return {
      callbackAnalysis: this.analyzeCallback(req),
      configurationCheck: this.checkConfiguration(),
      troubleshootingSteps: [
        'Verify OAuth app configuration in Intuit Developer dashboard',
        'Ensure redirect URI matches exactly (including http/https)',
        'Check that QuickBooks API access is enabled for your app',
        'Confirm scopes include com.intuit.quickbooks.accounting',
        'Test with "Connect to QuickBooks" button, not "Sign In"',
        'Check browser console for any JavaScript errors',
        'Review server logs for additional error details'
      ]
    }
  }
}

module.exports = new Diagnostics()