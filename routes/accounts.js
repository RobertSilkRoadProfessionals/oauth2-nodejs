var tools = require('../tools/tools.js')
var config = require('../config.json')
var request = require('request')
var express = require('express')
var router = express.Router()

/** /accounts - Get list of accounts for debugging purchase API calls **/
router.get('/', function (req, res) {
  var token = tools.getToken(req.session)
  if (!token) return res.json({ error: 'Not authorized' })
  if (!req.session.realmId) return res.json({
    error: 'No realm ID. QBO calls only work if the accounting scope was passed!'
  })

  // Query for accounts
  var url = config.api_uri + req.session.realmId + "/query?query=SELECT * FROM Account";// WHERE AccountType='Expense' OR AccountType='Credit Card' OR AccountType='Bank'"
  console.log('Querying accounts: ' + url)
  
  var requestObj = {
    url: url,
    headers: {
      'Authorization': 'Bearer ' + token.accessToken,
      'Accept': 'application/json'
    }
  }

  request(requestObj, function (err, response) {
    tools.checkForUnauthorized(req, requestObj, err, response).then(function ({ err, response }) {
      if (err || response.statusCode != 200) {
        console.log('Error querying accounts:', err, response.statusCode)
        return res.json({ error: err, statusCode: response.statusCode, body: response.body })
      }

      try {
        var data = JSON.parse(response.body)
        var accounts = data.QueryResponse.Account || []
        
        // Format for easier reading
        var accountList = accounts.map(account => ({
          id: account.Id,
          name: account.Name,
          type: account.AccountType,
          subType: account.AccountSubType
        }))
        
        res.json({
          message: 'Use these account IDs in your purchase API calls',
          totalAccounts: accountList.length,
          accounts: accountList
        })
      } catch (parseError) {
        console.log('Error parsing accounts response:', parseError)
        res.json({ error: 'Failed to parse response', body: response.body })
      }
    }, function (err) {
      console.log('Authorization error:', err)
      return res.json({ error: 'Authorization error', details: err })
    })
  })
})

/** /items - Get list of items for debugging purchase API calls **/
router.get('/items', function (req, res) {
  var token = tools.getToken(req.session)
  if (!token) return res.json({ error: 'Not authorized' })
  if (!req.session.realmId) return res.json({
    error: 'No realm ID. QBO calls only work if the accounting scope was passed!'
  })

  // Query for items
  var url = config.api_uri + req.session.realmId + "/query?query=SELECT * FROM Item" // WHERE Type='Service' OR Type='Inventory' OR Type='NonInventory'"
  console.log('Querying items: ' + url)
  
  var requestObj = {
    url: url,
    headers: {
      'Authorization': 'Bearer ' + token.accessToken,
      'Accept': 'application/json'
    }
  }

  request(requestObj, function (err, response) {
    tools.checkForUnauthorized(req, requestObj, err, response).then(function ({ err, response }) {
      if (err || response.statusCode != 200) {
        console.log('Error querying items:', err, response.statusCode)
        return res.json({ error: err, statusCode: response.statusCode, body: response.body })
      }

      try {
        var data = JSON.parse(response.body)
        var items = data.QueryResponse.Item || []
        
        // Format for easier reading
        var itemList = items.map(item => ({
          id: item.Id,
          sku: item.Sku,
          name: item.Name,
          type: item.Type,
          qtyOnHand: item.QtyOnHand,
          expenseAccountRef: item.ExpenseAccountRef,
          incomeAccountRef: item.IncomeAccountRef
        }))
        
        res.json({
          message: 'Available items - check ExpenseAccountRef for purchase compatibility',
          totalItems: itemList.length,
          items: itemList
        })
      } catch (parseError) {
        console.log('Error parsing items response:', parseError)
        res.json({ error: 'Failed to parse response', body: response.body })
      }
    }, function (err) {
      console.log('Authorization error:', err)
      return res.json({ error: 'Authorization error', details: err })
    })
  })
})

/** /classes - Get list of classes for debugging purchase API calls **/
router.get('/classes', function (req, res) {
  var token = tools.getToken(req.session)
  if (!token) return res.json({ error: 'Not authorized' })
  if (!req.session.realmId) return res.json({
    error: 'No realm ID. QBO calls only work if the accounting scope was passed!'
  })

  // Query for classes
  var url = config.api_uri + req.session.realmId + "/query?query=SELECT * FROM Class"
  console.log('Querying classes: ' + url)
  
  var requestObj = {
    url: url,
    headers: {
      'Authorization': 'Bearer ' + token.accessToken,
      'Accept': 'application/json'
    }
  }

  request(requestObj, function (err, response) {
    tools.checkForUnauthorized(req, requestObj, err, response).then(function ({ err, response }) {
      if (err || response.statusCode != 200) {
        console.log('Error querying classes:', err, response.statusCode)
        return res.json({ error: err, statusCode: response.statusCode, body: response.body })
      }

      try {
        var data = JSON.parse(response.body)
        var classes = data.QueryResponse.Class || []
        
        // Format for easier reading
        var classList = classes.map(cls => ({
          id: cls.Id,
          name: cls.Name,
          active: cls.Active,
          fullyQualifiedName: cls.FullyQualifiedName
        }))
        
        res.json({
          message: 'Available classes - use these IDs in ClassRef',
          totalClasses: classList.length,
          classes: classList
        })
      } catch (parseError) {
        console.log('Error parsing classes response:', parseError)
        res.json({ error: 'Failed to parse response', body: response.body })
      }
    }, function (err) {
      console.log('Authorization error:', err)
      return res.json({ error: 'Authorization error', details: err })
    })
  })
})

module.exports = router