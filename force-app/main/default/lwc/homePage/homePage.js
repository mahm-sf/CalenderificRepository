import {LightningElement,api,wire} from 'lwc';
import {ShowToastEvent} from 'lightning/platformShowToastEvent';
import updateCitizen from '@salesforce/apex/searchCalendarController.updateCitizen';
import updateHolidays from '@salesforce/apex/searchCalendarController.updateholidays';
import getholidays from '@salesforce/apex/searchCalendarController.getholidays';
import getApiKey from '@salesforce/apex/searchCalendarController.getApiKey';
import Search_Page_Header from '@salesforce/label/c.Search_Page_Header';

const columns = [{label: 'Holiday',fieldName: 'Name'},
                {label: 'Date',fieldName: 'DOB__c'},
                {label: 'Type',fieldName: 'Type__c'},
                {label: 'Description',fieldName: 'Description__c'}];
let i = 0;
const Calenderific_URL = 'https://calendarific.com/api/v2/holidays?';

export default class HomePage extends LightningElement {
    labels = {
        Search_Page_Header,
    };

    isDisabled = true;
    isFirstCall = 0;
    citizenData;
    citizenWrapper;
    holidayWrapper;
    page = 1; //this will initialize 1st page
    items = []; //it contains all the records.
    data = []; //data to be displayed in the table
    columns; //holds column info.
    startingRecord = 1; //start record position per page
    endingRecord = 0; //end record position per page
    pageSize = 5; //default value we are assigning
    totalRecountCount = 0; //total record count received from all retrieved r

    @api holidayList;
    @api year;
    @api month;
    @api day;
    displaytable = false;
    API_Key;

    connectedCallback() {
        getApiKey({})
            .then((data) => {
                this.API_Key = data.Detail__c;
            })
            .catch((error) => {
                console.log(error);
            })
    }
    reset() {
        this.citizenWrapper = null;
        this.displaytable = false;
        this.data = [];
        this.isFirstCall = 0;
        this.isDisabled = true;
    }

    handleChange(event) {
        this.reset();
        var inputValue = event.target.value;
        if (inputValue.length == 13) {
            if (!isNaN(inputValue)) {
                var year = parseInt(inputValue.substring(0, 2));
                this.year = '19' + inputValue.substring(0, 2);
                var month = parseInt(inputValue.substring(2, 4));
                this.month = inputValue.substring(2, 4);
                var day = parseInt(inputValue.substring(4, 6));
                this.day = inputValue.substring(4, 6);
                var gender = parseInt(inputValue.substring(6, 10));
                var citizen = parseInt(inputValue.substring(10, 11));
                var checkSum = parseInt(inputValue.substring(12, 13));

                if (citizen <= 1 && this.checkSumCalculator(inputValue) &&
                    month >= 1 && month <= 12 &&
                    day >= 1 && day <= 31) {
                    this.isDisabled = false;
                    var Data = new Object();
                    Data.DOB__C = '19' + inputValue.substring(0, 2) + '-' + inputValue.substring(2, 4) + '-' + inputValue.substring(4, 6);
                    Data.SA_Citizen__c = citizen == 0 ? 'SA Citizen' : 'Permanent Resident'; //move as PL
                    Data.SA_ID__c = parseInt(inputValue);
                    Data.Name = inputValue;
                    Data.Gender__c = gender > 0 && gender < 5000 ? 'Female' : 'Male';
                    this.citizenData = Data;
                } else {
                    this.showErrorPrompt();
                }
            } else {
                this.showErrorPrompt();
            }
        }
    }

    fetchUserDetailYear() {
        let paramString = 'api_key=' + this.API_Key + '&year=' + this.year + '&country=ZA';
        fetch(Calenderific_URL + paramString)
            .then(response => {
                if (response.ok) {
                    response.json().then(function (result) {
                        var objlist = [];
                        for (var h in result.response.holidays) {
                            var temp1 = result.response.holidays[h];
                            var temp = new Object();
                            temp.Name = temp1.name;
                            temp.Description__c = temp1.description;
                            temp.DOB__C = temp1.date.iso.substring(0, 10);
                            temp.Type__c = temp1.type[0];
                            objlist[h] = temp;
                        }
                        updateHolidays({
                                HolidayJSON: JSON.stringify(objlist)
                            })
                            .then((data) => {

                            })
                            .catch((error) => {
                                console.log(error);
                            })
                            .finally(() => {
                                getholidays({
                                        year: this.year
                                    })
                                    .then((data) => {
                                        this.setData(data);

                                    })
                                    .catch((error) => {
                                        console.log(error);
                                    });
                            });
                    });

                } else {
                    throw Error(response);
                }
            });

    }

    showErrorPrompt() {
        const event = new ShowToastEvent({
            title: 'Invalid',
            message: 'The ID number is invalid',
            variant: 'error'
        });
        this.dispatchEvent(event);
    }

    handleClick(event) {

        if (!this.isDisabled) {
            updateCitizen({
                    CitizenJSON: JSON.stringify(this.citizenData)
                })
                .then((result) => {
                    this.citizenWrapper = result;
                    getholidays({
                            year: this.year
                        })
                        .then((data) => {
                            if (data.length > 0) {
                                this.setData(data);
                            } else {
                                this.fetchUserDetailYear();
                            }
                        })
                        .catch((error) => {
                            console.log(error);
                        });
                })
                .catch((error) => {
                    console.log(error);
                });

        }
    }

    setData(data) {

        //    this.holidayWrapper = data;
        this.items = data;
        this.totalRecountCount = data.length;
        this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); //here it is 5
        this.data = this.items.slice(0, this.pageSize);
        this.endingRecord = this.pageSize;
        this.columns = columns;
        this.displaytable = true;
    }
    checkSumCalculator(idNumber) {
        var tempTotal = 0;
        var checkSum = 0;
        var multiplier = 1;
        for (var i = 0; i < 13; ++i) {
            tempTotal = parseInt(idNumber.charAt(i)) * multiplier;
            if (tempTotal > 9) {
                tempTotal = parseInt(tempTotal.toString().charAt(0)) + parseInt(tempTotal.toString().charAt(1));
            }
            checkSum = checkSum + tempTotal;
            multiplier = (multiplier % 2 == 0) ? 1 : 2;
        }
        return (checkSum % 10) == 0;
    }





    //*******************************************************Data table code TBC*************** */
    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //clicking on next button this method will be called
    nextHandler() {
        if ((this.page < this.totalPage) && this.page !== this.totalPage) {
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //this method displays records page by page
    displayRecordPerPage(page) {

        /*let's say for 2nd page, it will be => "Displaying 6 to 10 of 23 records. Page 2 of 5"
        page = 2; pageSize = 5; startingRecord = 5, endingRecord = 10
        so, slice(5,10) will give 5th to 9th records.
        */
        this.startingRecord = ((page - 1) * this.pageSize);
        this.endingRecord = (this.pageSize * page);

        this.endingRecord = (this.endingRecord > this.totalRecountCount) ?
            this.totalRecountCount : this.endingRecord;

        this.data = this.items.slice(this.startingRecord, this.endingRecord);

        //increment by 1 to display the startingRecord count, 
        //so for 2nd page, it will show "Displaying 6 to 10 of 23 records. Page 2 of 5"
        this.startingRecord = this.startingRecord + 1;
    }
}