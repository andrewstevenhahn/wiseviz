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
    return mappedData;
}

// relate attributes to geometry
function joinData(countiesData,attributesData, year) {

    // variables for csv to json transfer
    var fields = ["N_NOTCOMPLETED","N_COMPLETED", "N_COLLEGE_GOING", "COHORT_COUNT","COLLEGE_GOING_RATE","COMPLETION_RATE"]

    // loop through each county
    for (var i=0; i<countiesData.length; i++) {
        var county = countiesData[i];
        var county_name = county.name;

        // loop through each county year
        for (var a=0; a < attributesData.length; a++) {
            var attr_county = attributesData[a]
            var attr_name = attr_county.name
            var data_year = attr_county.year

            // if the year and county match, add attribute data
            if (data_year == year) {
                if (attr_name == county_name) {
                    for (var key in fields){
                        var attr = fields[key]
                        var val = (attr_county.data[attr])
                        county.properties[attr] = Number(val)
                    }
                    break;
                } else {
                    continue;
                }
            }

        }

    }
    
    // return appeneded data
    return countiesData;
}

function getDomain(data, expressed) {
    domain = [];
    for (var i = 0; i < data.length; i++) {
        value = data[i].properties[expressed]
        domain.push(Number(value))
    }
    return domain;
}

// create color scale
function colorScale(data, expressed) {
    //create quantile classes with color scale
    var color = d3.scaleQuantile() //designate quantile scale generator
        .range([
            "#f0f9e8",
            "#bae4bc",
            "#7bccc4",
            "#43a2ca",
            "#0868ac"
            ]);

    //pass array of expressed values as domain
    color.domain(getDomain(data,expressed));

    return color;	 //return the color scale generator
}

// create map recolor 
function choropleth(d, recolorMap, expressed) {
    //get data value
    var value = d.properties[expressed];
    if (value) {
        return recolorMap(value);
    } else {
        return "#ccc";
    }
}

function updateMap(d, map, width, height, expressed) {
    // initiate color scale for default expressed metric
    var recolorMap = colorScale(d[0].features, expressed)
    
    // create projection
    var projection = d3.geoMercator()
        .center([-89.89,44.65])
        .scale(7500)
        .translate([(width/2)+000,height/2])

    // create path generator
    var path = d3.geoPath()
    .projection(projection);

    // add county geometry to map
    var countiesLayer = map.selectAll("path")
        .data(d[0].features)
        .enter()
        .append("path")
            .attr("class", "counties")
            .attr("id", function(d) {
                return d.properties.county_nam;
            })
            .attr("d", path)
            .style("fill", function(d) {
                return choropleth(d, recolorMap, expressed)
            })
            .on("mouseenter", function(d) {
                const e = countiesLayer.nodes();
                const i = e.indexOf(this);
                county_name = e[i].__data__.properties.county_nam;
                value = e[i].__data__.properties[expressed];
                highlight = d3.select("#" + county_name)
                    .style("stroke", "white")
                    .style("stroke-width", 5)
                    .style("opacity", .6);
                
                highlightBars = d3.select('.bars-' + county_name)
                    .style("stroke", "white")
                    .style("stroke-width", 3)
                    .style("opacity", .6);
                
                var detailBox = setDetail(d, e, i, expressed);
            })
            .on("mouseout", function(d) {
                const e = countiesLayer.nodes();
                const i = e.indexOf(this);
                county_name = e[i].__data__.properties.county_nam;
                value = e[i].__data__.properties[expressed];
                dehighlight = d3.select("#" + county_name)
                    .style("stroke", "#ffffff")
                    .style("stroke-width", 0.5)
                    .style("opacity", 1);       
                
                dehighlightBars = d3.select('.bars-' + county_name)
                    .style("stroke", "#ffffff")
                    .style("stroke-width", 0.5)
                    .style("opacity", 1);      

            }); 
}

// intializes map
function setMap(d, expressed) {
    var clear = d3.select("#map-box")
        .html(null);

    var width = 1400;
    var height = 900;
    // process data to be callable with keys
    countiesData = processCounties(d[0].features)
    attributesData = processAttributes(d[1])

    // zip counties with year of attribute data
    var joinedData = joinData(countiesData, attributesData, 2020)

    // create svg container for map 
    var map = d3.select("div#map-box")
    .append("svg")
    .attr("class","map")
    .attr("viewBox", "0 0 " + width + " " + height );
    
    updateMap(d, map, width, height, expressed)
    
};

function updateBars(data, barChart, width, height, expressed) {
    var recolorBars = colorScale(data[0].features, expressed)
    var yScale = d3.scaleLinear()
    .range([0, height])
    .domain([0,Math.max.apply(Math, getDomain(data[0].features,expressed))])

    var bars = barChart.selectAll(".bars")
    .data(data[0].features)
    .enter()
    .append("rect")
        .sort(function(a, b){
            return b.properties[expressed]-a.properties[expressed]
        })
        .attr("class", function(d) {
            return "bars bars-" + d.properties.county_nam;
        })
        .attr("height", height/(data[0].features.length-1))
        .attr("y", function(d,i) {
            return i * (height / data[0].features.length);
        })
        .attr("width", function(d){
            return yScale(parseFloat(d.properties[expressed]))
        })
        .attr("x", 0)
        .style("fill", function(d) {
            return choropleth(d, recolorBars, expressed)
        })
        .on("mouseenter", function(d) {
            const e = bars.nodes();
            const i = e.indexOf(this);
            county_name = e[i].__data__.properties.county_nam;
            value = e[i].__data__.properties[expressed];
            highlight = d3.select("#" + county_name)
                .style("stroke", "white")
                .style("stroke-width", 5)
                .style("opacity", .6)
            
            highlightBars = d3.select('.bars-' + county_name)
                .style("stroke", "white")
                .style("stroke-width", 3)
                .style("opacity", .6)

            var detailBox = setDetail(d, e, i, expressed);

        })
        .on("mouseout", function(d) {
            const e = bars.nodes();
            const i = e.indexOf(this);
            county_name = e[i].__data__.properties.county_nam;
            value = e[i].__data__.properties[expressed];
            dehighlight = d3.select("#" + county_name)
                .style("stroke", "#ffffff")
                .style("stroke-width", 0.5)
                .style("opacity", 1);       
            
            dehighlightBars = d3.select('.bars-' + county_name)
                .style("stroke", "#ffffff")
                .style("stroke-width", 0.5)
                .style("opacity", 1);
            
        }); 
}

// initializes bar chart
function setBars(data, expressed) {
    var width = 550;
    var height = 550;

    var clear = d3.select("#bar-area")
        .html(null)
    var barChart = d3.select("#bar-area")
        .append("svg")
            .attr("width",width)
            .attr("height",height)
            .attr("class", "bar-chart")
    
    // default expressed value
    updateBars(data, barChart, width, height, expressed)

}

function getPrintValue(value) {
    if (value < 1) {
        return Math.round(value*10000)/100
    } else {
        return value
    }
}

function getPrintKey(key) {
    // "N_NOTCOMPLETED","N_COMPLETED", "N_COLLEGE_GOING", "COHORT_COUNT","COLLEGE_GOING_RATE","COMPLETION_RATE"]
    switch (key) {
        case "N_NOTCOMPLETED":
            return "Total Noncompleters";
        
        case "N_COMPLETED":
            return "Total High School Completers";
        
        case "N_COLLEGE_GOING":
            return "Total Fall College/University Attendees";    
        
        case "COHORT_COUNT":
        return "Total Seniors in Graduating Class";
        
        case "COLLEGE_GOING_RATE":
            return "Percent of Completers Attending College/University";
        
        case "COMPLETION_RATE":
            return "Percent of Seniors Graduating after 4 Years";

        default:
            return "<error>";
    }
}

function setDetail(data, e, i, expressed) {
    var clear = d3.select("#detail-area")
        .html(null)

    var county_name = e[i].__data__.properties.county_nam;
    var value = e[i].__data__.properties[expressed];
    
    detail2 = clear.append("div")
        .text(getPrintKey(expressed))
        .attr("id", "keytext")

    detailArea = clear.append("div")
        .text(county_name + " County")
        .attr("class", "county-name-detail")
    
    detail3 = clear.append("div")
        .text(getPrintValue(value))
        .attr("class","county-value-detail")
        

    var expressed = "N_COMPLETED"

}

function changeAttribute(data, attribute) {
    setMap(data, attribute);
    setBars(data, attribute);
    // change map title and colors
    var mapTitle = d3.select("#map-title")
        .text("County Map: " + getPrintKey(attribute) )
    
    setMap(data, attribute)

    // change bar title and colors
    var barTitle = d3.select("#bar-title")
        .text("Counties Ranked: " + getPrintKey(attribute) )
    
    var keytext = d3.select("#keytext")
        .text(getPrintKey(attribute))

    var label = d3.select("#metric-label")
        .text(getPrintKey(attribute))

    var cleardesc = d3.select("#detail-area")
        .text("Hover over a county to view details.")

}

// initializes filter controls
function setFilters(d) {
    var fields = ["N_NOTCOMPLETED","N_COMPLETED", "N_COLLEGE_GOING", "COHORT_COUNT","COLLEGE_GOING_RATE","COMPLETION_RATE"]
    metricFilter = d3.select("#metricDropdown")
    for (var i = 0; i < fields.length; i++) {
        
        metricFilter.append("a")
            .attr("class", "dropdown-item")
            .text(getPrintKey(fields[i]))
            .attr("id", fields[i])

        }
    
    $('a.dropdown-item').on('click', function () {
        var id = $(this).attr('id');
        changeAttribute(d, id);
    });
    
}


// main function
function initialize() {
    // set "global" variables
    var countiesFile = "data/wi_counties_geojson.geojson"
    var attributesFile = "data/countyAggs.csv"

    var barWidth = 550;
    var barHeight = 550;

    // load data asynchronously (v6 means no queue())
    Promise.all([
        d3.json(countiesFile),
        d3.csv(attributesFile)
        ]).then(function(d){
            
            // default metric
            defaultExpressed = "COHORT_COUNT"

            //initialize map with data and path generator
            setMap(d, defaultExpressed);
            setBars(d, defaultExpressed);
            setFilters(d, defaultExpressed);
    });

};

// call main function
window.onload = initialize();