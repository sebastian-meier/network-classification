let knn = require('alike'),
  fs = require('fs'),
  sql = require('spatialite'),
  d3 = require('d3')

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

let event_data, trip_data

let db = new sql.Database(process.argv[2]+'.db', function(err){
  if(err) console.log(err);

  db.spatialite(function(err) {
    if(err) console.log(err);

    db.all("SELECT "+
    "trips.id,  "+
    "trips.end_10_min,  "+
    "trips.day_of_week,  "+
    "trips.to_cluster,  "+
    "trips.to_id,  "+
    "locations.type, "+
    "locations.fs_id   "+
  "FROM  "+
    "trips, locations  "+
  "WHERE  "+
    "trips.to_id = locations.id AND "+
    "trips.test = 1 AND  "+
    "trips.to_cluster IS NOT NULL", function(err, rows){

      trip_data = rows
      trip_data.forEach(d => {
        for(let key in d){
          if(key != 'type'){
            d[key] = +d[key]
          }
        }
      })

      db.all("SELECT "+
        "cluster_locations.cluster_id AS cluster, "+
        "locations.type, "+
        "locations.fs_id, "+
        "locations.name, "+
        "cluster_locations.location_id, "+
        "start_10_min, "+
        "end_10_min, "+
        "day_of_week, "+
        "duration "+
      "FROM "+
        "location_events "+
        "LEFT JOIN cluster_locations ON cluster_locations.location_id = location_events.location_id "+
        "LEFT JOIN locations ON locations.id = location_events.location_id "+
      "WHERE "+
        "cluster IS NOT NULL", function(err, rows){

        event_data = rows
        event_data.forEach(d => {
          for(let key in d){
            if(key != 'type' && key != 'name'){
              d[key] = +d[key]
            }
          }
        })

        processIt()
      })
    })
  })
})

let clusters = {}
function processIt(){
  event_data.forEach( e => {
    if(!(e.cluster in clusters)){
      clusters[e.cluster] = []
    }

    clusters[e.cluster].push(e)
  })

  let results = []

  trip_data.forEach( e => {
    let c = clusters[e.to_cluster]

    let items = []
    c.forEach( (item) => {
      items.push({
        start:shiftNumber(item.start_10_min,e.end_10_min,144,1),
        day_of_week:shiftNumber(item.day_of_week,e.day_of_week,7,0),
        id:item.location_id
      })
    })

    options = {
      //k:20,
      //debug:true,
      weights: {
        start: 0.1,
        day_of_week: 0.05
      }
    }

    let knns = knn({start: e.end_10_min, day_of_week: e.day_of_week }, items, options)

    let t_knns = {}
    knns.forEach((k,ki) => {
      if(!(k.id in t_knns)){
        t_knns[k.id] = 0
      }
      //Maybe not smart?
      t_knns[k.id] += (knns.length-ki)
    })

    //reorder
    let ta_knns = []
    for(let key in t_knns){
      ta_knns.push({id:key, c:t_knns[key]})
    }
    //DESC
    ta_knns.sort((a,b) => {
      if (a.c < b.c) {
        return 1
      }else if (a.c > b.c) {
        return -1
      }else{
        return 0
      }
    })

    let match = -1

    ta_knns.forEach( (t, ti) => {
      if(t.id == e.to_id){
        match = ti
      }
    })

    results.push([match, ta_knns.length])
  })

  fs.writeFileSync(process.argv[3]+'cluster_event_results.csv', array2csv(results, 'match,matches'))
}

function array2csv(a,column){
  var csv = column
  a.forEach( aa => {
    csv += '\n'
    aa.forEach( (c,ci) => {
      if(ci>0){
        csv += ','
      }
      csv += c
    })
  })
  return csv;
}

function shiftNumber(target,ref,max,min){
  if(min==0){max+=1}
  if(target > ref+max/2){
    return target-max
  }else if(target < ref-max/2){
    return max-target+max/2-(max-ref)+1
  }else{
    return target
  }
}