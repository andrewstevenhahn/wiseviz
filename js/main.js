1 //begin script when window loads
2 window.onload = initialize();
3
4 //the first function called once the html is loaded
5 function initialize(){
6 	setMap();
7 };
8
9 //set choropleth map parameters
10 function setMap(){
11 //use queue.js to parallelize asynchronous data loading
12 queue()
13 .defer(d3.csv, “data/unitsData.csv”) //load attributes from csv
14 .defer(d3.json, “data/EuropeCountries.topojson”) //load
15 .defer(d3.json, “data/FranceRegions.topojson”) //load geometry
16 .await(callback); //trigger callback function once data is loaded
17
18 function callback(error, csvData, europeData, franceData){
19 console.log();
20 };
21 } 


set up global variables
  var countiesFile = "data/wi_counties_geojson.geojson";
  var attributesFile = "data/countyAggs.csv";
  var clear = d3.select("#map-box")
  .html(null);
  var width = 1420;
  var height = 600;
	
  // function to process counties to include keys
  var processCounties = function(json) {
    var mappedData = [];
    for (var i = 0; i < json.length; i++) {
      county = {
        name : json[i].properties.county_nam,
        properties : json[i].properties,
        geometry : json[i].geometry
      }
      mappedData.push(county)
    }
    return mappedData;
  }

	// function to process attributes to include keys
  var processAttributes = function(csv) {
    var mappedData = [];
    for (var i = 0; i < csv.length; i++) {
      county = {
        name : csv[i].COUNTY,
        year : csv[i].COHORT,
        data : csv[i]
      }
      mappedData.push(county)
    }
    console.log(mappedData)
    return mappedData;
  }




  // function to draw or update map
  var loadMap = () => {
    var countiesRaw = d3.json(countiesFile).then(
      (data,error) => {
        if(error){
          console.log("Error loading counties.")
        } else {
          countyData = processCounties(data.features)
          countyRaw = data.features
          d3.csv(attributesFile).then(
            (data,error) => {
              if(error){
                console.log("Error loading attributes.")
              } else {
                attributeData = processAttributes(data)
                console.log(countyRaw)
                drawMap(countyData,countyRaw);
              }
            }
          );
        }
      }
    );
  }

  function colorScale(csvData){
    //create quantile classes with color scale
    var color = d3.scaleQuantize() //designate quantile scale generator
    	.range([
    		"#f6e8c3",
    		"#dfc27d",
    		"#bf812d",
    		"#8c510a",
    		"#543005"
    		]);
				
    	//build array of all currently expressed values for input domain
    	var domainArray = [];
    	for (var i in csvData){
    		domainArray.push(Number(csvData[i]["GROUP_COUNT"]));
    	};
    	//pass array of expressed values as domain
    	color.domain(domainArray);

    	return color;	 //return the color scale generator
};

  var drawMap = (countyData,countyRaw) => {
    // create svg container for map 
    var map = d3.select("#map-box")
        .append("svg")
        .attr("class","map")
        .attr("viewBox", "0 0 " + width + " " + height );
		
    // create projection
    var projection = d3.geoAlbersUsa()
        .scale(1100)
        .translate([width/2, (height/2)]);

    var path = d3.geoPath().projection(projection);
    var counties = countyData
    var recolorMap = colorScale(csvData);

  }

  // main function
  var main = function() {
    // Load external data and boot
Promise.all([
  d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
  d3.csv("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv", function(d) {
      data.set(d.code, +d.pop)
  })
  ]).then(function(loadData){
      let topo = loadData[0]
	
  drawMap();

  })

  }

  main();

};