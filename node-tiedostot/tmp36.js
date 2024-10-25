// Copyright (c) Microsoft. All rights reserved.
// Licensed under the MIT license.

'use strict';
// Define the objects you will be working with
const { Board, Thermometer } = require("johnny-five");
var device = require('azure-iot-device');

// Use factory function from AMQP-specific package
// Other options include HTTP (azure-iot-device-http) and MQTT (azure-iot-device-mqtt)
var clientFromConnectionString = require('azure-iot-device-amqp').clientFromConnectionString;

var location = process.env.DEVICE_LOCATION || 'Tyohuone';
var connectionString = process.env.IOTHUB_CONN || 'HostName=MikanIOThub.azure-devices.net;DeviceId=MikanArduinoUno;SharedAccessKey=o0s89pptvqCeaIDCr0v5Mw31Iro0rerWWaVKDlbN3yg=';

// Create an Azure IoT client that will manage the connection to your IoT Hub
// The client is created in the context of an Azure IoT device, which is why
// you use a device-specific connection string.
var client = clientFromConnectionString(connectionString);
var deviceId = device.ConnectionString.parse(connectionString).DeviceId;

// Create a Johnny-Five board instance to represent your Arduino Board
// Board is simply an abstraction of the physical hardware, whether is is a 
// Photon, Arduino, Raspberry Pi or other boards.
const board = new Board({ port: "COM7" });

// The board.on() executes the anonymous function when the 
// board reports back that it is initialized and ready.
board.on("ready", function () {
    console.log("Board connected...");
	
	// Use the board's `samplingInterval(ms)` to
	// control the actual MCU sampling rate.
	//
	// This will limit sampling of all Analog Input
	// and I2C sensors to once per second (1000 milliseconds)
	board.samplingInterval(1000);


    const thermometer = new Thermometer({
        controller: "TMP36",
        pin: "A0",
		freq: 60000
    });

    thermometer.on("change", () => {
        const { celsius, fahrenheit, kelvin } = thermometer;

        /*
        console.log("Thermometer");
        console.log("  celsius      : ", celsius);
        console.log("  fahrenheit   : ", fahrenheit);
        console.log("  kelvin       : ", kelvin);
        console.log("--------------------------------------");
        */

        var payload = JSON.stringify({
            deviceId: deviceId,
            location: location,
            celsius: celsius,
            fahrenheit: fahrenheit,
            kelvin: kelvin,
        });
        // Create the message based on the payload JSON
        var message = new device.Message(payload);
		message.contentType = 'application/json';
		message.contentEncoding = 'utf-8';
        // For debugging purposes, write out the message payload to the console
        console.log("Sending message: " + message.getData());
        // Send the message to Azure IoT Hub
        client.sendEvent(message, printResultFor('send'));
    });

});

// Helper function to print results in the console
function printResultFor(op) {
    return function printResult(err, res) {
        if (err) console.log(op + ' error: ' + err.toString());
        if (res && (res.statusCode !== 204)) console.log(op + ' status: ' + res.statusCode + ' ' + res.statusMessage);
    };
}