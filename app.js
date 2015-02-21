angular.module("myapp",[])
	.controller("MapController",["$scope","MapService", function ($scope,MapService) {
	    var point = new google.maps.LatLng(32.700542, 128.831537);
	    var zoom = 15;
	    var scope = $scope;

	    $scope.wayId = "No way selected"
	    $scope.wayWidth = 5
	    $scope.carWidth = 1.7
	    $scope.cars = [
	    	{name: "TOYOTA COROLLA", width: 1.7},
	    	{name: "SUZUKI WagonR", width: 1.48},
	    	{name: "Lamborghini Aventador", width: 2.030}
	    ];

	    MapService.initMap(point,zoom);
	    MapService.showWayWidth($scope.carWidth);


	    $scope.onSubmit = function () {
	    	MapService.reviseWayWidth($scope.wayId,$scope.wayWidth,$scope.wayWidth);
	    }

	    $scope.onChange = function () {
	    	alert($scope.carWidth)
	    	MapService.refleshWayWidth($scope.carWidth);
	    }

	    MapService.setOnClickFunc($scope,function (wayId) {
	    	$scope.wayId = wayId
	    })

	}])

	.factory("MapService", ["$http","$q", function ($http,$q) {

	    var nodesUrl = "http://localinnovation.net/game_hackathon/getdata_nodes.php"
	    var waysUrl = "http://localinnovation.net/game_hackathon/getdata_ways.php"

		var map;
		var nodes = [];
		var ways;
		var lines = [];
		var carWidth;
		var onClickFunc;

		function initMap(point,zoom) {
			map = new google.maps.Map(document.getElementById("map"), {
				mapTypeId: google.maps.MapTypeId.ROADMAP,
				center: point,
				zoom: zoom
			});

			infowindow = new google.maps.InfoWindow();
			service = new google.maps.places.PlacesService(map);
		}

		function showWayWidth(_carWidth) {
			carWidth = _carWidth
			getData(function () {
				drawLines();
			})

		}

		function refleshWayWidth(_carWidth) {
			clearLines();
			clearData();

			carWidth = _carWidth
			getData(function () {
				drawLines();
			})
		}

		function getData(callback) {
			var nodes_promise = $http({
				method: 'GET',
				url: nodesUrl,
				timeout: 100000
			}).success(function (data) {
				// ways.concat(data);
				for (var i=0; i<data.length; i++) {
					nodes[data[i].id] = {
						lat: data[i].lat,
						lon: data[i].lon
					}
				}
			});

			var ways_promise = $http({
				method: 'GET',
				url: waysUrl,
				timeout: 100000
			}).success(function (data) {
				// nodes.concat(data);
				ways = data
			});

			$q.all([nodes_promise,ways_promise]).then(function () {
				callback();
			});
		}
		function clearData() {
			nodes = [];
			ways = null;
		}

		function drawLines() {
			var cnt = 0
			var lineColor;
			for (var i=0; i<ways.length; i++) {
				line_coords = [];

				if ((0<Number(ways[i]["maxW"])) && (Number(ways[i]["maxW"]) < carWidth*2)) {
					if (Number(ways[i]["maxW"]) < carWidth) {
						lineColor = "#ff0000"
					} else {
						lineColor = "#ffff00"
					}

					for (var j=0; j<ways[i]["nodes"].length; j++) {
						var k = ways[i]["nodes"][j];

						// nodes[k]が存在しない場合を除外
						if (nodes[k]) {
							line_coords.push(new google.maps.LatLng(nodes[k].lat, nodes[k].lon))
						} else {
							cnt++;
						}
					}

					lines[i] = new google.maps.Polyline({
						path: line_coords,
						strokeColor: lineColor,
						strokeOpacity: 1.0,
						strokeWeight: 2
					});

 	 				lines[i].setMap(map);

					var _onClickFunc = (function (_wayId) {
					var wayId = _wayId
						return function () {
							if (onClickFunc) {
								onClickFunc(wayId);
							}
						}
					})(ways[i].id);

					google.maps.event.addListener(lines[i], 'click', _onClickFunc);

				}
			}
		}

		function clearLines() {
			var cnt = 0
			for (var i=0; i<ways.length; i++) {
				if (lines[i]) {
					cnt++;
					lines[i].setMap(null)
				}
			}
			alert(cnt + " lines were deleted")
		}

		function setOnClickFunc(_scope,_func) {
			var func = _func;
			var $scope = _scope;
			onClickFunc = function (wayId) {
				func(wayId);
				$scope.$apply();
			}
		}

		function reviseWayWidth(wayId,minW,maxW) {
			if (isFinite(minW)){
				alert(wayId +","+ minW + "," + maxW)
			} else {
				alert("入力が不適切です");
			}
		}

		return {
			initMap: initMap,
			showWayWidth: showWayWidth,
			refleshWayWidth: refleshWayWidth,
			setOnClickFunc: setOnClickFunc,
			reviseWayWidth: reviseWayWidth
		}
	}])

	.factory("CarService", ["$http", function ($http) {
		function getCars() {
		}
		return {
			getCars: getCars
		}
	}]);
	