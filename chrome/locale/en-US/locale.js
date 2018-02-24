/* (c) 2009-2010 Michael Koch
*/

var objTelifyLocale = {

defaultCountryCode: "+1",

msgNumberTemplateMissing: function()
{
	return "Your template does not contain a placeholder for the phone number (i.e. '$0') and will therefore not transmit a phone number. "
		+ "Do you really want to continue?";
},

msgUnknownProtocol: function()
{
	return "No application is installed which registered itself for the used protocol. "
		+ "Please configure a suitable protocol in the Telify preferences or install a suitable application.";
}

}
