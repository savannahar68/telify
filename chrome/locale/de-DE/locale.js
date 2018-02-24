/* (c) 2009-2010 Michael Koch
*/

var objTelifyLocale = {

defaultCountryCode: "+49",

msgNumberTemplateMissing: function()
{
	return "Ihre Vorlage enthält keinen Platzhalter für die Telefonnummer (d.h. '$0') und wird deshalb keine Telefonnummer übermitteln. "
		+ "Wollen Sie das wirklich?";
},

msgUnknownProtocol: function()
{
	return "Im diesem System ist keine Anwendung installiert, die sich für das verwendete Protokoll registriert hat. "
		+ "Bitte stellen Sie in der Telify-Konfiguration ein geeignetes Protokoll ein oder installieren Sie eine geeignete Anwendung.";
}

}
