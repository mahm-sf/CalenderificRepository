public without sharing class searchCalendarController {

    @AuraEnabled
    public static List<Citizen_Detail__c> getCitizen(string SAId){
        return [select id,Name,Search_Count__c,DOB__c,Gender__c,SA_Citizen__c from Citizen_Detail__c where Name =: SAId];
    }

    @AuraEnabled
    public static Calendarific_Configuration__mdt getApiKey(){
        return [select Detail__c from Calendarific_Configuration__mdt where DeveloperName='API_Key'];
    }
    
    @AuraEnabled
    public static List<holiday__c> getholidays(string year){
        return [select id,Type__c,DOB__c,Description__c,Name from holiday__c where DOB__c Like :year+'%%'];
    }

    @AuraEnabled
    public static Citizen_Detail__c updateCitizen(string CitizenJSON){
        List<Citizen_Detail__c> citizenDetaillist;
        Citizen_Detail__c citizen;
        try {
            citizen = (Citizen_Detail__c) Json.deserialize(CitizenJSON,Citizen_Detail__c.class); 
            citizenDetaillist = [select id,Name,Search_Count__c,DOB__c,Gender__c,SA_Citizen__c from Citizen_Detail__c where SA_ID__c =: citizen.SA_ID__c];
            if(citizenDetaillist.size()>0){
                citizenDetaillist[0].Search_Count__c ++;
                Update citizenDetaillist[0];
                return citizenDetaillist[0];
                } else {
                  insert citizen;
                  return citizen;
                }
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    @AuraEnabled
    public static List<Holiday__c> updateholidays(string HolidayJSON){
        try{
            list<Holiday__c> holidaysList = (list<Holiday__c>) Json.deserialize(HolidayJSON,List<Holiday__c>.Class);
            insert holidaysList;
            return holidaysList;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}
