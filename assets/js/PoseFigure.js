var PoseFigure = (function() {
	// private static attributes

	// private static methods

	// return constructor
	return function(poseConfig) {
		
		// private attributes
		var name;
		var parts = [];
		
		// privileged methods
		this.getParts = function() {
			return parts;
		};
		
		this.getStartPointFromLast = function(partId) {
			var drawNow = parts[partId];
			var drawFromLast = drawNow.GetDrawFromLast();
			// console.log("DRAW drawNow Name: ", drawNow.GetName(), "drawFromLast: ", drawFromLast.part, "at", drawFromLast.site);
			
			// loop the parts to find the last part's index
			for(var k = 0; k < parts.length; k++) {
				if (parts[k].GetName() == drawFromLast.part) {					
					return parts[k].GetNextStartPoint(drawFromLast.site);
				}
			}	
			// assume main startpoint
			return false;				
		};
						
		this.drawAllParts = function(layerParts, layerPoints, diffInMotion, partName) {
			// must draw in order, and retrieve the attachment startPoint from previous
			// loop the parts in draw order 
			for (var j = 0; j < parts.length; j++) {
				var startPoint = this.getStartPointFromLast(j);	
				if (!startPoint) {			
					// console.log("drawAllParts no startPoint", j);
				}

				parts[j].Draw(layerParts, layerPoints, startPoint, diffInMotion, partName);
			}					
		};	
		
		this.scaleAllParts = function() {
			for (var j = 0; j < parts.length; j++) {
				parts[j].Scale();
			}
		}
		
		this.colorAllParts = function() {
			for (var j = 0; j < parts.length; j++) {
				parts[j].Color();
			}
		}
		
		// Export the poser information as an object or JSON string
		this.writeFile = function(poseName, toJSON) {
			poseName = poseName || name;
			var figureParts = [];
			
			if (toJSON) {
				var beginTxt = [];
				var mainTxt = [];
				var endTxt = [];

				// beginTxt.push("Pose[\"" + poseName + "\"] = {");
				// For storage in Mongo, don't use the PoseFile variable name.
				beginTxt.push("\t{");
				beginTxt.push("\t\t\"name\": \"" + poseName + "\",");
				beginTxt.push("\t\t\"parts\": [");
				
				for(var i = 0; i < parts.length; i++) {
					mainTxt.push(parts[i].Write(toJSON));
				}
				
				endTxt.push("]");
				endTxt.push("\t}");
				return beginTxt.join('\n') + mainTxt.join(',\n\t\t') + endTxt.join('\n'); 
			}
			else {
				for(var i = 0; i < parts.length; i++) {
					figureParts.push(parts[i].Write(toJSON));
				}
				return {"name": poseName, "parts": figureParts};
			}
		};	

		// constructor code
		name = poseConfig.name;
		if (false) {
			console.log("constructing new PoseFigure with name " + name);
		}
		
		poseConfig.parts.sort(function(a,b) { return a.drawOrder-b.drawOrder });
		
		$.each(poseConfig.parts, function(idx, prt) {
			var newPart = new PosePart(idx, prt);			
			parts.push(newPart);
		});
	}
})();

// Public static attributes
PoseFigure.scaleFactor = 60; // 75
PoseFigure.strokeColor = "black";

// Public static methods
PoseFigure.ScaleFactor = function(val) {
	if (val) {
		PoseFigure.scaleFactor = val;
		controller.RescaleFigure();
	}
	
	return PoseFigure.scaleFactor;
};

PoseFigure.StrokeColor = function(val) {
	if (val) {
		PoseFigure.strokeColor = val;
		controller.RecolorFigure();
	}
	
	return PoseFigure.strokeColor;
};

PoseFigure.OffsetX = function() {
	return 50;
};

PoseFigure.OffsetY = function() {
	return 50;
};

PoseFigure.DrawChain = function() {
	var chain = {};
	chain[0] = [7,8,9,10];
	chain[1] = [2];
	chain[2] = [];
	chain[3] = [5];
	chain[4] = [6];
	chain[5] = [];
	chain[6] = [];		
	chain[7] = [9];
	chain[8] = [10];
	chain[9] = [];
	chain[10] = [];	
	
	return chain;
};

PoseFigure.IsInDrawChain = function (drawIdx) {
	var res = false;
	var activePartIndex = controller.GetActivePartIndex();

	$.each(PoseFigure.DrawChain()[activePartIndex], function(idx,partInChain) {
		// console.log("isInDrawChain", activePartIndex, drawIdx, partInChain, drawIdx == partInChain);
		if (drawIdx == partInChain) {
			res = true;
		}
	});
	
	return res;
};

//public nonprivileged methods
PoseFigure.prototype = {
	Draw: function(layerParts, layerPoints, diffInMotion, partName) {
		layerParts.removeChildren();
		this.currentPartName = partName;	
		this.drawAllParts(layerParts, layerPoints, diffInMotion, partName);		
		layerParts.draw();
	},
	
	Scale: function() {
		this.scaleAllParts();
	},
	
	Color: function() {
		this.colorAllParts();
	},
	
	GetParts: function() {
		return this.getParts();
	},
	
	Write: function(poseName, toJSON) {
		return this.writeFile(poseName, toJSON);
	}
};
