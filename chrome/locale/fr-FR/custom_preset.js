/* (c)2009 Michael Koch
*/

/* name, url, parameter #1, parameter #2, parameter #3 */
var telify_custom_preset = [
    ["", "", "Parametre #1", "Parametre #2", "Parametre #3"],
    ["Modèle pour téléphone snom", "http://$1/command.htm?number=$0&outgoing_uri=$2", "IP téléphone", "URI sortante", ""],
    ["Modèle pour client AGFEO TK-Suite", "tksuite:$0?call", "", "", ""],
		["Modèle pour CPBX", "http://$1/api.php?number=$0&user=$2&key=$3", "Adresse IP", "Téléphone", "Security-Key"],
];
