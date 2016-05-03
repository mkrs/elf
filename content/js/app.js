

var app = angular.module('elf', ["ngRoute", "angular-websocket", "ui.bootstrap"]);


function isNumeric(n) {
	return !isNaN(parseFloat(n)) && isFinite(n);
}

function arrayContains(arr, e) {
	for (var i = arr.length - 1; i >= 0; i--) {
		if (arr[i] == e) {
			return true;
		}
	}
	return false;
}


/* Routes */
app.config(["$routeProvider", function ($routeProvider) {
	$routeProvider
		.when("/etb", {
			templateUrl: "app/partials/einsatztagebuch.html",
			controller: "ElfEtbController"
		})
		.when("/kraefte", {
			templateUrl: "app/partials/kraefte.html",
			controller: "ElfKraefteController"
		})
		.when("/drucken", {
			templateUrl: "app/partials/drucken.html",
			controller: "ElfDruckenController"
		})
		.otherwise({
			redirectTo: "/etb"
		});
}]);


/* Directives */
app.directive('elfOnEnterUp', function () {
	return {
		restrict: 'A',
		link: function (scope, elem, attr, ctrl) {
			elem.bind('keyup', function (evt) {
				evt = evt || window.event;
				// Return if not Enter Key
				if (evt.keyCode != 13) return;
				scope.$apply(function (s) {
					s.$eval(attr.elfOnEnterUp);
				});
			});
		}
	};
});


/* Websocket */
app.factory("ElfData", ["$websocket", "$rootScope", function ($websocket, $rootScope) {
	var url = "ws://" + window.location.host + "/ws";
	var ws = $websocket(url);
	var now = new Date();
	var nowMsec = now.getUTCMilliseconds();
	var elfData = {
		einsatz: "",
		editEinsatz: true,
		etb: {},
		ek: {},
		ta_units: [],
		ta_usrs: [],
		ta_fw: [
			"Zellerndorf",
			"Watzelsdorf",
			"Platt",
			"Deinzendorf",
			"Pillersdorf"
		],
		ta_fzg: [
			"RüstLösch",
			"Tank",
			"Pumpe",
			"Kommando",
			"Bus"
		],
		newEtbEntry: function (e) {
			ws.send({ typ: "new-etb", data: e });
		},
		updateEtbEntry: function (e) {
			ws.send({ typ: "update-etb", data: e });
		},
		deleteEtbEntry: function (e) {
			ws.send({ typ: "delete-etb", data: e });
		},
		updateEkEntry: function (e) {
			ws.send({ typ: "update-ek", data: e });
		},
		newEkEntry: function (e) {
			ws.send({ typ: "new-ek", data: e });
		},
		dumpEtb: function () {
			ws.send({ typ: "dump-etb" });
		},
		updateEks: function (id) {
			var e = this.ek[id];
			if (e.to === null) {
				if (arrayContains(this.ta_fw, e.fw) == false) {
					this.ta_fw.push(e.fw);
				}
				var unit = "";
				if (e.fw != "") unit += e.fw;
				if (e.fzg != "") unit = e.fzg + " " + unit;
				if (arrayContains(this.ta_units, unit) == false) {
					this.ta_units.push(unit);
				}
			}
		},
		updateEtbs: function (id) {
			var e = this.etb[id];
			if (arrayContains(this.ta_units, e.to) == false) {
				this.ta_units.push(e.to);
			}
			if (arrayContains(this.ta_units, e.from) == false) {
				this.ta_units.push(e.from);
			}
			if (arrayContains(this.ta_usrs, e.usr) == false) {
				this.ta_usrs.push(e.usr);
			}
		}
	};

	ws.onMessage(function (message) {
		var msg = JSON.parse(message.data);
		if ((msg.typ === undefined) ||
			(msg.data === undefined)) {
			return;
		}
		var t = msg.typ;
		var id = msg.data.id;
		if (t == "init-etb") {
			elfData.etb[id] = msg.data;
			elfData.updateEtbs(id);
		} else if (t == "new-etb") {
			elfData.etb[id] = msg.data;
			elfData.updateEtbs(id);
		} else if (t == "update-etb") {
			elfData.etb[id] = msg.data;
			elfData.updateEtbs(id);
		} else if (t == "delete-etb") {
			delete elfData.etb[id];
		} else if (t == "init-ek") {
			elfData.ek[id] = msg.data;
			elfData.updateEks(id);
		} else if (t == "new-ek") {
			elfData.ek[id] = msg.data;
			elfData.updateEks(id);
		} else if (t == "update-ek") {
			elfData.ek[id] = msg.data;
			elfData.updateEks(id);
		}
		var s = t.split("-");
		if (s.length > 1 && s[1] === "ek") {
			$rootScope.$broadcast("ek");
		}
	});

	return elfData;
}]);


/* Controllers */
app.controller("IndexController", ["$scope", "ElfData", function ($scope, ElfData) {
	$scope.ElfData = ElfData;
}]);

app.controller('ElfEtbController', ["$timeout", "$compile", "$rootScope", "$scope", "$http", "ElfData", function ($timeout, $compile, $rootScope, $scope, $http, ElfData) {
	$scope.ElfData = ElfData;
	$scope.ElfData.mode = 1;

	var entriesEqual = function (o, n) {
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
	$scope.newEntry = angular.extend({}, defaultEntry, { ts: new Date() });
	//$scope.newEntry.usr = "";
	$scope.etbBefore = {};

	setInterval(function () {
		$scope.$apply(function () {
			$scope.newEntry.ts = new Date();
		});
	}, 1000);

	$scope.addNewEtbEntry = function () {
		var bTo = $scope.newEntry.to == "";
		var bFrom = $scope.newEntry.from == "";
		if (bTo && bFrom) {
			alert("Feld 'An' und 'Von' dürfen nicht beide leer sein.");
			document.getElementById("NewEntryTo").focus();
			return;
		}
		if ($scope.newEntry.msg == "") {
			alert("Feld 'Nachricht' ist leer.");
			document.getElementById("NewEntryMsg").focus();
			return;
		}
		if ($scope.newEntry.usr == "") {
			alert("Feld 'Bearbeiter' ist leer.");
			document.getElementById("NewEntryUsr").focus();
			return;
		}
		var user = $scope.newEntry.usr;
		$scope.ElfData.newEtbEntry($scope.newEntry);
		$scope.newEntry = angular.extend({}, defaultEntry, { ts: new Date(), usr: user });
		document.getElementById("NewEntryTo").focus();
	};

	$scope.editEtbEntry = function (e) {
		$scope.etbBefore[e.id] = angular.copy(e);
		//$scope.ElfData.etb[i].edit = true;
		e.edit = true;
	};

	$scope.saveEtbEntry = function (e) {
		//$scope.ElfData.etb[i].edit = false;
		e.edit = false;
		// Check for changes
		var o = $scope.etbBefore[e.id];
		if (entriesEqual(o, e)) {
			console.log("entries equal");
			return;
		}
		// Send 'save entry' message to server
		$scope.ElfData.updateEtbEntry(e)
	};

	$scope.deleteEtbEntry = function (e) {
		var ret = confirm("Sind Sie sicher, dass der Eintrag:\n\nAn: " + e.to + "\nVon: " + e.from + "\nNachricht: " + e.msg + "\n\ngelöscht werden soll?");
		if (ret == true) {
			$scope.ElfData.deleteEtbEntry(e);
		}
	};

	$scope.dumpEtb = function () {
		$scope.ElfData.dumpEtb();
	};

	var printElement = function (elem) {
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

	$scope.print = function () {
		$http.get("app/print/print.html").success(function (template) {
			var printScope = angular.extend($rootScope.$new(), $scope.ElfData);
			var compiledPrint = $compile($('<div>' + template + '</div>'));
			var element = compiledPrint(printScope);
			var waitForRenderAndPrint = function () {
				if (printScope.$$phase || $http.pendingRequests.length) {
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

app.controller("ElfKraefteController", ["$scope", "$rootScope", "ElfData", function ($scope, $rootScope, ElfData) {
	$scope.ElfData = ElfData;
	$scope.ElfData.mode = 2;
	$scope.allSums = {};
	$scope.actSums = {};

	var defaultEinheit = {
		to: null,
		from: null,
		fw: "",
		fzg: "",
		ppl: 0,
		atsg: 0,
		atst: 0
	};

	$scope.newEinheit = angular.extend({}, defaultEinheit);

	$scope.calculateSums = function () {
		var allSums = {
			_fws: {},
			fw: 0,
			fzg: 0,
			ppl: 0,
			atsg: 0,
			atst: 0
		};
		var actSums = {
			_fws: {},
			fw: 0,
			fzg: 0,
			ppl: 0,
			atsg: 0,
			atst: 0
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
	$rootScope.$on("ek", function () {
		$scope.calculateSums();
	});

	$scope.einheitLeaves = function (e) {
		var newE = angular.extend({}, e, { to: new Date() });
		$scope.ElfData.updateEkEntry(newE);
	};

	$scope.addEinheit = function () {
		if (($scope.newEinheit.fw === undefined) || ($scope.newEinheit.fw === "")) {
			alert("Feuerwehr muss ausgefüllt sein!");
			document.getElementById('newEinheitFw').focus();
			return
		}
		if (($scope.newEinheit.fzg === undefined) || ($scope.newEinheit.fzg === "")) {
			alert("Fahrzeug muss ausgefüllt sein!");
			document.getElementById('newEinheitFzg').focus();
			return;
		}
		if (!isNumeric($scope.newEinheit.ppl)) {
			alert("Mitglieder ist keine Zahl!");
			document.getElementById('newEinheitPpl').focus();
			return;
		}
		if (!isNumeric($scope.newEinheit.atsg)) {
			alert("ATS Geräte ist keine Zahl!");
			return;
		}
		if (!isNumeric($scope.newEinheit.atst)) {
			alert("ATS Träger ist keine Zahl!");
			return;
		}
		if (+$scope.newEinheit.ppl < 1) {
			alert("Anzahl der Mitglieder muss >= 1 sein!");
			document.getElementById('newEinheitPpl').focus();
			return;
		}
		$scope.newEinheit.ppl = +$scope.newEinheit.ppl;
		$scope.newEinheit.atsg = +$scope.newEinheit.atsg;
		$scope.newEinheit.atst = +$scope.newEinheit.atst;
		$scope.newEinheit.from = new Date();
		$scope.ElfData.newEkEntry($scope.newEinheit);
		$scope.newEinheit = angular.extend({}, defaultEinheit);
	};
}]);

app.controller("ElfDruckenController", ["$timeout", "$compile", "$scope", "$rootScope", "$http", "ElfData", function ($timeout, $compile, $scope, $rootScope, $http, ElfData) {
	$scope.ElfData = ElfData;
	$scope.ElfData.mode = 3;
	
	$scope.allSums = {};
	$scope.actSums = {};	
	$scope.printEtb = true;
	$scope.printEk = true;

	var printElement = function (elem) {
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

	$scope.print = function () {
		$http.get("app/print/print.html").success(function (template) {
			var printScope = angular.extend($rootScope.$new(), {printEtb: $scope.printEtb, printEk: $scope.printEk, ElfData: $scope.ElfData, allSums: $scope.allSums, actSums: $scope.actSums});
			var compiledPrint = $compile($('<div>' + template + '</div>'));
			var element = compiledPrint(printScope);
			var waitForRenderAndPrint = function () {
				if (printScope.$$phase || $http.pendingRequests.length) {
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


/* Filters */
app.filter('orderObjectBy', function () {
	return function (items, field, reverse) {
		var filtered = [];
		angular.forEach(items, function (item) {
			filtered.push(item);
		});
		filtered.sort(function (a, b) {
			return (a[field] > b[field] ? 1 : -1);
		});
		if (reverse) filtered.reverse();
		return filtered;
	};
});
