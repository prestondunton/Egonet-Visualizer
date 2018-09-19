nodeColor = "#FF0000";
nodeBorderColor = "#2b2b2b";
selectedColor = "#ff7777";
linkColor = "#000000";

doc = d3.select("body");
var chartWidth = window.innerWidth - 40;
var chartHeight = window.innerHeight - 20;
chart = doc.append("svg")
    .attr("width",chartWidth)
    .attr("height",chartHeight)
    .attr("id","chart");
chartelement = document.getElementById("chart");

var forces = d3.forceSimulation()
	.force("manybody", d3.forceManyBody().strength(-1200))
	.force('linking spring',d3.forceLink());

var allNodes = [];
var allLinks = [];
var currentGraph = {"nodes" : allNodes, "links" : allLinks};
var currentEgo;
var displayWeights = true;
var displayEgo = true;
var displayArrows = true;
var directedGraph = false;
var largestWeight = FindLargestWeight(allLinks);
var updateGraph = true;

ReadData();

function ReadData(){ // Loads JSON networks that are in JS files linked in the HTML. Was for development use only.
	if(document.getElementById("selectNetwork").value == "L2K"){
		allNodes = L2KNetwork.nodes;
		allLinks = L2KNetwork.links;
		directedGraph = false;
	} 
	if(document.getElementById("selectNetwork").value == "dolphin"){
		allNodes = dolphinNetwork.nodes;
		allLinks = dolphinNetwork.links;
		directedGraph = false;
	}
	if(document.getElementById("selectNetwork").value == "congress"){
		allNodes = congressNetwork.nodes;
		allLinks = congressNetwork.links;
		directedGraph = false;
	}
	if(document.getElementById("selectNetwork").value == "catbrain"){
		allNodes = catBrainNetwork.nodes;
		allLinks = catBrainNetwork.links;
		directedGraph = true;
	}
	if(document.getElementById("selectNetwork").value == "starwars"){
		allNodes = starwarsNetwork.nodes;
		allLinks = starwarsNetwork.links;
		directedGraph = false;
	}
	if(document.getElementById("selectNetwork").value == "sampledirected"){
		allNodes = sampleDirectedNetwork.nodes;
		allLinks = sampleDirectedNetwork.links;
		directedGraph = true;
	}
	if(document.getElementById("selectNetwork").value == "sample"){
		allNodes = sampleNetwork.nodes;
		allLinks = sampleNetwork.links;
		directedGraph = false;
	}

	LinkByNode(allLinks);
	ClearGraph();

}

function DrawGraph(nodes, links){
	currentGraph.nodes = nodes;
	currentGraph.links = links;

	CenterNodes(nodes);

	chart.selectAll("circle").remove();
	chart.selectAll("line").remove();
	chart.selectAll("path").remove();
	chart.selectAll("g").remove();

	
	if(directedGraph == true){
		var arrows = chart.append("g") //append container
		.attr("class", "arrows")
		.selectAll("path") // select lines so that when we bind data
		.data(links) //bind data
		.enter().append("path") //use the data to create lines
		.attr("stroke",linkColor)
		.attr("stroke-width", 1);
	} else {
		var linkLines = chart.append("g") //append container
		.attr("class", "links") //label
		.selectAll("line") // select lines so that when we bind data
		.data(links) //bind data
		.enter().append("line") //use the data to create lines
		.attr("stroke",linkColor);

		chart.selectAll("line").attr("stroke-width", function(d){
			if(d.source.id == currentEgo || d.target.id == currentEgo){
				if(displayEgo){
					return 1;
				} else {
					return 0;
				}
			} else {
				if(displayWeights){
					return NormalizeWeight(d.weight, FindLargestWeight(links));
				} else {
					if(d.weight != 0){
						return 1;
					} else {
						return 0;
					}
				}
			}
		}); 
	}

	var nodeCircles = chart.append("g")
		.attr("class", "nodes")
		.selectAll("circle")
		.data(nodes)
		.enter().append("circle")
		.attr("r", function(d){
			if(d.id == currentEgo){
				if(displayEgo){
					return 12;
				} else {
					return 0;
				}
			} else {
				return 7;
			}
		})
		.attr('stroke', nodeBorderColor)
		.attr('stroke-width', 2)
		.attr('fill', nodeColor)
		.attr("drg",true)
		.call(d3.drag()
			.on("start",StartDrag)
			.on("drag", Dragging)
			.on("end", EndDrag)
		);
	nodeCircles.append("title")
		.text(function(d){if(d.name != null){d.name;}else{if(d.label != null) return d.label;};});

	forces
		.nodes(nodes)
		.on("tick",Update);

	if(directedGraph){
		forces.force("linking spring")
			.links(RemoveDoubleLinks(links))
			.strength(0.05);
	} else {
		forces.force("linking spring")
			.links(links)
			.strength(0.05);
	}
	UpdateLinkStrength();
	forces.alphaTarget(0.1).restart();
}

function Update(){

	chart.selectAll("circle").attr("cy", function(d){return d.y;}); //updates the y position of circles
	chart.selectAll("circle").attr("cx", function(d){return d.x;}); //updates the x position of circles
	
	if(directedGraph == true){
		var numberOfDoublePaths = 0;
		chart.selectAll("path")
		.attr("d", function(d){
			
			doublePath = false;
			for(var i =0; i<currentGraph.links.length;i++){
				if(currentGraph.links[i].target == d.source && currentGraph.links[i].source == d.target){
					doublePath = true;
					var secondLink = currentGraph.links[i];
					break;
				}
			}
		
			if(d.target.id == currentEgo){
				b = 15; //distance between center of node and point 2	
			} else {
				b = 10; //distance between center of node and point 2	
			}
			if(d.source.id == currentEgo){
				a = 15; //distance between center of node and point 1
			} else {
				a = 10; //distance between center of node and point 1	
			}

			l = 5; //length of arrow side
			phi = Math.PI / 4; //angle between link line and arrow lines
			
			p1x = d.source.x;
			p1y = d.source.y;
			p2x = d.target.x;
			p2y = d.target.y;

			theta = Math.atan((p2y-p1y)/(p2x-p1x));
			if(p2x-p1x<0)
				theta += Math.PI;
			

			p1x = Math.round(p1x + (a*Math.cos(theta)));
			p1y = Math.round(p1y + (a*Math.sin(theta)));
			p2x = Math.round(p2x - (b*Math.cos(theta)));
			p2y = Math.round(p2y - (b*Math.sin(theta)));
			p3x = Math.round(p2x + (l*Math.cos(theta+Math.PI-phi)));
			p3y = Math.round(p2y + (l*Math.sin(theta+Math.PI-phi)));
			p4x = Math.round(p2x + (l*Math.cos(theta+Math.PI+phi)));
			p4y = Math.round(p2y + (l*Math.sin(theta+Math.PI+phi)));
			p5x = Math.round(p1x + (l*Math.cos(theta-phi)));
			p5y = Math.round(p1y + (l*Math.sin(theta-phi)));
			p6x = Math.round(p1x + (l*Math.cos(theta+phi)));
			p6y = Math.round(p1y + (l*Math.sin(theta+phi)));


			var lineString = "";
			if(displayEgo == false){
				if(d.source.id == currentEgo || d.target.id == currentEgo){
					lineString = "";
				} else {
					if(displayArrows == false){
						lineString = "M " + p1x + " " + p1y + " L " + p2x + " " + p2y + " Z";
					} else {
						if(doublePath){
							lineString = "M " + p6x + " " + p6y + " L" + 
												p1x + " " + p1y + " L " +
												p5x + " " + p5y + " M " + 
												p1x + " " + p1y + " L " +
												p2x + " " + p2y + " M " +
												p3x + " " + p3y + " L " + 
												p2x + " " + p2y + " L " + 
												p4x + " " + p4y + " Z";
						} else {
							lineString = "M " + p1x + " " + p1y + " L" + 
												p2x + " " + p2y + " M " + 
												p3x + " "  + p3y + " L " + 
												p2x + " " + p2y + " L " + 
												p4x + " " + p4y + " Z";
						}
					}
				}
			} else {
				if(displayArrows == false){
					lineString = "M " + p1x + " " + p1y + " L " + p2x + " " + p2y + " Z";
				} else {
					if(doublePath){
						lineString = "M " + p6x + " " + p6y + " L" + 
											p1x + " " + p1y + " L " +
											p5x + " " + p5y + " M " + 
											p1x + " " + p1y + " L " +
											p2x + " " + p2y + " M " +
											p3x + " " + p3y + " L " + 
											p2x + " " + p2y + " L " + 
											p4x + " " + p4y + " Z";
					} else {
						lineString = "M " + p1x + " " + p1y + " L" + 
											p2x + " " + p2y + " M " + 
											p3x + " "  + p3y + " L " + 
											p2x + " " + p2y + " L " + 
											p4x + " " + p4y + " Z";
					}
				}
			}
			
			return lineString;
		})
		.attr("class", function(d){
			doublePath = false;
			for(var i =0; i<currentGraph.links.length;i++){
				if(currentGraph.links[i].target == d.source && currentGraph.links[i].source == d.target){
					doublePath = true;
					numberOfDoublePaths += 1;
					var secondLink = currentGraph.links[i];
					break;
				}
			}
			if(doublePath && d.source.id > secondLink.source.id){
				return "doubledPath";
			} else {
				return;
			}
		});
		chart.selectAll("path.doubledPath").remove();
		numberOfDoublePaths /= 2;
	} else {
		chart.selectAll("line")
			.attr("x1", function(d){return d.source.x})
			.attr("y1", function(d){return d.source.y})
			.attr("x2", function(d){return d.target.x})
			.attr("y2", function(d){return d.target.y});
	}

	
	
}

function StartDrag(d){
	if(d.id != currentEgo){
	 	if (!d3.event.active)
	 		forces.alphaTarget(0.1).restart();
		d3.select(this)
			.attr("fill",selectedColor);
		d.fx = d.x;
		d.fy = d.y;
	}
}

function Dragging(d){
	if(d.id != currentEgo){
		d.fx = d3.event.x;
		d.fy = d3.event.y;
	}
}

function EndDrag(d){
	if(d.id != currentEgo){
		if(updateGraph){
			if (!d3.event.active) 
				forces.alphaTarget(0);
			d.fx = null;
			d.fy = null;
		}
		d3.select(this)
			.attr("fill",function(d){if(d.selected != true){return nodeColor;} else {return selectedColor;}});
	}
}

function SelectNode(nodeId){
	if(nodeId == null || nodeId == ""){
		if(nodeId != 0){
			ClearGraph();
			return;
		}
	}

	currentEgo = nodeId;

	egonet = Egonet(nodeId);
	DrawGraph(egonet.nodes, egonet.links);

	chart.selectAll("circle").attr("fill", function(d){
		if(d.id == nodeId){
			d.selected = true;
			return selectedColor;
		} else {
			d.selected = false;
			return nodeColor;
		}
	});

	if(updateGraph){
		d3.selectAll("circle").classed("fixed", function(d){
			if(d.id != currentEgo){
				d.fixed = false; 
				d.fx = null; 
				d.fy = null; 
				return false;
			} else {
				d.fx = chartWidth / 2;
				d.fy = chartHeight / 2;
			}
		});
	} else {
		d3.selectAll("circle").classed("fixed", function(d){
			if(d.id == currentEgo){
				d.fx = chartWidth / 2;
				d.fy = chartHeight / 2;
			} else {
				d.fx = d.x; 
				d.fy = d.y; 
			}
			d.fixed = true; 
			return true;
		});
	}

	forces.alphaTarget(0.1).restart();
}

function Egonet(nodeId){ //returns the egonet of a node given its ID
	egonetNodes = [];
	egonetLinks = [];
	egonetNodes.push(jsonNodeOfId(nodeId,allNodes));
	
	for(var i = 0; i < allLinks.length; i++){
		if(allLinks[i].source.id == nodeId && allLinks[i].weight != 0){
			if(egonetNodes.includes(allLinks[i].target) == false)
				egonetNodes.push(allLinks[i].target);
		}
		if(allLinks[i].target.id == nodeId && allLinks[i].weight != 0){
			if(egonetNodes.includes(allLinks[i].source) == false)
				egonetNodes.push(allLinks[i].source);
		}
	}
	egonetLinks = egonetLinks.concat(LinksBetweenNodes(egonetNodes));
	return {
		nodes : egonetNodes,
		links : egonetLinks
	}
}

function jsonNodeOfId(nodeId,nodes){ // Returns a node object given its ID
	for(var i = 0; i < nodes.length; i++){
		if(nodes[i].id == nodeId)
			return nodes[i];
	}
}

function LinksBetweenNodes(nodes){ // Returns every link connecting argument nodes
	links = [];
	for(var i = 0;i<allLinks.length;i++){
		for(var j = 0;j<nodes.length;j++){
			for(var k = 0;k<nodes.length;k++){
				if(allLinks[i].source.id == nodes[j].id && allLinks[i].target.id == nodes[k].id)
					if(links.includes(allLinks[i]) == false)
						links.push(allLinks[i]);
				if(allLinks[i].source.id == nodes[k].id && allLinks[i].target.id == nodes[j].id)
					if(links.includes(allLinks[i]) == false)
						links.push(allLinks[i]);
			}
		}
	}
	return links;
}

function ToggleWeights(){
	displayWeights = !displayWeights;
	if(directedGraph){
		//Weighted Directional Graphs Not Yet Implemented
	} else {
		chart.selectAll("line").attr("stroke-width",function(d){
			if(displayEgo == false){
				if(d.source.id == currentEgo || d.target.id == currentEgo){
					return 0;
				} else {
					if(displayWeights){
						return NormalizeWeight(d.weight, FindLargestWeight(currentGraph.links));
					} else {
						if(d.weight != 0){
							return 1;
						} else {
							return 0;
						}
					}
				}
			} else {
				if(displayWeights){
					return NormalizeWeight(d.weight, FindLargestWeight(currentGraph.links));
				} else {
					if(d.weight != 0){
						return 1;
					} else {
						return 0;
					}
				}
			}
		});
	}
}

function ToggleEgo(){
	displayEgo = !displayEgo;

	chart.selectAll("circle").attr("r", function(d){ // Togle Circle Element
		if(d.id == currentEgo){
			if(displayEgo){
				return 12;
			} else {
				return 0;
			}
		} else {
			return 7;
		}
	}); 

	if(directedGraph == false){ // Toggle Line and Path Elements
		chart.selectAll("line").attr("stroke-width", function(d){
			if(d.source.id == currentEgo || d.target.id == currentEgo){
				if(displayEgo){
					if(displayWeights){
						return NormalizeWeight(d.weight, FindLargestWeight(currentGraph.links));
					} else {
						return 1;
					}
				} else {
					return 0;
				}
			} else {
				if(displayWeights){
					return NormalizeWeight(d.weight, FindLargestWeight(currentGraph.links));
				} else {
					if(d.weight != 0){
						return 1;
					} else {
						return 0;
					}
				}
			}
		});
	} 
}

function ToggleArrows(){
	displayArrows = !displayArrows; 
	Update();
}

function LinkByNode(links){ // Sets the source/target info in a link object to a node object instead of integer ID's
	for(var i = 0; i < links.length; i++){
		if (links[i].source === parseInt(links[i].source, 10)){ //if the source is an integer
		    links[i].source = jsonNodeOfId(links[i].source,allNodes);
			links[i].target = jsonNodeOfId(links[i].target,allNodes);
		}
	}
}

function CenterNodes(nodes){ // Initializes node positions to a random position near the center of the chart
	for(var i = 0; i < nodes.length; i++){
		
		r = Math.floor(Math.random()*25) + 200;
		theta = Math.floor(Math.random()*6.28);
		randomX = r*Math.cos(theta);
		randomY = r*Math.sin(theta);

		nodes[i].x = (chartWidth / 2) + randomX;
		nodes[i].y = (chartHeight / 2) + randomY;
	}
}

function ClearGraph(){
	currentEgo = null;
	currentGraph.nodes = [];
	currentGraph.links = [];
	chart.selectAll("circle").remove();
	chart.selectAll("line").remove();
	chart.selectAll("path").remove();
	chart.selectAll("g").remove();
}

function FindLargestWeight(links){
	var weight = 0;
	for(var i = 0; i < links.length; i++){
		if(links[i].weight >= weight)
			weight = links[i].weight;
	}
	return weight;
}

function NormalizeWeight(weight, largestWeight){
	return (weight / largestWeight) * 7; // 7 is max aesthetic line thickness; can be changed.
}

function RemoveDoubleLinks(links){ // removes one link from links which are the reverse of each other. e.g. {source: a target: b}{source: b target: a}
	var newLinks = [];
	for(var i = 0; i < links.length; i++){
		doubleLink = false;
		for(var j = 0; j < links.length; j++){
			if(links[i].source.id == links[j].target.id && links[i].target.id == links[j].source.id){
				doubleLink = true;
				secondLink = links[j];
				break;
			}
		}
		if(doubleLink){
			if(links[i].source.id < secondLink.source.id)
				newLinks.push(links[i]);
		} else {
			newLinks.push(links[i]);
		}
	}
	return newLinks;
}

function ToggleUpdates(){
	updateGraph = !updateGraph;
	if(updateGraph){
		d3.selectAll("circle").classed("fixed", function(d){
			if(d.id != currentEgo){
				d.fixed = false; 
				d.fx = null; 
				d.fy = null; 
				return false;
			}
		});
	} else {
		d3.selectAll("circle").classed("fixed", function(d){
			d.fixed = true; 
			d.fx = d.x; 
			d.fy = d.y; 
			return true;
		});
	}
}

function UpdateLinkStrength(){
	var strength = document.getElementById("linkStrengthSlider").value / 1000;
	if(directedGraph){
		forces.force("linking spring")
			.links(RemoveDoubleLinks(currentGraph.links))
			.strength(strength);
	} else {
		forces.force("linking spring")
			.links(currentGraph.links)
			.strength(strength);
	}

	forces.alphaTarget(0.1).restart();
}