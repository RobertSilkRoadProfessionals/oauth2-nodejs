var tools = require('../tools/tools.js')
var config = require('../config.json')
var request = require('request')
var express = require('express')
var router = express.Router()

/** /api_call **/
router.get('/', function (req, res) {
  var token = tools.getToken(req.session)
  if (!token) return res.json({ error: 'Not authorized' })
  if (!req.session.realmId) return res.json({
    error: 'No realm ID.  QBO calls only work if the accounting scope was passed!'
  })

  // Set up API call (with OAuth2 accessToken)
  var url = config.api_uri + req.session.realmId + '/purchase';
  console.log('Making POST API call to: ' + url);

  // Updated purchase object using AccountBasedExpenseLineDetail for better compatibility
  var jsonBody = {
    'AccountRef': {
      'value': '41',
      'name': 'Mastercard'
    },
    'PaymentType': 'CreditCard',
    'TxnDate': '2025-10-17', // Updated to current date
    'TxnSource': 'Node.js OAuth2 Sample',
    'PrivateNote': 'Purchase transaction created via API - Office supplies',
    'TotalAmt': 104.00, // Updated to match line amount
    // 'VendorRef': { // VendorRef isn't accepted
    //   'value': '56',
    //   'name': 'Office Supplies Co.'
    // },
    // 'CurrencyRefType': { // This is only required for multi-currency companies. Otherwise, it will cause an error.
    //   'value': 'USD',
    //   'name': 'United States Dollar'
    // },
    // 'Credit': true, // Uncomment this line to make it a credit (refund) instead of a purchase
    // 'TxnTaxDetail': { // optionally specify tax details
    //   'TxnTaxCodeRef': {
    //       'value': '2',
    //       'name': 'TAX'
    //   },
    //     'TotalTax': 0.00,
    //     'TaxLine': []
    // },
    // 'PaymentMethodRef': { // optionally specify a payment method
    //     'value': '4',
    //     'name': 'Visa'
    // },
    // 'LinkedTxn': [ // This may be needed to link to a Bill or other transaction, used for refunds
    //     {
    //         'TxnId': '123',
    //         'TxnType': 'Bill',
    //         'TxnLineId': '1'
    //     },
    //     {
    //         'TxnId': '456',
    //         'TxnType': 'Bill',
    //         'TxnLineId': '5'
    //     }
    // ],
    'Line': [
      {
        'Amount': 104.00,
        'DetailType': 'ItemBasedExpenseLineDetail',
        'Description': 'ItemBasedExpenseLineDetail PO:12345 - office supplies',
        'ItemBasedExpenseLineDetail': {
          'ItemRef': {
            'value': '1',
            'name': 'Office Supplies'
          }
        }
      }
    ]
    // 'Line': [ // use if Preferences.ProductAndServicesPrefs.ForPurchase is set to true
    //   {
    //     //'LineNum': 1, // maybe use to ensure that the lines stay in order
    //     'Amount': 169.12,
    //     'DetailType': 'ItemBasedExpenseLineDetail',
    //     'Description': 'Item PO:12345 - office supplies',
    //     'PaymentType': 'CreditCard',
    //     'AccountRef': {
    //       'value': '41',
    //       'name': 'Mastercard'
    //     },
    //     // 'CurrencyRef': { // required if multi-currency is enabled
    //     //   'value': 'USD',
    //     //   'name': 'United States Dollar'
    //     // },
    //     // 'TxnDate': '2025-10-17',
    //     // 'TxnId': '12345',
    //     // 'TxnType': 'Purchase',

    //     'ItemBasedExpenseLineDetail': {
    //       'ItemRef': {
    //         'value': '1',
    //         'name': 'Office Supplies'
    //       },
    //       // 'TaxCodeRef': {
    //       //   'value': '2',
    //       //   'name': 'TAX'
    //       // },
    //       // 'CustomerRef': {
    //       //   'value': '1',
    //       //   'name': 'John Doe'
    //       // }
    //       //}
    //     }
    //   }
    // ]
  };

  var requestObj = {
    url: url,
    headers: {
      'Authorization': 'Bearer ' + token.accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(jsonBody),
    method: 'POST'
  };


  // Make API call
  request(requestObj, function (err, response) {
    // Enhanced error logging
    if (err) {
      console.log('Request error:', err);
      return res.json({ error: 'Request failed', details: err });
    }
    
    console.log('Response status:', response.statusCode);
    console.log('Response body:', response.body);
    
    // Check if 401 response was returned - refresh tokens if so!
    tools.checkForUnauthorized(req, requestObj, err, response).then(function ({ err, response }) {
      if (err) {
        console.log('Authorization error:', err);
        return res.json({ error: 'Authorization error', details: err });
      }
      
      if (response.statusCode != 200) {
        console.log('API Error - Status:', response.statusCode);
        console.log('API Error - Body:', response.body);
        
        // Try to parse the error response for better debugging
        try {
          var errorBody = JSON.parse(response.body);
          return res.json({ 
            error: 'QuickBooks API Error', 
            statusCode: response.statusCode,
            qbError: errorBody 
          });
        } catch (parseError) {
          return res.json({ 
            error: 'API Error', 
            statusCode: response.statusCode, 
            body: response.body 
          });
        }
      }

      // API Call was a success!
      console.log('Purchase created successfully!');
      res.json(JSON.parse(response.body));
    }, function (err) {
      console.log('Unexpected error:', err);
      return res.json({ error: 'Unexpected error', details: err });
    });
  });
})

// /** /api_call/revoke **/
// router.get('/revoke', function (req, res) {
//   var token = tools.getToken(req.session)
//   if(!token) return res.json({error: 'Not authorized'})

//   var url = tools.revoke_uri
//   request({
//     url: url,
//     method: 'POST',
//     headers: {
//       'Authorization': 'Basic ' + tools.basicAuth,
//       'Accept': 'application/json',
//       'Content-Type': 'application/json'
//     },
//     body: JSON.stringify({
//       'token': token.accessToken
//     })
//   }, function (err, response, body) {
//     if(err || response.statusCode != 200) {
//       return res.json({error: err, statusCode: response.statusCode})
//     }
//     tools.clearToken(req.session)
//     res.json({response: "Revoke successful"})
//   })
// })

// /** /api_call/refresh **/
// // Note: typical use case would be to refresh the tokens internally (not an API call)
// // We recommend refreshing upon receiving a 401 Unauthorized response from Intuit.
// // A working example of this can be seen above: `/api_call`
// router.get('/refresh', function (req, res) {
//   var token = tools.getToken(req.session)
//   if(!token) return res.json({error: 'Not authorized'})

//   tools.refreshTokens(req.session).then(function(newToken) {
//     // We have new tokens!
//     res.json({
//       accessToken: newToken.accessToken,
//       refreshToken: newToken.refreshToken
//     })
//   }, function(err) {
//     // Did we try to call refresh on an old token?
//     console.log(err)
//     res.json(err)
//   })
// })

module.exports = router
