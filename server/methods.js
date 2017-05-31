//import { Meteor } from 'meteor/meteor';

Meteor.methods({
  // The method expects a valid IPv4 address
  'geoJsonForIp': function (useless) {
  	//this.unblock();
    //console.log('This is the method!');
    // Construct the API URL
    var apiUrl = 'http://localhost:23333/api/sales';
    // query the API
    var response = HTTP.get(apiUrl).data;
    //console.log(response);
    return response;
  }
});

