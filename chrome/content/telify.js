/*
Creative Commons License: Attribution-No Derivative Works 3.0 Unported
http://creativecommons.org/licenses/by-nd/3.0/
(c) 2009-2012 Michael Koch
*/

Components.utils.import("resource://gre/modules/Services.jsm");


var objTelify = {

digits_min: 7,
digits_max: 16,

hilite_color: new Array(0,0,255),
hilite_bgcolor: new Array(255,255,0),

// special chars
sc_nbsp: String.fromCharCode(0xa0),

// chars which look like dashes
token_dash:
	String.fromCharCode(0x2013) +
	String.fromCharCode(0x2014) +
	String.fromCharCode(0x2212),

exclPatternList: [
	/^\d{2}\.\d{2} *(-|–) *\d{2}\.\d{2}$/,	// time range e.g. 08.00 - 17.00
	/^\d{2}\/\d{2}\/\d{2}$/,	// date e.g. 09/03/09
	/^\d{2}\/\d{2} *(-|–) *\d{2}\/\d{2}$/,	// date range e.g. 01/05 - 05/06
	/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,	// ip address
	/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3} *\/ *(8|16|24)$/,	// ip address with subnet
	/^[0-3]?[0-9][\/\.-][0-3]?[0-9][\/\.-](19|20)\d{2} *(-|–) *\d{2}\.\d{2}$/,	// date and time e.g. 09.03.2009 - 17.59
	/^\d{2}[\.\:]\d{2} +[0-3]?[0-9][\/\.-][0-3]?[0-9][\/\.-](19|20)?\d{2}$/,	// date and time e.g. 17:59 09/03/2009
	/^[0-3]?[0-9][\/\.-] *[0-3]?[0-9][\/\.-] *(19|20)\d{2}$/,	// date e.g. 09/03/2009, 09.03.2009, 09-03-2009
	/^[0-3]?[0-9]\.?[\/-][0-3]?[0-9]\. *[0-1]?[0-9]\. *(19|20)\d{2}$/,	// two days e.g. 20/21.5.2010
	/^[0-3]?[0-9][\/\.-][0-3]?[0-9]\.? *(-|–) *[0-3]?[0-9][\/\.-][0-3]?[0-9]\.?$/,	// date range days
	/^[0-3]?[0-9][\/\.-][0-3]?[0-9][\/\.-]? *(-|–) *[0-3]?[0-9][\/\.-][0-3]?[0-9][\/\.-]\d{2}$/,	// date range short
	/^[0-3]?[0-9][\/\.-][0-3]?[0-9][\/\.-]\d{2} *(-|–) *[0-3]?[0-9][\/\.-][0-3]?[0-9][\/\.-]\d{2}$/,	// date range short
	/^[0-3]?[0-9][\/\.-][0-3]?[0-9][\/\.-] *(-|–) *[0-3]?[0-9][\/\.-][0-3]?[0-9][\/\.-](19|20)\d{2}$/,	// date range medium
	/^([0-3]?[0-9][\/\.-])?[0-3]?[0-9][\/\.-](19|20)\d{2} *(-|–) *([0-3]?[0-9][\/\.-])?[0-3]?[0-9][\/\.-](19|20)\d{2}$/,	// date range long
	/^[0-9]([ \.\,]000)+$/,	// just a big number
	/^000.+$/,	// starting with more than 2 zeroes
	/^[0-1]+$/,	// bit pattern
	/^0\.\d+$/, // e.g. 0.12345678
	/^[0-1]-\d{5}-\d{3}-\d{1}$/,	// ISBN
	/^0-[0-1]\d{1}-\d{6}-\d{1}$/,	// ISBN
	/^0-[2-6]\d{2}-\d{5}-\d{1}$/,	// ISBN
	/^0-[7-8]\d{3}-\d{4}-\d{1}$/,	// ISBN
	/^0-8\d{4}-\d{3}-\d{1}$/,	// ISBN
	/^0-9\d{5}-\d{2}-\d{1}$/,	// ISBN
	/^0-9\d{6}-\d{1}-\d{1}$/,	// ISBN
	/^1\.\d{3}\.\d{3}$/,	// number with decimal separator
],

// list of special local phone number patterns and their corresponding country code
// here be dragons: always add [^\d]* at end of pattern
inclLocalList: [
	[/^[1-9]\d{2}[/\.-]\d{3}[/\.-]\d{4}[^\d]*$/, "+1"],	// US
	[/^\([1-9]\d{2}\) \d{3}[/\.-]\d{4}[^\d]*$/, "+1"],	// US
	[/^0[1-9][ \.]\d{2}[ \.]\d{2}[ \.]\d{2}[ \.]\d{2}[^\d]*$/, "+33"],	// France
	[/^0[ \.]800[ \.]\d{2}[ \.]\d{2}[ \.]\d{2}[^\d]*$/, "+33"],	// France
],

token_trigger: "+(0123456789",
token_part: " -/()[].\r\n"
	+ String.fromCharCode(0xa0) // sc_nbsp
	+ String.fromCharCode(0x2013) + String.fromCharCode(0x2014) +	String.fromCharCode(0x2212), // token_dash
token_start: "+(0",
token_sep: " -/(.",
token_disallowed_post: ":-²³°$€£¥",
token_disallowed_prev: "-,.$€£¥",

string_disallowed_post: [
	"km²", "Hz", "kHz", "Uhr", "Bytes", "kB", "MB", "km/h", "²", "³", "°", "mph", "$", "€", "£", "¥"
],

dialHistory: new Array(objTelifyPrefs.maxHistory),

excludedTags: ["a","applet","map","select","script","textarea","datalist","time"],
excludedAtts: ["contenteditable"],



getDialHistory: function()
{
	for (var i=0, j=0; i<objTelifyPrefs.maxHistory; i++) {
		try {
			var cc = objTelifyPrefs.telPrefs.getCharPref("history"+i);
			var name = objTelifyUtil.getCountryListString(cc);
			if (name == null || name.length == 0) continue;
			this.dialHistory[j++] = cc;
		} catch (e) {
		}
	}
	if (this.dialHistory[0] == "") {
		this.dialHistory[0] = objTelifyLocale.defaultCountryCode;
	}
},


saveDialHistory: function()
{
	for (var i=0; i<objTelifyPrefs.maxHistory; i++) {
		if (this.dialHistory[i] == null) this.dialHistory[i] = "";
		objTelifyPrefs.telPrefs.setCharPref("history"+i, this.dialHistory[i]);
	}
},


updateDialHistory: function(prefix)
{
	//logmsg("updateDialHistory("+prefix+")");
	var name = objTelifyUtil.getCountryListString(prefix);
	if (name == null || name.length == 0) return;
	var newList = new Array(objTelifyPrefs.maxHistory);
	newList[0] = prefix;
	for (var i=0, j=1; i<objTelifyPrefs.maxHistory && j<objTelifyPrefs.maxHistory; i++) {
		if (this.dialHistory[i] == null || this.dialHistory[i] == "" || this.dialHistory[i] == prefix) continue;
		newList[j++] = this.dialHistory[i];
	}
	this.dialHistory = newList;
	this.saveDialHistory();
},


setStatus: function()
{
	var statusicon = document.getElementById("idTelify_statusicon");
	if (statusicon == null) return; // we have no status icon, so skip it
	if (objTelifyPrefs.fActive) {
		statusicon.setAttribute("src", "chrome://telify/content/icon/icon_menu.png");
		var text = objTelifyPrefs.telStrings.getString("telify_active");
		if (content.document.tel_parsetime) {
			text += "\n" + objTelifyPrefs.telStrings.getString("processing_time") + " " + content.document.tel_parsetime + " ms";
		}
		statusicon.setAttribute("tooltiptext", text);
	} else {
		statusicon.setAttribute("src", "chrome://telify/content/icon/icon_menu_inactive.png");
		var text = objTelifyPrefs.telStrings.getString("telify_inactive");
		statusicon.setAttribute("tooltiptext", text);
	}
},


toggleBlacklist: function()
{
	var host = objTelifyUtil.getHost(content.document);
	if (host == null) return;
	if (objTelifyPrefs.excludedHosts.indexOf(host) >= 0) {
		objTelifyUtil.arrayRemove(objTelifyPrefs.excludedHosts, host);
	} else {
		objTelifyPrefs.excludedHosts.push(host);
	}
	objTelifyPrefs.blacklist = objTelifyPrefs.excludedHosts.join(",");
	objTelifyPrefs.telPrefs.setCharPref(objTelifyPrefs.PREF_BLACKLIST, objTelifyPrefs.blacklist);
},


toggleActive: function()
{
	objTelifyPrefs.telPrefs.setBoolPref(objTelifyPrefs.PREF_ACTIVE, !objTelifyPrefs.fActive);
	this.setStatus();
},


getSelectionNumber: function()
{
	//var sel = content.window.getSelection().toString();
	var sel = document.commandDispatcher.focusedWindow.getSelection().toString();
	sel = this.convertVanityNr(sel);
	sel = objTelifyUtil.stripNumber(sel);
	return sel;
},


dialNumber: function(nr)
{
	var requ = new XMLHttpRequest();
	var url = objTelifyUtil.createDialURL(nr);

	if (objTelifyPrefs.hrefType == objTelifyPrefs.HREFTYPE_CUSTOM) {
		if (objTelifyPrefs.custom_opentype == 1) {
			window.open(url, "_blank");
			return;
		}
		if (objTelifyPrefs.custom_opentype == 2) {
			var browser = top.document.getElementById("content");
			var tab = browser.addTab(url);
			return;
		}
		if (objTelifyPrefs.custom_opentype == 3) {
			var browser = top.document.getElementById("content");
			var tab = browser.addTab(url);
			browser.selectedTab = tab;
			return;
		}
	}

	try {
		requ.open("GET", url, true);
		requ.send(null);
	} catch(e) {
		// throws exception because answer is empty (or protocol is unknown)
		if (e.name == "NS_ERROR_UNKNOWN_PROTOCOL") {
			objTelifyUtil.showMessageBox("", objTelifyLocale.msgUnknownProtocol(), objTelifyUtil.MB_ICON_ERROR);
			objTelifyPrefs.showConfigDialog();
		}
	}
},


modifyPopup: function(event)
{
	var label, image, key;

	//var selText = content.window.getSelection().toString();
	var selText = document.commandDispatcher.focusedWindow.getSelection().toString();

	if (document.popupNode && document.popupNode.getAttribute("class") == "telified") {
		var nr = document.popupNode.getAttribute("nr");
		var posscc = document.popupNode.getAttribute("posscc");
		var pattcc = document.popupNode.getAttribute("pattcc");
		var nr_parts = objTelifyUtil.splitPhoneNr(nr);
		objTelify.modifyDialPopup(nr_parts[0], posscc, pattcc, nr_parts[1], "context");
		objTelifyUtil.setIdAttr("collapsed", false, "idTelify_menu_context");
	} else if (objTelifyPrefs.fActive && selText.length > 0 && objTelifyUtil.countDigits(selText) > 1) {
		var nr = objTelify.getSelectionNumber();
		var nr_parts = objTelifyUtil.splitPhoneNr(nr);
		objTelify.modifyDialPopup(nr_parts[0], null, null, nr_parts[1], "context");
		objTelifyUtil.setIdAttr("collapsed", false, "idTelify_menu_context");
	} else {
		objTelifyUtil.setIdAttr("collapsed", true, "idTelify_menu_context");
	}

	if (objTelifyPrefs.fActive) {
		label = objTelifyPrefs.telStrings.getString("telify_deactivate");
		image = "chrome://telify/content/icon/power_off.png";
	} else {
		label = objTelifyPrefs.telStrings.getString("telify_activate");
		image = "chrome://telify/content/icon/power_on.png";
	}
	objTelifyUtil.setIdAttr("label", label, "idTelify_menu_activity", "idTelify_appmenu_activity");
	objTelifyUtil.setIdAttr("image", image, "idTelify_menu_activity", "idTelify_appmenu_activity");

	if (objTelifyUtil.appinfo.ID == objTelifyUtil.FIREFOX_ID) {
		objTelifyUtil.setIdAttr("label", label, "idTelify_status_activity");
		objTelifyUtil.setIdAttr("image", image, "idTelify_status_activity");
		var host = objTelifyUtil.getHost(content.document);
		if (host) {
			objTelifyUtil.setIdAttr("disabled", !objTelifyPrefs.fActive, "idTelify_menu_blacklist", "idTelify_appmenu_blacklist", "idTelify_status_blacklist");
			if (objTelifyPrefs.excludedHosts.indexOf(host) >= 0) {
				key = "host_active_arg";
				image = "chrome://telify/content/icon/block_off.png";
			} else {
				key = "host_inactive_arg";
				image = "chrome://telify/content/icon/block_on.png";
			}
			label = objTelifyUtil.substArgs(objTelifyPrefs.telStrings.getString(key), host);
			objTelifyUtil.setIdAttr("label", label, "idTelify_menu_blacklist", "idTelify_appmenu_blacklist", "idTelify_status_blacklist");
			objTelifyUtil.setIdAttr("image", image, "idTelify_menu_blacklist", "idTelify_appmenu_blacklist", "idTelify_status_blacklist");
			objTelifyUtil.setIdAttr("collapsed", false, "idTelify_menu_blacklist", "idTelify_appmenu_blacklist", "idTelify_status_blacklist");
		} else {
			objTelifyUtil.setIdAttr("label", "", "idTelify_menu_blacklist", "idTelify_appmenu_blacklist", "idTelify_status_blacklist");
			objTelifyUtil.setIdAttr("collapsed", true, "idTelify_menu_blacklist", "idTelify_appmenu_blacklist", "idTelify_status_blacklist");
		}
	}
},


showEditNumberDialog: function(cc, nr)
{
	var argObj = {cc: cc, nr: nr, fOK: false};
	window.openDialog("chrome://telify/content/editNumber.xul", "dlgTelifyEditNumber", "centerscreen,chrome,modal", argObj);
	if (argObj.fOK) {
		this.updateDialHistory(argObj.cc);
		var dial = objTelifyUtil.prefixNumber(argObj.cc, argObj.nr, "");
		objTelify.dialNumber(dial);
	}
},


dialMenuSelection: function(cc, nr)
{
	this.updateDialHistory(cc);
	var dial = objTelifyUtil.prefixNumber(cc, nr, "");
	objTelify.dialNumber(dial);
},


createTargetCountryInfo: function(prefix)
{
	var cstring = objTelifyUtil.getCountryListString(prefix);
	if (cstring) return "\n" + objTelifyPrefs.telStrings.getString('country_code') + ": " + cstring;
	return "";
},


setDialMenuItem: function(item, code, nr)
{
	var label = objTelifyUtil.prefixNumber(code, nr, "-");
	item.setAttribute("label", label);
	var cmd = "objTelify.dialMenuSelection("+TelifyStringUtil.quote(code)+","+TelifyStringUtil.quote(nr)+");";
	item.setAttribute("oncommand", cmd);
	label = objTelifyUtil.substArgs(objTelifyPrefs.telStrings.getString('call_arg'), label);
	label += objTelify.createTargetCountryInfo(code);
	item.setAttribute("tooltiptext", label);
	var flagname = objTelifyUtil.getFlagFromNr(code, nr);
	item.setAttribute("image", "chrome://telify/content/flag/"+flagname+".png");
},


modifyDialPopup: function(cc, posscc, pattcc, nr, id)
{
	var item = document.getElementById("idTelify_"+id);
	var sep = document.getElementById("idTelify_sep_"+id);
	var numShown = 0;

	if (cc) {
	  item.removeAttribute("disabled");
		this.setDialMenuItem(item, cc, nr);
	} else {
	  item.setAttribute("label", nr);
		if (objTelifyPrefs.hrefType == objTelifyPrefs.HREFTYPE_SKYPE) {
			item.setAttribute("tooltiptext", objTelifyPrefs.telStrings.getString('skype_nocc_invalid'));
			item.setAttribute("image", "chrome://telify/content/icon/notvalid.png");
			item.setAttribute("disabled", true);
		  item.removeAttribute("oncommand");
		} else {
			var label = objTelifyUtil.substArgs(objTelifyPrefs.telStrings.getString('call_arg'), nr);
			item.setAttribute("tooltiptext", label);
			item.setAttribute("image", "chrome://telify/content/flag/unknown.png");
		  item.removeAttribute("disabled");
		  item.setAttribute("oncommand", "objTelify.dialNumber("+TelifyStringUtil.quote(nr)+")");
		}
	}

	item = document.getElementById("idTelify_edit_"+id);
	if (cc) {
	  item.setAttribute("oncommand", "objTelify.showEditNumberDialog("+TelifyStringUtil.quote(cc)+","+TelifyStringUtil.quote(nr)+")");
	} else {
	  item.setAttribute("oncommand", "objTelify.showEditNumberDialog(null,"+TelifyStringUtil.quote(nr)+")");
	}

	item = document.getElementById("idTelify_pattcc_"+id);
	if (!cc && pattcc && pattcc != "") {
		item.setAttribute("collapsed", false);
		this.setDialMenuItem(item, pattcc, nr);
		numShown++;
	} else {
		item.setAttribute("collapsed", true);
		pattcc = null;
	}

	item = document.getElementById("idTelify_posscc_"+id);
	if (!cc && posscc && posscc != "" && posscc != pattcc) {
		item.setAttribute("collapsed", false);
		this.setDialMenuItem(item, posscc, nr.substr(posscc.length-1));
		numShown++;
	} else {
		item.setAttribute("collapsed", true);
		posscc = null;
	}

	var tldcc = objTelifyUtil.tld2cc(objTelifyUtil.getHostTLD());
	//alert(""+objTelifyUtil.getHostTLD()+" : "+tldcc);
	item = document.getElementById("idTelify_tld_"+id);
	if (!cc && tldcc && tldcc != pattcc && tldcc != posscc) {
		item.setAttribute("collapsed", false);
		this.setDialMenuItem(item, tldcc, nr);
		numShown++;
	} else {
		item.setAttribute("collapsed", true);
		tldcc = null;
	}

	this.getDialHistory();

	if (!cc && nr.charAt(0) != '+') {
		var numLeft = objTelifyPrefs.numHistory;
		if (tldcc) numLeft--;
		if (posscc) numLeft--;
		if (pattcc) numLeft--;
		for (var i=0; i<objTelifyPrefs.maxHistory; i++) {
			item = document.getElementById("idTelify_"+id+i);
			if (numLeft == 0 || this.dialHistory[i] == null || this.dialHistory[i].length == 0 || this.dialHistory[i] == cc || this.dialHistory[i] == tldcc || this.dialHistory[i] == pattcc || this.dialHistory[i] == posscc) {
				item.setAttribute("collapsed", true);
			} else {
				item.setAttribute("collapsed", false);
				this.setDialMenuItem(item, this.dialHistory[i], nr);
				numLeft--;
				numShown++;
			}
		}
	} else {
		for (var i=0; i<objTelifyPrefs.maxHistory; i++) {
			item = document.getElementById("idTelify_"+id+i);
			item.setAttribute("collapsed", true);
		}
	}
	sep.setAttribute("collapsed", numShown == 0);
},


showDialPopup: function(target, cc, posscc, pattcc, nr)
{
	var menu = document.getElementById("idTelify_popup_dial");
	this.modifyDialPopup(cc, posscc, pattcc, nr, "dial");
	menu.openPopup(target, "after_start", 0, 0, true, false);
},


onClick: function(event)
{
	//objTelifyUtil.logmsg(event.button);
	//if (event.button != 0) return;
	if (event.button != 0 && event.button != 2) return;
	if (event.target.getAttribute("class") != "telified") return;
	event.preventDefault();
	event.stopPropagation();
	var nr = event.target.getAttribute("nr");
	var pattcc = event.target.getAttribute("pattcc");
	var posscc = event.target.getAttribute("posscc");
	var nr_parts = objTelifyUtil.splitPhoneNr(nr);
	if (event.button == 0) {
		if (nr_parts[0] && objTelifyPrefs.fDialCCDirect) {
			objTelify.dialNumber(nr);
		} else if (nr_parts[0] == null && objTelifyPrefs.fDialWOCCDirect && objTelifyPrefs.hrefType != objTelifyPrefs.HREFTYPE_SKYPE) {
			objTelify.dialNumber(nr);
		} else {
			objTelify.showDialPopup(event.target, nr_parts[0], posscc, pattcc, nr_parts[1]);
		}
	}
	if (event.button == 2) {
		objTelify.showDialPopup(event.target, nr_parts[0], posscc, pattcc, nr_parts[1]);
	}
},


getNodeDocument: function(node)
{
	node = node.parentNode;
	if (node == null) return null;
	if (node.nodeType == Node.DOCUMENT_NODE) return node;
	return this.getNodeDocument(node);
},


getNodeBackgroundColor: function(doc, node, depth)
{
	if (depth == 4) return null;
	node = node.parentNode;
	if (doc == null || node == null) return null;
	if (node.nodeType == Node.ELEMENT_NODE) {
		var style = doc.defaultView.getComputedStyle(node, "");
		var image = style.getPropertyValue("background-image");
		if (image && image != "none") return null;
		var color = style.getPropertyValue("background-color");
		if (color && color != "transparent") return color;
	}
	return this.getNodeBackgroundColor(doc, node, depth+1);
},


getNodeColor: function(doc, node, depth)
{
	if (depth == 4) return null;
	node = node.parentNode;
	if (doc == null || node == null) return null;
	if (node.nodeType == Node.ELEMENT_NODE) {
		var style = doc.defaultView.getComputedStyle(node, "");
		var color = style.getPropertyValue("color");
		if (color && color != "transparent") return color;
	}
	return this.getNodeColor(doc, node, depth+1);
},


formatPhoneNr: function(phonenr)
{
	var substList = [
		["  ", " "],	// double spaces to single space
		[this.sc_nbsp, " "],	// non-breaking space to plain old space
		["+ ", "+"],	// remove space after +
		["--", "-"],	// double dashes to single dash
		["(0)", " "],	// remove optional area code prefix
		["[0]", " "],	// remove optional area code prefix
		["-/", "/"],
		["/-", "/"],
		["( ", "("],
		[" )", ")"],
		["\r", " "],
		["\n", " "],
	];

	// replace dash-like chars with dashes
	for (var i=0; i<phonenr.length; i++) {
		var c = phonenr.charAt(i);
		if (this.token_dash.indexOf(c) >= 0) {
			phonenr = phonenr.substr(0, i) + "-" + phonenr.substr(i+1);
		}
	}

	const MAXLOOP = 100; // safety bailout
	var nChanged;

	nChanged = 1;
	for (var j=0; nChanged > 0 && j < MAXLOOP; j++) {
		nChanged = 0;
		for (var i=0; i<substList.length; i++) {
			var index;
			while ((index = phonenr.indexOf(substList[i][0])) >= 0) {
				phonenr = phonenr.substr(0, index) + substList[i][1] + phonenr.substr(index+substList[i][0].length);
				nChanged++;
			}
		}
	}

	return phonenr;
},


convertVanityNr: function(phonenr)
{
	const tab_alpha = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	const tab_digit = "22233344455566677778889999";
	var newnr = "";
	for (var i=0; i<phonenr.length; i++) {
		var c = phonenr.charAt(i);
		var index = tab_alpha.indexOf(c);
		if (index >= 0) c = tab_digit.substr(index, 1);
		newnr += c;
	}
	return newnr;
},


reject: function(str, reason)
{
	if (objTelifyPrefs.fDebug == false) return;
	var msg = "Telify: reject '"+str+"' reason: "+reason;
	objTelifyUtil.logmsg(msg);
},


basechar_tab: [
	String.fromCharCode(0xa0) +
	String.fromCharCode(0x2013) +
	String.fromCharCode(0x2014) +
	String.fromCharCode(0x2212),
	" ---"
],


basechar: function(c)
{
	var index = this.basechar_tab[0].indexOf(c);
	if (index >= 0) c = this.basechar_tab[1].charAt(index);
	return c;
},


telifyTextNode: function(node, hasNoContent)
{
	if (node == null) return 0;
	var text = node.data;
	var len = text.length;
	if (len < this.digits_min) return 0;
	var hlFactor = objTelifyPrefs.highlight/200.0;
	var blank_count = 0;
	var parentTag = "";

	if (node.parentNode.nodeType == Node.ELEMENT_NODE) {
		parentTag = node.parentNode.tagName.toLowerCase();
	}

	for (var i=0; i<len; i++) {
		var c = text.charAt(i);

		if (this.token_trigger.indexOf(c) < 0) continue;

		c = this.basechar(c);

		var str = "" + c;
		var strlen = 1;
		var last_c = c;
		var ndigits = (objTelifyUtil.isdigit(c) ? 1 : 0);
		var index;

		// gather allowed chars
		while (strlen < len-i) {
			c = text.charAt(i+strlen);
			c = this.basechar(c);
			if (c == " ") {
				blank_count++;
				if (blank_count == 3 && parentTag == "pre") break;
			} else {
				blank_count = 0;
			}
			if ((c == '+' && ndigits == 0) || (this.token_part.indexOf(c) >= 0)) {
				if (c == last_c && c!=' ') break;
			} else {
				if (!objTelifyUtil.isdigit(c)) break;
				ndigits++;
			}
			str += c;
			strlen++;
			last_c = c;
		}

		// check against digit count min value
		if (ndigits < this.digits_min) {
			//this.reject(str, "less than "+this.digits_min+" digits");
			i += strlen - 1; continue;
		}

		// check allowed prev token
		if (i > 0) {
			var prev_c = text.charAt(i-1);
			if (this.token_disallowed_prev.indexOf(prev_c) >= 0) {
				this.reject(str, "unallowed previous token ('"+prev_c+"')");
				i += strlen - 1; continue;
			}
			if ((prev_c >= 'a' && prev_c <= "z") || (prev_c >= 'A' && prev_c <= "Z")) {
				this.reject(str, "unallowed previous token ('"+prev_c+"')");
				i += strlen - 1; continue;
			}
		}

		// check if phone number starts with country code
		var posscc = null;
		for (var j=0; j<telify_country_data.length; j++) {
			var cclen = telify_country_data[j][0].length;
			if (cclen < 2 || cclen > 4) continue;
			var pattern = telify_country_data[j][0].substr(1);
			var plen = pattern.length;
			if (str.substr(0, plen) != pattern) continue;
			var c = str.charAt(plen);
			if (this.token_sep.indexOf(c) < 0) continue;
			posscc = "+"+pattern;
			break;
		}

		// check against special local patterns
		var pattcc = null;
		for (var j=0; j<this.inclLocalList.length; j++) {
			var res = this.inclLocalList[j][0].exec(str);
			if (res) {pattcc = this.inclLocalList[j][1]; break;}
		}

		// check if phone number starts with allowed token
		if (pattcc == null && posscc == null && this.token_start.indexOf(str.charAt(0)) < 0) {
			this.reject(str, "unallowed start token (reject list)");
			i += strlen - 1; continue;
		}

		// trim chars at end of string up to an unmatched opening bracket
		index = -1;
		for (var j=strlen-1; j>=0; j--) {
			c = str.charAt(j);
			if (c == ')' || c == ']') break;
			if (c == '(' || c == '[') {index = j; break;}
		}
		if (index == 0) continue;
		if (index > 0) {
			str = str.substr(0, index);
			strlen = str.length;
		}

		// check against digit count max value (after we have removed unnecessary digits)
		if (objTelifyUtil.countDigits(str) > this.digits_max) {
			this.reject(str, "more than "+this.digits_max+" digits");
			i += strlen - 1; continue;
		}

		// trim non-digit chars at end of string
		while (str.length > 0) {
			c = str.charAt(str.length-1);
			if (!objTelifyUtil.isdigit(c)) {
				str = str.substr(0, str.length-1);
				strlen--;
			} else break;
		}

		// check for unallowed post token
		// caveat: post_c is also used in the next check
		var post_c = text.charAt(i+strlen);
		if (post_c) {
			if (this.token_disallowed_post.indexOf(post_c) >= 0) {
				this.reject(str, "unallowed post token ('"+post_c+"')");
				i += strlen - 1; continue;
			}
			if ((post_c >= 'a' && post_c <= "z") || (post_c >= 'A' && post_c <= "Z")) {
				this.reject(str, "unallowed post token ('"+post_c+"')");
				i += strlen - 1; continue;
			}
		}

		// check for unallowed post strings (dimensions, units, etc.)
		var post_s = null;
		for (var j=0; j<this.string_disallowed_post.length; j++) {
			var postlen = this.string_disallowed_post[j].length;
			if (text.substr(i+strlen+1, postlen) == this.string_disallowed_post[j]) {
				if (post_c == ' ' || post_c == sc_nbsp) {
					post_s = this.string_disallowed_post[j];
					break;
				}
			}
		}
		if (post_s) {
			this.reject(str, "unallowed post string ('"+post_s+"')");
			i += strlen - 1; continue;
		}

		// check if this is just a number in braces
		// first check for unnecessary opening braces
		if (str.substr(0, 1) == "(" && str.indexOf(")") < 0) {
			str = str.substr(1);
			i++;
			strlen--;
			// now check if it still starts with allowed token
			if (this.token_start.indexOf(str.charAt(0)) < 0) {
				this.reject(str, "unallowed start token (after brace removal)");
				i += strlen - 1; continue;
			}
		}

		// check against blacklisted patterns (date, time ranges etc.)
		index = -1;
		for (var j=0; j<this.exclPatternList.length; j++) {
			var res = this.exclPatternList[j].exec(str);
			if (res) {index = j; break;}
		}
		if (index >= 0) {
			this.reject(str, "blacklisted pattern #"+index);
			i += strlen - 1;
			continue;
		}

		// ----------------------------------------------------------------

		var display = this.formatPhoneNr(str);
		var href = objTelifyUtil.stripNumber(display);
		//if (posscc) href = "+"+href;
		//if (pattcc) href = pattcc + href;

		// insert link into DOM

		if (hasNoContent) {
			//var node_prev = document.createTextNode(text.substr(0, i));
			//var node_after = document.createTextNode(text.substr(i+strlen));
		} else {
			var node_prev = content.document.createTextNode(text.substr(0, i));
			var node_after = content.document.createTextNode(text.substr(i+strlen));
		}

		if (hasNoContent) {
			var node_anchor = document.createElementNS("http://www.w3.org/1999/xhtml", "html:a");
		} else {
			var node_anchor = content.document.createElement("a");
		}

		if (hlFactor > 0.0 && !hasNoContent) {
			var doc = this.getNodeDocument(node);
			var color = objTelifyUtil.parseColor(this.getNodeColor(doc, node, 0));
			if (color == null) color = new Array(0,0,0);
			var bgcolor = objTelifyUtil.parseColor(this.getNodeBackgroundColor(doc, node, 0));
			if (bgcolor == null) bgcolor = new Array(255,255,255);
			for (var i=0; i<3; i++) {
				color[i] = color[i] + hlFactor * (this.hilite_color[i] - color[i]);
				bgcolor[i] = bgcolor[i] + hlFactor * (this.hilite_bgcolor[i] - bgcolor[i]);
			}
			var style = "color:#"+objTelifyUtil.color2hex(color)+";background-color:#"+objTelifyUtil.color2hex(bgcolor)+";-moz-border-radius:3px";
			style = style + ";cursor:pointer";
			node_anchor.setAttribute("style", style);
		} else {
			node_anchor.setAttribute("style", "cursor:pointer");
		}

		node_anchor.setAttribute("title", objTelifyPrefs.telStrings.getString('link_title'));
		node_anchor.setAttribute("class", "telified");
		if (posscc) node_anchor.setAttribute("posscc", posscc);
		if (pattcc) node_anchor.setAttribute("pattcc", pattcc);
		node_anchor.setAttribute("nr", href);
		node_anchor.setAttribute("href", objTelifyUtil.createDialURL(href));
		node_anchor.addEventListener("click", objTelify.onClick, false);

		if (hasNoContent) {
			//var node_text = document.createTextNode(str);
			var node_text = document.createTextNode(text);
		} else {
			var node_text = content.document.createTextNode(str);
		}
		node_anchor.appendChild(node_text);

		var parentNode = node.parentNode;
		if (hasNoContent) {
			parentNode.replaceChild(node_anchor, node);
		} else {
			parentNode.replaceChild(node_after, node);
			parentNode.insertBefore(node_anchor, node_after);
			parentNode.insertBefore(node_prev, node_anchor);
		}

		return 1;
	}

	return 0;
},


cancelParse: false,
startParse: 0,

recurseNode: function(node, depth)
{
	if (this.cancelParse) return 0;
	let duration = (new Date()).getTime() - objTelify.startParse;
	//objTelifyUtil.logmsg("recurseNode: "+depth+" "+duration+"ms");
	if (duration >= objTelifyPrefs.max_parse_time) {
		this.cancelParse = true;
		return 0;
	}
	if (node == null) return 0; // safety
	if (node.nodeType == Node.TEXT_NODE) {
		if (objTelifyUtil.appinfo.ID == objTelifyUtil.THUNDERBIRD_ID) {
			if ((new Date()).getTime() - this.startParse > 2000) {
				this.cancelParse = true;
				return 0;
			}
		}
		return this.telifyTextNode(node, false);
	} else {
		var nChanged = 0;
		if (node.nodeType == Node.ELEMENT_NODE) {
			var tagName = node.tagName.toLowerCase();
			if (this.excludedTags.indexOf(tagName) >= 0) return 0;
			if (objTelifyPrefs.excludedTags.indexOf(tagName) >= 0) return 0;
			for (var n=0; n<this.excludedAtts.length; n++) {
				if (node.getAttribute(this.excludedAtts[0]) == "true") return 0;
			}
			for (var n=0; n<objTelifyPrefs.excludedAtts.length; n++) {
				if (node.getAttribute(objTelifyPrefs.excludedAtts[0]) == "true") return 0;
			}
		}
		for (var i=0; i<node.childNodes.length; i++) {
			nChanged +=  this.recurseNode(node.childNodes[i], depth+1);
			if (this.cancelParse) return nChanged;
		}
		if (node.contentDocument) {
			nChanged += this.recurseNode(node.contentDocument.body, depth+1);
			//node.contentDocument.addEventListener("click", objTelify.onClick, false);
			if (objTelifyUtil.appinfo.ID == objTelifyUtil.FIREFOX_ID) {
				var host = objTelifyUtil.getHost(node.contentDocument);
				if (host && objTelifyPrefs.excludedDynamicHosts.indexOf(host) < 0) {
					try {
						if (node.contentDocument.observer == undefined) {
							node.contentDocument.observer = new MutationObserver(function(mutations){objTelify.onDOMModified(null)});
							node.contentDocument.observer.observe(node.contentDocument, {subtree: true});
						}
					} catch (e) {
						node.contentDocument.addEventListener("DOMSubtreeModified", objTelify.onDOMModified, false);
					}
				}
			}
		}
	}
	return nChanged;
},


onDOMModified: function(event)
{
	if (!objTelifyPrefs.fDynamic) return;
	if (content.document.tel_modified == undefined) {
		content.document.tel_modified = 1;
	} else {
		content.document.tel_modified++;
	}
	if (content.document.tel_modified > 1) return;
	if (content.document.body === undefined) return;
	window.setTimeout(
		function() {
			//objTelifyUtil.logmsg("onDOMModified: "+content.document.title);
			objTelify.startParse = (new Date()).getTime();
			objTelify.cancelParse = false;
			objTelify.recurseNode(content.document.body, 0);
			content.document.tel_modified = 0;
			var duration = (new Date()).getTime() - objTelify.startParse;
			content.document.tel_parsetime = duration;
			objTelify.setStatus();
			//objTelifyUtil.logmsg(""+(new Date())+" onDOMModified: "+duration+" ms");
		}
		, Math.max(100, 2*content.document.tel_parsetime));
},


onTabSelect: function(event)
{
	objTelify.setStatus();
},


update_check_performed: false,

parsePage: function(event)
{
	if (!objTelifyPrefs.fActive) return;
	objTelifyPrefs.migrateOldPreferences();
	//objTelifyUtil.logmsg("eventPhase: "+event.eventPhase+"\n"+content.document.URL);
	//objTelifyUtil.logmsg("parsePage: id="+event.target.id);
	if (event.target.body == null) return;
	if (event && event.eventPhase != 1) return;

	var host = objTelifyUtil.getHost(content.document);
	if (host && objTelifyPrefs.excludedHosts.indexOf(host) >= 0) return;

	window.setTimeout(
		function() {
			objTelify.startParse = (new Date()).getTime();
			objTelify.cancelParse = false;
			//objTelify.recurseNode(content.document.body, 0);
			objTelify.recurseNode(event.target.body, 0);
			var duration = (new Date()).getTime() - objTelify.startParse;
			event.target.tel_parsetime = duration;
			//objTelifyUtil.logmsg("recurseNode: "+duration+" ms");
			objTelify.setStatus();
			event.target.tel_modified = 0;
			//event.target.addEventListener("click", objTelify.onClick, false);
			if (objTelifyUtil.appinfo.ID == objTelifyUtil.FIREFOX_ID) {
				if (host && objTelifyPrefs.excludedDynamicHosts.indexOf(host) < 0) {
					try {
						if (event.target.observer == undefined) {
							event.target.observer = new MutationObserver(function(mutations){objTelify.onDOMModified(null);});
							event.target.observer.observe(event.target, {subtree: true});
						}
					} catch (e) {
						event.target.addEventListener("DOMSubtreeModified", objTelify.onDOMModified, false);
					}
				}
			}
		}
		,	100);

	if (objTelify.update_check_performed == false) {
		objTelify.update_check_performed = true;
		objTelifyUtil.checkForUpdate();
	}
},



idPhoneField: ["cvPhWork", "cvPhHome", "cvPhFax", "cvPhCellular", "cvPhPager"],

onABContentChanged: function(event)
{
	if (objTelifyPrefs.fTelifyAddressBook == false) return;
	if (event.target.data === undefined) return;
	if (event.target.data.length == 0) return;
	//objTelifyUtil.logmsg("onABContentChanged id="+event.target.parentNode.id+" "+event.target.data);
	if (event.target.parentNode.id == "CardTitle") {
		for (var i=0; i<objTelify.idPhoneField.length; i++) {
			var obj = document.getElementById(objTelify.idPhoneField[i]);
			obj.removeChild(obj.childNodes[0]);
			obj.appendChild(document.createTextNode(""));
		}
	} else {
		for (var i=0; i<objTelify.idPhoneField.length; i++) {
			if (event.target.parentNode.id == objTelify.idPhoneField[i]) {
				objTelify.telifyTextNode(event.target, true);
				break;
			}
		}
	}
},


onABContentChanged15: function(event)
{
	if (objTelifyPrefs.fTelifyAddressBook == false) return;
	//objTelifyUtil.logmsg("onABContentChanged15 id="+event.target.id);
	let node = event.target;
	if (node.id == "CardTitle") {
		for (var i=0; i<objTelify.idPhoneField.length; i++) {
			var obj = document.getElementById(objTelify.idPhoneField[i]);
			if (obj.childNodes[0].nodeType != Node.TEXT_NODE) {
				//objTelifyUtil.logmsg("onABContentChanged15 id="+event.target.id+" change child node (type="+obj.childNodes[0].nodeType+") of "+objTelify.idPhoneField[i]+" to text node");
				obj.removeChild(obj.childNodes[0]);
				obj.appendChild(document.createTextNode(""));
				obj.tel_modified = 0;
			}
		}
	} else {
		for (var i=0; i<objTelify.idPhoneField.length; i++) {
			if (node.id == objTelify.idPhoneField[i]) {
				if (node.childNodes[0].nodeType != Node.TEXT_NODE) break;
				if (node.childNodes[0].data.length == 0) break;
				if (node.tel_modified == undefined) {
					node.tel_modified = 1;
				} else {
					node.tel_modified++;
				}
				if (node.tel_modified > 1) break;
				//objTelifyUtil.logmsg("onABContentChanged15 id="+node.id+" telify text node "+node.childNodes[0].data);
				objTelify.telifyTextNode(node.childNodes[0], true);
				node.tel_modified = 0;
				break;
			}
		}
	}
},


parseContactFields: function(doc)
{
	for (var i=0; i<objTelify.idPhoneField.length; i++) {
		let node = doc.getElementById(objTelify.idPhoneField[i]);
		if (node && node.childNodes.length > 0) {
			let child = node.childNodes[0];
			if (child.nodeType == Node.TEXT_NODE && child.data.length > 0) {
				objTelify.telifyTextNode(child, true);
			}
		}
	}
},


init: function(event)
{
	window.addEventListener('load', objTelify.init, false);
	objTelifyPrefs.initTelifyPrefs();

	//objTelifyUtil.logmsg("init: id="+event.target.id);

	let obj = document.getElementById("abContent");
	if (obj) {
		if (Services.vc.compare(Services.appinfo.platformVersion, "15.0") < 0) {
			obj.addEventListener("DOMCharacterDataModified", objTelify.onABContentChanged, false);
		} else {
			try {
				if (obj.observer == undefined) {
					obj.observer = new MutationObserver(
						function(mutations) {
							mutations.forEach(
								function(mutation) {
									let event = {};
									event.target = mutation.target;
									objTelify.onABContentChanged15(event);
								}
							);
						}
					);
					obj.observer.observe(obj, {subtree: true});
				}
			} catch (e) {
				obj.addEventListener("DOMSubtreeModified", objTelify.onABContentChanged15, false);
			}
		}
	}

	if (typeof getBrowser == 'function') {
		objTelify.setStatus();
		getBrowser().addEventListener("load", objTelify.parsePage, true);
		if (getBrowser().tabContainer) {
			getBrowser().tabContainer.addEventListener("TabSelect", objTelify.onTabSelect, true);
		}

		let tabmail = document.getElementById("tabmail");
		if (tabmail) {
			let monitor = {
			  onTabClosing: function(tab) {},
			  onTabOpened: function(aTab, aIsFirstTab, aWasCurrentTab) {},
			  onTabSwitched: function(aTab, aOldTab) {
					if (aTab.browser) {
						objTelify.parseContactFields(aTab.browser.contentDocument);
					}
			  },
			  onTabTitleChanged: function(aTab) {
					if (aTab.browser) {
						objTelify.parseContactFields(aTab.browser.contentDocument);
					}
			  },
			  onTabPersist: function(aTab) {},
			  onTabRestored: function(aTab, aState, aIsFirstTab) {}
			};
			tabmail.registerTabMonitor(monitor);
		}

/*
		var messagepane = document.getElementById("messagepane"); // mail
		if (messagepane) messagepane.addEventListener("load", objTelify.parsePage, true);
*/
		if (objTelifyUtil.appinfo.ID == objTelifyUtil.FIREFOX_ID) {
			document.getElementById("contentAreaContextMenu").addEventListener("popupshowing", objTelify.modifyPopup, false);
			objTelifyUtil.addScheme("tel");
		}
		if (objTelifyUtil.appinfo.ID == objTelifyUtil.THUNDERBIRD_ID) {
			document.getElementById("mailContext").addEventListener("popupshowing", objTelify.modifyPopup, false);
		}
	}
	objTelifyUtil.localizeCountryData();
}

};


window.addEventListener('load', objTelify.init, false);

