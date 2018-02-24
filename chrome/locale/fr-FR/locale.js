/* (c) 2009-2010 Michael Koch
*/

var objTelifyLocale = {

defaultCountryCode: "+33",

msgNumberTemplateMissing: function()
{
    return "Votre modèle ne contient pas d'emplacement pour le numéro de téléphone (i.e. '$0') et ne transmettra donc pas de numéro. "
    + "Voulez-vous réellement continuer ?";
},

msgUnknownProtocol: function()
{
    return "Il n'y a aucune application enregistrée pour le protocole utilisé. "
    + "Veuillez configurer un protocole dans les préférences de Telify ou installer une application adéquate.";
}

}
