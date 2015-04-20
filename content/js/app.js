

var app = angular.module('elf', ["ngRoute", "angular-websocket", "mgcrea.ngStrap.typeahead"]);


/* Routes */
app.config(["$routeProvider", function($routeProvider) {
	$routeProvider
	.when("/etb", {
		templateUrl: "app/partials/einsatztagebuch.html",
		controller: "ElfEtbController"
	})
	.when("/kraefte", {
		templateUrl: "app/partials/kraefte.html",
		controller: "ElfKraefteController"
	})
	.otherwise({
		redirectTo: "/etb"
	});
}]);


/* Websocket */
app.factory("ElfData", function($websocket) {
	var url = "ws://" + window.location.host + "/ws";
	var ws = $websocket(url);
	var now = new Date();
	var elfData = {
		etb: [
			{ts:new Date().setUTCMilliseconds(now.getUTCMilliseconds() - 360000), to:"Pumpe Zellerndorf", from:"EL", msg:"Wasser Marsch!", usr:"LM Schwayer"},
			{ts:new Date().setUTCMilliseconds(now.getUTCMilliseconds() - 480000), to:"EL", from:"Pumpe Zellerndorf", msg:"Zubringleitung fertig", usr:"LM Schwayer"}
		],
		ek: {
			"Zellerndorf-Pumpe":{
				from:new Date().setUTCMilliseconds(now.getUTCMilliseconds() - 360000),
				to:new Date().setUTCMilliseconds(now.getUTCMilliseconds() - 240000),
				fw:"Zellerndorf",
				fzg:"Pumpe",
				ppl:9,
				atsg:0,
				atst:5
			},
			"Zellerndorf-Tank":{
				from:new Date().setUTCMilliseconds(now.getUTCMilliseconds() - 480000),
				to:null,
				fw:"Zellerndorf",
				fzg:"Tank",
				ppl:9,
				atsg:3,
				atst:6
			}
		},
		units: [
			"EL",
			"Pumpe Zellerndorf",
			"Tank Zellerndorf"
		],
		newEtbEntry: function(e) {
			ws.send({typ:"new-etb", data:e});
		}
	};

	ws.onMessage(function(message){
		var msg = JSON.parse(message.data);
		if ((msg.typ === undefined) ||
		    (msg.data === undefined)) {
			return;
		}
		if (msg.typ == "new-etb") {
			elfData.etb.unshift(msg.data);
		}
	});

	return elfData;
});


/* Controllers */
app.controller('ElfEtbController', ["$scope", "ElfData", function($scope, ElfData) {
	$scope.mode = 1;

	var defaultEntry = {
    	to: "",
    	from: "",
    	msg: "",
    	usr: "",
    	edit: false
    };

	var now = new Date();
	$scope.newEntry = $.extend({ts:new Date()}, defaultEntry);
	$scope.newEntry.usr = "LM Schwayer";
	$scope.ElfData = ElfData;
	$scope.etbBefore = {};

	setInterval(function(){
		$scope.$apply(function(){
			$scope.newEntry.ts = new Date();
		});
	},1000);

	$scope.addNewEtbEntry = function() {
		if ($scope.newEntry.to == "") {
			alert("Feld 'An' ist leer.");
			return;
		}
		if ($scope.newEntry.from == "") {
			alert("Feld 'Von' ist leer.");
			return;
		}
		if ($scope.newEntry.msg == "") {
			alert("Feld 'Nachricht' ist leer.");
			return;
		}
		if ($scope.newEntry.usr == "") {
			alert("Feld 'Bearbeiter' ist leer.");
			return;
		}
		var user = $scope.newEntry.usr;
		$scope.ElfData.newEtbEntry($scope.newEntry);
		$scope.newEntry = $.extend({ts:new Date()}, defaultEntry, {usr:user});
		// TODO: Send 'new entry' message to server
	};

	$scope.editEtbEntry = function(i) {
		$scope.etbBefore[i] = angular.extend({},$scope.ElfData.etb[i]);
		$scope.ElfData.etb[i].edit = true;
	}

	$scope.saveEtbEntry = function(i) {
		$scope.ElfData.etb[i].edit = false;
		// TODO: Send 'save entry' message to server
	}
}]);

app.controller("ElfKraefteController", ["$scope", "ElfData", function($scope, ElfData) {
	$scope.mode = 2;
	$scope.ElfData = ElfData;
	$scope.allSums = {};
	$scope.actSums = {};

	$scope.calculateSums = function() {
		var allSums = {
			_fws:{},
			fw:0,
			fzg:0,
			ppl:0,
			atsg:0,
			atst:0
		};
		var actSums = {
			_fws:{},
			fw:0,
			fzg:0,
			ppl:0,
			atsg:0,
			atst:0
		};

		for (k in $scope.ElfData.ek) {
			var item = $scope.ElfData.ek[k];

			allSums._fws[item.fw] = true;
			allSums.fzg += 1;
			allSums.ppl += item.ppl;
			allSums.atsg += item.atsg;
			allSums.atst += item.atst;

			if (item.to === null) {
				actSums._fws[item.fw] = true;
				actSums.fzg += 1;
				actSums.ppl += item.ppl;
				actSums.atsg += item.atsg;
				actSums.atst += item.atst;
			}
		}

		allSums.fw = Object.keys(allSums._fws).length;
		actSums.fw = Object.keys(actSums._fws).length;
		$scope.allSums = allSums;
		$scope.actSums = actSums;
	};

	$scope.calculateSums();
	$scope.$watch(function(scope){ return scope.ElfData; }, function(newValue, oldValue){
		$scope.calculateSums();
	});
}]);


/* Filters */
app.filter('orderObjectBy', function() {
	return function(items, field, reverse) {
		var filtered = [];
		angular.forEach(items, function(item) {
			filtered.push(item);
		});
		filtered.sort(function (a, b) {
			return (a[field] > b[field] ? 1 : -1);
		});
		if(reverse) filtered.reverse();
		return filtered;
	};
});
