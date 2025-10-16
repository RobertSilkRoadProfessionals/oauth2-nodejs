var tools = require('../tools/tools.js')
var jwt = require('../tools/jwt.js')
var diagnostics = require('../tools/diagnostics.js')
var express = require('express')
var router = express.Router()

/** /callback **/
router.get('/', function (req, res) {
  // Generate comprehensive diagnostic report
  var diagnosticReport = diagnostics.generateReport(req)
  console.log('=== OAuth2 Callback Diagnostics ===')
  console.log(JSON.stringify(diagnosticReport, null, 2))
  
  // Debug: Log all query parameters
  console.log('Callback received with query parameters:', req.query)
  console.log('Full callback URL:', req.originalUrl)
  
  // Verify anti-forgery
  if(!tools.verifyAntiForgery(req.session, req.query.state)) {
    return res.send('Error - invalid anti-forgery CSRF response!')
  }

  // Check diagnostic results
  var analysis = diagnosticReport.callbackAnalysis
  if (analysis.diagnosis.status === 'error') {
    console.log('CALLBACK ERROR:', analysis.diagnosis.issues.join(', '))
    return res.send('OAuth Error: ' + analysis.diagnosis.issues.join(', '))
  }

  // Check if realmId is present (required for QuickBooks API calls)
  if (!req.query.realmId) {
    console.log('⚠️  WARNING: realmId not found in callback.')
    console.log('Available query parameters:', Object.keys(req.query))
    console.log('Recommendations:')
    analysis.diagnosis.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`)
    })
  } else {
    console.log('✅ RealmId successfully received:', req.query.realmId)
  }

  // Exchange auth code for access token
  tools.intuitAuth.code.getToken(req.originalUrl).then(function (token) {
    // Store token - this would be where tokens would need to be
    // persisted (in a SQL DB, for example).
    tools.saveToken(req.session, token)
    
    // Only set realmId if it exists
    if (req.query.realmId) {
      req.session.realmId = req.query.realmId
      console.log('Successfully stored realmId:', req.query.realmId)
    } else {
      console.log('No realmId received - this may limit API functionality')
      req.session.realmId = null
    }

    var errorFn = function(e) {
      console.log('Invalid JWT token!')
      console.log(e)
      res.redirect('/')
    }

    if(token.data.id_token) {
      try {
        // We should decode and validate the ID token
        jwt.validate(token.data.id_token, function() {
          // Callback function - redirect to /connected
          res.redirect('connected')
        }, errorFn)
      } catch (e) {
        errorFn(e)
      }
    } else {
      // Redirect to /connected
      res.redirect('connected')
    }
  }, function (err) {
    console.log(err)
    res.send(err)
  })
})

module.exports = router
