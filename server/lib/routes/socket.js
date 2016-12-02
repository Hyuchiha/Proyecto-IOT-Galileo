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

      // obtain the frame
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

           imRoi.detectObject('./node_modules/opencv/data/haarcascade_frontalface_alt2.xml', {}, function(err, faces) {
         	    if (err) throw err;

         	    for (var i = 0; i < faces.length; i++) {
           		    face = faces[i];
           		    im.rectangle([face.x+data.position.x,
                                face.y+data.position.y],
                                [face.width, face.height], rectColor, rectThickness);
         	    }

              if(faces.length==0){
                data.occupied = false;
              }else{
                data.occupied = true;
              }

              socket.emit('frame', { buffer: im.toBuffer() });
       	   });
         })
      }

    });
  }, camInterval);
};
