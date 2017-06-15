let fs = require('fs')

if(process.argv.length < 4){
  console.log('Please provide path to test_results.json and output path.')
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

fs.readFile(process.argv[2], 'utf8', function (err,data) {
  if(err) console.log(err)

  let json = JSON.parse(data)

  let accuracy = {location : [], cluster : [], json: {location : [], cluster : []}}, num_corridors = [], csv_num_corridors = []

  json.tests.forEach( t => {
    let t_num_corridors = [],
      t_accuracy = {
        location : [],
        cluster : []
      }

    t.tests.forEach( (tt,ti) => {
      let obj = {
        count:tt.length,
        step:ti,
        length:t.tests.length
      }
      csv_num_corridors.push(obj)
      t_num_corridors.push(obj)
    })
    num_corridors.push(t_num_corridors)

    let types = ['cluster','location']
    types.forEach( type => {
      var include = true
      if(t[type].to == null){
        include = false
      }
      t.knns[type].forEach( (knn,knni) => {
        let t_match = -1
        if(knn){
          knn.forEach( (k,ki) => {
            if(k.id == t[type].to && t_match == -1){
              t_match = ki
            }
          })
        }

        let obj = {
          match:t_match,
          matches:(knn)?knn.length:0,
          step:knni,
          length:t.knns[type].length
        }

        if(include){
          accuracy[type].push(obj)
          t_accuracy[type].push(obj)
        }
      })
      if(include){
        accuracy.json[type].push(t_accuracy[type])
      }
    })
  })

  fs.writeFileSync(process.argv[3]+'num_corridors.json', JSON.stringify(num_corridors))
  fs.writeFileSync(process.argv[3]+'num_corridors.csv', array2csv(csv_num_corridors))
  fs.writeFileSync(process.argv[3]+'accuracy_cluster.csv', array2csv(accuracy.cluster))
  fs.writeFileSync(process.argv[3]+'accuracy_location.csv', array2csv(accuracy.location))
  fs.writeFileSync(process.argv[3]+'accuracy_cluster.json', JSON.stringify(accuracy.json.cluster))
  fs.writeFileSync(process.argv[3]+'accuracy_location.json', JSON.stringify(accuracy.json.location))
})

function array2csv(a){
  let csv = ''

  //head
  let i = 0, keys = []
  for(var key in a[0]){
    if(i>0) csv += ','
    csv += key
    keys.push(key)
    i++
  }

  a.forEach( aa => {
    csv += '\n'
    keys.forEach( (k,ki) => {
      if(ki>0) csv += ','
      csv += aa[k]
    })
  })

  return csv
}