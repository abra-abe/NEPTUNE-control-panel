const express = require('express');
const app = express();
const axios = require('axios');
const fs = require('fs');
const nodeWebcam = require('node-webcam');
const exifImage = require('node-exif').ExifImage;
const path = require('path');
const PORT = 7895;

// requiring and setting up serial port
const SerialPort = require('serialport');
const { ppid } = require('process');
const Readline = SerialPort.parsers.Readline;
const portName = '/dev/ttyUSB0';
const baudRate = 9600;

const arduinoPort = new SerialPort(portName, {baudRate});
const parser = new Readline({ delimeter: '\r\n' });
arduinoPort.pipe(parser);

// configuring parser
app.use(express.urlencoded({extended: true}));

//setting up capturing using node-webcam
app.use(express.static('images'))

    //specifying parameters for the pictures to be taken
var options = {
    width: 1280,
    height: 720,
    quality: 100,
    delay: 1,
    saveShots: true,
    output: 'jpeg',
    device: '/dev/video0',
    callbackReturn: 'location'
};

//creating an instance using the options created
var webcam = nodeWebcam.create(options)

//image capture function
var captureShot = (amount, i, name) => {
    return new Promise(reolve => {
        var path = `./images/${name}`;

        //creating a folder if it does not exist
        if(!fs.existsSync(path)) {
            fs.mkdirSync(path);
        }

        //capturing the image
        webcam.capture(`./images/${name}/${name}${i}.${options.output}`, (err, data) => {
            if(!err) {
                console.log('Image Created');
            }
            console.log(err);
            i++;
            if(i <= amount) {
                captureShot(amount, i, name);
            }
            // resolve('/images')
        })
    })
} 

// configuring the view engine
app.set('view-engine', 'ejs');

// routes
app.get('/control', (req, res) => {
    res.render('controlPanel.ejs')
})

app.post('/control/:input', async (req, res) => {
    const {input} = req.params;
    const {button} = req.body;
    // let input = '';

    // mapping buttons to specific inputs
    switch (button) {
        case 'button1':
            input = 'd';
            break;
        case 'button2':
            input = 'u';
            break;
        case 'button3':
            input = 'f';
            break;
        case 'button4':
            input = 'b';
            break;
        case 'button5':
            input = 'l';
            break;
        case 'button6':
            input = 'r';
            break;
        case 'button7':
            input = 's';
            break;
    }

    arduinoPort.write(`${input}\n`, (err) => {
        if(err) {
            console.error('Error while writing to serial port: ', err)
            res.status(500).send('error');
        }
        else {
            console.log('Input sent to arduino board:', input);
            
            console.log(`latitude: -6.7939507`);
            console.log(`longitude: 39.091095`);

            res.redirect('/control');
        }
    });
});

app.get('/capture', (req, res) => {
    captureShot(1, 1, 'sea');

    //for extracting exif data
    // try{
    //     new exifImage({ image: 'ocean.jpg' }, function (error, exifData) {
    //         if(error){
    //             console.log('Error: '+error.message);
    //         }
    //         else {
    //             console.log(exifData);;
    //         }
    //     });
    // }catch (error) {
    //     console.log(error);
    // }


    res.redirect('/control')
})

app.listen(PORT, () => {
    console.log(`application listening on port ${PORT}`);
})