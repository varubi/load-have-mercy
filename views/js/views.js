var views = views || {};
views.results = function(data){
	var $O = '';
	$O += '<table>\n'
		+ '<thead>\n'
		+ '<td>URL</td>\n'
		+ '<td>Status</td>\n'
		+ '<td>Time</td>\n'
		+ '<td>Size</td>\n'
		+ '<td>Process Time</td>\n'
		+ '<td>Parse Time</td>\n'
		+ '</thead>\n'
		+ '<tbody>\n';
	for(var i = 0; i < data.length; i++){
		$O += '<tr>\n'
			+ '<td>' + data[i].href + '</td>\n'
			+ '<td>' + data[i].status + '</td>\n'
			+ '<td>' + data[i].time + ' ms</td>\n'
			+ '<td>' + this.bytesize(data[i].size) + '</td>\n'
			+ '<td>' + data[i].processtime + ' ms</td>\n'
			+ '<td>' + data[i].parsetime + ' ms</td>\n'
			+ '</tr>\n';
	}
	$O += '</tbody>\n'
		+ '</table>\n';
	return $O;
}
views.bytesize = function(data){
	var sizes =['B','KB','MB','GB','TB'];
	if(data == 0)return'0 Byte';
	var i = parseInt(Math.floor(Math.log(data)/ Math.log(1024)));
	return Math.round(data / Math.pow(1024, i), 2)+' '+ sizes[i];
}
if(typeof module!=='undefined'&&typeof module.exports!=='undefined'){
	module.exports.views=views;
}