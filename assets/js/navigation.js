$(document).ready(function() {
	BooksForLife.assignAjaxLinks();
	BooksForLife.assignVideoLinks();
	
	// An event that fires when the user hits the browser back, forward or refresh.
	// This works in conjunction with window.history.pushState.
	window.onpopstate = function(event) {
		if (event.state) {
			console.log("location: " + document.location + ", state: " + JSON.stringify(event.state));
			BooksForLife.ajaxCall(document.location, event.state.title, event.state.sidebar, event.state.topNav);
		}
	}
});

// BFL namespace for avoiding global conflicts.
var BooksForLife = {
	// Add an event handler for all the hyperlinks in the given content with an ajax class.
	assignAjaxLinks:  function() {
		$("a.ajax").click(function(event) {
			event.preventDefault();
			
			var page = $(this).attr("href");
			var title = $(this).attr("data-title");
			var sidebar = $(this).attr("data-nav-side");
			var topNav = $(this).attr("data-nav-top");
			
			if (sidebar === "remove") {
				$("div.sidebar").hide();
				$("div.main").removeClass("col-xs-8");
				$("div.main").addClass("col-xs-12");
				sidebar = null;
			}
			
			if (topNav === "remove") {
				$("div.top-nav .wrapper").hide();
				topNav = null;
			}
			
			// Modify the browser history to keep up with ajax calls so that back, forward and refresh still work.
			var objState = { "title": title, "sidebar": sidebar, "topNav": topNav }; 
			window.history.pushState(objState, title, page);
			
			// console.log("ajax links set");
			console.log(objState);
			
			BooksForLife.ajaxCall(page, title, sidebar, topNav);
		});
	},

	// And this is the ajax call.
	// Page is the route to get.
	// Title is the page title of that route.
	// Nav is any navigation to load in a navigation div.
	ajaxCall: function (page, title, sidebar, topNav) {
		// If this isn't the next link
		$("a.ajax img").removeClass("active");
		$("a.ajax[data-title='" + title + "'] img").addClass("active");
		
		if (topNav) {
			$("div.top-nav .wrapper").fadeOut("fast", function() {
				$.get(topNav + "/ajax", function(data) {
					$("div.top-nav .wrapper").html(data);
					// Need to assign click handlers for new content.
					BooksForLife.assignAjaxLinks();
					
					$("div.top-nav .wrapper").fadeIn("fast", function() {
						// fade in
					});
				});
			});
		}
		
		// If there is a navigation to be loaded, then ask for it.
		if (sidebar) {
			if ($("div.sidebar").css("display") === "none") {
				$("div.main").removeClass("col-xs-12");
				$("div.main").addClass("col-xs-8");
				$("div.sidebar").show();
			}
			
			$("div.sidebar").fadeOut("fast", function() {
				$.get(sidebar + "/ajax", function(data) {
					$("div.sidebar").html(data);
					
					// Need to assign click handlers for new content.
					BooksForLife.assignAjaxLinks();
					BooksForLife.assignVideoLinks();
					
					$("div.sidebar").fadeIn("fast", function() {
						// fade in
					});
				});
			});
		}
			
		$("div.main .wrapper").fadeOut("fast", function() {
			$.get(page + "/ajax", function(data) {
				$("div.main .wrapper").html(data);
				
				$("div.main .wrapper").fadeIn("fast", function() {
					// fade in
				});
			});
		});
	},
	
	// For links with a video class, replace the iframe source with the link's youtube video url.
	assignVideoLinks: function() {
		$("a.video").click(function(event) {
			event.preventDefault();
			var page = $(this).attr("href");
			var title = $(this).attr("data-title");
			var url = BooksForLife.videos[title].url;
			
			// If the iframe doesn't exist, get it fromt he server.
			if ($("iframe.video").length === 0) {
				// console.log("get the iframe");
				
				$.get(page + "/ajax", function(data) {
					$("div.main .wrapper").html(data);
				});
			}
			else {
				$("iframe.video").attr("src", "//www.youtube.com/embed/" + url);
			}
		});
	},
	
	// Redundant - need to consolidate video info in one place.
	videos: {
		"structure": {
			"title": "Structure of a Lesson",
			"url": "MbQpDsP6AzU",
		},
		"importance": {
			"title": "Importance of Introduction",
			"url": "2L1yR5NGxOA",
		},
		"venn": {
			"title": "Venn Diagram",
			"url": "LZrLfgVYVNY",
		},
		"numerals": {
			"title": "Numerals",
			"url": "kGEzAMT6I34",
		},
	}
}

// Use arrow keys to go forward and backward - maybe only for the manual navigation.
$(document).keydown(function(e) {
    if (e.keyCode == 37) { 
       history.back();
       return false;
    } 
	else if(e.keyCode == 39) {
		history.forward();
		return false;
	}
});