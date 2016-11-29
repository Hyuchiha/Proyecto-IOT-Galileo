var cv = require('opencv');

// camera properties
var camWidth = 320;
var camHeight = 240;
var camFps = 10;
var camInterval = 1000 / camFps;

// face detection properties
var rectColor = [0, 255, 0];
var rectThickness = 2;

//Thresh values and area from movement detection
var lowThresh = 0;
var highThresh = 50;
var nIters = 2;
var minArea = 500;

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

      // convert the frame into grayscale and blur it
      var gray = im.copy();
      gray.convertGrayscale();
      gray.gaussianBlur([21,21]);

      // if the fisrt frame is None, initialize it
      if(firstFrame == null){
      	firstFrame = gray;
      }

      //Compute the absolute difference between the current frame and first frame
      var frameDelta = new cv.Matrix(im.width(), im.height());
      frameDelta.absDiff(firstFrame,gray);
      // dilate the thereshold image to fill un holes
      // then find contours on threasholder image
      frameDelta.canny(lowThresh, highThresh);
  	  frameDelta.dilate(nIters);
  	  contours = frameDelta.findContours();

  	  //loop over the contours
  	  for (i = 0; i < contours.size(); i++) {
  	  	//if te contour is too small, ignore it
    	if (contours.area(i) < minArea) continue;
    	
    	//im.rectangle([contour.x, contour.y], [contour.width, contour.height], rectColor, rectThickness);
    	console.log("Movement");
      }


      im.detectObject('./lib/cascade/cars.xml', {}, function(err, faces) {
        if (err) throw err;

        for (var i = 0; i < faces.length; i++) {
          face = faces[i];
          im.rectangle([face.x, face.y], [face.width, face.height], rectColor, rectThickness);
        }

        socket.emit('frame', { buffer: im.toBuffer() });
      });
    });
  }, camInterval);
};
