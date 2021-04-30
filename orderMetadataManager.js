'use strict'

const AWS = require('aws-sdk')
const dynamoDb = new AWS.DynamoDB.DocumentClient();

/*
  order : {
      orderID: String,
      name: String,
      address: String,
      description: String,
      delivery_status: READY_FOR_DELIVERY / DELIVERY
      timestamp: timestamp
  }
 */

module.exports.saveCompletedOrder = order => {
    console.log('Save request that was  called!');

    order.delivery_status = 'READY_FOR_DELIVERY';

    const params = {
        TableName : process.env.COMPLETED_ORDER_TABLE,
        Item: order
    };

    return dynamoDb.put(params, error => {
        if(error) {
            console.log(error)
        }
    }).promise();
};

module.exports.deliveryOrder = orderId => {
    console.log('DeliveryOrder it was call!')
    const params = {
		TableName: process.env.COMPLETED_ORDER_TABLE,
		Key: {
			orderId
		},
		ConditionExpression: 'attribute_exists(orderId)',
		UpdateExpression: 'set delivery_status = :v',
		ExpressionAttributeValues: {
			':v': 'DELIVERED'
		},
		ReturnValues: 'ALL_NEW'
    };
    
    return dynamoDb
		.update(params)
		.promise()
		.then(response => {
            console.log('order delivered');
			return response.Attributes;
		});
};

module.exports.getOrder = orderId => {
	console.log('getOrder it was call!');

	const params = {
		TableName: process.env.COMPLETED_ORDER_TABLE,
		Key: {
			orderId
		}
	};

	return dynamoDb
		.get(params)
		.promise()
		.then(item => {
			return item.Item;
		});
};