$(document).ready(function() {
	var $sigdiv = $("#signature").jSignature({
		'UndoButton' : true
	});
	//var transitions = [ 'pop', 'slide', 'fade', 'flip', 'flow', 'turn', 'slidefade', 'slide', 'slideup', 'slidedown' ];
	var transition = 'slidefade';
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

});

var app = {
	mic : null,
	isPaused : false,
	deviceType : 'Browser',
	filePath : '/',
	fileName : 'chief_complaint.wav',
	patient : new function(){
		this.patientID = "None"; //MR Number
		this.admitID = "";		 //VisitNumber
		this.patientIndex = "";  //PatientNumber
		this.newAdmit = false;
		this.newPatient = false;
		this.lastName = "";
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
		$.ajax({
			     url: dir,
			     type: "POST",
			     dataType: "json",
			     crossDomain: false,
			     data: param,
			     cache: false,
			     success: function(response) {
			     	callback(response);
			     },
			     error : function (e){
			     	console.log('Error encountered while making data request.' + e.status);
			     	console.log(e);
			     }
			 });
	},

	getPatientData : function(){
		app.patient.admitID = $('#admitSearchList input:checked').attr('data-admitid');
		app.makeRequest("loadPatient", app.patient, app.loadPatientData);
	},

	findPatient: function(){
		var patientID = $('#patient_id').val();
		app.patient.lastName = $('#Field1').val();
		var params = new function(){ this.patientID = ""; this.lastName = "";};
		app.patient.dob = $('#Field2').val();
		params.patientID = patientID;
		params.lastName = app.patient.lastName;

		if (app.patient.patientIndex != "" || app.patient.lastName != ""){
			app.makeRequest("findPatient", params, app.getPatientList);
		}else{
			alert("Please enter Patient's Last name and Date of Birth or the ID to search for your patient.")
		}
	},
	findAdmit : function(){
		app.patient.patientIndex = $('#patSearchList input:checked ').attr("data-patientID");
   		if (app.patient.patientIndex == "newPatient"){
   			app.patient.newPatient = true;
   			app.patient.newAdmit = true;
   		}

		params = new function(){
				this.patientID = app.patient.patientIndex,
				this.lastName = app.patient.lastName,
				this.dob = app.patient.dob,
				this.newPatient =app.patient.newPatient,
				this.newAdmit = app.patient.newAdmit;
		};

		app.makeRequest("findAdmit", params, app.getAdmitList);

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

	    	if (data.newAdmit === false){
    		
    			var admitHeader = "<h1>Please select Admission</h1>";
    	
    		}else{
    	
    			var admitHeader = "<h1>Please select an ADT Message</h1>";
    	
    		}

    		$('#admitSelectHeader').html(admitHeader);


    		var admitDate = data.results.admitDates,
    		billingNumber = data.results.billingNumbers,
    		admitIndex = data.results.admitIndex,
    		status = data.results.inPatient,
    		admitSearch = "<input id='patSelect' name='admitSel' type='hidden' value='' />";
    		if (data.results.hasOwnProperty('firstName')){
    			var firstName = data.results.firstName;
		        for (var x=0; x < data.results.firstName.length; x++){

		        	admitSearch+= "<span><input type='radio' class='field radio admitChoice' name='admitSel' data-admitID = "+admitIndex[x]+" id='admit"+x+"'/> \
					   <label for='admit" +x+"' class='choice' >First Name: "+firstName[x] + " Admit Date:" +admitDate[x]+" Type: "+status[x] + " Billing Number:"+billingNumber[x] +"</label></span>";
		        }				    			

    		}else{
		        
		        for (var x=0; x<status.length; x++){

		        	admitSearch+= "<span><input type='radio' class='field radio admitChoice' name='admitSel' data-admitID = "+admitIndex[x]+" id='admit"+x+"'/> \
					   <label for='admit" +x+"' class='choice' >Admit Date:" +admitDate[x]+" Type: "+status[x] + " Billing Number:"+billingNumber[x] +"</label></span>";
		        }

    		}

        
		    admitSearch+= "<span> <input type='radio' class='field radio admitChoice' name = 'admitSel' data-admitID = 'newAdmit' for = 'patientSel' id = 'newAdmit'/>\
				<label for='newAdmit'>New Admission</label></span>";


		   	$("#admitSearchList").empty().append(admitSearch);
		   	$('.admitChoice').checkboxradio();
			$("#admitSelect").dialog();
			$.mobile.changePage("#admitSelect");
	}

	},
	loadPatientData : function(data){
		var fields = data.patient.mobileTextFields,
		values = data.patient.mobileTextValues;
		for(var x=0; x < fields.length; x++){
			if (values[x] != "__blank__"){
				$('#'+fields[x]).val(values[x]);	
			}
		}
		var fields = data.patient.mobileCheckFields,
		values = data.patient.mobileCheckValues;
		for(var x=0; x < fields.length; x++){
				$('#'+fields[x]).attr('checked', values[x]).checkboxradio("refresh");	

		}
	}
}
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

});

var app = {
	mic : null,
	isPaused : false,
	deviceType : 'Browser',
	filePath : '/',
	fileName : 'chief_complaint.wav',
	patient : new function(){
		this.patientID = "None";
		this.admitID = "";
		this.patientIndex = "";
		this.newAdmit = false;
		this.newPatient = false;
		this.lastName = "";
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



	findPatient: function(){
		var patientID = $('#patient_id').val();
		app.patient.lastName = $('#Field1').val();
		var params = new function(){ this.patientID = ""; this.lastName = "";};
		app.patient.dob = $('#Field2').val();
		params.patientID = patientID;
		params.lastName = app.patient.lastName;

		if (app.patient.patientIndex != "" || app.patient.lastName != ""){
			$.ajax({
			     url: 'findPatient',
			     type: "POST",
			     dataType: "json",
			     crossDomain: false,
			     data: params,
			     cache: false,
			     success: function(response) {
					var patientSearch = "<input id='patSelect' name='patientSel' type='hidden' value='' />";
			     	if (response.newPatient === false){
				        var mr = response.results.mR,
				        first = response.results.firstNames,
				        last = response.results.lastNames,
				        dob = response.results.dob,
				        ssn = response.results.ssn,
				        patId = response.results.patID, 
				        options = { 
				        	beforeclose: function(){
				        		console.log('before close');
				        		app.patient.patientIndex = $('#patSearchList input:checked ').attr("data-patientID");
				        		if (app.patient.patientIndex == "newPatient"){
				        			app.patient.newPatient = true;
				        			app.patient.newAdmit = true;
				        		}

				        	}};
				        
				        for (var x=0; x<response.results.mR.length; x++){
				        	patientSearch+= "<span><input type='radio' class='field radio patientChoice' name='patientSel' data-patientID = "+patId[x]+" id='patient" +patId[x]+"'/> \
							   <label for='patient" +patId[x]+"' class='choice' >Patient ID:"+mr[x] + " Name:" +last[x]+", "+first[x] + " Dob:"+dob[x] + " Ssn:" + ssn[x] +"</label></span>";
				        }			     		
			     	}
			        
			        patientSearch+= "<span> <input type='radio' class='field radio patientChoice' name = 'patientSel' data-patientID = 'newPatient' for = 'patientSel' id = 'newPatient'/>\
								   	<label for='newPatient'>New Patient</label></span>";
					
					$("#patSearchList").empty().append(patientSearch);
					$('.patientChoice').checkboxradio();	
		  		    $("#patientsearch").dialog(options);
			    	$.mobile.changePage("#patientsearch");
			        console.log("Patient Search Successful" + response);
			     }
			     // },
			     // error: function(e) {
			     //    console.log('Error on find Patient satus:'+e.status);
			     //    console.log(e);
			     // }
			 });

		}
	},
	findAdmit : function(){
		app.patient.patientIndex = $('#patSearchList input:checked ').attr("data-patientID");
   		if (app.patient.patientIndex == "newPatient"){
   			app.patient.newPatient = true;
   			app.patient.newAdmit = true;
   		}

		params = new function(){
				this.patientID = app.patient.patientIndex,
				this.lastName = app.patient.lastName,
				this.dob = app.patient.dob,
				this.newPatient =app.patient.newPatient,
				this.newAdmit = app.patient.newAdmit;
		};


					$.ajax({
				    url: 'findAdmit',
				    type: "POST",
				    dataType: "json",
				    crossDomain: false,
				    data: params,
				    cache: false,
				    success: function(response){
				    	if (response.results){


					    	if (response.newAdmit === false){
					    	
					    		var admitHeader = "<h1>Please select Admission</h1>";
					    	
					    	}else{
					    	
					    		var admitHeader = "<h1>Please select an ADT Message</h1>";
					    	
					    	}

					    	$('#admitSelectHeader').html(admitHeader);


					    		var admitDate = response.results.admitDates,
					    		billingNumber = response.results.billingNumbers,
					    		admitIndex = response.results.admitIndex,
					    		status = response.results.inPatient,
					    		admitSearch = "<input id='patSelect' name='admitSel' type='hidden' value='' />";
					    		if (response.results.hasOwnProperty('firstName')){
					    			var firstName = response.results.firstName;
							        for (var x=0; x<response.results.firstName.length; x++){

							        	admitSearch+= "<span><input type='radio' class='field radio admitChoice' name='admitSel' data-admitID = "+admitIndex[x]+" id='admit"+x+"'/> \
										   <label for='admit" +x+"' class='choice' >First Name: "+firstName[x] + " Admit Date:" +admitDate[x]+" Type: "+status[x] + " Billing Number:"+billingNumber[x] +"</label></span>";
							        }				    			

					    		}else{
							        
							        for (var x=0; x<status.length; x++){

							        	admitSearch+= "<span><input type='radio' class='field radio admitChoice' name='admitSel' data-admitID = "+admitIndex[x]+" id='admit"+x+"'/> \
										   <label for='admit" +x+"' class='choice' >Admit Date:" +admitDate[x]+" Type: "+status[x] + " Billing Number:"+billingNumber[x] +"</label></span>";
							        }

					    		}
	     		
					        
							    admitSearch+= "<span> <input type='radio' class='field radio admitChoice' name = 'admitSel' data-admitID = 'newAdmit' for = 'patientSel' id = 'newAdmit'/>\
									<label for='newAdmit'>New Admission</label></span>";


							   	$("#admitSearchList").empty().append(admitSearch);
							   	$('.admitChoice').checkboxradio();
								$("#admitSelect").dialog();
								$.mobile.changePage("#admitSelect");
						}

					},
				    error: function(e){
				    	console.log('error on find admit'+ e.status);
				    	console.log(e);
				    }

				});

	}
}