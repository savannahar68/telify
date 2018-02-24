/* (c)2009 Michael Koch
*/

/* name, url, parameter #1, parameter #2, parameter #3 */
var telify_custom_preset = [
	["", "", "Parameter #1", "Parameter #2", "Parameter #3"],
	["Vorlage für snom-Telefone", "http://$1/command.htm?number=$0&outgoing_uri=$2", "Telefon-IP", "Ausgehende URI", ""],
	["Vorlage für AGFEO TK-Suite Client", "tksuite:$0?call", "", "", ""],
	["Vorlage für CPBX", "http://$1/api.php?number=$0&user=$2&key=$3", "IP-Adresse der Telefonanlage", "Nebenstelle", "Security-Key"],
];
