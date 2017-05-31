import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';

import './main.html';

Template.hello.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.counter = new ReactiveVar(0);
});

Template.hello.onRendered(function helloOnRendered() {
  Meteor.call('geoJsonForIp',0,function(err,res){
    myData = res.data;
    var config = {"data0":"name","data1":"Estimated number in modern slavery",
    "data2":"SIGI Value 2014","data3":"Fatal occupational accidents",
    "data4":"Total public social expenditure as a percentage of GDP(%)",
    "defaultValue":"Estimated number in modern slavery",
    "state":"name",
    "id":"_id",
    "label0":"label 0","label1":"label 1","color0":"#aed7fa","color1":"#1962a0",
    "color2":"#aaf0a7","color3":"#27a621","color4":"#fb8989","color5":"#b60e0e",
    "color6":"#fccf4e","color7":"#ff473e","color8":"#aed7fa","color9":"#1962a0",
    "width":960,"height":960}

    var width = config.width,
    height = config.height;

    var COLOR_COUNTS = 90;

    function Interpolate(start, end, steps, count) {
      var s = start,
      e = end,
      final = s + (((e - s) / steps) * count);
      return Math.floor(final);
    }

    function Color(_r, _g, _b) {
      var r, g, b;
      var setColors = function(_r, _g, _b) {
        r = _r;
        g = _g;
        b = _b;
      };

      setColors(_r, _g, _b);
      this.getColors = function() {
        var colors = {
          r: r,
          g: g,
          b: b
        };
        return colors;
      };
    }

    function hexToRgb(hex) {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    }

    function valueFormat(d) {
      if (d > 1000000000) {
        return Math.round(d / 1000000000 * 10) / 10 + "B";
      } else if (d > 1000000) {
        return Math.round(d / 1000000 * 10) / 10 + "M";
      } else if (d > 1000) {
        return Math.round(d / 1000 * 10) / 10 + "K";
      } else {
        return d;
      }
    }

    function valueFormat1(d) {
      return d;
    }  

    var fields = Object.keys(myData[0]);
    var option_select = d3.select('#selectors').append("select")
    .attr("class", "option-select");
    for (var i = 0; i < fields.length; i++) {
      if (fields[i] !== config.state && fields[i] !== config.id) {
        var opt = option_select.append("option")
        .attr("value", fields[i])
        .text(fields[i]);

        if (fields[i] === config.defaultValue) {
          opt.attr("selected", "true");
        }
      }
    }

    var COLOR_FIRST, COLOR_LAST ;
    //COLOR_FIRST = config.color0

    var rgb ;

    var COLOR_START, COLOR_END;
    var startColors, endColors;
    var colors = [];
    var quantize;

    //set color of the map------------------------------------LIN  
    mapColor(config.color0,config.color1);
    function mapColor(aa,bb){

      COLOR_FIRST= aa, COLOR_LAST = bb;

      rgb = hexToRgb(COLOR_FIRST);
      COLOR_START = new Color(rgb.r, rgb.g, rgb.b); 

      rgb = hexToRgb(COLOR_LAST);
      COLOR_END = new Color(rgb.r, rgb.g, rgb.b);

      startColors = COLOR_START.getColors(),
      endColors = COLOR_END.getColors();

      colors = [];

      for (var i = 0; i < COLOR_COUNTS; i++) {
        var r = Interpolate(startColors.r, endColors.r, COLOR_COUNTS, i);
        var g = Interpolate(startColors.g, endColors.g, COLOR_COUNTS, i);
        var b = Interpolate(startColors.b, endColors.b, COLOR_COUNTS, i);
        colors.push(new Color(r, g, b));
      }    

      quantize = d3.scale.quantize()
      .domain([0, 900000.0])
      .range(d3.range(COLOR_COUNTS).map(function(i) { return i }));
      quantize.domain([10,200000]);  

    }
  

    var MAP_KEY = config.data0;
  
    // data visualization

    //scale of the map--------------------------------LIN 
    var projection = d3.geo.mercator()
    .scale((width + 1) / 2 / Math.PI)
    .translate([width / 2, height / 2])
    .precision(.1);

    var path = d3.geo.path()
    .projection(projection);
    //scale of the map--------------------------------LIN 

    var graticule = d3.geo.graticule();

    var svg = d3.select("#canvas-svg").append("svg")
    .attr("width", width)
    .attr("height", height);

    svg.append("path")
    .datum(graticule)
    .attr("class", "graticule")
    .attr("d", path);

    var valueHash = {};

    function log10(val) {
      return Math.log(val);
    }

    d3.json("https://s3-us-west-2.amazonaws.com/vida-public/geo/world-topo-min.json", function(error, world) {

      var countries = topojson.feature(world, world.objects.countries).features;
      var MAP_VALUE;   
      function drawMap(dataColumn) {
      //alert(dataColumn);

      if(dataColumn == "Estimated number in modern slavery"){
        MAP_VALUE = config.data1;
        mapColor(config.color0,config.color1);
      }else if(dataColumn == "SIGI Value 2014"){
        MAP_VALUE = config.data2;
        mapColor(config.color2,config.color3);
      }else if (dataColumn == "Fatal occupational accidents"){
        MAP_VALUE = config.data3;
        mapColor(config.color4,config.color5);  
      }else{
        MAP_VALUE = config.data4;
        mapColor(config.color6,config.color7);  
      }

      myData.forEach(function(d) {
        valueHash[d[MAP_KEY]] = +d[MAP_VALUE];
      });
      quantize.domain([d3.min(myData, function(d){
        return (+d[MAP_VALUE]) }),
      d3.max(myData, function(d){
        return (+d[MAP_VALUE]) })]);

      svg.append("path")
      .datum(graticule)
      .attr("class", "choropleth")
      .attr("d", path);

      var g = svg.append("g");

      g.append("path")
      .datum({type: "LineString", coordinates: [[-180, 0], [-90, 0], [0, 0], [90, 0], [180, 0]]})
      .attr("class", "equator")
      .attr("d", path);

      var country = g.selectAll(".country").data(countries);

      country.enter().insert("path")
      .attr("class", "country")
      .attr("d", path)
      .attr("id", function(d,i) { return d.id; })
      .attr("title", function(d) { return d.properties.name; })
      .style("fill", function(d) {
        if (valueHash[d.properties.name]) {

          var c = quantize((valueHash[d.properties.name]));
          var color = colors[c].getColors();
          return "rgb(" + color.r + "," + color.g +
          "," + color.b + ")";
        } else {
          return "#ccc";
        }
      })
      .on("mousemove", function(d) {
        var html = "";

        html += "<div class=\"tooltip_kv\">";
        html += "<span class=\"tooltip_key\">";
        html += d.properties.name;
        html += "</span>";
        html += "<span class=\"tooltip_value\">";
        html += (valueHash[d.properties.name] ? valueFormat1(valueHash[d.properties.name]) : "");
        html += "";
        html += "</span>";
        html += "</div>";

        $("#tooltip-container").html(html);
        $(this).attr("fill-opacity", "0.8");
        $("#tooltip-container").show();

        var coordinates = d3.mouse(this);

        var map_width = $('.choropleth')[0].getBoundingClientRect().width;

        if (d3.event.pageX < map_width / 2) {
          d3.select("#tooltip-container")
          .style("top", (d3.event.layerY + 15) + "px")
          .style("left", (d3.event.layerX + 15) + "px");
        } else {
          var tooltip_width = $("#tooltip-container").width();
          d3.select("#tooltip-container")
          .style("top", (d3.event.layerY + 15) + "px")
          .style("left", (d3.event.layerX - tooltip_width - 30) + "px");
        }
      })
      .on("mouseout", function() {
        $(this).attr("fill-opacity", "1.0");
        $("#tooltip-container").hide();
      });

      g.append("path")
      .datum(topojson.mesh(world, world.objects.countries, function(a, b) { return a !== b; }))
      .attr("class", "boundary")
      .attr("d", path);

      svg.attr("height", config.height * 2.2 / 3);      
    }

    drawMap(config.defaultValue);

    option_select.on("change", function() {
      drawMap($("#selectors").find(".option-select").val());
    });
  });

    d3.select(self.frameElement).style("height", (height * 2.3 / 3) + "px");

  });

});

Template.hello.helpers({
  counter() {
    return Template.instance().counter.get();
  },
});

Template.hello.events({
  'click button'(event, instance) {
    // increment the counter when button is clicked
    instance.counter.set(instance.counter.get() + 1);
  },
});


