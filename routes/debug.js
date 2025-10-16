var diagnostics = require('../tools/diagnostics.js')
var express = require('express')
var router = express.Router()

/** /debug - Configuration and OAuth flow diagnostics **/
router.get('/', function (req, res) {
  var configCheck = diagnostics.checkConfiguration()
  
  var html = `
    <html>
    <head>
      <title>OAuth2 Debug Information</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .status-success { color: green; }
        .status-warning { color: orange; }
        .status-error { color: red; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        pre { background: #f5f5f5; padding: 10px; overflow-x: auto; }
        ul { margin: 10px 0; }
        li { margin: 5px 0; }
      </style>
    </head>
    <body>
      <h1>OAuth2 Configuration Diagnostics</h1>
      <a href="/">← Back to Home</a>
      
      <div class="section">
        <h2>Configuration Status</h2>
        <ul>
          <li>Client ID: <strong>${configCheck.clientId}</strong></li>
          <li>Client Secret: <strong>${configCheck.clientSecret}</strong></li>
          <li>Redirect URI: <strong>${configCheck.redirectUri}</strong></li>
        </ul>
      </div>
      
      <div class="section">
        <h2>OAuth Scopes</h2>
        <h3>Connect to QuickBooks:</h3>
        <ul>
          ${configCheck.scopes.connect_to_quickbooks ? 
            configCheck.scopes.connect_to_quickbooks.map(scope => `<li>${scope}</li>`).join('') :
            '<li style="color: red;">No scopes configured</li>'
          }
        </ul>
        
        <h3>Sign In with Intuit:</h3>
        <ul>
          ${configCheck.scopes.sign_in_with_intuit ? 
            configCheck.scopes.sign_in_with_intuit.map(scope => `<li>${scope}</li>`).join('') :
            '<li style="color: red;">No scopes configured</li>'
          }
        </ul>
      </div>
      
      ${configCheck.issues.length > 0 ? `
      <div class="section status-error">
        <h2>❌ Configuration Issues</h2>
        <ul>
          ${configCheck.issues.map(issue => `<li>${issue}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      ${configCheck.recommendations.length > 0 ? `
      <div class="section status-warning">
        <h2>💡 Recommendations</h2>
        <ul>
          ${configCheck.recommendations.map(rec => `<li>${rec}</li>`).join('')}
        </ul>
      </div>
      ` : ''}
      
      <div class="section">
        <h2>Troubleshooting Steps</h2>
        <ol>
          <li>Verify your OAuth app is configured correctly in the <a href="https://developer.intuit.com" target="_blank">Intuit Developer Dashboard</a></li>
          <li>Ensure the redirect URI matches exactly (including http/https and port)</li>
          <li>Check that QuickBooks API access is enabled for your app</li>
          <li>Confirm scopes include <code>com.intuit.quickbooks.accounting</code></li>
          <li>Use the "Connect to QuickBooks" button, not just "Sign In with Intuit"</li>
          <li>Make sure to grant company access during authorization</li>
        </ol>
      </div>
      
      <div class="section">
        <h2>Raw Configuration</h2>
        <pre>${JSON.stringify(configCheck, null, 2)}</pre>
      </div>
    </body>
    </html>
  `
  
  res.send(html)
})

module.exports = router