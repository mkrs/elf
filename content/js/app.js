

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
	//var ws = $websocket("ws://localhost:1122/ws");
	var now = new Date();
	var elfData = {
		etb: [
			{ts:new Date().setUTCMilliseconds(now.getUTCMilliseconds() - 360000), to:"Pumpe Zellerndorf", from:"EL", msg:"Wasser Marsch!", usr:"LM Schwayer"},
			{ts:new Date().setUTCMilliseconds(now.getUTCMilliseconds() - 480000), to:"EL", from:"Pumpe Zellerndorf", msg:"Zubringleitung fertig", usr:"LM Schwayer"}
		],
		ek: {},
		units: [
			"EL",
			"Pumpe Zellerndorf"
		],
		newEtbEntry: function(e) {
			this.etb.unshift(e);
		}
	};

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
		$scope.ElfData.etb[i].edit = true;
	}

	$scope.saveEtbEntry = function(i) {
		$scope.ElfData.etb[i].edit = false;
		// TODO: Send 'save entry' message to server
	}
}]);

app.controller("ElfKraefteController", ["$scope", "ElfData", function($scope, ElfData) {
	$scope.mode = 2;
}]);
