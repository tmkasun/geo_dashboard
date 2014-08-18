
var db = require("jaggery/database.jag");
var log = new Log();
log.info("Required the module");
//create table tileServers (serverId int NOT NULL AUTO_INCREMENT, url varchar(255) NOT NULL, name varchar(255), PRIMARY KEY (serverID));
//print(db.configuration);
var configuration = db.configuration;
var db = new Database("jdbc:mysql://"+configuration.server+":3306/"+configuration.db_name, configuration.username, configuration.password);
var insertTestData  ="INSERT INTO tileServers (url, name) VALUES('http://{s}.somedomain.com/blabla/{z}/{x}/{y}.png', 'Sample server URL' );";
try{
    db.query(insertTestData);
    print('Sample data insert<br/>');
}
catch(e){
    print(e.toString());
}
finally{
    //db.close();
}

var getAllTileServers = "select * from tileServers";
try{
    var allTileServers = db.query(getAllTileServers);
    print('Data retrieved<br/>');
    log.info(allTileServers);
    print(parseInt(allTileServers.length));


    /*
    for (i = 0; i < allTileServers.length; i++) {
        print(allTileServers[i].url + "<br>");
    }
    */
}
catch(e){
    print(e.toString());
}
finally{
    db.close();
}




/*

var log = new Log();
webSocket.ontext = function (data) {
	log.debug('Client Sent : ' + data);
	//var ws = this;
	var list = application.get('list');
	
	//broadcasting
	for(var i = list.length - 1; i >= 0; i--) {		
		list[i].send(data);
	}

};

webSocket.onbinary = function (stream) {
	//log.debug('Client Streamed : ' + stream.toString());
};


webSocket.onopen = function () {
	//log.debug(this.toString());
	var streamList=[];
	var list = application.get('list');
	if(list ==null){
		log.debug('adding list');
		streamList.push(this);
		application.put('list', streamList);
		log.debug(streamList.length);
	}
	else{
		var storedList = application.get('list');
		storedList.push(this);
		application.put('list', storedList);
		log.debug(storedList.length);
	}
};

webSocket.onclose = function (status) {

	log.debug('Client Streamed close');
	log.debug(this.outbound);
	var list = application.get('list');
	log.debug(list.length);
	for(var i = list.length - 1; i >= 0; i--) {
		if(list[i] === this) {
			list.splice(i, 1);
			log.debug("removing element");
		}
	}



	log.debug(list.length);
	
};
*/
