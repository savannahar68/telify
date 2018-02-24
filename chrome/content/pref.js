/*
Creative Commons License: Attribution-No Derivative Works 3.0 Unported
http://creativecommons.org/licenses/by-nd/3.0/
(c) 2009-2016 Michael Koch
*/

var objTelifyPrefs = {

PREF_BLACKLIST: "blacklist",
PREF_NODYNAMIC: "nodynamic",
PREF_HIGHLIGHT: "highlight",
PREF_EXCLUDE: "exclude",
PREF_EXCLUDED_TAGS: "excluded_tags",
PREF_EXCLUDED_ATTS: "excluded_atts",
PREF_DEBUG: "debug",
PREF_DYNAMIC: "dynamic",
PREF_ACTIVE: "active",
PREF_STATUSICON: "statusicon",
PREF_HREFTYPE: "linktype",
PREF_COLSORTCC: "colsortcc",
PREF_NUMHISTORY: "num_history",
PREF_IDD_PREFIX: "idd_prefix",
PREF_DONT_ESCAPE_PLUS: "dont_escape_plus",
PREF_DIAL_CC_DIRECT: "dial_cc_direct",
PREF_DIAL_WOCC_DIRECT: "dial_wocc_direct",
PREF_SUPPRESS_CC: "suppress_cc",
PREF_TELIFY_AB: "telify_addressbook",
PREF_MAX_PARSE_TIME: "max_parse_time",

NUM_CUSTOM_PARAMS: 3,

PREF_CUSTOM_URL: "custom_url",
PREF_CUSTOM_TMPL: "custom_tmpl",
PREF_CUSTOM_PARAM: "custom_param",
PREF_CUSTOM_OPENTYPE: "custom_opentype",

maxHistory: 10,

telPrefs: null,
telStrings: null,

blacklist: null,
excludedHosts: null,
excludedDynamicHosts: null,
highlight: null,
excludedTags: null,
excludedAtts: null,
hrefType: null,
numHistory: null,
idd_prefix: null,
fStatusIcon: null,
fActive: null,
fDebug: null,
fDynamic: null,
fDontEscapePlus: null,
fDialCCDirect: null,
fDialWOCCDirect: null,
fTelifyAddressBook: null,
max_parse_time: null,

custom_url: null,
custom_tmpl: null,
custom_param: [],
custom_opentype: null,

HREFTYPE_TEL: 0,
HREFTYPE_CALLTO: 1,
HREFTYPE_SKYPE: 2,
HREFTYPE_SIP: 3,
HREFTYPE_PHONE: 4,
HREFTYPE_CUSTOM: 9,

//protoList: new Array("tel", "callto", "skype", "sip"),
protoTmpl: new Array("tel:$0", "callto:$0", "skype:$0?call", "sip:$0", "phone:$0"),


showConfigDialog: function()
{
	while (true) {
		window.openDialog("chrome://telify/content/config.xul", "dlgTelifyConfig", "centerscreen,chrome,modal").focus;
		if (this.hrefType == this.HREFTYPE_CUSTOM && this.custom_url.indexOf("$0") < 0) {
			var result = objTelifyUtil.showMessageBox("", objTelifyLocale.msgNumberTemplateMissing(),
				 objTelifyUtil.MB_OK|objTelifyUtil.MB_CANCEL|objTelifyUtil.MB_ICON_WARNING);
			if (result == false) continue;
		}
		break;
	}
},


getPrefObj: function()
{
	var obj = Components.classes["@mozilla.org/preferences-service;1"];
	obj = obj.getService(Components.interfaces.nsIPrefService);
	obj = obj.getBranch("extensions.telify.");
	obj.QueryInterface(Components.interfaces.nsIPrefBranch2);
	return obj;
},


migrateOldPreferences: function()
{
	try {
		var old = Components.classes["@mozilla.org/preferences-service;1"];
		old = old.getService(Components.interfaces.nsIPrefService);
		old = old.getBranch("telify.settings.");
		var obj = {};
		var children = old.getChildList("", obj);
		if (children.length == 0) return;
		var msg;
		objTelifyUtil.logmsg("migrate "+children.length+" old prefs");
		for (var i=0; i<children.length; i++) {
			var type = old.getPrefType(children[i]); // PREF_STRING, PREF_INT, PREF_BOOL, or PREF_INVALID.
			if (children[i] == "version") {
				objTelifyUtil.logmsg("don't migrate pref 'version'");
				old.clearUserPref(children[i]);
				continue;
			}
			objTelifyUtil.logmsg("migrate pref '"+children[i]+"' of type "+type);
			switch (type) {
				case old.PREF_STRING:
					try {
						this.telPrefs.setCharPref(children[i], old.getCharPref(children[i]));
						objTelifyUtil.logmsg("migrated pref '"+children[i]+"' with value '"+old.getCharPref(children[i])+"'");
						old.clearUserPref(children[i]);
					} catch (e) {
						objTelifyUtil.logmsg("migrating failed: "+e);
					};
					break;
				case old.PREF_INT:
					try {
						this.telPrefs.setIntPref(children[i], old.getIntPref(children[i]));
						objTelifyUtil.logmsg("migrated pref '"+children[i]+"' with value '"+old.getIntPref(children[i])+"'");
						old.clearUserPref(children[i]);
					} catch (e) {
						objTelifyUtil.logmsg("migrating failed: "+e);
					};
					break;
				case old.PREF_BOOL:
					try {
						this.telPrefs.setBoolPref(children[i], old.getBoolPref(children[i]));
						objTelifyUtil.logmsg("migrated pref '"+children[i]+"' with value '"+old.getBoolPref(children[i])+"'");
						old.clearUserPref(children[i]);
					} catch (e) {
						objTelifyUtil.logmsg("migrating failed: "+e);
					};
					break;
			}
		}
		//old.deleteBranch("");
	} catch (e) {
		objTelifyUtil.logerror("error migrating old prefs: "+e);
	}
},


getCharPref: function(name)
{
	try {
		return this.telPrefs.getCharPref(name);
	} catch (e) {
		alert(e);
		return "";
	}
},


getIntPref: function(name)
{
	try {
		return this.telPrefs.getIntPref(name);
	} catch (e) {
		return 0;
	}
},


getBoolPref: function(name)
{
	try {
		return this.telPrefs.getBoolPref(name);
	} catch (e) {
		return false;
	}
},


getPrefs: function()
{
	this.blacklist = this.telPrefs.getCharPref(this.PREF_BLACKLIST);
	if (this.blacklist.length > 0) {
		this.excludedHosts = this.blacklist.toLowerCase().split(",");
	} else {
		this.excludedHosts = new Array();
	}
	var tmp = this.telPrefs.getCharPref(this.PREF_NODYNAMIC);
	if (tmp.length > 0) {
		this.excludedDynamicHosts = tmp.toLowerCase().split(",");
	} else {
		this.excludedDynamicHosts = new Array();
	}
	this.highlight = this.telPrefs.getIntPref(this.PREF_HIGHLIGHT);
	this.highlight = objTelifyUtil.trimInt(this.highlight, 0, 100);
	this.numHistory = this.telPrefs.getIntPref(this.PREF_NUMHISTORY);
	this.numHistory = objTelifyUtil.trimInt(this.numHistory, 1, 10);
	this.idd_prefix = this.telPrefs.getCharPref(this.PREF_IDD_PREFIX);

	var exclude = this.telPrefs.getCharPref(this.PREF_EXCLUDED_TAGS);
	this.excludedTags = exclude.toLowerCase().split(",");

	var exclude = this.telPrefs.getCharPref(this.PREF_EXCLUDED_ATTS);
	this.excludedAtts = exclude.toLowerCase().split(",");

	this.hrefType = this.telPrefs.getIntPref(this.PREF_HREFTYPE);
	if ((this.hrefType < 0 || this.hrefType >= this.protoTmpl.length) && this.hrefType != this.HREFTYPE_CUSTOM) this.hrefType = 0;
	this.fStatusIcon = this.telPrefs.getBoolPref(this.PREF_STATUSICON);
	var status = document.getElementById("idTelify_status");
	if (status) status.setAttribute("collapsed", !this.fStatusIcon);
	this.fDebug = this.telPrefs.getBoolPref(this.PREF_DEBUG);
	this.fDynamic = this.telPrefs.getBoolPref(this.PREF_DYNAMIC);
	this.fActive = this.telPrefs.getBoolPref(this.PREF_ACTIVE);
	this.fDontEscapePlus = this.telPrefs.getBoolPref(this.PREF_DONT_ESCAPE_PLUS);
	this.fDialCCDirect = this.telPrefs.getBoolPref(this.PREF_DIAL_CC_DIRECT);
	this.fDialWOCCDirect = this.telPrefs.getBoolPref(this.PREF_DIAL_WOCC_DIRECT);
	this.fTelifyAddressBook = this.telPrefs.getBoolPref(this.PREF_TELIFY_AB);
	this.max_parse_time = this.telPrefs.getIntPref(this.PREF_MAX_PARSE_TIME);
	this.suppress_cc = this.telPrefs.getCharPref(this.PREF_SUPPRESS_CC);
	// custom url
	this.custom_url = this.getCharPref(this.PREF_CUSTOM_URL);
	this.custom_tmpl = this.getIntPref(this.PREF_CUSTOM_TMPL);
	for (var i=1; i<this.NUM_CUSTOM_PARAMS+1; i++) {
		this.custom_param[i] = this.getCharPref(this.PREF_CUSTOM_PARAM+i);
	}
	this.custom_opentype = this.getIntPref(this.PREF_CUSTOM_OPENTYPE);
	if (objTelifyUtil.appinfo.ID == objTelifyUtil.THUNDERBIRD_ID) {
		this.custom_opentype = 0;
	}
},


prefObserver: {
	observe: function(subject, topic, data) {
		if (topic != "nsPref:changed") return;
		objTelifyPrefs.getPrefs();
	}
},


initTelifyPrefs: function()
{
	objTelifyPrefs.telPrefs = objTelifyPrefs.getPrefObj();
	objTelifyPrefs.migrateOldPreferences();
	objTelifyPrefs.telPrefs.addObserver("", objTelifyPrefs.prefObserver, false);
	objTelifyPrefs.telStrings = document.getElementById("idTelifyStringBundle");
	objTelifyPrefs.getPrefs();
}

};


