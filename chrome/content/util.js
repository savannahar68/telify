/*
Creative Commons License: Attribution-No Derivative Works 3.0 Unported
http://creativecommons.org/licenses/by-nd/3.0/
(c) 2009-2011 Michael Koch
*/

var objTelifyUtil = {

FIREFOX_ID: "{ec8030f7-c20a-464f-9b0e-13a3a9e97384}",
THUNDERBIRD_ID: "{3550f703-e582-4d05-9a08-453d09bdfdc6}",
appinfo: Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULAppInfo),

addon_version: null,

getString: function(key)
{
	try {
		return document.getElementById("idTelifyStringBundle").getString(key);
	} catch (e) {
		this.logerror("getString('"+key+"'): "+e);
		return "";
	}
},


getBrowser: function()
{
	if (objTelifyUtil.appinfo.ID == objTelifyUtil.THUNDERBIRD_ID) {
		return window.getBrowser();
	}
	var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"].getService(Components.interfaces.nsIWindowMediator);
	var mainWindow = wm.getMostRecentWindow("navigator:browser");
	return mainWindow.getBrowser();
},


getAddonVersion: function(callback)
{
	const addonid = "{6c5f349a-ddda-49ad-bdf0-326d3fe1f938}";
	var ascope = {};
	if (typeof(Components.classes["@mozilla.org/extensions/manager;1"]) != 'undefined') {
		var gExtensionManager = Components.classes["@mozilla.org/extensions/manager;1"]
			.getService(Components.interfaces.nsIExtensionManager);
		var addon = gExtensionManager.getItemForID(addonid);
		callback(addon.version);
		return;
	}
	if (typeof(Components.utils) != 'undefined' && typeof(Components.utils.import) != 'undefined') {
		Components.utils.import("resource://gre/modules/AddonManager.jsm", ascope);
	}
	ascope.AddonManager.getAddonByID(addonid, function(addon) {
		var version = addon.version;
		var suffix = "-signed";
		if (version.substring(version.length - suffix.length) == suffix) {
			version = version.substring(0, version.length - suffix.length);
		}
		callback(version);
	});
},


openOnlineHelp: function()
{
	//var lang = document.getElementById("idTelifyStringBundle").getString("lang");
	var lang = this.getString("lang");
	if (lang != "en" && lang != "de") lang = "en";
	var url = "http://www.codepad.de/"+lang+"/software/firefox-add-ons/telify.html?app="+objTelifyUtil.appinfo.name;

	if (objTelifyUtil.appinfo.ID == objTelifyUtil.THUNDERBIRD_ID) {
		var service = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
			.getService(Components.interfaces.nsIExternalProtocolService);
		var ioservice = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
		service.loadURI(ioservice.newURI(url, null, null));
	} else {
		var browser = objTelifyUtil.getBrowser();
		var tab = browser.addTab(url);
		browser.selectedTab = tab;
	}
},


openUpdateHelp: function(action, version)
{
	//var lang = document.getElementById("idTelifyStringBundle").getString("lang");
	var lang = this.getString("lang");
	if (lang != "en" && lang != "de") lang = "en";
	var url = "http://www.codepad.de/"+lang+"/software/firefox-add-ons/telify.html?"+action+"="+version+"&app="+objTelifyUtil.appinfo.name;

	if (objTelifyUtil.appinfo.ID == objTelifyUtil.THUNDERBIRD_ID) {
		var service = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"]
			.getService(Components.interfaces.nsIExternalProtocolService);
		var ioservice = Components.classes["@mozilla.org/network/io-service;1"]
			.getService(Components.interfaces.nsIIOService);
		service.loadURI(ioservice.newURI(url, null, null));
	} else {
		var browser = objTelifyUtil.getBrowser();
		var tab = browser.addTab(url);
		browser.selectedTab = tab;
	}
},


checkForUpdate: function()
{
	this.getAddonVersion(
		function(new_version) {
			var old_version = objTelifyPrefs.telPrefs.getCharPref("version");
			if (new_version != old_version) {
				if (old_version == "") {
					objTelifyUtil.openUpdateHelp("install", new_version);
				} else {
					objTelifyUtil.openUpdateHelp("update", new_version);
				}
				objTelifyPrefs.telPrefs.setCharPref("version", new_version);
			}
		}
	);
},


createDialURL: function(nr)
{
	var url;
	if (objTelifyPrefs.suppress_cc.length > 0) {
		if (nr.substr(0, objTelifyPrefs.suppress_cc.length) == objTelifyPrefs.suppress_cc) {
			if (this.code2ndd_hashtable == null) this.create_code2ndd_hashtable();
			var ndd = this.code2ndd_hashtable.get(objTelifyPrefs.suppress_cc);
			nr = ndd + nr.substr(objTelifyPrefs.suppress_cc.length);
		}
	}
	if (nr.charAt(0) == '+') {
		if (objTelifyPrefs.idd_prefix.length > 0) {
			nr = objTelifyPrefs.idd_prefix + nr.substr(1);
		}	else if (objTelifyPrefs.hrefType == objTelifyPrefs.HREFTYPE_CUSTOM && !objTelifyPrefs.fDontEscapePlus) {
			nr = "%2B" + nr.substr(1);
		}
	}
	if (objTelifyPrefs.hrefType == objTelifyPrefs.HREFTYPE_CUSTOM) {
		url = objTelifyPrefs.custom_url;
		url = objTelifyUtil.replaceRefs(url, 0, nr);
		for (var i=1; i<objTelifyPrefs.NUM_CUSTOM_PARAMS+1; i++) {
			url = objTelifyUtil.replaceRefs(url, i, objTelifyPrefs.custom_param[i]);
		}
	} else {
		//url = objTelifyPrefs.protoList[objTelifyPrefs.hrefType]+":"+nr;
		url = objTelifyPrefs.protoTmpl[objTelifyPrefs.hrefType];
		url = objTelifyUtil.replaceRefs(url, 0, nr);
	}
	return url;
},


token_href: "+0123456789",

stripNumber: function(phonenr)
{
	var newnr = "";
	for (var i=0; i<phonenr.length; i++) {
		var c = phonenr.charAt(i);
		if (this.token_href.indexOf(c) >= 0) newnr += c;
	}
	return newnr.substr(0, objTelify.digits_max);
},


code2ndd_hashtable: null,

create_code2ndd_hashtable: function()
{
	this.code2ndd_hashtable = new objTelifyHashtable();
	for (var i=0; i<telify_country_data.length; i++) {
		if (telify_country_data[i][0] == "") continue;
		this.code2ndd_hashtable.put(telify_country_data[i][0], telify_country_data[i][3]);
	}
},


prefixNumber: function(prefix, nr, sep)
{
	if (prefix == null || prefix == "") return this.stripNumber(nr);
	if (this.code2ndd_hashtable == null) this.create_code2ndd_hashtable();
	var ndd = this.code2ndd_hashtable.get(prefix);
	if ((ndd.length > 0) && (nr.substr(0, ndd.length) == ndd)) nr = nr.substr(ndd.length);
	return this.stripNumber(prefix) + sep + this.stripNumber(nr);
},


trim: function(s)
{
  s = s.replace(/^\s*(.*)/, "$1");
  s = s.replace(/(.*?)\s*$/, "$1");
  return s;
},


localizeCountryData: function()
{
/*
	for (var i=0; i < telify_country_data.length; i++) {
		for (var j=0; j<telify_country_locale.length; j++) {
			if (telify_country_data[i][1] == telify_country_locale[j][0]) {
				telify_country_data[i][1] = telify_country_locale[j][1];
				break;
			}
		}
	}
*/
	var hashtable = new objTelifyHashtable();
	for (var i=0; i<telify_country_locale.length; i++) {
		hashtable.put(telify_country_locale[i][0], telify_country_locale[i][1]);
	}
	for (var i=0; i<telify_country_data.length; i++) {
		var value = hashtable.get(telify_country_data[i][1]);
		if (value) telify_country_data[i][1] = value;
	}
},


tld_hashtable: null,

create_tld_hashtable: function()
{
	this.tld_hashtable = new objTelifyHashtable();
	for (var i=0; i<telify_country_data.length; i++) {
		if (telify_country_data[i][2] == "") continue;
		var tld_list = telify_country_data[i][2].toLowerCase().split(",");
		for (var j=0; j<tld_list.length; j++) {
			tld_list[j] = this.trim(tld_list[j]);
			this.tld_hashtable.put(tld_list[j], telify_country_data[i][0]);
		}
	}
},


tld2cc: function(tld)
{
	if (this.tld_hashtable == null) this.create_tld_hashtable();
	return this.tld_hashtable.get(tld);
},


splitPhoneNr: function(nr)
{
	var index = -1;
	var maxlen = 0;
	var idd_list = ["00", "011"];
	var oldnr = nr;

	if (nr.charAt(0) != '+') {
		for (var i=0; i<idd_list.length; i++) {
			if (nr.substr(0, idd_list[i].length) == idd_list[i]) {
				nr = "+" + nr.substr(idd_list[i].length);
				break;
			}
		}
	}
	if (nr.charAt(0) != '+') return [null, oldnr];
	for (var i=0; i<telify_country_data.length; i++) {
		if (nr.substr(0, telify_country_data[i][0].length) == telify_country_data[i][0]) {
			if (telify_country_data[i][0].length > maxlen) {
				index = i;
				maxlen = telify_country_data[i][0].length;
			}
		}
	}
	if (index >= 0) {
		var cc = telify_country_data[index][0];
		return [cc, nr.substr(cc.length)];
	}
	return [null, oldnr];
},


code2name_hashtable: null,

create_code2name_hashtable: function()
{
	this.code2name_hashtable = new objTelifyHashtable();
	for (var i=0; i<telify_country_data.length; i++) {
		if (telify_country_data[i][0] == "") continue;
		var name = telify_country_data[i][1];
		var prev = this.code2name_hashtable.get(telify_country_data[i][0]);
		if (prev) name = prev + ", " + name;
		this.code2name_hashtable.put(telify_country_data[i][0], name);
	}
},


getCountryListString: function(prefix)
{
	if (this.code2name_hashtable == null) this.create_code2name_hashtable();
	return this.code2name_hashtable.get(prefix);
},


getFlagFromNr: function(code, nr)
{
	for (var i=0; i<telify_flag_exception.length; i++) {
		if (code > telify_flag_exception[i][0]) break;
		if (code == telify_flag_exception[i][0]) {
			var area = telify_flag_exception[i][1];
			if (nr.substr(0, area.length) == area) {
				return telify_flag_exception[i][2];
			}
		}
	}
	return code.substr(1);
},


getHost: function(doc)
{
	try {
		return doc.location.host.toLowerCase();
	} catch (e) {
		return null;
	}
},


getHostTLD: function()
{
	var host = this.getHost(content.document);
	if (host) {
		var index = host.lastIndexOf('.');
		if (index >= 0) {
			var tld = host.substr(index+1);
			if (tld.length) return tld;
		}
	}
	return null;
},


MB_MASK: 0xff, MB_OK: 1, MB_CANCEL: 2,
MB_ICON_MASK: 0xff00, MB_ICON_INFO: 0, MB_ICON_WARNING: 0x0100, MB_ICON_ERROR: 0x0200, MB_ICON_ASK: 0x0300,

showMessageBox: function(title, msg, flags)
{
	var argObj = {title: title, msg: msg, flags: flags, fResult: true};
	window.openDialog("chrome://telify/content/messagebox.xul", "dlgTelifyMessageBox", "centerscreen,chrome,modal", argObj).focus();
	return argObj.fResult;
},


consoleService: null,

logmsg: function(msg) {
	if (this.consoleService == null) {
		this.consoleService = Components.classes["@mozilla.org/consoleservice;1"];
		this.consoleService = this.consoleService.getService(Components.interfaces.nsIConsoleService);
	}
	if (objTelifyPrefs.fDebug == true) {
		this.consoleService.logStringMessage(msg);
	} else {
		//alert(objTelifyPrefs.fDebug);
	}
},


logerror: function(msg) {
	if (objTelifyPrefs.fDebug == true) {
	  Components.utils.reportError(msg);
	}
},


arrayRemove: function(a, v)
{
	for (var i=0; i<a.length; i++) {
		if (a[i] == v) {
			a.splice(i, 1);
			i--;
		}
	}
},


replaceRefs: function(string, nr, param)
{
	var index;
	while ((index = string.indexOf("$"+nr)) >= 0 && string.charAt(index-1) != '\\') {
		string = string.substr(0, index) + param + string.substr(index+2);
	}
	return string;
},


substArgs: function(text)
{
	var newText = "";
	for (var i=1; i<arguments.length && i<10; i++) {
		for (var j=0; j<text.length; j++) {
			var c = text.charAt(j);
			if (c == '$') {
				c = text.charAt(j+1);
				if (c >= '1' && c <= '9') {
					var index = c - '0';
					if (index < arguments.length) {
						newText += arguments[index];
					} else {
						this.logerror("substArgs("+text+"): argument for $"+index+" missing");
					}
					j++;
				} else {
					newText += c;
				}
			} else {
				newText += c;
			}
		}
	}
	return newText;
},


setIdAttr: function(name, value)
{
	for (var i=2; i<arguments.length; i++) {
		var e = document.getElementById(arguments[i]);
		if (e) {
			e.setAttribute(name, value);
		} else {
			this.logerror("unknown element '"+arguments[i]+"'");
		}
	}
},


countDigits: function(text)
{
	var count = 0;
	for (var i=0; i<text.length; i++) {
		var c = text.charAt(i);
		if (c >= '0' && c <= '9') count++;
	}
	return count;
},


isdigit: function(c)
{
	return ("0123456789".indexOf(c) >= 0);
},


trimInt: function(value, min, max)
{
	if (value < min) return min;
	if (value > max) return max;
	return value;
},


parseColor: function(text)
{
	var exp, res, color;

	if (text == null) return null;

	exp = /^rgb *\( *(\d{1,3}) *, *(\d{1,3}) *, *(\d{1,3}) *\)$/;
	res = exp.exec(text);
	if (res) {
		color = new Array(parseInt(res[1]), parseInt(res[2]), parseInt(res[3]));
		for (var i=0; i<3; i++) {
			if (color[i] < 0) color[i] = 0;
			if (color[i] > 255) color[i] = 255;
		}
		return color;
	}

	exp = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i;
	res = exp.exec(text);
	if (res) {
		color = new Array(parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16));
		return color;
	}

	exp = /^#?([\da-f])([\da-f])([\da-f])$/i;
	res = exp.exec(text);
	if (res) {
		color = new Array(parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16));
		for (var i=0; i<3; i++) color[i] = color[i]*16+color[i];
		return color;
	}

	return null;
},


color2hex: function(color)
{
	var hex;

	if (color == null || color.length != 3) return "";
	for (var i=0, hex=""; i<3; i++) {
		var d = "0"+Math.floor(color[i]).toString(16);
		hex += d.substr(d.length - 2, 2);
	}
	return hex;
},


esc2xml: function(string)
{
	var substList = [
		["&", "&amp;"],	// here be dragons: must be first element in list
		["<", "&lt;"],
		[">", "&gt;"],
		["\'", "&apos;"],
		["\"", "&quot;"],
		["Ä", "&#196;"],
		["Ö", "&#214;"],
		["Ü", "&#220;"],
		["ä", "&#228;"],
		["ö", "&#246;"],
		["ü", "&#252;"],
		["ß", "&#223;"],
	];

	for (var i=0; i<substList.length; i++) {
		var index;
		while ((index = string.indexOf(substList[i][0])) >= 0) {
			string = string.substr(0, index) + substList[i][1] + string.substr(index+substList[i][0].length);
		}
	}

	return string;
},


iso2utf8: function(s)
{
	s = s.split("");
	for (var i=0; i<s.length; i++) {
		var c = s[i].charCodeAt(0);
		if (c > 127) s[i] = String.fromCharCode(0xc0 | ((c >> 6) & 3)) + String.fromCharCode(0x80 | (c & 0x3f));
	}
	return s.join("");
},

addScheme: function(scheme)
{
	var createNC = function(aProperty) {return "http://home.netscape.com/NC-rdf#" + aProperty;};

	var RDF = Components.classes["@mozilla.org/rdf/rdf-service;1"].getService();
	var IRDFService = RDF.QueryInterface(Components.interfaces.nsIRDFService);

	var ContainerUtils = Components.classes["@mozilla.org/rdf/container-utils;1"].getService();
	var IRDFContainerUtils = ContainerUtils.QueryInterface(Components.interfaces.nsIRDFContainerUtils);

  var Container = Components.classes["@mozilla.org/rdf/container;1"].createInstance();
	var IRDFContainer = Container.QueryInterface(Components.interfaces.nsIRDFContainer);

  const mimeTypes = "UMimTyp";
  var fileLocator = Components.classes["@mozilla.org/file/directory_service;1"].getService(Components.interfaces.nsIProperties);
  var file = fileLocator.get(mimeTypes, Components.interfaces.nsIFile);
  var ioService = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
  var fileHandler = ioService.getProtocolHandler("file").QueryInterface(Components.interfaces.nsIFileProtocolHandler);
  var datasource = IRDFService.GetDataSource(fileHandler.getURLSpecFromFile(file));
	var irds = datasource.QueryInterface(Components.interfaces.nsIRDFRemoteDataSource);

	var about, property, value;

  about = IRDFService.GetResource("urn:schemes");
  property = IRDFService.GetResource(createNC("Protocol-Schemes"));
	value = IRDFService.GetResource("urn:schemes:root");
  datasource.Assert(about, property, value, true);

	about = IRDFService.GetResource("urn:schemes:root");
	if (IRDFContainerUtils.IsSeq(datasource, about) == false) {
	  datasource.Assert(about, null, null, true);
		IRDFContainerUtils.MakeSeq(datasource, about);
	}
	IRDFContainer.Init(datasource, about);
	var element = IRDFService.GetResource("urn:scheme:"+scheme);
	if (IRDFContainer.IndexOf(element) < 0) {
		IRDFContainer.AppendElement(element);
	}

  about = IRDFService.GetResource("urn:scheme:"+scheme);
  property = IRDFService.GetResource(createNC("value"));
  value = IRDFService.GetLiteral(scheme);
  datasource.Assert(about, property, value, true);
  property = IRDFService.GetResource(createNC("handlerProp"));
	value = IRDFService.GetResource("urn:scheme:handler:"+scheme)
  datasource.Assert(about, property, value, true);

  about = IRDFService.GetResource("urn:scheme:handler:"+scheme);
  property = IRDFService.GetResource(createNC("alwaysAsk"));
  value = IRDFService.GetLiteral("true");
  datasource.Assert(about, property, value, true);
  property = IRDFService.GetResource(createNC("useSystemDefault"));
  value = IRDFService.GetLiteral("false");
  datasource.Assert(about, property, value, true);
/*
  property = IRDFService.GetResource(createNC("possibleApplication"));
	value = IRDFService.GetResource("urn:scheme:possibleApplication:tel");
  datasource.Assert(about, property, value, true);

  about = IRDFService.GetResource("urn:scheme:possibleApplication:tel");
  property = IRDFService.GetResource(createNC("prettyName"));
  value = IRDFService.GetLiteral("Nicht konfiguriert");
  datasource.Assert(about, property, value, true);
  property = IRDFService.GetResource(createNC("uriTemplate"));
  value = IRDFService.GetLiteral("urn:handler:web:http://www.mike-koch.de");
  datasource.Assert(about, property, value, true);
*/
	irds.Flush();
}


/*
  <RDF:Description RDF:about="urn:schemes">
    <NC:Protocol-Schemes RDF:resource="urn:schemes:root"/>
  </RDF:Description>

  <RDF:Seq RDF:about="urn:schemes:root">
    <RDF:li RDF:resource="urn:scheme:webcal"/>
    <RDF:li RDF:resource="urn:scheme:mailto"/>
    <RDF:li RDF:resource="urn:scheme:callto"/>
    <RDF:li RDF:resource="urn:scheme:tel"/>
  </RDF:Seq>

  <RDF:Description RDF:about="urn:scheme:tel" NC:value="tel">
    <NC:handlerProp RDF:resource="urn:scheme:handler:tel"/>
  </RDF:Description>

  <RDF:Description RDF:about="urn:scheme:handler:tel" NC:alwaysAsk="true">
    <NC:externalApplication RDF:resource="urn:scheme:externalApplication:tel"/>
  </RDF:Description>

  <RDF:Description RDF:about="urn:scheme:externalApplication:tel"
                   NC:prettyName="3GP_Converter.exe"
                   NC:path="C:\Programme\3GP_Converter033\3GP_Converter.exe" />

*/

};

objTelifyUtil.getAddonVersion(function(version){
	objTelifyUtil.addon_version = version;
});
