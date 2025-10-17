var tools = require('../tools/tools.js')
var config = require('../config.json')
var request = require('request')
var express = require('express')
var router = express.Router()

/** /simple_purchase - Simplified purchase API call using minimal required fields **/
router.get('/', function (req, res) {
  var token = tools.getToken(req.session)
  if (!token) return res.json({ error: 'Not authorized' })
  if (!req.session.realmId) return res.json({
    error: 'No realm ID. QBO calls only work if the accounting scope was passed!'
  })

  // Set up API call with minimal required fields
  var url = config.api_uri + req.session.realmId + '/purchase'
  console.log('Making simplified POST API call to: ' + url)

  // Simplified purchase object - using only required fields
  var jsonBody = {
    'PaymentType': 'Cash', // Simplified payment type
    'AccountRef': {
      'value': '35' // Try a different account - this is often "Checking" in QB
    },
    'TotalAmt': 50.00,
    'Line': [
      {
        'Amount': 50.00,
        'DetailType': 'AccountBasedExpenseLineDetail',
        'AccountBasedExpenseLineDetail': {
          'AccountRef': {
            'value': '59' // This is often "Office Supplies" expense account
          }
        }
      }
    ]
  }

  var requestObj = {
    url: url,
    headers: {
      'Authorization': 'Bearer ' + token.accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonBody),
    method: 'POST'
  }

  console.log('Request body:', JSON.stringify(jsonBody, null, 2))

  // Make API call
  request(requestObj, function (err, response) {
    if (err) {
      console.log('Request error:', err)
      return res.json({ error: 'Request failed', details: err })
    }
    
    console.log('Response status:', response.statusCode)
    console.log('Response body:', response.body)
    
    tools.checkForUnauthorized(req, requestObj, err, response).then(function ({ err, response }) {
      if (err) {
        console.log('Authorization error:', err)
        return res.json({ error: 'Authorization error', details: err })
      }
      
      if (response.statusCode != 200) {
        console.log('API Error - Status:', response.statusCode)
        try {
          var errorBody = JSON.parse(response.body)
          return res.json({ 
            error: 'QuickBooks API Error', 
            statusCode: response.statusCode,
            qbError: errorBody,
            suggestion: 'Try /accounts endpoint to find valid account IDs'
          })
        } catch (parseError) {
          return res.json({ 
            error: 'API Error', 
            statusCode: response.statusCode, 
            body: response.body 
          })
        }
      }

      // API Call was a success!
      console.log('Simple purchase created successfully!')
      res.json(JSON.parse(response.body))
    }, function (err) {
      console.log('Unexpected error:', err)
      return res.json({ error: 'Unexpected error', details: err })
    })
  })
})

module.exports = router