const restify = require('restify');

var mysql = require('mysql');

const server = restify.createServer({
  name: "SmartParking",
  version: '1.0.0'
});

var connection = mysql.createConnection({
  host    :"localhost",
  user    :"root",
  password:"root",
  database:"smartparking"
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

server.post('/history', function (req, res, next) {
  console.log("post: "+req.params);
  var data = req.params;

  var id;

  connection.query("INSERT INTO record SET ?", {parking_id_parking:data.parking_id, create_at: data.created_at},
    function(err,result){
      if(err) console.log(err);

      console.log("ID: "+result.insertId);
      idSend = result.insertId;

      console.log("Sending response: "+ idSend);
      res.send(201, {id:idSend});
    });

    connection.query('UPDATE parking SET current_status = ? WHERE id_parking= ?;', [data.current_status,data.parking_id],
      function(err,res){
        if(err) console.log(err);
    });


  return next();
});


server.put('/history', function (req, res, next) {
  console.log(req.params);
  var data = req.params;

  console.log(JSON.stringify(data));

  var min = 0;
  var max = 0;

  connection.query('UPDATE record SET update_at = ?, time_parking = ? WHERE id_record=?;',[data.updated_at, data.time_parking, data.id],
    function(err,res){
      if(err) console.log(err);

      console.log("updated");
    });

    connection.query('SELECT MIN(time_parking) AS min FROM record WHERE id_record =?;',[data.id],
      function(error, results, fields){
        if(err) console.log(err);

        min = results[0].min;
        console.log("min:"+ min);
      });

      connection.query('SELECT MAX(time_parking) AS max FROM record WHERE id_record =?;',[data.id],
        function(error, results, fields){
          if(err) console.log(err);

          max = results[0].max;
          console.log("max:"+ max);
        });


    connection.query('UPDATE parking SET current_status = ? , min_time =?, max_time = ? WHERE id_parking= ?;', [data.current_status,min,max,data.parking_id],
      function(err,res){
        if(err) console.log(err);

        console.log("update parking");
      });

      console.log("Sending response");
      res.send(201, {status:"Sucess"});
      return next();
});

server.listen(3000, function () {
  console.log('%s listening at %s', server.name, server.url);
});
