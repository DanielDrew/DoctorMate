
$(document).ready(function() {
	var $sigdiv = $("#signature").jSignature({
		'UndoButton' : true
	});
	//var transitions = [ 'pop', 'slide', 'fade', 'flip', 'flow', 'turn', 'slidefade', 'slide', 'slideup', 'slidedown' ];
	var transition = 'slidefade';

	$('a').each(function() {
		// Set the default page transitions
		//transition = transitions[Math.floor(Math.random()*10)]
		$(this).attr('data-transition', transition);
	});

	// Microphone buttons...
	$("#record").button();
	$("#stop").button();
	$("#pause").button();
	$("#play").button();

	$("#stop").button("disable");
	$("#pause").button("disable");
	$("#play").button("disable");

	$("#record").bind("click", app.record);
	$("#pause").bind("click", app.pause);
	$("#stop").bind("click", app.stop);
	$("#play").bind("click", app.play);
	$("#findPatient").bind("click", app.findPatient);
	$("#acceptPatient").bind("click", app.findAdmit);
	$("#acceptAdmit").bind("click", app.getPatientData);
	$('#ajaxProgress').hide();
	$("#clearPatient").bind("click", app.clearPatient);
	$("#clearPatient").addClass("ui-disabled");
	$("#sendPatientData").bind("click", app.sendPatientData);
	$("#patient_UniqueIndex").hide();
$("#patient #history #systems #diagnostics #signatures").trigger( "create" );
});

$.fn.clearForm = function() {
  return this.each(function() {
    var type = this.type, tag = this.tagName.toLowerCase();
    if (tag == 'form')
      return $(':input',this).clearForm();
    if (type == 'text' || type == 'password' || tag == 'textarea')
      this.value = '';
    else if (type == 'checkbox' || type == 'radio'){
    	this.checked = false;
    }
      
    else if (tag == 'select')
      this.selectedIndex = -1;
  });
};


var app = {
	mic : null,
	isPaused : false,
	deviceType : 'Browser',
	filePath : '/',
	fileName : 'chief_complaint.wav',
	patientData : null,
	patient : new function(){
		this.patientID = ""; //MR Number
		this.admitID = "";		 //VisitNumber
		this.patientIndex = "";  //PatientNumber
		this.newAdmit = false;
		this.newPatient = false;
		this.lastName = "";
		this.firstName = "";
		this.dob = "";
	},



	init : function() {
		//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
		// Core device detection functions
		//=-=-=-=-=-=-=-=-=-=-=-=-=-=-=
		var userAgent = navigator.userAgent.toLowerCase();
		if (userAgent.indexOf('webkit') >= 0) {
			if (userAgent.indexOf('blackberry') >= 0) {
				app.deviceType = (window.tinyHippos) ? 'RippleBlackberry' : 'Blackberry';
			} else if (userAgent.indexOf('playbook') >= 0) {
				app.deviceType = (window.tinyHippos) ? 'RipplePlaybook' : 'Playbook';
			}
		}
		console.log('Device: ' + app.deviceType);

		// Set up Microphone ONLY if Playbook!
		if (app.deviceType === 'Playbook') {
			console.log('Playbook detected!');
			app.mic = blackberry.media.microphone;
			app.filePath = blackberry.io.dir.appDirs.shared.music.path;
		}
		// Send to desired home page once page is loaded
		window.setTimeout(app.homePage, 200);
		$("#confirm-clear-dialog").dialog();


	},

	initPatient : function(){
		
			app.patient.patientID = ""; //MR Number
			app.patient.admitID = "";		 //VisitNumber
			app.patient.patientIndex = "";  //PatientNumber
			app.patient.newAdmit = false;
			app.patient.newPatient = false;
			app.patient.lastName = "";
	
	},

	homePage : function() {
		$.mobile.changePage($("#patient"), 'none');
		window.setTimeout(function() {
			$('#myPage').css('visibility', 'visible')
		}, 300);
	},

	record : function(myFilename) {
		try {
			//if (myFilename) {
			//	app.fileName = myFilename;
			//}
			console.log('Recording: ' + app.filePath + '/' + app.fileName);
			if (app.deviceType === 'Playbook') {
				var myFilename = app.filePath + '/' + app.fileName;
				try {
					if (blackberry.io.file.exists(myFilename)) {
						blackberry.io.file.deleteFile(myFilename);
						//, app.filePath+'/old_'+app.fileName);
					}
				} catch (e) {
					console.log('Deleting old, e:' + e.message);
				}
				app.mic.record(myFilename, app.testSuccess, app.testError);
			}
			$("#record").button("disable");
			$("#play").button("disable");
			$("#pause").button("enable");
			$("#stop").button("enable");
			console.log('Recording started successfully');
		} catch (e) {
			console.log('Record, e:' + e.message);
		}
	},

	pause : function() {
		app.isPaused = !app.isPaused;

		if (app.isPaused) {
			console.log('Resuming...');
			$('#pause').text('Resume');
		} else {
			console.log('Pausing...');
			$('#pause').text('Pause');
		}
		$('#pause').button('refresh');
		try {
			if (app.deviceType === 'Playbook') {
				app.mic.pause();
			}
		} catch (e) {
			console.log('Pause, e:' + e.message);
		}
	},
	play : function() {
		try {
			console.log('Playing...');
			if (app.deviceType === 'Playbook') {
				blackberry.io.file.open( app.filePath + '/' + app.fileName );
			}
		} catch (e) {
			console.log('Play, e:' + e.message);
		}
	},
	stop : function() {
		try {
			console.log('Stopping...');
			if (app.deviceType === 'Playbook') {
				app.mic.stop();
			}
			$("#play").button("enable");
			$("#record").button("enable");
			$("#pause").button("disable");
			$("#stop").button("disable");
		} catch (e) {
			console.log('Stop, e:' + e.message);
		}
	},

	testSuccess : function(filePath) {
		console.log("Recorded successfully! File: " + app.filePath);
	},

	testError : function(errorCode, errorMessage) {
		if (errorMessage == "Unsupported record encoding type") {
			console.log("try recording an .amr audio file");
			return;
		}
		console.log('error code:' + errorCode + ' error message:' + errorMessage);
	},

	makeRequest : function(dir, param, callback){
		$('#ajaxProgress').show();
		$.ajax({
			     url: dir,
			     type: "POST",
			     dataType: "json",
			     crossDomain: false,
			     data: param,
			     cache: false,

			     success: function(response) {
			     	$('#ajaxProgress').hide();
			     	callback(response);
			     },
			     error : function (e){
			     	$('#ajaxProgress').hide();
			     	console.log('Error encountered while making data request.' + e.status);
			     	console.log(e);
			     }
			 });
	},

	getPatientData : function(){
		
		app.patient.admitID = $('#admitSearchList input:checked').attr('data-admitid');
		
		if (app.patient.admitID ==="newAdmit"){
		
			app.patient.newAdmit= true;
			app.makeRequest("findADTMessages", app.patient, app.gethl7Data);
		}else{
			app.patient.newAdmit= false;

			app.makeRequest("loadPatient", app.patient, app.loadPatientData);	
		}

		
	},

	findPatient: function(){

		app.patient.patientID = $('#patient_id').val();
		app.patient.lastName = $('#pat_LastName').val();
		app.patient.firstName = $('#pat_FirstName').val();
		app.patient.dob = $('#pat_DOB').val();
		

		if (app.patient.patientID != "" || app.patient.lastName != ""){
			app.makeRequest("findPatient", app.patient, app.getPatientList);
		}else{
			alert("Please enter Patient's Last name and Date of Birth or the ID to search for your patient."); //Change to Popup 
		}

	},
	findAdmit : function(){
		app.patient.patientIndex = $('#patSearchList input:checked ').attr("data-patientID");
   		if (app.patient.patientIndex == "newPatient"){
   			app.patient.newPatient = true;
   			app.patient.newAdmit = true;
   			app.makeRequest("findADTMessages", app.patient, app.gethl7Data);

   		}else{
			app.patient.newAdmit= false;
			app.patient.newPatient= false;
			app.makeRequest("findAdmit", app.patient, app.getAdmitList);
   		}

		

	}, 
	getPatientList: function(data){

		var patientSearch = "<input id='patSelect' name='patientSel' type='hidden' value='' />";
     	if (data.newPatient === false){
	        var mr = data.results.mR,
	        first = data.results.firstNames,
	        last = data.results.lastNames,
	        dob = data.results.dob,
	        ssn = data.results.ssn,
	        patId = data.results.patID;
 			for (var x=0; x<data.results.mR.length; x++){
	        	patientSearch+= "<span><input type='radio' class='field radio patientChoice' name='patientSel' data-patientID = "+patId[x]+" id='patient" +patId[x]+"'/> \
					<label for='patient" +patId[x]+"' class='choice' >Patient ID:"+mr[x] + " Name:" +last[x]+", "+first[x] + " Dob:"+dob[x] + " Ssn:" + ssn[x] +"</label></span>";
	        }
	    }
	     
	    patientSearch+= "<span> <input type='radio' class='field radio patientChoice' name = 'patientSel' data-patientID = 'newPatient' for = 'patientSel' id = 'newPatient'/>\
			<label for='newPatient'>New Patient</label></span>";

		$("#patSearchList").empty().append(patientSearch);
		$('.patientChoice').checkboxradio();	
	    $("#patientsearch").dialog();
    	$.mobile.changePage("#patientsearch");
        console.log("Patient Search Successful" + data);	
	},
	getAdmitList: function(data){
		if (data.results){
			var admitDate = data.results.admitDates,
    		billingNumber = data.results.billingNumbers,
    		admitIndex = data.results.admitIndex,
    		status = data.results.inPatient,
    		admitSearch = "<input id='patSelect' name='admitSel' type='hidden' value='' />";

	    	if (data.newAdmit === false){
    		
    			var admitHeader = "<h1>Please select Admission</h1>";
		        for (var x=0; x<status.length; x++){

		        	admitSearch+= "<span><input type='radio' class='field radio admitChoice' name='admitSel' data-admitID = "+admitIndex[x]+" id='admit"+x+"'/> \
					   <label for='admit" +x+"' class='choice' >Admit Date:" +admitDate[x]+" Type: ";
					   if (status[x] =="True"){
					  	admitSearch+="Inpatient";
					  }else{
					  	admitSearch+="OutPatient";
					  }
					  admitSearch+= " Billing Number:"+billingNumber[x] +"</label></span>";
		        }    	


    		}else{
    	
    			var admitHeader = "<h1>Please select an ADT Message</h1>",
    			firstName = data.results.firstName;
		        for (var x=0; x < data.results.firstName.length; x++){

		        	admitSearch+= "<span><input type='radio' class='field radio admitChoice' name='admitSel' data-admitID = "+admitIndex[x]+" id='admit"+x+"'/> \
					   <label for='admit" +x+"' class='choice' >First Name: "+firstName[x] + " Admit Date:" +admitDate[x]+" Type: "
					  if (status[x] =="True"){
					  	admitSearch+="Inpatient";
					  }else{
					  	admitSearch+="OutPatient";
					  }
					admitSearch+=" Billing Number:"+billingNumber[x] +"</label></span>";
    	

    			}
    		}

    		$('#admitSelectHeader').html(admitHeader);
      
		    admitSearch+= "<span> <input type='radio' class='field radio admitChoice' name = 'admitSel' data-admitID = 'newAdmit' for = 'patientSel' id = 'newAdmit'/>\
				<label for='newAdmit'>New Admission</label></span>";


		   	$("#admitSearchList").empty().append(admitSearch);
		   	$('.admitChoice').checkboxradio();
			$("#admitSelect").dialog();
			$.mobile.changePage("#admitSelect");
		}

	},
	gethl7Data: function(data){
		if (data.results){

    		var admitDate = data.results.admitDates,
    		billingNumber = data.results.billingNumbers,
    		admitIndex = data.results.admitIndex,
    		status = data.results.inPatient,
    		admitSearch = "<input id='patSelect' name='admitSel' type='hidden' value='' />";

    		if (data.results.hasOwnProperty('firstName')){
    			var firstName = data.results.firstName;
		        for (var x=0; x < data.results.firstName.length; x++){

		        	admitSearch+= "<span><input type='radio' class='field radio adtChoice' name='admitSel' data-adtID = "+admitIndex[x]+" id='admit"+x+"'/> \
					   <label for='admit" +x+"' class='choice' >First Name: "+firstName[x] + " Admit Date:" +admitDate[x]+" Type: "
					  if (status[x] =="True"){
					  	admitSearch+="Inpatient";
					  }else{
					  	admitSearch+="OutPatient";
					  }
					admitSearch+=" Billing Number:"+billingNumber[x] +"</label></span>";
		        }				    			

    		}else{
		        
		        for (var x=0; x<status.length; x++){

		        	admitSearch+= "<span><input type='radio' class='field radio adtChoice' name='admitSel' data-adtID = "+admitIndex[x]+" id='admit"+x+"'/> \
					   <label for='admit" +x+"' class='choice' >Admit Date:" +admitDate[x]+" Type: ";
					   if (status[x] =="True"){
					  	admitSearch+="Inpatient";
					  }else{
					  	admitSearch+="OutPatient";
					  }
					  admitSearch+= " Billing Number:"+billingNumber[x] +"</label></span>";
		        }

    		}

        
		    admitSearch+= "<span> <input type='radio' class='field radio adtChoice' name = 'admitSel' data-adtID = 'None' for = 'patientSel' id = 'newADT'/>\
				<label for='newADT'>None</label></span>";


		   	$("#adtSearchList").empty().append(admitSearch);
		   	$('.adtChoice').checkboxradio();
			$("#adtSelect").dialog();
			$.mobile.changePage("#adtSelect");
		}else{
			app.patient.newAdmit= true;
			app.makeRequest("loadPatient", app.patient, app.loadPatientData);
		}

	},
	loadPatientData : function(data){
		console.log("Start Patient Load");
		$("#clearPatient").removeClass("ui-disabled");
		var fields = data.patient;
		app.patientData = fields;
		for(var key in data.patient){
			switch(data.patient[key].Type){

				case "text":
					$('#'+key).val(fields[key].Value);
					break;
				case "CheckBox":
					$('#'+key).checkboxradio().attr('checked', fields[key].Value).checkboxradio("refresh");
					break;
				default:
				break;
			}
		}
		console.log("End Patient Load");
		// $('.ui-collapsible-heading-toggle').trigger( "expand" );

		// var fields = data.patient.mobileCheckFields,
		// values = data.patient.mobileCheckValues;
		// for(var x=0; x < fields.length; x++){
		// 		$('#'+fields[x]).checkboxradio().attr('checked', values[x]).checkboxradio("refresh");	

		// }
				// $('.ui-collapsible-heading-toggle').trigger( "collapse" );

		// $("form").loadJSON(data)
	},
	clearPatient : function(){
		$("#confirm-clear-button").bind("click", app.acceptPatientClear);
		app.initPatient();
		$.mobile.changePage("#confirm-clear-dialog");
	},
	acceptPatientClear: function(){
		$('#form65').clearForm();
		$('.checkbox').checkboxradio().checkboxradio('refresh');
		$("#clearPatient").addClass("ui-disabled");
		$("#confirm-clear-button").unbind("click", app.acceptPatientClear);
		$("#confirm-clear-dialog").dialog('close');
	},

	sendPatientData: function(){
		for(var key in app.patientData){
			switch(app.patientData[key].Type){

				case "text":
					app.patientData[key].Value = $('#'+key).val();
					break;

				case "CheckBox":
					app.patientData[key].Value =$("#"+key).prop('checked');
					break;

				case "trap" :
					break;
			}
		}
		app.makeRequest("savePatient", app.patientData, app.saveStatus);

	},
	saveStatus: function(data){
		if (data.results){
			//successful
			console.log("Succesfully sent data to Cardio Pulse");
			//show success dialog
		}else{
			//failed to save
			console.log("Failed to sent data to Cardio Pulse");
			//show failure dialog
		}
	}
}