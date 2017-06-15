let fs = require("fs"),
    path = require("path"),
    d3 = require("d3"),
    turf = require("turf"),
    _progress = require('cli-progress'),
    Canvas = require("canvas")

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

let progress_bar = new _progress.Bar({}, _progress.Presets.shades_classic)

let width = 1000,
    height = 1000

let mode = 'cluster'
if(process.argv.length>4){
  mode = process.argv[4]
}

let canvas = new Canvas(width, height),
    context = canvas.getContext("2d")

let projection, geoPath, defaultScale = 100

function updateProjection(center, scale){
  projection = d3.geoMercator()
    .scale(width / 2 / Math.PI)
    .center(center)
    .scale(scale)
    .translate([width / 2, height / 2])

  geoPath = d3.geoPath()
    .projection(projection)
    .context(context)
}

updateProjection([13.3085223, 52.5006173], defaultScale)

fs.readFile(process.argv[2], 'utf8', function (err,data) {
  if(err) console.log(err)

  let json = JSON.parse(data)

  progress_bar.start(json.tests.length, 0)

  json.tests.forEach( (t,ti) => {
    //Calculate the bounds based on origin and destination
    let points = []
    points.push(turf.point(t.points[0]))
    points.push(turf.point(t.points[t.points.length-1]))

    let bb = turf.bbox(turf.featureCollection(points))
    let center = [bb[0]+(bb[2]-bb[0])/2, bb[1]+(bb[3]-bb[1])/2];

    updateProjection(center, defaultScale)

    var bounds = [projection([bb[0],bb[1]]),projection([bb[2],bb[3]])],
      dx = bounds[1][0] - bounds[0][0],
      dy = bounds[1][1] - bounds[0][1],
      x = (bounds[0][0] + bounds[1][0]) / 2,
      y = (bounds[0][1] + bounds[1][1]) / 2,
      scale = .8 / Math.max(dx / width, dy / height)

    updateProjection(center, ((defaultScale*scale > 1000000)?1000000:defaultScale*scale))

    t.tests.forEach( (tt,tti) => {
      if(tt.length > 0){
        context.clearRect(0, 0, width, height)

        context.beginPath()
        context.fillStyle = '#ffffff'
        context.rect(0,0,width,height)
        context.fill()
        context.closePath()

        let color_keys = {}, color_count = 0

        t.knns[mode][tti].forEach( (knn,knni) => {
          if(!(knn.id in color_keys)){
            color_keys[knn.id] = color_count
            color_count++
          }
        })

        let color = d3.scaleLinear().range([0.8,0.2]).domain([0,color_count])

        tt.sort(function(a, b){
          let as = 0, bs = 0
          if(t[mode].to == a[mode].to){as = 1}
          if(t[mode].to == b[mode].to){bs = 1}

          if (as > bs) {
            return 1
          }else if (as < bs) {
            return -1
          }else{
            return 0
          }
        })

        tt.forEach( hull => {

          if((hull.id in json.hulls)){
            if(json.hulls[hull.id] != null){
              if(t[mode].to == hull[mode].to){
                context.strokeStyle = "rgba(60,127,180,1)"
                context.lineWidth = 2
                context.setLineDash([5, 5])
              }
              context.fillStyle = "rgba(0,0,0,"+((color_count == 0)?1:color(color_keys[hull[mode].to]))+")"
              context.beginPath()
              geoPath(turf.polygon(json.hulls[hull.id].coordinates))
              context.fill()
              if(t[mode].to == hull[mode].to){
                context.stroke()
              }
              context.closePath()
            }else{
              //console.log('null:',hull.id)  
            }
          }else{
            //console.log('not found:',hull.id)
          }

        })

        context.strokeStyle = 'rgba(180,49,22,1)'
        context.setLineDash([])
        context.lineWidth = 1
        context.beginPath()
        geoPath(turf.lineString(t.points))
        context.stroke()
        context.closePath()

        t.points.forEach( (p,pi) => {
          context.strokeStyle = 'rgba(180,49,22,1)'
          context.lineWidth = 2
          if(pi <= (tti+1)){
            context.fillStyle = 'rgba(180,49,22,1)'
          }else{
            context.fillStyle = 'rgba(0,0,0,1)'
          }
          context.beginPath()
          let gp = projection(p)
          context.arc(gp[0], gp[1], 3, 0, 2 * Math.PI, false)
          context.fill()
          context.stroke()
          context.closePath()
        })

        let buffer = canvas.toBuffer()
        fs.writeFileSync(process.argv[3]+mode+"_"+formatNumber(ti)+"_"+formatNumber(tti)+".png", buffer)
      }
    })
    progress_bar.update((ti+1)) 
  })
  process.exit()
})

function formatNumber(n){
  var t = ''
  if(n>99){
    t = n
  }else if(n<10){
    t = '00'+n
  }else if(n<100){
    t = '0'+n
  }
  return t
}