var cv = require('opencv');
var configLot = require("../../lib/config/config");

// camera properties
var camWidth = 320;
var camHeight = 240;
var camFps = 10;
var camInterval = 1000 / camFps;

// face detection properties
var rectColor = [0, 255, 0];
var rectColorRed = [0,0,255];
var rectThickness = 2;

//Thresh values and area from movement detection
var lowThresh = 0;
var highThresh = 50;
var nIters = 2;
var minArea = 600;

// initialize camera
var camera = new cv.VideoCapture(0);

camera.setWidth(camWidth);
camera.setHeight(camHeight);

//Initialize the frame
var firstFrame = null;

module.exports = function (socket) {
  setInterval(function() {
    camera.read(function(err, im) {
      if (err) throw err;

      var gray = im.copy();

      // if the fisrt frame is None, initialize it
      if(firstFrame == null){
      	firstFrame = gray;
        gray.save('firstFrame.png');
      }

      //convert the frame into grayscale and blur it
      gray.convertGrayscale();
      gray.gaussianBlur([21,21]);

      //Compute the absolute difference between the current frame and first frame
      var frameDelta = new cv.Matrix(im.width(), im.height());
      frameDelta.absDiff(firstFrame,gray);

      // dilate the thereshold image to fill un holes
      // obtain the frame
      // then find contours on threasholder image
      frameDelta.canny(lowThresh, highThresh);
  	  frameDelta.dilate(nIters);
  	  contours = frameDelta.findContours();

      for (i = 0; i < contours.size(); i++) {
  	  //loop over the contours
  	  	 //if te contour is too small, ignore it
    	   if (contours.area(i) < minArea) continue;

         configLot.forEach(function (data) {

           var imRoi = im.roi(data.position.x,
             data.position.y,
             data.position.width,
             data.position.height);

             if(data.occupied){
               im.rectangle([data.position.x,
                             data.position.y],
                             [data.position.width,
                             data.position.height], rectColorRed, rectThickness);
             }else{
               im.rectangle([data.position.x,
                             data.position.y],
                             [data.position.width,
                             data.position.height], rectColor, rectThickness);
             }

           imRoi.detectObject('../data/hogcascade_cars_sideview.xml', {}, function(err, cars) {
         	    if (!err){
                if(cars.length==0){
                    //TODO
                    data.occupied = false;
                    console.log('NO detectObject');
                }else{
                    //TODO
                    data.occupied = true;

                    if(data.occupied_time == ""){
                        data.occupied_time = new Date();
                    }else{
                      var diffMs = (data.occupied_time - new Date());
                      var diffMins = Math.round(((diffMs % 86400000) % 3600000) / 60000);

                      if(diffMins >1){
                          console.log('DetectObject');
                      }
                    }
                }
              }

              socket.emit('frame', { buffer: im.toBuffer() });
       	   });
         })
      }

    });
  }, camInterval);
};


/**
 * You first need to create a formatting function to pad numbers to two digits…
 **/
function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

/**
 * …and then create the method to output the date string as desired.
 * Some people hate using prototypes this way, but if you are going
 * to apply this to more than one Date object, having it as a prototype
 * makes sense.
 **/
Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};
