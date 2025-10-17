var tools = require('../tools/tools.js')
var config = require('../config.json')
var request = require('request')
var express = require('express')
var router = express.Router()

/** POST /create_class - Create a new class in QuickBooks **/
router.post('/', function (req, res) {
  var token = tools.getToken(req.session)
  if (!token) return res.json({ error: 'Not authorized' })
  if (!req.session.realmId) return res.json({
    error: 'No realm ID. QBO calls only work if the accounting scope was passed!'
  })

  var className = req.body.className
  if (!className || className.trim() === '') {
    return res.json({ error: 'Class name is required' })
  }

  // Set up API call to create class
  var url = config.api_uri + req.session.realmId + '/class'
  console.log('Creating class via POST API call to: ' + url)

  var classData = {
    'Name': className.trim()
  }

  var requestObj = {
    url: url,
    headers: {
      'Authorization': 'Bearer ' + token.accessToken,
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(classData),
    method: 'POST'
  }

  console.log('Creating class with data:', JSON.stringify(classData, null, 2))

  request(requestObj, function (err, response) {
    if (err) {
      console.log('Request error:', err)
      return res.json({ error: 'Request failed', details: err })
    }
    
    console.log('Class creation response status:', response.statusCode)
    console.log('Class creation response body:', response.body)
    
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
            error: 'QuickBooks API Error creating class', 
            statusCode: response.statusCode,
            qbError: errorBody 
          })
        } catch (parseError) {
          return res.json({ 
            error: 'API Error creating class', 
            statusCode: response.statusCode, 
            body: response.body 
          })
        }
      }

      // Class creation was successful
      try {
        var responseData = JSON.parse(response.body)
        // For creation, QB returns the object directly in QueryResponse, not in an array
        var createdClass = responseData.QueryResponse ? responseData.QueryResponse.Class[0] : null
        
        // Alternative response format for creation
        if (!createdClass && responseData.Class) {
          createdClass = responseData.Class
        }
        
        if (createdClass) {
          console.log('Class created successfully:', createdClass.Id, createdClass.Name)
          res.json({
            success: true,
            classId: createdClass.Id,
            className: createdClass.Name,
            message: 'Class created successfully',
            fullResponse: responseData // Include for debugging
          })
        } else {
          console.log('Unexpected response format:', responseData)
          res.json({
            error: 'Unexpected response format from QuickBooks',
            responseData: responseData
          })
        }
      } catch (parseError) {
        console.log('Error parsing class creation response:', parseError)
        res.json({ 
          error: 'Failed to parse class creation response', 
          body: response.body 
        })
      }
    }, function (err) {
      console.log('Unexpected error:', err)
      return res.json({ error: 'Unexpected error creating class', details: err })
    })
  })
})

module.exports = router