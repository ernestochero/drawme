'use strict';
// get schema from server
function initialize () {
  $("#submit").click(function(e){
    e.preventDefault();
    var input = $(this).parent("form").find("input").val();
    $.ajax({
      type: 'POST',
      url: '/schema',
      data: {
      job_name: input
      },
      success: function(data) {
        console.log(data);
        cleanCanvas();
        createGraphics(data);
      } 
  });
  })
}

// clear svg tag
function cleanCanvas() {
  var element = document.getElementById("my_canvas");
  if(!!element) element.parentNode.removeChild(element);
}

// method to create automata
function createGraphics(rules) {
  var width, height, rules, map, tasks, links, nodes, svg, tick, radius, force, link, node;
  width = 1500;
  height = 800;
  map = d3.map();
  rules.forEach(function(rule){
    map.set(rule.from, {
      fixed: true
    });
    return map.set(rule.to, true);
  });
  tasks = map.keys();
  links = rules.map(function(rule){
    return {
      source: tasks.indexOf(rule.from),
      target: tasks.indexOf(rule.to)
    };
  });
  nodes = tasks.map(function(k){
    var entry;
    entry = {
      name: k
    };
    if (map.get(k).fixed) {
      entry.fixed = true;
      entry.x = map.get(k).x;
      entry.y = map.get(k).y;
    }
    return entry;
  });
  svg = d3.select("#app").append("svg").attr("width", width).attr("height", height).attr("id","my_canvas");
  svg.append("svg:defs").append("svg:marker").attr("id", "arrow").attr("viewBox", "0 0 10 10").attr("refX", 20).attr("refY", 5).attr("markerUnits", "strokeWidth").attr("markerWidth", 8).attr("markerHeight", 6).attr("orient", "auto").append("svg:path").attr("d", "M 0 0 L 10 5 L 0 10 z");
  svg.append("line").attr("x1", 5).attr("x2", 50).attr("y1", 5).attr("y2", 50).style("stroke", "black").attr("stroke-width", 2).attr("marker-end", "url(#arrow)");
  tick = function(){
    link.selectAll("line").attr("x1", function(d){
      return d.source.x;
    }).attr("y1", function(d){
      return d.source.y;
    }).attr("x2", function(d){
      return d.target.x;
    }).attr("y2", function(d){
      return d.target.y;
    }).attr("marker-end", "url(#arrow)");
    node.attr("transform", function(d){
      return "translate(" + d.x + "," + d.y + ")";
    });
  };
  radius = d3.scale.sqrt().range([0, 50]);
  force = d3.layout.force().size([width / 2, height]).charge(-600).linkDistance(function(d){
    return 250;
  });
  force.nodes(nodes).links(links).on("tick", tick).start();
  link = svg.selectAll(".link").data(links).enter().append("g").attr("class", "link");
  link.append("line").style("stroke-width", 5).attr("marker-end", "url(#arrow)");
  node = svg.selectAll(".node").data(nodes).enter().append("g").attr("class", "node").call(force.drag);
  node.append("circle").attr("r",35).style("fill", "blue");
  node.append("text").attr("dy", ".35em").attr("text-anchor", "middle").text(function(d){
    return d.name;
  }).style("fill", "white");
}

initialize();