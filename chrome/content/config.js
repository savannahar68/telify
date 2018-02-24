/*
Creative Commons License: Attribution-No Derivative Works 3.0 Unported
http://creativecommons.org/licenses/by-nd/3.0/
(c) 2009-2010 Michael Koch
*/

var objTelifyConfig = {

tmplIndex: 0,
customLabelDefault: "",

setConfigValues: function()
{
	objTelifyPrefs.telPrefs.setCharPref(objTelifyPrefs.PREF_IDD_PREFIX, document.getElementById("idTelifyPref_idd_prefix").value);
	objTelifyPrefs.telPrefs.setIntPref(objTelifyPrefs.PREF_HREFTYPE, document.getElementById("idTelifyPref_hreftype").value);
	objTelifyPrefs.telPrefs.setIntPref(objTelifyPrefs.PREF_HIGHLIGHT, document.getElementById("idTelifyPref_highlight").value);
	objTelifyPrefs.telPrefs.setIntPref(objTelifyPrefs.PREF_NUMHISTORY, document.getElementById("idTelifyPref_num_history").value);
	objTelifyPrefs.telPrefs.setBoolPref(objTelifyPrefs.PREF_STATUSICON, document.getElementById("idTelifyPref_statusicon").value == 1);
	objTelifyPrefs.telPrefs.setBoolPref(objTelifyPrefs.PREF_DIAL_CC_DIRECT, document.getElementById("idTelifyPref_dialcc").value == 1);
	objTelifyPrefs.telPrefs.setBoolPref(objTelifyPrefs.PREF_DIAL_WOCC_DIRECT, document.getElementById("idTelifyPref_dialwocc").value == 1);
	objTelifyPrefs.telPrefs.setCharPref(objTelifyPrefs.PREF_SUPPRESS_CC, document.getElementById("idTelifyPref_suppress_cc").value);
	objTelifyPrefs.telPrefs.setBoolPref(objTelifyPrefs.PREF_TELIFY_AB, document.getElementById("idTelifyPref_telify_addressbook").value == 1);

	objTelifyPrefs.telPrefs.setCharPref(objTelifyPrefs.PREF_CUSTOM_URL, document.getElementById("idTelifyPref_url_input").value);
	objTelifyPrefs.telPrefs.setIntPref(objTelifyPrefs.PREF_CUSTOM_TMPL, this.tmplIndex);
	for (var i=1; i<objTelifyPrefs.NUM_CUSTOM_PARAMS+1; i++) {
		objTelifyPrefs.telPrefs.setCharPref(objTelifyPrefs.PREF_CUSTOM_PARAM+i, document.getElementById("idTelifyPref_param"+i+"_value").value);
	}
	objTelifyPrefs.telPrefs.setIntPref(objTelifyPrefs.PREF_CUSTOM_OPENTYPE, document.getElementById("idTelifyPref_opentype").value);
},

onAccept: function()
{
	this.setConfigValues();
	return true;
},

onHelp: function()
{
	objTelifyUtil.openOnlineHelp();
	return true;
},

initConfig: function()
{
	objTelifyPrefs.initTelifyPrefs();
	document.getElementById("idTelifyPref_idd_prefix").value = objTelifyPrefs.idd_prefix;
	document.getElementById("idTelifyPref_hreftype").value = objTelifyPrefs.hrefType;
	this.hrefTypeChanged(objTelifyPrefs.hrefType);
	document.getElementById("idTelifyPref_highlight").value = objTelifyPrefs.highlight;
	document.getElementById("idTelifyPref_num_history").value = objTelifyPrefs.numHistory;
	document.getElementById("idTelifyPref_statusicon").value = (objTelifyPrefs.fStatusIcon ? 1 : 0);
	if (objTelifyUtil.appinfo.ID == objTelifyUtil.THUNDERBIRD_ID) {
		document.getElementById("idTelifyPref_statusicon_row").setAttribute("collapsed", true);
		window.sizeToContent();
	} 
	document.getElementById("idTelifyPref_dialcc").value = (objTelifyPrefs.fDialCCDirect ? 1 : 0);
	document.getElementById("idTelifyPref_dialwocc").value = (objTelifyPrefs.fDialWOCCDirect ? 1 : 0);

	document.getElementById("idTelifyPref_telify_addressbook").value = (objTelifyPrefs.fTelifyAddressBook ? 1 : 0);
	if (objTelifyUtil.appinfo.ID != objTelifyUtil.THUNDERBIRD_ID) {
		document.getElementById("idTelifyPref_row_telify_addressbook").setAttribute("collapsed", true);
	}

	if (objTelifyPrefs.hrefType == objTelifyPrefs.HREFTYPE_SKYPE) {
		document.getElementById("idTelifyPref_dialwocc").setAttribute("disabled", true);
	}

	var node = document.getElementById("idTelifyPref_suppress_cc");
	for (var i=0; i<telify_country_data.length; i++) {
		var item = document.createElement("menuitem");
		item.setAttribute("label", telify_country_data[i][0]);
		item.setAttribute("value", telify_country_data[i][0]);
		node.firstChild.appendChild(item);
		if (telify_country_data[i][0] == objTelifyPrefs.suppress_cc) {
			node.selectedIndex = i;
		}
	}

	document.getElementById("idTelifyPref_url_input").value = objTelifyPrefs.custom_url;
	this.tmplIndex = objTelifyPrefs.custom_tmpl;
	for (var i=1; i<objTelifyPrefs.NUM_CUSTOM_PARAMS+1; i++) {
		document.getElementById("idTelifyPref_param"+i+"_value").value = objTelifyPrefs.custom_param[i];
	}

	document.getElementById("idTelifyPref_opentype").value = objTelifyPrefs.custom_opentype;
	if (objTelifyUtil.appinfo.ID == objTelifyUtil.THUNDERBIRD_ID) {
		document.getElementById("idTelifyPref_opentype").setAttribute("disabled", true);
	}

	this.customLabelDefault = document.getElementById("idTelifyPref_custom_caption").label

	var popup = document.getElementById("idTelifyPref_url_popup");
	for (var i=0; i<telify_custom_preset.length; i++) {
		var item = document.createElement("menuitem");
		item.setAttribute("label", telify_custom_preset[i][0]);
		popup.appendChild(item);
	}

	this.setTemplate(this.tmplIndex, true);

	objTelifyUtil.getAddonVersion(
		function(version) {
			document.getElementById("idTelifyPref_version_label").value = "Telify v"+version;
		}
	);

},

getTemplateParam: function(nr)
{
	if (nr == 0) return objTelifyPrefs.telStrings.getString("phonenr_tmpl");
	var param = document.getElementById("idTelifyPref_param"+nr+"_value").value;
	var label = document.getElementById("idTelifyPref_param"+nr+"_caption").value;
	if (label.value && label.value == "") param = "";
	return param;
},

createResultDOM: function(node)
{
	if (node == null) return; // safety
	if (node.nodeType == Node.TEXT_NODE) {
		var text = node.data;
		var len = text.length;
		var fEscape = 0;
		for (var i=0; i<len-1; i++) {
			if (fEscape == 1) {fEscape = 0; continue;}
			var c = text.charAt(i);
			if (c == '\\') {fEscape = 1; continue}
			if (c != '$') continue;
			c = text.charAt(i+1);
			var nr = "0123456789".indexOf(c);
			if (nr < 0 || nr > objTelifyPrefs.NUM_CUSTOM_PARAMS) continue;
			var prev_node = document.createTextNode(text.substr(0, i));
			var next_node = document.createTextNode(text.substr(i+2));
			var hilite_node = document.createElement("span");
			hilite_node.setAttribute("class", (nr == 0 ? "tmpl_number" : "tmpl_param"));
			var param_node = document.createTextNode(this.getTemplateParam(nr));
			hilite_node.appendChild(param_node);
			var parentNode = node.parentNode;
			parentNode.replaceChild(next_node, node);
			parentNode.insertBefore(hilite_node, next_node);
			parentNode.insertBefore(prev_node, hilite_node);
			break;
		}
	} else {
		for (var i=0; i<node.childNodes.length; i++) {
			this.createResultDOM(node.childNodes[i]);
		}
	}
},

urlChanged: function()
{
	var url = document.getElementById("idTelifyPref_url_input").value;
	var result = document.getElementById("idTelifyPref_url_result");
	while (result.childNodes[0]) result.removeChild(result.childNodes[0]);
	if (url == "") {
		var item = document.createElement("span");
		var empty_url = objTelifyPrefs.telStrings.getString("empty_url")
		item.appendChild(document.createTextNode(empty_url));
		item.setAttribute("class", "tmpl_empty");
		result.appendChild(item);
	} else {
		var item = document.createTextNode(url);
		result.appendChild(item);
		this.createResultDOM(result);
	}
},

setTemplate: function(nr, init)
{
	var caption =	document.getElementById("idTelifyPref_custom_caption");
	caption.label = this.customLabelDefault;
	if (telify_custom_preset[nr][0].length) caption.label += " ("+telify_custom_preset[nr][0]+")";
	if (!init) document.getElementById("idTelifyPref_url_input").value = telify_custom_preset[nr][1];
	for (var j=0; j<objTelifyPrefs.NUM_CUSTOM_PARAMS; j++) {
		var label = document.getElementById("idTelifyPref_param"+(j+1)+"_caption");
		var param = document.getElementById("idTelifyPref_param"+(j+1)+"_value");
		var row = document.getElementById("idTelifyPref_param"+(j+1)+"_row");
		label.value = telify_custom_preset[nr][2+j];
		if (label.value != "") label.value += ":";
		if (label.value == "") param.setAttribute("disabled", true); else param.removeAttribute("disabled");
	}
	this.urlChanged();
},

tmplChanged: function()
{
	var obj = document.getElementById("idTelifyPref_url_input");
	for (var i=0; i<telify_custom_preset.length; i++) {
		if (obj.value == telify_custom_preset[i][0]) {
			this.tmplIndex = i;
			this.setTemplate(i, false);
			break;
		}
	}
},

paramChanged: function(nr, value)
{
	this.urlChanged();
},

enableDOMTree: function(node, enable)
{
	if (node == null) return;
	if (enable) {
		if (node.removeAttribute) node.removeAttribute("disabled");
	} else {
		if (node.setAttribute) node.setAttribute("disabled", true);
	}
	for (var i=0; i<node.childNodes.length; i++) {
		this.enableDOMTree(node.childNodes[i], enable);
	}
},

hrefTypeChanged: function(nr)
{
	var group = document.getElementById("idTelifyPref_custom_group");
	if (nr == objTelifyPrefs.HREFTYPE_CUSTOM) {
		group.removeAttribute("collapsed");
		window.sizeToContent();
	} else {
		//alert(group.clientHeight);
		group.setAttribute("collapsed", true);
		//window.resizeTo(500, 500);
		window.resizeBy(0, -200);
		window.sizeToContent();
	}
	if (nr == objTelifyPrefs.HREFTYPE_SKYPE) {
		document.getElementById("idTelifyPref_dialwocc").setAttribute("disabled", true);
	} else {
		document.getElementById("idTelifyPref_dialwocc").removeAttribute("disabled", true);
	}
}

};
