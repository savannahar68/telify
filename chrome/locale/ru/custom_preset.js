/* (c)2009 Michael Koch
*/

/* name, url, parameter #1, parameter #2, parameter #3 */
var telify_custom_preset = [
	["", "", "Параметр #1", "Параметр #2", "Параметр #3"],
	["Шаблон для телефонов Snom", "http://$1/command.htm?number=$0&outgoing_uri=$2", "IP телефона", "URI исходящего", ""],
	["Шаблон для AGFEO TK-Suite Client", "tksuite:$0?call", "", "", ""],
	["CPBX template", "http://$1/api.php?number=$0&user=$2&key=$3", "IP-Address Phoneserver", "Extension", "Security-Key"],
];
