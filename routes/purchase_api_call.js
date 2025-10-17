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


  var jsonBody = {
    'AccountRef': {
      'value': '41',
      'name': 'Mastercard'
    },
    "EntityRef": {
      "value": "45",
      "name": "Office Depot",
      "type": "Vendor"
    },
    'PaymentType': 'CreditCard',
    "DocNumber": "EXP-2025-1016",
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
        //'LineNum': 1, // maybe use to ensure that the lines stay in order
        'Amount': 104.05,

        'DetailType': 'ItemBasedExpenseLineDetail',
        'Description': 'ItemBasedExpenseLineDetail - Cleaning Service for Airbnb',
        'ItemBasedExpenseLineDetail': {
          'Qty': 15,
          "BillableStatus": "NotBillable",
          "UnitPrice": 0.75,
          'ItemRef': { // must be an item set up for purchase
            // 'value': '11',
            // 'name': 'Pump'
            'value': '19',
            'name': '	Steam cleaning of residence'
          },
          'TaxCodeRef': {
            'value': '2',
            'name': 'TAX'
          },
          'CustomerRef': {
            'value': '1',
            //'name': 'John Doe'
          },
          // "ClassRef": { // Commented out until valid Class ID is found
          //   "value": "200", // This ID doesn't exist - use /accounts/classes to find valid IDs
          //   "name": "Admin Department"
          // }
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

module.exports = router
