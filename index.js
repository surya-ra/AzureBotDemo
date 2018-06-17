
/*Name: Asset Bot*/
/*Release version- 1.6.0*/
/* Last Updated: 22nd May'18 */
/*Author:Suryadeep */
/*LUIS :Smart Asset v1.0 */
/*Last Updated Dev Version Number: 1.5.6*/
/*Last Update: bottom implemented */

var restify = require('restify');
var builder = require('botbuilder');
var sql = require('mssql');
require('json-response');
var stringify = require('json-stringify');
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
//var app = require('express');
var TYPES = require('tedious').TYPES;
//var botbuilder_azure = require("botbuilder-azure");
var jsonFile = require('jsonfile')
var basequery = jsonFile.readFileSync("PostDeployScripts\\SmartAssetBaseQuery.json")
var filterquery = jsonFile.readFileSync("PostDeployScripts\\SmartAssetFilterQuery.json")
var topquery = jsonFile.readFileSync("PostDeployScripts\\SmartAssetTopQuery.json")
var SmartAssetAllEntities = jsonFile.readFileSync("PostDeployScripts\\SmartAssetAllEntities.json")
var links = jsonFile.readFileSync("PostDeployScripts\\SmartAssetWebLinks.json")
var UserAuthenticate = jsonFile.readFileSync("PostDeployScripts\\Authenticate.json")
var server = restify.createServer();
var fs = require('fs');
var path = require('path');
var userName = process.env['USERPROFILE'].split(path.sep)[2];
//var loginId = path.join("domainName",userName);
var SkypeUsername;
let SecondaryEntityType = "";
let valPlaceholder = "";
let PrimaryEntity = "";
var SecondaryEntity = "";
let TernaryEntity = "";
let SqlQuery = "";
let IntentName = "";
let UtterFetchValue1 = "";
let UtterFetchValue2 = "";
var StoreForFAQ = [];
var StoreReturnForFAQ = [];
var StoreSessionHistory = [];
var StoreMetadata = [];
var StoreTopValues = [];
var StoreTopThreeValues = [];
let SlNo = 0;
var SendDisplay;
var elCnt = 0;
var ifCnt = 0;
var flag;
var flag_table_display = 0;
var HistoryCount = 0;
var indexforTop = 0;
var TopType;
server.listen(process.env.port || process.env.PORT || 8080, function () {
  console.log('%s listening to %s', server.name, server.url);
});

//Configure and create 
var config = {
  userName: '****',
  password: '*****',
  server: '*******',
  options: {
    database: '*****',
    encrypt: true
  }
}
var config1 = {
  userName: '*****',
  password: '****',
  server: '******',
  options: {
    database: '*****',
    encrypt: true
  }
}




//Configure Connection
var connection = new Connection(config);

var connectionInsert = new Connection(config);

var connectionUtter = new Connection(config);

var ConnectionTop = new Connection(config1);

//set up the database connection
connection.on('connect', function (err) {
  if (err) {
    console.log(err)
  }
  else {
    console.log('Connected to database fetch database!')
  }
});

connectionInsert.on('connect', function (err) {
  if (err) {
    console.log('error while connecting the log table' + err);
  }
  else {
    console.log('Connected to insert database');
  }
});

connectionUtter.on('connect', function (err) {
  if (err) {
    console.log('error while connecting for utterance fetch');
  }
  else {
    console.log('Connected For utterance fetch');
  }
});

ConnectionTop.on('connect', function (err) {
  if (err) {
    console.log('Error while connecting to top database' + err)
  }
  else {
    console.log('Connected to top database!')
  }
});

//connect the bot to my node js server  
var connector = new builder.ChatConnector({
	 appId: process.env.MicrosoftAppId,
  appPassword: process.env.MicrosoftAppPassword,
  openIdMetadata: process.env.BotOpenIdMetadata
});

server.post('/api/messages', connector.listen());

var bot = new builder.UniversalBot(connector);

//Integrate LUIS framework with node js server
//const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/4fed397a-0a97-48dc-a9e5-f0e3f026a689?subscription-key=b32c3c902efa422e8ba42e9164de50a5&verbose=true&timezoneOffset=0&q=';
const LuisModelUrl = 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/931731fa-645e-48d4-9c3a-f2919162082e?subscription-key=b32c3c902efa422e8ba42e9164de50a5&spellCheck=true&bing-spell-check-subscription-key={61593bce7f4549e499697aeec639bb22}&verbose=true&timezoneOffset=0&q=';
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
bot.recognizer(recognizer);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
console.log("INTENTS " + JSON.stringify(intents))


//function code to handles entities for intents
function getentities(session, entity, column) {
  SecondaryEntity = "";
  StoreTopValues.splice(0)
  var index = 1;
  var index_top = 1;
 
  //Read the all entities from josn file store them in respective variables
  const alltypes = SmartAssetAllEntities[0].alltypes // Main entities like Asset Count, Asset Value
  const filtertypes = SmartAssetAllEntities[1].filtertypes //Filter entites like With Filter::Department
  const toptypes = SmartAssetAllEntities[2].toptypes	 //Top entities like Top::Top_Department
  var isTop = 'N'//Top
  var topNumber = 1//builtin.number
  var filtertypesmatches = [] //creates an array to store mulitple filter types like department, country
  var filterentity = [] //creates an array to store mulitple values of filter like ehs, india
  for (i = 0; i < entity.entities.length; i++) { //using for loop, we loop each entity type and try to match with entities we have and store them respective variable 
    //SecondaryEntity="";
    if (alltypes.indexOf(entity.entities[i].type) > -1) { //alltypes.indexOf(entity.entities[i].type tries to get index of entity type stored in alltypes
    		var alltypesmatches = alltypes[alltypes.indexOf(entity.entities[i].type)]   //if matches, store value in alltypesmatches variable
      PrimaryEntity = alltypesmatches;

      console.log('primary entity: ' + PrimaryEntity);
      console.log('secondary entity: ' + SecondaryEntity);
    }
    if (filtertypes.indexOf(entity.entities[i].type) > -1) { //tries to match with filter entities 

    		filtertypesmatches[i] = filtertypes[filtertypes.indexOf(entity.entities[i].type)] //if matches, store filter type and entity in respective values in variables
    		filterentity[i] = entity.entities[i].entity
      SecondaryEntity = filterentity[i];
      console.log('secondary entity inside filters: ' + SecondaryEntity);
      console.log('primary entity inside filters: ' + PrimaryEntity);
    }
    if (toptypes.indexOf(entity.entities[i].type) > -1) { //tries to match with top entities
    		var toptypesmatches = toptypes[toptypes.indexOf(entity.entities[i].type)] //if mathces, stores top type in respective toptypesmatches variable
      TernaryEntity = toptypesmatches;
    }
    if (entity.intent == 'Top') { //checks whether any entity is Top
    		var isTop = 'Y'
    }
    if (entity.entities[i].type == 'builtin.number') { //checks for top number
    		var topNumber = entity.entities[i].entity
    }
  }
  // console.log('##############')
  filtertypesmatches = filtertypesmatches.filter(function (x) { return x != undefined }) //Removes if any undefined values in filtertypesmatches array  
  for (var i = 0; i < filtertypesmatches.length; i++) {
    SecondaryEntityType = filtertypesmatches[i];
   	filtertypesmatches[i] = filtertypesmatches[i].replace(/\s/g, "") //for each element removes the white spaces
   	filtertypesmatches[i] = filtertypesmatches[i].replace(/:/g, "")//for each element removes :
  }
  filterentity = filterentity.filter(function (x) { return x != undefined })  //Removes if any undefined values in filterentity array 
  // for(var i=0;i<filterentity.length;i++){
  // 	filterentity[i]=filterentity[i].replace(/\s/g,"")//for each element removes the white spaces
  // 	filterentity[i]=filterentity[i].replace(/:/g,"")//for each element removes :
  // }


  IntentName = stringify(entity.intent);
  //print all values to console
  console.log(alltypesmatches)
  console.log(filtertypesmatches)
  console.log('SecondaryEntityType: ' + SecondaryEntityType);
  console.log(filterentity)
  console.log(toptypesmatches)
  console.log(isTop)
  console.log(topNumber)
  console.log("ENTITY " + entity)
  console.log("Intent name " + IntentName);

  if (isTop == 'Y') { //if its top utterance

   	for (var i = 0; i < topquery.length; ++i) { //search through all queries in json file then return query , group for selected and store them in respective variables
      if (topquery[i].intent == alltypesmatches) {
        var BasePassQueryTop = topquery[i].query;
        var BasePassQueryGroup = topquery[i].group;
        break
      }
   	}

    /*for (var i=0;i<links.length;++i) { //search for HYPERLINKS
      if (links[i].intent==alltypesmatches){
        var Hyperlink=links[i].link;
        console.log(Hyperlink);

      }
    }*/



   	if (filtertypesmatches.length > 0) { //if any filter is present with top like 'top 5 departments by asset count in india' where'india' is filter
      for (var j = 0; j < filtertypesmatches.length; j++) {  //this particular code block search for filter field in json file as per values in filtertypesmatches array
        for (var i = 0; i < filterquery.length; ++i) {      // and append them to base base query
          if (filterquery[i].id == filtertypesmatches[j]) {
            var FilterPassQuery = filterquery[i].field;
            var BasePassQueryTop = BasePassQueryTop + ' ' + FilterPassQuery
            break
          }
        }
      }
   	}
   	var PassQuery = BasePassQueryTop + ' ' + BasePassQueryGroup+' '+TopType; //final query that to be sent to database
    
 
    var requestCountTop = new Request(
    		PassQuery,
    		function (err, rowCount, rows) {
        if (err) {
          console.log(err);
        }
        else {
          console.log('All fine inside top request')
        }
    		}
    		);
    //console.log('length of filter entity: ' + filterentity.length)
    requestCountTop.addParameter('paramDomain', TYPES.Int, topNumber); //adds top number to query
    requestCountTop.addParameter('paramColumn', TYPES.VarChar, toptypesmatches); //adds top column to be returned as parameter
    // console.log('length of filter entity(After): ' + filterentity.length)  
          

    /*    if(filterentity.length>0){
          r(var i=0;i<filterentity.length;i++){
            uestCountTop.addParameter(filtertypesmatches[i],TYPES.NVarChar,filterentity[i]) //adds all filter conditions as parameters to query
                       	*/
    requestCountTop.on('row', function (columns) {

    		columns.forEach(function (column) {
        //session.send("%s\t%s", column.metadata.colName, column.value);   //will send output to bot window		
    		  StoreTopValues[index_top] = column.value;
        index_top++;
      });

      renderTopResult(session, index_top, StoreTopValues, topNumber)
    });

    connection.execSql(requestCountTop);
      
    //console.log(PassQuery)

  }
  else if (isTop == 'N') {//if not top query 
    for (var i = 0; i < basequery.length; ++i) { //will search for particular query from entity store in alltypesmatches
    		if (basequery[i].intent == alltypesmatches) {
        var BasePassQueryAssetValue = basequery[i].query; //returns the base query and stores in it
        var PassQuery = BasePassQueryAssetValue
        SqlQuery = PassQuery;
        break
    		}
    }

    for (var i = 0; i < links.length; ++i) { //search for HYPERLINKS
      if (links[i].intent == alltypesmatches) {
        var Hyperlink = links[i].link;
        var HyperlinkPlaceholder = links[i].Placeholder;
      }
    }
    if (filtertypesmatches.length > 0) { //this particular code block adds filters if any exists to base query
    		for (var j = 0; j < filtertypesmatches.length; j++) {
        for (var i = 0; i < filterquery.length; ++i) {
          if (filterquery[i].id == filtertypesmatches[j]) {
            var FilterPassQuery = filterquery[i].field;
            var PassQuery = PassQuery + ' ' + FilterPassQuery
            SqlQuery = PassQuery;
            break
          }
        }
    		}
    }
    var requestCountTop = new Request(
    		PassQuery,
      function (err, rowCount, rows) {
        if (err) {
          console.log(err);
        }
    		}
      );
    console.log('Filter with query : ' + PassQuery);
    for (var i = 0; i < filterentity.length; i++) { //adds all filters exists in array as parameters to query
    		requestCountTop.addParameter(filtertypesmatches[i], TYPES.NVarChar, filterentity[i])
    }

    requestCountTop.on('row', function (columns) {
    		columns.forEach(function (column) {
        session.send("%s\t%s", column.metadata.colName, column.value);
        /* builder.Prompts.number(session,"Would you like to see a graphical report " + '1. YES  2.NO',function(session){
          if (session.message.text=='1') {
          session.send(Hyperlink);}}) */
        valPlaceholder = stringify(column.value);
        console.log('Value inside ON: ' + valPlaceholder);
        forInsertion(session);
        var HTMLplaceholder= '<a href="'+Hyperlink+'">'+ HyperlinkPlaceholder+'</a>';
        session.send(HTMLplaceholder);
        //session.send("[For more information Click On the link](%s) ", Hyperlink);
        //session.send(Hyperlink);
    		});

    });

    connection.execSql(requestCountTop);
    //console.log(PassQuery)

  }
}


function forInsertion(session, entity) {

  /*State data store(1.5.1)*/
  /*Author: Suryadeep*/
  /*29th Jan*/
  var d = new Date();
  var ConcatString = "";
  //console.log(session.message.user.id)
  global.requesToInsert = new Request(
    "insert into UserLogs  values (@u_name,@utterance,@primary_entity,@secondary_entity,@ternary_entity,@sql_query,@value,@intentname,@masterstring,'Y',@datestamp,@secondarytype)",
    function (err) {
      if (err) {
        console.log('Error while inserting into log table' + err);
      }
      else {
        console.log('Successfully inserted into Log Table');
        toUpdate();
      }
    }
    );
      
  /*
  global.toUpdate= new Request(
        "UPDATE [UserLogs] SET [Flag]='N' WHERE [timemap]!= (SELECT CONVERT(VARCHAR(10), GETDATE(),120))",
        function(err){
          if(err){
            console.log('Error in update bro'+err);
          }
          else{
            console.log('Update performed Successfully');
          }
        }
    );*/
  console.log("Intent name inside insertion " + IntentName);
  ConcatString = PrimaryEntity + '|' + SecondaryEntity + '|' + SecondaryEntityType + '|' + TernaryEntity;
  console.log("forInsertion function " + valPlaceholder);
  console.log(ConcatString);
  requesToInsert.addParameter('u_name', TYPES.NVarChar, userName);
  requesToInsert.addParameter('utterance', TYPES.NVarChar, session.message.text);
  requesToInsert.addParameter('primary_entity', TYPES.NVarChar, PrimaryEntity);
  requesToInsert.addParameter('secondary_entity', TYPES.NVarChar, SecondaryEntity);
  requesToInsert.addParameter('ternary_entity', TYPES.NVarChar, TernaryEntity);
  requesToInsert.addParameter('sql_query', TYPES.NVarChar, SqlQuery);
  requesToInsert.addParameter('value', TYPES.NVarChar, valPlaceholder);
  requesToInsert.addParameter('intentname', TYPES.NVarChar, IntentName);
  requesToInsert.addParameter('masterstring', TYPES.NVarChar, ConcatString);
  requesToInsert.addParameter('datestamp', TYPES.Date, d);
  requesToInsert.addParameter('secondarytype', TYPES.NVarChar, SecondaryEntityType);

  connectionInsert.execSql(requesToInsert);

}

function toUpdate() {
  /*Historical data(1.5.2)*/
  /*Author: Suryadeep*/
  /*6th Feb*/
  global.queryUpdate = new Request(
    "UPDATE [UserLogs] SET [Flag]='N' WHERE [timemap]!= (SELECT CONVERT(VARCHAR(10), GETDATE(),120))",
    function (err) {
      if (err) {
        console.log('Error in update bro' + err);
      }
      else {
        console.log('Update performed Successfully');
      }
    }
    );
  connectionInsert.execSql(queryUpdate);
}

function fetchTop(session) {
  /*Frequently asking questions(1.5.3)*/
  /*Author: Suryadeep*/
  /*7th Feb*/
  var i = 1;
  global.fetchTopAskedQuestions = new Request(
    "SELECT TOP 2 masterstring,SUM(executed_value) FROM [UserLogs] GROUP BY [masterstring] ORDER BY COUNT([masterstring]) DESC",
    function (err) {
      if (err) {
        console.log('Error while fetching top queries' + err);
      }
      else {
        console.log('FAQ has been fetched');
        getDisplayValues(session);
        //performCalculation(session,UtterFetchValue1,UtterFetchValue2);
      }
    }
    );
  connectionInsert.execSql(fetchTopAskedQuestions);

  fetchTopAskedQuestions.on('row', function (columns) {
    columns.forEach(function (column) {
      console.log('Before Push ' + i)
      StoreForFAQ[i] = column.value;
      console.log('After push ' + i)
      console.log('%s   %s', i, StoreForFAQ[i]);
      //session.send('%d) %s',i,column.value);
      //sendValues(session);
      i = i + 1;
    });
    UtterFetchValue1 = StoreForFAQ[1];
    UtterFetchValue2 = StoreForFAQ[3];
    console.log('while calling function ' + i)
    console.log('size of array: ' + StoreForFAQ.length)

    //sendValues(session,i);
    
  });

}

function getDisplayValues(session) {
  /*Utterance and value from FAQ(1.5.4)*/
  /*Author: Suryadeep*/
  /*Last Updated: 9th Feb*/
  var i = 1;
  console.log('UtterFetchValue1: ' + UtterFetchValue1);
  global.GetDisplay = new Request(
    "SELECT [utterance],[executed_value] FROM [UserLogs] WHERE [id]=(SELECT MAX([id]) FROM [UserLogs] WHERE [masterstring]=@val1);SELECT [utterance],[executed_value] FROM [UserLogs] WHERE [id]=(SELECT MAX([id]) FROM [UserLogs] WHERE [masterstring]=@val2)",
    function (err) {
      if (err) {
        console.log('Error while getting display values' + err)
      }
      else {
        console.log('Utterance and executed values fetched')
      }
    }
    );
  console.log('About to add parameter: ' + UtterFetchValue1);
  var LocalScopeForDisplay1 = UtterFetchValue1;
  var LocalScopeForDisplay2 = UtterFetchValue2;
  console.log('LocalScopeForDisplay1: ', LocalScopeForDisplay1);
  GetDisplay.addParameter('val1', TYPES.NVarChar, LocalScopeForDisplay1);
  GetDisplay.addParameter('val2', TYPES.NVarChar, LocalScopeForDisplay2);
  //GetDisplay.addParameter('val2', TYPES.NVarChar, UtterFetchValue2);
  console.log('parameters added: ' + UtterFetchValue1);

  connectionInsert.execSql(GetDisplay);
  console.log('Sql executed');
  GetDisplay.on('row', function (columns) {
    console.log('before for each')
    columns.forEach(function (column) {
      console.log('About to send value to bot')
      //session.send('%s', column.value);
      StoreReturnForFAQ[i] = column.value;
      i = i + 1;
    });
    sendValues(session, i, StoreReturnForFAQ);
  });
  console.log('column execution done');
}

function getHistory(session) {
  /*Session History(1.5.5)*/
  /*Author: Suryadeep*/
  /*Last Updated: 12th Feb*/
  var checker = 1;
  var i = 0;
  global.GetHistory = new Request(
    "SELECT [utterance],[executed_value] FROM [UserLogs] WHERE [Flag]='Y'",
    function (err) {
      if (err) {
        console.log('Error while fetching history')
      }
      else {
        console.log('Fetched history');
      }
    }
    );
  connectionInsert.execSql(GetHistory);

  GetHistory.on('row', function (columns) {
    columns.forEach(function (column) {
      StoreSessionHistory[i] = column.value;
      console.log(i)
      console.log(StoreSessionHistory[i]);
      i = i + 1;
    });
    checker++;
    for (var a = 0; a < StoreSessionHistory.length; a++) {
      console.log('***outside for each before calling function***')
      console.log(StoreSessionHistory[a])
    }
    console.log('checker ' + checker)
    sendHistoryValues(session,i, StoreSessionHistory);
  });

}
/* Function to render Greeting */
function sendValues(session, args, args1) {
  /*Update : 1.5.8*/

  if (flag_table_display > 0) {
    var QuestOne = args1[1];
    var AnsOne = args1[2];
    var QuesTwo = args1[3];
    var AnsTwo = args1[4];

    var BaseHtml = '<table style="padding:10px;border:1px solid black;"><tr style="background-color:#1e9bc9; color:white"><th>Questions</th><th>Values</th></tr>'

    var FirstHtml = "<tr> <td>" + QuestOne + "</td> <td>" + AnsOne + "</td> </tr>";
    var SecondHtml = "<tr> <td>" + QuesTwo + "</td> <td>" + AnsTwo + "</td> </tr> </table>";
    var HtmlTable = BaseHtml + FirstHtml + SecondHtml;
    session.send(HtmlTable);
    flag_table_display = 0;
  }
  else {

    flag_table_display++;
  }
}
/* History value rendering function */
/*function sendHistoryValues(session, args, args1) {
	console.log('entered send history function');
	console.log('i: ',args);
	console.log('History count', HistoryCount);
  if (HistoryCount > 0) {
    for (var loop_id = 0; loop_id < args1.length / 2; loop_id++) {
      if (loop_id % 2 == 0) {
        session.send('%s--> %s', args1[loop_id], args1[loop_id + 1])
      }
      else {
        session.send('%s--> %s', args1[loop_id + 1], args1[loop_id + 2])
      }
    }
    HistoryCount = 0;
  }
  else {
    HistoryCount++;
  }
}*/

function sendHistoryValues(session,args,args1){
	console.log('Inside send history function');
	console.log('i: ',args);
	var for_index = 0;
	var SessionBug_Cnt = 0;
	console.log('Array length: ',args1.length);
	for ( ; for_index < args1.length; for_index++) {
		/*console.log('index: ',for_index);
		session.send('%s-->%s',args1[for_index],args1[for_index+1]);
		for_index = for_index+1;
		console.log('index post increment: ',for_index);*/
		//console.log('%s. %s->%s', for_index,args1[for_index],args1[for_index+1]);
		//session.send('%s. %s->%s', for_index,args1[for_index],args1[for_index+1]);
		//session.send('%s',for_index)
		//console.log(session.send)
		for_index = for_index+1;
	}
	console.log(session);
}
/* Top value rendering function */
function renderTopResult(session, args_index, args_values, args_topcount) {
  var TrueFlag = -1;
  var renderOnce = (args_topcount * 2) + 1;
  if (args_index == renderOnce) {
    TrueFlag = 1;
  }
  else {
    TrueFlag = 0;
  }
  if (TrueFlag == 1) {
    if (args_topcount == 2) {
      var QuestOne = args_values[1];
      var AnsOne = args_values[2];
      var QuesTwo = args_values[3];
      var AnsTwo = args_values[4];

      var BaseHtml = '<table style="padding:10px;border:1px solid black;">';

      var FirstHtml = "<tr> <td>" + QuestOne + "</td> <td>" + AnsOne + "</td> </tr>";
      var SecondHtml = "<tr> <td>" + QuesTwo + "</td> <td>" + AnsTwo + "</td> </tr> </table>";
      var HtmlTable = BaseHtml + FirstHtml + SecondHtml;
      session.send(HtmlTable);
    }
    else if (args_topcount == 3) {
      var QuestOne_topThree = args_values[1];
      var AnsOne_topThree = args_values[2];
      var QuesTwo_topThree = args_values[3];
      var AnsTwo_topThree = args_values[4];
      var QuesThree_topThree = args_values[5];
      var AnsThree_topThree = args_values[6];

      var BaseHtml_topThree = '<table style="padding:10px;border:1px solid black;">';

      var FirstHtml_topThree = "<tr> <td>" + QuestOne_topThree + "</td> <td>" + AnsOne_topThree + "</td> </tr>";
      var SecondHtml_topThree = "<tr> <td>" + QuesTwo_topThree + "</td> <td>" + AnsTwo_topThree + "</td> </tr>";
      var ThirdHtml_topThree = "<tr> <td>" + QuesThree_topThree + "</td> <td>" + AnsThree_topThree + "</td> </tr> </table>";
      var HtmlTable_topThree = BaseHtml_topThree + FirstHtml_topThree + SecondHtml_topThree + ThirdHtml_topThree;
      session.send(HtmlTable_topThree);
    }
    else if (args_topcount == 4) {
      var QuestOne_topFour = args_values[1];
      var AnsOne_topFour = args_values[2];
      var QuesTwo_topFour = args_values[3];
      var AnsTwo_topFour = args_values[4];
      var QuesThree_topFour = args_values[5];
      var AnsThree_topFour = args_values[6];
      var QuesFour_topFour = args_values[7];
      var AnsFour_topFour = args_values[8];

      var BaseHtml_topFour = '<table style="padding:10px;border:1px solid black;">';

      var FirstHtml_topFour = "<tr> <td>" + QuestOne_topFour + "</td> <td>" + AnsOne_topFour + "</td> </tr>";
      var SecondHtml_topFour = "<tr> <td>" + QuesTwo_topFour + "</td> <td>" + AnsTwo_topFour + "</td> </tr>";
      var ThirdHtml_topFour = "<tr> <td>" + QuesThree_topFour + "</td> <td>" + AnsThree_topFour + "</td> </tr>";
      var FourthHtml_topFour = "<tr> <td>" + QuesFour_topFour + "</td> <td>" + AnsFour_topFour + "</td> </tr> </table>";
      var HtmlTable_topFour = BaseHtml_topFour + FirstHtml_topFour + SecondHtml_topFour + ThirdHtml_topFour + FourthHtml_topFour;
      session.send(HtmlTable_topFour);
    }
    else {
      session.send('Please ask top 2 or top 3 or top 4!')
    }
  }
}

intents.matches('Greetings', [function (session, args) {
  var FetchName = session.message.user.name;
  console.log(FetchName)
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {
    session.send('Hi ' + FullName + '! ')
    session.send('You look interested in the following topics: ')
    fetchTop(session);

    elCnt = 0;
  }


}])
intents.matches('Asset', function (session, args) {


  var FetchName = session.message.user.name;
  console.log(FetchName)
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {
    //var linkTrial = '<a href="https://www.lifewire.com/html5-placeholder-links-3468070">Troom</a>';
    getentities(session, args)
    elCnt = 0;
  }
})
intents.matches('Labour', function (session, args) {


  var FetchName = session.message.user.name;
  console.log(FetchName)
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {

    getentities(session, args)
    elCnt = 0;
  }

})
intents.matches('Supplier', function (session, args) {

  var FetchName = session.message.user.name;
  console.log(FetchName)
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {

    getentities(session, args)
    elCnt = 0;
  }

})
intents.matches('ServiceRequest', function (session, args) {
  
  var FetchName = session.message.user.name;
  console.log(FetchName)
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {

    getentities(session, args)
    elCnt = 0;
  }

})
intents.matches('Inventory', function (session, args) {

  var FetchName = session.message.user.name;
  console.log(FetchName)
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {

    getentities(session, args)
    elCnt = 0;
  }
})
intents.matches('Workorder', function (session, args) {


  var FetchName = session.message.user.name;
  console.log(FetchName)
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {

    getentities(session, args)
    elCnt = 0;
  }
})
intents.matches('Maintenance', function (session, args) {

  var FetchName = session.message.user.name;
  console.log(FetchName)
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {

    getentities(session, args)
    elCnt = 0;
  }
})
intents.matches('Top', function (session, args) {

  var FetchName = session.message.user.name;
  console.log('FetchName ', FetchName);
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id;
    //SkypeUsername = session.message.user.name;	//Modified for deveopment from Bastien Server. Please comment this line before Pushing to production
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {
  	var IdentifierName = builder.EntityRecognizer.findEntity(args.entities, 'Identifier');
  	if (IdentifierName.entity == 'bottom') {
  		TopType = 'ASC';
  	}
  	else{
  		TopType = 'DESC';
  	}
    getentities(session, args)
    elCnt = 0;
  }
})
intents.matches('History', function (session, args) {


  var FetchName = session.message.user.name;
  console.log(FetchName)
  if (FetchName != undefined) {
    var FnameIndex = FetchName.indexOf(',') + 1;
    var Fname = FetchName.slice(FnameIndex)
    var Lname = FetchName.slice(0, FetchName.indexOf(','))
    var FullName = Fname + ' ' + Lname;
    console.log(Fname)
    SkypeUsername = session.message.user.id
    //SkypeUsername = session.message.user.name;
    console.log(SkypeUsername)
    var StartIndex = SkypeUsername.indexOf(':') + 1
    console.log(StartIndex)
    var EndIndex = SkypeUsername.indexOf('@')
    console.log(EndIndex)
    var DisplayName = SkypeUsername.slice(StartIndex, EndIndex)
    var FinalDisplay = DisplayName.replace('.', ' ')
    var UpperCase = FinalDisplay.charAt(0).toUpperCase()
    SendDisplay = FinalDisplay.replace(FinalDisplay.charAt(0), UpperCase)
  }
  else {
    FullName = 'user';
  }

  for (var i = 0; i < UserAuthenticate.length; i++) {
    if (UserAuthenticate[i].Mail == SkypeUsername) {
      ifCnt++
      flag = 1;
    }
    else {
      elCnt++;
    }
  }
  if (elCnt == UserAuthenticate.length) {
    session.send('Hi ' + FullName + ' ! You are not an authorized user')
    elCnt = 0;
  }
  else {
    session.send('Hi' +Fname+' ! This feature is getting updated.');
    //getHistory(session);
    elCnt = 0;
  }
})
  .onDefault((session) => {
  session.send('Sorry, I did not understand \'%s\'.', session.message.text);
});

bot.dialog('/', intents);

