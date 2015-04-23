

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
		},
		deleteEtbEntry: function(e) {
			ws.send({typ:"delete-etb", data:e});
		},
		updateEkEntry: function(e) {
			ws.send({typ:"update-ek", data:e});
		},
		dumpEtb: function() {
			ws.send({typ:"dump-etb"});
		}
	};

	ws.onMessage(function(message){
		var msg = JSON.parse(message.data);
		if ((msg.typ === undefined) ||
		    (msg.data === undefined)) {
			return;
		}
		var t = msg.typ;
		var id = msg.data.id;
		if (t == "new-etb") {
			elfData.etb[id] = msg.data;
		} else if (t == "update-etb") {
			elfData.etb[id] = msg.data;
		} else if (t == "delete-etb") {
			delete elfData.etb[id];
		} else if (t == "init-etb") {
			elfData.etb[id] = msg.data;
		} else if (t == "init-ek") {
			elfData.ek[id] = msg.data;
		}
	});

	return elfData;
});


/* Controllers */
app.controller('ElfEtbController', ["$timeout", "$compile", "$rootScope", "$scope", "$http", "ElfData", function($timeout, $compile, $rootScope, $scope, $http, ElfData) {
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
	$scope.newEntry = angular.extend({}, defaultEntry, {ts:new Date()});
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
		$scope.newEntry = angular.extend({}, defaultEntry, {ts:new Date(), usr:user});
	};

	$scope.editEtbEntry = function(e) {
		$scope.etbBefore[e.id] = angular.copy(e);
		//$scope.ElfData.etb[i].edit = true;
		e.edit = true;
	};

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
	};

	$scope.deleteEtbEntry = function(e) {
		var ret = confirm("Sind Sie sicher, dass der Eintrag:\n\nAn: " + e.to + "\nVon: " + e.from + "\nNachricht: " + e.msg + "\n\ngelöscht werden soll?");
		if (ret == true) {
			$scope.ElfData.deleteEtbEntry(e);
		}
	};

	$scope.dumpEtb = function() {
		$scope.ElfData.dumpEtb();
	};

	var printElement = function(elem) {
		//var domClone = elem.cloneNode(true);
		var domClone = elem[0];
		var $printSection = document.getElementById("printSection");
		if (!$printSection) {
			var $printSection = document.createElement("div");
			$printSection.id = "printSection";
			document.body.appendChild($printSection);
		}
		$printSection.innerHTML = "";
		$printSection.appendChild(domClone);
	}

	$scope.print = function() {
		$http.get("app/print/print.html").success(function(template){
        var printScope = angular.extend($rootScope.$new(), $scope.ElfData);
        var compiledPrint = $compile($('<div>' + template + '</div>'));
        var element = compiledPrint(printScope);
        var waitForRenderAndPrint = function() {
            if(printScope.$$phase || $http.pendingRequests.length) {
                $timeout(waitForRenderAndPrint);
            } else {
                printElement(element);
                window.print();
                printScope.$destroy();
            }
        }
        waitForRenderAndPrint();
    });
	};
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
	$scope.$watch(function(scope){
		return scope.ElfData;
	}, function(newValue, oldValue){
		$scope.calculateSums();
	});

	$scope.einheitLeaves = function(e) {
		var newE = angular.extend({}, e, {to:new Date()});
		$scope.ElfData.updateEkEntry(newE);
	}
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
