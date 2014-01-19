var PoseController = (function() {

	//private static attributes
	var stage,
		figure,
		layerParts,
		layerPoints,
		activePartIndex,
		isPart;
		
	//private static methods

	//return constructor
	return function() {
		//private attributes
		
		//privileged methods
				
		this.makePoseSelector = function() {	
			var c=[];
			
			c.push("Starting Pose: <select id='poses'></select>");
			return c.join('');
		};
			
		this.makeTensionSelector = function() {	
			var c=[];	
			
			c.push('<br/>Tension:');
			c.push('<input type="number" min="0.0" max="1.0" step="0.2" value="0.0" id="tension"></input>');
			
			return c.join('');
		};
				
		this.makeNumberPointsSelector = function(){	
			var c=[];
			
			c.push('<br/># Mid Points:');
			c.push('<input type="number" min="1" max="7" step="1" value="1" id="num-midpoints"></input>');
			
			return c.join('');
		};	
		
		this.makeScaleFactorSelector = function(){	
			var c=[];
		
			c.push('<br/>Scale Factor:');
			c.push('<input type="number" min="20" max="100" step="1" value="75" id="scale-factor"></input>');
			return c.join('');
		};	

		this.makeColorSelector = function(){	
			var c=[];
		
			c.push('<br/>Pose Color:');
			c.push('<input type="color" value="#000" id="pose-color"></input>');
			return c.join('');
		};	

		this.makeDownloadControls = function() {
			var c=[];	
			
			c.push('<p><a class="poser-export" id="downloadImage" href="#" download="stickposer.png">Download</a>');
			c.push('<a class="poser-export" id="saveToLibrary" href="#">Save to Library</a></p>');
			c.push("<div id='saveToLibraryMsg'></div>");
			
			return c.join('');
		};
		
		this.makeSaveControls = function() {
			var c=[];	
			
			c.push("<input type='button' class='btn-warning' id='getFile' value='Get File Text'></input> ");
			c.push("<br/><textarea id='writeFile' rows='5'></textarea> ");
			c.push("<br/>Note: Copy and Paste code into PoseFile.js.");
			
			return c.join('');
		};
		
		this.makeExportControls = function() {
			var c=[];	
			
			c.push("<p><input type='button' id='exportImage' class='btn-success' value='Export Image'></input></p>");
			c.push("<p><img id='exportedImage' src='' style='height: 150px'></p>");
			c.push("</p>");
			
			return c.join('');
		}
		
		this.makeAllHtml = function() {
			var c=[];	
		
			c.push("<div id='mainCtl' class='pose_controller'>");			
				c.push("<div id='posesCtl' class='pose_controller_sub'>" + this.makePoseSelector() + "</div>");
				c.push("<div id='tensionCtl' class='pose_controller_sub'>" + this.makeTensionSelector() + "</div>");
				c.push("<div id='numPointsCtl' class='pose_controller_sub'>" + this.makeNumberPointsSelector() + "</div>");
				c.push("<div id='scaleFactorCtl' class='pose_controller_sub'>" + this.makeScaleFactorSelector() + "</div>");
				c.push("<div id='scaleFactorCtl' class='pose_controller_sub'>" + this.makeColorSelector() + "</div>");
				c.push("<div id='downloadCtl' class='pose_controller_sub'>" + this.makeDownloadControls() + "</div>");
				c.push("<div id='saveCtl' class='pose_controller_sub'>" + this.makeSaveControls() + "</div>");
				c.push("<div id='exportCtl' class='pose_controller_sub'>" + this.makeExportControls() + "</div>");
			c.push("</div>");		
		
			return c.join("");		
		};
		
		this.initializeStage = function(w, h) {
			stage = new Kinetic.Stage({
				container: 'poser-container',
				width: w || 500,  // 600
				height: h || 600,  // 600
			});

			layerParts = new Kinetic.Layer();
			layerPoints = new Kinetic.Layer();
			stage.add(layerParts);
			stage.add(layerPoints);
			
			// Either the default figure from database or user's figure stored in the browser session.
			figure = this.getStickPose();	
			figure.Draw(layerParts, layerPoints);
		}
		
		this.initializeEvents = function() {
			this.initializeStage();
			
			$.each(Pose, function(idx, pose) {
				if (!figure.stored && pose.name == "BASE") {
					$('<option selected="selected">').val(idx).text(pose.name).appendTo('#poses');
				}
				else {
					$('<option>').val(idx).text(pose.name).appendTo('#poses');
				}
			});	
			
			// If the figure was stored, add an additional option for the user stored figure
			if (figure.stored) {
				$('<option selected="selected">').val($('#poses > option').length).text(figure.name).appendTo('#poses');
			}
				
			$("#poser-container").on("click", function() {
				clickTimer = setTimeout(function() {
					if (!isPart) {
						layerPoints.clear();				
					} 
					isPart = false;
				}, 500);
			});
	
			$("#tension").on("change", function() {
				var num = $(this).val();

				figure.GetParts()[activePartIndex].SetTension(parseFloat(num));
			});
	
			$("#num-midpoints").on("change", function() {
				var num = $(this).val();

				figure.GetParts()[activePartIndex].SetNumMidPts(parseInt(num), layerPoints);
			}); 	
			
			$('#scale-factor').on("change", function() {
				var num = $(this).val();
				
				PoseFigure.ScaleFactor(num);
			}); 
			
			$('#pose-color').on("change", function() {
				var color = $(this).val();
				console.log(color);
				
				PoseFigure.StrokeColor(color);
			}); 
			
			$("#exportImage").on("click", function() {
				var dataURL = layerParts.toDataURL();
				
				$("#exportedImage").attr("src", dataURL);
				$("#downloadImage").attr("href", dataURL);
				
				$("body").scrollTo("#exportedImage");
			});
			
			$("#downloadImage").on("click", function() {
				var dataURL = layerParts.toDataURL();
				
				$(this).attr("href", dataURL);
				console.log(dataURL);
				
				return true;
			});
			
			$("#saveToLibrary").on("click", function(event) {
				event.preventDefault();
				
				var stickFigure = null;
				var name = prompt("Enter Name");
				
				if (name) {
					stickFigure = figure.Write(name);
					// console.log(stickFigure);
					
					$.post("/library", {"stickFigure": stickFigure}, function(data) {
						if (data.error) {
							$("#saveToLibraryMsg").html('<stron class="error">' + data.message + '</strong>');
						}
						// Need to get updated stickPoserCollection
						// And update the drop down list
						else {
							Pose = data.poserList;
							$("#saveToLibraryMsg").html('<strong>' + data.message + '</strong>');
							
							$("#poses").empty();	// clear all values first
							$.each(Pose, function(idx, pose){
								// console.log(pose);
								if (pose.name == stickFigure.name) {
									$('<option selected="selected">').val(idx).text(pose.name).appendTo('#poses');
								}
								else {
									$('<option>').val(idx).text(pose.name).appendTo('#poses');
								}
							});	
						}
					});
				}
			});	
	
			$("#getFile").on("click", function() {
				var txt = "";
				var toJSON = true;
				var name = prompt("Enter Name");
				
				if (name) {
					txt = figure.Write(name, toJSON);
					$("#writeFile").text(txt);
				}
			});	
	
			$('#poses').on('change', function() {
				if ($('option:selected', $(this)).text() == "Current") {
					// Get the currently stored stick pose
					if (controller) {
						figure = controller.getStickPose();
					}
					else if (sessionStorage && sessionStorage.stickPose) {
						var storedPose = JSON.parse(sessionStorage.stickPose);
						figure = new PoseFigure(storedPose);
					}
					// Otherwise, the stored stick pose got deleted, so go with the first one.
					else {
						figure = new PoseFigure(Pose[0]);
					}
				}
				else {
					figure = new PoseFigure(Pose[this.value]);
				}
				
				figure.Draw(layerParts, layerPoints);	
			});
		};
		
		this.redrawFigure = function(diffInMotion, currentPartName) {
			figure.Draw(layerParts, layerPoints, diffInMotion, currentPartName);
		};
		
		this.rescaleFigure = function() {
			figure.Scale();
		};
		
		this.recolorFigure = function() {
			figure.Color();
		};
		
		this.setActivePart = function(part_idx) {
			activePartIndex = part_idx;
			isPart = true;
		};
		
		this.getActivePartIndex = function() {
			return activePartIndex;
		};
		
		// Sometimes need to get the figure's image url.
		this.getDataURL = function() {
			return layerParts.toDataURL();
		};
		
		// Store the current user's stick figure in the browser session
		this.storeStickPose = function() {
			if (typeof(Storage) !== "undefined") {
				var storedPose = figure.Write();
				storedPose.name = "Current";
				sessionStorage.stickPose = JSON.stringify(storedPose);
			}
		};
		
		// Retrieve the user's working stick figure if it exists
		this.getStickPose = function() {
			if (typeof(Storage) !== "undefined") {
				var storedPose;
				var newPose;	// the PoseFigue to be created from session storage or the default Pose
				
				// Make sure there is a stick pose object
				if (sessionStorage.stickPose) {
					storedPose = JSON.parse(sessionStorage.stickPose);
					
					// Make sure this object has a relevant property
					if (storedPose.name) {
						newPose = new PoseFigure(storedPose);
						newPose.stored = true;
						newPose.name = storedPose.name;
						return newPose;
					}
				}
			};
			
			// There's no stored figure, so create a new default one
			if (Pose.find) {
				newPose = new PoseFigure(Pose.find("BASE"));
			} else {
				console.log("getting first pose figure");
				newPose = new PoseFigure(Pose[0]);
			}
			
			newPose.stored = false;
			return newPose;
		}
		
		// Make the canvas div available for setting the cursor property with different events.
		this.getContainer = function() {
			return stage.attrs.container;
		}
		
		this.getFigure = function() {
			return figure;
		}
		
		this.getLayerParts = function() {
			return layerParts;
		}

		// constructor code
		
		// Add a find method to the Pose figure array.
		if (Pose) {
			Pose.find = function(name) {
				for (var i = 0; i < this.length; i++) {
					if (this[i].name == name) {
						return this[i];
					}
				}
				return null;
			}
		}
		
		// Have the current Pose be stored in the browser when the user leaves the page.
		$(window).unload(function() {
			controller.storeStickPose();
		});
		
		// Add scrollTo plugin to jQuery
		$.fn.scrollTo = function( target, options, callback ) {
			if (typeof options == 'function' && arguments.length == 2) { 
				callback = options; options = target; 
			}
			var settings = $.extend({
					scrollTarget	: target,
					offsetTop		 : 50,
					duration			: 500,
					easing			: 'swing'
			}, options);
			return this.each(function(){
				var scrollPane = $(this);
				var scrollTarget = (typeof settings.scrollTarget == "number") ? settings.scrollTarget : $(settings.scrollTarget);
				var scrollY = (typeof scrollTarget == "number") ? scrollTarget : scrollTarget.offset().top + scrollPane.scrollTop() - parseInt(settings.offsetTop);
				scrollPane.animate({scrollTop : scrollY }, parseInt(settings.duration), settings.easing, function() {
					if (typeof callback == 'function') { 
						callback.call(this); 
					}
				});
			});
		}
	}
})();

//public static method
//PoseController.StaticMethod = function() {
//	return 100;
//};
 	
// public nonprivileged methods
PoseController.prototype = {
	Build: function(elName){
		var el = $("#" + elName).get();
		$("#"+elName).append(this.makeAllHtml());
		this.initializeEvents();
	},
	
	SetActivePart: function(part_idx) {
		this.setActivePart(part_idx);
	},
	
	RedrawFigure: function(diffInMotion, currentPartName) {
		this.redrawFigure(diffInMotion, currentPartName);
	},
	
	RescaleFigure: function() {
		this.rescaleFigure();
		this.redrawFigure();
	},
	
	RecolorFigure: function() {
		this.recolorFigure();
		this.redrawFigure();
	},
	
	GetActivePartIndex: function() {
		return this.getActivePartIndex();
	},
	
	GetContainer: function() {
		return this.getContainer();
	}
};
