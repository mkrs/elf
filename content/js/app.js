

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
	var nowMsec = now.getUTCMilliseconds();
	var elfData = {
		_id: 0,
		newId: function() {
			this._id %= 1000000;
			this._id += 1;
			return this._id;
		},
		etb: {},
		ek: {},
		units: [
			"EL",
			"Pumpe Zellerndorf",
			"Tank Zellerndorf"
		],
		newEtbEntry: function(e) {
			ws.send({typ:"new-etb", data:e});
		},
		updateEtbEntry: function(e) {
			ws.send({typ:"update-etb", data:e});
		}
	};

	var id = elfData.newId();
	elfData.etb[id] = {id:id, ts:new Date().setUTCMilliseconds(nowMsec - 360000), to:"Pumpe Zellerndorf", from:"EL", msg:"Wasser Marsch!", usr:"LM Schwayer"};
	id = elfData.newId();
	elfData.etb[id] = {id:id, ts:new Date().setUTCMilliseconds(nowMsec - 480000), to:"EL", from:"Pumpe Zellerndorf", msg:"Zubringleitung fertig", usr:"LM Schwayer"}
	id = elfData.newId();
	elfData.ek[id] = {
		id:id,
		from:new Date().setUTCMilliseconds(nowMsec - 360000),
		to:new Date().setUTCMilliseconds(nowMsec - 240000),
		fw:"Zellerndorf",
		fzg:"Pumpe",
		ppl:9,
		atsg:0,
		atst:5
	};
	id = elfData.newId();
	elfData.ek[id] = {
		id:id,
		from:new Date().setUTCMilliseconds(nowMsec - 480000),
		to:null,
		fw:"Zellerndorf",
		fzg:"Tank",
		ppl:9,
		atsg:3,
		atst:6
	};

	ws.onMessage(function(message){
		var msg = JSON.parse(message.data);
		if ((msg.typ === undefined) ||
		    (msg.data === undefined)) {
			return;
		}
		if (msg.typ == "new-etb") {
			elfData.etb[msg.data.id] = msg.data;
		} else if (msg.typ == "update-etb") {
			elfData.etb[msg.data.id] = msg.data;
		}
	});

	return elfData;
});


/* Controllers */
app.controller('ElfEtbController', ["$scope", "ElfData", function($scope, ElfData) {
	$scope.mode = 1;

	var entriesEqual = function(o, n) {
		if (o.ts != n.ts) {
			return false;
		}
		if (o.to != n.to) {
			return false;
		}
		if (o.from != n.from) {
			return false;
		}
		if (o.msg != n.msg) {
			return false;
		}
		if (o.usr != n.usr) {
			return false;
		}
		return true;
	}

	var defaultEntry = {
    	to: "",
    	from: "",
    	msg: "",
    	usr: "",
    	edit: false
    };

	var now = new Date();
	$scope.newEntry = angular.extend({id:ElfData.newId(), ts:new Date()}, defaultEntry);
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
		$scope.newEntry = angular.extend({id:$scope.ElfData.newId(), ts:new Date()}, defaultEntry, {usr:user});
	};

	$scope.editEtbEntry = function(e) {
		$scope.etbBefore[e.id] = angular.extend({},e);
		//$scope.ElfData.etb[i].edit = true;
		e.edit = true;
	}

	$scope.saveEtbEntry = function(e) {
		//$scope.ElfData.etb[i].edit = false;
		e.edit = false;
		// Check for changes
		var o = $scope.etbBefore[e.id];
		if (entriesEqual(o,e)) {
			console.log("entries equal");
			return;
		}
		// Send 'save entry' message to server
		$scope.ElfData.updateEtbEntry(e)
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
