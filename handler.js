'use strict';
const uuid = require('uuid');
var AWS = require('aws-sdk');

const orderMetadataManager = require('./orderMetadataManager');

var sqs = new AWS.SQS({ region: process.env.REGION });
const QUEUE_URL = process.env.PENDING_ORDER_QUEUE;

module.exports.order = async (event) => {
  const orderId = uuid.v1();
  var statusCode = '';
  var message = '';

  const body = JSON.parse(event.body)

  const order = {
    orderId,
    name: body.name,
    address: body.address,
    description: body.description,
    timestamp: Date.now()
  }
  const params = {
    MessageBody: JSON.stringify(order),
    QueueUrl: QUEUE_URL
  }
  try {
    await sqs.sendMessage(params, function(err, data) {
      statusCode = (err) ? 500 : 200
      message = (err) ? err : { order, menssageId: data.MessageId }
    }).promise();
  } catch(e) {
    statusCode = 500;
    message = e;
  }

  return {
    statusCode: statusCode,
    body: JSON.stringify(message, null, 2)
  }
  
};

module.exports.prepateOrder = async (event) => {
  console.log('PreparateOrder it was call!');

  const order = JSON.parse(event.Records[0].body);
  try {
    await orderMetadataManager.saveCompletedOrder(order)
    return true
  }
  catch(e){
    return e.message
  }
};

module.exports.sendOrder = async (event) => {
  console.log('sendOrder it was call!')

  const record = event.Records[0];

  if(record.eventName === 'INSERT') {
    
    const orderId = record.dynamodb.Keys.orderId.S;
    try {
      await orderMetadataManager.deliveryOrder(orderId).then(response => {
        console.log(response)
        return response
      });
    
    } catch(e) {
      return e.message
    }

  } else {
    console.log('Is not a new record')
    return record
  }
};

module.exports.getOrderStatus = async (event) => {
  console.log('getOrderStatus it was call');
  var statusCode = '200';
  var message = '';

  const orderId = event.pathParameters && event.pathParameters.orderId;
  console.log(orderId)
	if (orderId !== null) {
    try {
      await orderMetadataManager
			.getOrder(orderId)
			.then(order => {
        statusCode = 200;
        message = { orderId, state: order.delivery_status }
			})
    } catch (e) {
      statusCode = 500;
      message = { message: e.message}
    }
	} else {
    statusCode = 500;
      message = { message: 'Order not found.' };
  }
  return {
    statusCode,
    body: JSON.stringify( message, null, 2 )
  };
};
