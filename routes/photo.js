var fs = require('fs');
var CLIENT;

exports.inject = function(con) {
  CLIENT=con;
};

exports.upload = function(req, res) {
  console.log(req.body);
  var filename = 'us' + new Date().getTime() + '.jpg';
  var filedata = req.body.photo.split(',')[1];
  fs.writeFile(filename, new Buffer(filedata, "base64"), function (err) {
    res.json({
      name: 'http://mean.geolis.pw/'+filename,
    params: {
        username: req.body.username,
        timestamp: req.body.timestamp,
        point: req.body.point,
        lat: req.body.lat,
        lng: req.body.lng,
        accuracy: req.body.accuracy,
        heading: req.body.heading
      }
    });
  });
}
