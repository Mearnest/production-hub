// prototype class pattern
var PosePart = (function() {
	// private static attributes
	var m = PoseFigure.ScaleFactor(); // scale multiplier
	var o = PoseFigure.OffsetX(); // offset
	var strokeColor = PoseFigure.StrokeColor();
	var isTouch = 'ontouchstart' in document.documentElement;

	//private static methods
	function checkThisOut(someVar) {
		doSomething;
	}

	//return constructor
	return function(idx, configPart) {
		//private attributes
		var name, startPoint, endPoint;
		var drawOrder;
		var drawFromLast = {};
		var midPoints = [];
		var drawIdx;
		var partIdx;
		var tension;
		var numMidPts;
		var diffInMotion;	

		//privileged methods
		this.write = function(toJSON) {
			if (false) {  // Adjust Y offset
				var yOffset = 0.4;
				startPoint[1] = startPoint[1] + yOffset;
				endPoint[1] = endPoint[1] + yOffset;
				for (var i=0; i< midPoints.length; i++) {
					midPoints[i][1] = midPoints[i][1] + yOffset;
				}
			}
			if (false) {  // Adjust X offset
				var xOffset = 0.2;
				startPoint[0] = startPoint[0] + xOffset;
				endPoint[0] = endPoint[0] + xOffset;
				for (var i=0; i< midPoints.length; i++) {
					midPoints[i][0] = midPoints[i][0] + xOffset;
				}
			}
					
			var j = {};
			j.drawOrder = drawOrder;
			j.drawFromLast = drawFromLast;
			j.name = name;
			j.startPoint = startPoint;
			j.midPoints = midPoints;
			j.endPoint = endPoint;
			j.numMidPoints = numMidPts;
			j.tension = tension;
			
			if (toJSON) {
				return JSON.stringify(j);
			} else {
				return j;
			}
		};
		
		this.getXformedPointArray = function() {
			var arrPoints = [];

			// flatten points to array
			$.each(startPoint, function(idx, coord) {
				arrPoints.push(coord*m+o);
			});
			
			$.each(midPoints, function(idx, pair) {
				arrPoints.push(pair[0]*m+o);
				arrPoints.push(pair[1]*m+o);
			});
			
			$.each(endPoint, function(idx, coord) {
				arrPoints.push(coord*m+o);
			});
			
			return arrPoints;	
		};
		
		this.clearPoints = function(layerPoint) {
			//console.log(name, "this clear pts", layerPoint);		
			layerPoint.removeChildren();
		}
	
		this.drawPoints = function(layerPoint) {
			var arrPoints = [];
			var obj = {};
			var point;
			
			this.clearPoints(layerPoint);
			
			//startPoint
			this.drawPoint(layerPoint, startPoint[0]*m+o,startPoint[1]*m+o, "gray");

			//midPoints
			for(var i = 0; i < midPoints.length; i++) {
				this.drawPoint(layerPoint, midPoints[i][0]*m+o,midPoints[i][1]*m+o, "aqua");
			}			
			
			//endPoint
			this.drawPoint(layerPoint, endPoint[0]*m+o,endPoint[1]*m+o, "orange");
				
			layerPoint.draw();
			this.TriggerPartChange(partIdx);
		};
		
		this.drawPoint = function(layerPoint, x, y, color) {
			var container = controller.GetContainer();  // for setting cursor on mouse/touch events
			var obj = {
				x: x,
				y: y,		
				radius: (isTouch == true ? 20 : 5),  // touchscreens need larger circles
				fill: color,
				stroke: 'red',
				strokeWidth: 1,
				draggable: true
			};
			
			var point = new Kinetic.Circle(obj);
			var me = this; // for events 'this' wont work			
			
			point.on('dragmove touchmove', function() {
				if (this.index == 0) {
					this.setDraggable(false);
				} else {
					$(container).css('cursor', 'move');
					if (me.resetMidPoints(this.index, this.getX(), this.getY())) {
						me.TriggerRedraw(diffInMotion);
					}
				}
			});
			
			point.on('dragend touchend', function() {
				$(container).css('cursor', 'default');
				
				if (this.index > 0) {
					if (me.resetMidPoints(this.index, this.getX(), this.getY())) {
						me.TriggerRedraw(diffInMotion);
					}
				}
			});

			point.on('mouseover', function() {
				$(container).css('cursor', 'move');
			});
			
			point.on('mouseout', function() {
				$(container).css('cursor', 'default');
			});				
			
			layerPoint.add(point);
		}
		
		this.resetMidPoints = function(myIndex, myX, myY) {
			//one of the points of this part has moved
			//must reset array of points

			//new midPt
			var refX; 
			var refY;
			
			// startpoint for the changing part cannot move - ignore
			// set midPts
			for(var i = 0; i < midPoints.length; i++) {
				//how match?
				//console.log("reset match",i,myIndex-1);				
				if (i == (myIndex-1)) {
					//console.log("reset success",i,myIndex-1);	
					refX = ((myX-o)/m);
					refY = ((myY-o)/m);	
					midPoints[i] = [refX, refY];				
					return true;		
				}
			}
			
			// set endpoint
			diffInMotion = null;
			if (myIndex != 0) {
				//must be end point, because start point is 0
				refX = ((myX-o)/m);
				refY = ((myY-o)/m);	
				
				//report the diff between old x, new x, old y, new y
				diffInMotion = [(endPoint[0]-refX),(endPoint[1]-refY)];		
				//reset the endPoint
				endPoint = [refX, refY];
				
				return true;
			}
			
			// console.log("new mids", refX, refY);
		}
		
		this.drawPart = function(layerPart, layerPoint, startPointFromLast, diffToDraw) {
			//determine if points need transposing
			if (startPointFromLast) {
				if (diffToDraw) {
					if (PoseFigure.IsInDrawChain(drawIdx)) {
						// the part has a start, is not in motion, and has a diff							
						// console.log(name, "got here", diffToDraw.toString());
						// transpose the midPts
						for (var i = 0; i < midPoints.length; i++) {
							var pt = midPoints[i];
							pt[0] = pt[0] - diffToDraw[0];
							pt[1] = pt[1] - diffToDraw[1];
						}
						//transpose the endPoint
						endPoint[0] = endPoint[0] - diffToDraw[0];
						endPoint[1] = endPoint[1] - diffToDraw[1];
					}
				}
			}
			
			if (startPointFromLast) {
				startPoint = startPointFromLast;
			}
			
			var container = controller.GetContainer();
			var obj = {
				points: this.getXformedPointArray(),
				stroke: strokeColor,
				tension: tension,
				strokeWidth: (isTouch == true ? 24 : 10),
				lineCap:"round",
				lineJoin:"round"
			};
			
			//console.log("draw",obj.points.toString());
			var spline = new Kinetic.Spline(obj);
			var me = this; //for events 'this' wont work
			
			spline.on("mouseover", function() {
				$(container).css("cursor", "pointer");
			});
			
			spline.on("mouseout", function() {
				$(container).css("cursor", "default");
			});
			
			spline.on("click touchstart", function(event) {
				//console.log("click", spline.index, name, drawIdx, this.index);
				me.drawPoints(layerPoint);
				return false;
			});

			layerPart.add(spline);	
			drawIdx = spline.index;
			//console.log(name + " drawIdx set to " + drawIdx);
		};
		
		// layerPoint isn't used, why is it a paramater?
		this.insertMidPoints = function(numMidPts, layerPoint) {
			//console.log("old midpts", midPoints.toString());	
			//clear midPoints
			midPoints = [];
		
			//recalc midPts of part
			//var dist = lineDistance({x:startPoint[0],y:startPoint[1]},
			//	{x:endPoint[0],y:endPoint[1]});
			var num = numMidPts+1;//num must be 2 or above
			var newX;
			var newY;
			
			for(var i = 1; i < num; i++) {
				newX = startPoint[0] + (endPoint[0] - startPoint[0]) * i/num;
				newY = startPoint[1] + (endPoint[1] - startPoint[1]) * i/num;
				midPoints.push([newX, newY]);	
				//console.log("new midpts", i, i/num, midPoints.toString());			
			}
		}

		this.interpolateMidPoints = function(targetNum, layerPoint) {
			//target should be between 1 and 7
			if (numMidPts > 0 && numMidPts < 8) {
				//must be different from existing numpts
				if (midPoints.length != targetNum) {
					var diff = Math.abs(midPoints.length - targetNum);

					if (midPoints.length < targetNum) {
						//add points at each end
						//console.log("will add " + diff);
						for(var i = 0; i < diff; i++) {
							if (i % 2 == 0) {
								//add pt to end
								console.log("add to end",i);
								midPoints.push(getMidPt(midPoints[midPoints.length-1], endPoint));
							} else {
								//add pt to start
								//console.log("add to start",i);
								midPoints.unshift(getMidPt(startPoint, midPoints[0]));
							}
						}
					} else {
						//subtract points at each end
						//console.log("will drop " + diff);
						for(var i = 0; i < diff; i++) {
							if (i % 2 == 0) {
								//subtract pt from end
								//console.log("drop from end",i);
								midPoints.pop();
							} else {
								//subtract pt from start
								//console.log("drop from start",i);
								midPoints.shift();
							}
						}
					} //same num - do nothing
				} //incorrect num pts - do nothing
			}
			
		function getMidPt(ptA, ptB) {
				console.log(ptA,ptB);
				console.log([(ptA[0] + (ptB[0] - ptA[0])/2),(ptA[1] + (ptB[1] - ptA[1])/2)]);
				return [(ptA[0] + (ptB[0] - ptA[0])/2),(ptA[1] + (ptB[1] - ptA[1])/2)];	
			}
		}
		
		this.setDrawIdx = function(idx) {
			drawIdx = idx;
		};
		
		this.getName = function() {
			//console.log("Clicked", name);
			return name;
		};
		
		this.getDrawFromLast = function() {
			return drawFromLast;
		};
		
		this.getNextStartPoint = function(which) {
			if (which == "start") {
				return startPoint;
			} else {
				return endPoint;
			}
		};
		
		this.setTension = function(val) {
			//console.log(name,"old tension", tension);
			tension = val;
			//console.log(name,"new tension", tension);
			this.TriggerRedraw();
		};

		this.setNumMidPts = function(val, layerPoint) {
			//console.log(name,"old num", numMidPts);
			numMidPts = val;			
			this.interpolateMidPoints(numMidPts, layerPoint);			
			this.drawPoints(layerPoint);
			this.TriggerRedraw();
			//console.log(name,"new num", numMidPts);			
		};
		
		this.setScaleFactor = function(val) {
			m = val;
		}
		
		this.getScaleFactor = function() {
			return m;
		}
		
		this.setStrokeColor = function(val) {
			strokeColor = val;
		}
		
		this.getStrokeColor = function() {
			return strokeColor;
		}

		//constructor code
		// why not set private vars to passed in params when they are defined?
		partIdx = idx;
		name = configPart.name;
		
		startPoint = configPart.startPoint;		
		endPoint = configPart.endPoint;
		
		drawOrder = configPart.drawOrder;
		drawFromLast = configPart.drawFromLast;

		tension = configPart.tension;
		numMidPts = configPart.numMidPts;  // Incorrect - configPart.numMidPoints
		
		// Is there eer a case when midPoints is an empty array?
		if (configPart.midPoints.length == 0) {
			this.insertMidPoints(numMidPts);
		} else {
			midPoints = configPart.midPoints;
		}	
	}
})();

//public static method
// PosePart.PoseParent = function(obj) {
// 	this.setParent(obj);
// 
// };

// public nonprivileged methods
PosePart.prototype = {
	Draw: function(layerPart, layerPoint, startPointFromLast, diffToDraw) {
		// console.log("drawing " + this.getName());
		this.drawPart(layerPart, layerPoint, startPointFromLast, diffToDraw);
	},
	
	Scale: function() {
		this.setScaleFactor(PoseFigure.ScaleFactor());
	},
	
	Color: function() {
		this.setStrokeColor(PoseFigure.StrokeColor());
	},
	
	TriggerRedraw: function(diffInMotion) {		
		controller.RedrawFigure(diffInMotion);
	},
	
	TriggerPartChange: function(idx) {	
		controller.SetActivePart(idx);
	},
	
	GetDrawFromLast: function(callback) {
		return this.getDrawFromLast();
		callback();
	},
	
	GetNextStartPoint: function(which) {		
		return this.getNextStartPoint(which);
	},
	
	GetName: function() {
		return this.getName();
	},
	
	SetTension: function(val) {
		this.setTension(val);
	},
	
	SetNumMidPts: function(val, layerPoint) {
		this.setNumMidPts(val, layerPoint);
	},
	
	Write: function(toJSON) {
		return this.write(toJSON);
	}	
};
