var CLIENT;
var Terraformer = require('terraformer');
var ArcGIS = require('terraformer-arcgis-parser');
var fs = require('fs');
var geojson2shape = require('geojson2shape');
var path = require('path');

exports.inject = function(con) {
  CLIENT=con;
};

exports.save = function(req, res) {
  var sketches = req.body;
  var requestId;
  var parsed;
  var query;
  //insert request params into db
  sketches.forEach(function(sketch) {
    parsed = ArcGIS.parse(sketch.geometry, {sr:sketch.geometry.spatialReference.wkid});
    var geomText = JSON.stringify(parsed);
    var query = CLIENT.query(['INSERT INTO sketches',
                              '(username, sketch_json, geom) ',
                              'VALUES($1, $2, ST_SetSRID(ST_GeomFromGeoJSON($3), 102100)) ',
                              'RETURNING id'].join('\n'), ['jim',
                                                           sketch,
                                                           geomText
                                                          ]);

    query.on('error', function(error) {
      console.log('Error processing SQL: ' + error);
    });
    query.on('end', function () {
      res.json({status:"success"});
    });
  })

};

exports.download = function(req, res) {
  var id = req.params.id;
  var query = CLIENT.query('SELECT username, ST_AsGeoJSON(geom) AS geometry FROM sketches WHERE id = $1', [id]);
  var request;
  query.on('row', function(row) {
    request = row;
  });
  query.on('end', function(result) {
    var output = request.geometry.toString();
    var downloadPath = path.resolve(__dirname+'/../public');
    var infile = request.username + new Date().getTime() + '.json';
    fs.writeFile(downloadPath+'/'+infile, output, function(err) {
      if(err) {
        console.log(err);
      } else {
        console.log("GeoJSON file saved!");

        var zip = true;
        var outfile = infile.slice(0, -5) + '.shp';
        var download = outfile.slice(0, -4) + '.zip';
        geojson2shape(downloadPath+'/'+infile, downloadPath+'/'+outfile, zip, function(err){
          if(err) {
            throw err;
          } else {
            res.setHeader('Content-disposition', 'attachment; filename=' + download);
            res.setHeader('Content-type', 'application/x-gzip');
            // res.sendfile(downloadPath + '/' + outfile.slice(0, -4) + '.zip');
            var filestream = fs.createReadStream(downloadPath + '/' + download);
            filestream.pipe(res);
          }
        });
      }
    });

  });

}

exports.find = function(req, res) {
  var id = req.params.id;
  var query = CLIENT.query('SELECT * FROM sketches WHERE id = $1', [id]);
  var request;
  query.on('row', function(row) {
    request = row;
  });
  query.on('end', function(result) {
    res.json(request);
  });
}