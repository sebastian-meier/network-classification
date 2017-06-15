let sql = require('spatialite'),
  fs = require('fs')

if(process.argv.length < 4){
  console.log('Please provide path to spatialite database and output path.')
  process.exit()
}

for(let i = 3; i<4; i++){
  if(process.argv[i].substr(-1,1) != '/'){ 
    process.argv[i] += '/' 
  }
}

//Check if output folder exists
if (!fs.existsSync(process.argv[3])) {
  fs.mkdirSync(process.argv[3]);
}

let queries = {
  trips_location_light: "SELECT 'loc_'||from_id AS origin_txt, from_id AS origin, start_10_min AS start, day_of_week AS day, to_id AS destination, 'loc_'||to_id AS destination_txt FROM trips",
  trips_cluster_light: "SELECT 'cl_'||from_cluster AS origin_txt, from_cluster AS origin, start_10_min AS start, day_of_week AS day, to_cluster AS destination, 'cl_'||to_cluster AS destination_txt FROM trips WHERE from_cluster IS NOT NULL AND to_cluster IS NOT NULL",
  trips_location_full: "SELECT 'loc_'||trips.from_id AS origin_txt, trips.from_id AS origin, start_10_min AS start, day_of_week AS day, trips.to_id AS destination, 'loc_'||trips.to_id AS destination_txt, "+
                        "X(EndPoint(GeometryN(CastToMultiLinestring(Collect(trip_segments.the_geom)),ST_NumGeometries(CastToMultiLinestring(Collect(trip_segments.the_geom))) ))) AS destination_x, "+
                        "Y(EndPoint(GeometryN(CastToMultiLinestring(Collect(trip_segments.the_geom)),ST_NumGeometries(CastToMultiLinestring(Collect(trip_segments.the_geom))) ))) AS destination_y, "+
                        "X(StartPoint(GeometryN(CastToMultiLinestring(Collect(trip_segments.the_geom)),1))) AS origin_x, "+
                        "Y(StartPoint(GeometryN(CastToMultiLinestring(Collect(trip_segments.the_geom)),1))) AS origin_y "+
                        " FROM trips, trip_segments WHERE trip_id = trips.id GROUP BY trip_id ORDER BY trip_id, sequence",
  trips_cluster_full: "SELECT 'cl_'||from_cluster AS origin_txt, from_cluster AS origin, start_10_min AS start, day_of_week AS day, to_cluster AS destination, 'cl_'||to_cluster AS destination_txt, "+
                        "X(EndPoint(GeometryN(CastToMultiLinestring(Collect(trip_segments.the_geom)),ST_NumGeometries(CastToMultiLinestring(Collect(trip_segments.the_geom)))))) AS destination_x, "+
                        "Y(EndPoint(GeometryN(CastToMultiLinestring(Collect(trip_segments.the_geom)),ST_NumGeometries(CastToMultiLinestring(Collect(trip_segments.the_geom)))))) AS destination_y, "+
                        "X(StartPoint(GeometryN(CastToMultiLinestring(Collect(trip_segments.the_geom)),1))) AS origin_x, "+
                        "Y(StartPoint(GeometryN(CastToMultiLinestring(Collect(trip_segments.the_geom)),1))) AS origin_y "+
                        " FROM trips, trip_segments WHERE trip_id = trips.id AND from_cluster IS NOT NULL AND to_cluster IS NOT NULL GROUP BY trip_id ORDER BY trip_id, sequence"
}, query_count = 0, query_keys = []

let ki = 0
for(let key in queries){ query_keys[ki] = key; ki++ }

let db = new sql.Database(process.argv[2]+'.db', function(err){
  if(err) console.log(err);

  db.spatialite(function(err) {
    if(err) console.log(err);

    processQueries()

  })
})

function processQueries(){

  db.all(queries[query_keys[query_count]], function(err, rows){

    if(err) console.log(err)

    let head = ''

    for(let key in rows[0]){ if(head!=''){head+=','} head+=key }

    fs.writeFileSync(
      process.argv[3]+query_keys[query_count]+'.csv', 
      head+array2csv(rows)
    )

    //Simulate training over time, by splitting into 10 pieces each file contains n/10 of the overall data
    for(let i = 1; i<=10; i++){
      let train = rows.slice(0,((rows.length/10*i)-1))
      fs.writeFileSync(
        process.argv[3]+query_keys[query_count]+'_train_'+i+'.csv', 
        head+array2csv(train)
      )
    }

    //Limit to trip-groups which have at least n trips
    let trip_counts = {}
    rows.forEach( r => {
      if(!(r.origin+"_"+r.destination in trip_counts)){
        trip_counts[r.origin+"_"+r.destination] = 0
      }
      trip_counts[r.origin+"_"+r.destination]++
    })

    for(let i = 1; i<=10; i++){
      let limit = []
      rows.forEach( r => {
        if(trip_counts[r.origin+"_"+r.destination] > i){
          limit.push(r)
        }
      })
      fs.writeFileSync(
        process.argv[3]+query_keys[query_count]+'_limit_'+i+'.csv', 
        head+array2csv(limit)
      )
    }

    query_count++
    if(query_count<query_keys.length){
      processQueries()
    }else{
      console.log('done')
    }
  })
}

/*Helper Functions*/

function add(a, b) {
  return a + b;
}

function array2csv(a){
  var r = '';
  a.forEach(function(d,i){
    r += '\n';
    r += array2csv_line(d);
  });
  return r;
}

function array2csv_line(l){
  var r = '';
  var i = 0;
  for(var key in l){
    if(i>0) r += ',';
    r += l[key];
    i++;
  }
  return r;
}