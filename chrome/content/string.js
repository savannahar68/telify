/*
Creative Commons License: Attribution-No Derivative Works 3.0 Unported
http://creativecommons.org/licenses/by-nd/3.0/
(c) 2010-2015 Michael Koch
*/

var TelifyStringUtil = {

	tohex: function(v, l) {
		if (v < 0) v = -v;
		var s = v.toString(16);
		while (s.length < l) s = "0" + s;
		return s;
	},
	
	quote: function(s) {
		var d = "";
		for (var i=0; i<s.length; i++) {
			var c = s.charAt(i);
			if (c > 31 && c < 127 && c != '"' && c != '\\' && c != '\t') {
				d += c;
			} else {
				if (c == '\t') {
					d += "\\t";
				} else if (c == '\r') {
					d += "\\r";
				} else if (c == '\n') {
					d += "\\n";
				} else if (c > 255) {
					d += "\\u" + TelifyStringUtil.tohex(c, 4);
				} else {
					d += "\\x" + TelifyStringUtil.tohex(c, 2);
				}
			}
		}	
		return '"' + s + '"';
	}
	
}

