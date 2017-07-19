var views = views || {};
views.results = function(data){
	var $O = '';
	this.chartData = [];
	$O += '<div class="content-head">Results</div>\n'
		+ '<div class="content-body">\n'
		+ '<div id="graphs"></div>\n'
		+ '<table>\n'
		+ '<thead>\n'
		+ '<tr>\n'
		+ '<th>Status</th>\n'
		+ '<th>HTTPS</th>\n'
		+ '<th>URL</th>\n'
		+ '<th>TTFB</th>\n'
		+ '<th>DL</th>\n'
		+ '<th>Total</th>\n'
		+ '<th>Size</th>\n'
		+ '<th>Speed</th>\n'
		+ '<th>Parse Time</th>\n'
		+ '</tr>\n'
		+ '</thead>\n'
		+ '<tbody>\n';
	for(var i = 0; i < Math.min(1000, data.length); i++){
		var rep = data[i];
		var dl = Math.max(1, rep.time - rep.ttfb);
		var r = Math.ceil(rep.ttfb/10) * 10;
		this.chartData.push([rep.startTime, rep.ttfb, 'http' + (rep.secure?'s':'') + '://' + rep.host + rep.path])
		$O += '<tr>\n'
			+ '<td>' + rep.status + '</td>\n'
			+ '<td>' + (rep.secure?'✔':'') + '</td>\n'
			+ '<td>\n'
			+ '<span class="domain">' + rep.host + '</span>\n'
			+ '<span class="path">' + rep.path + '</span>\n'
			+ '</td>\n'
			+ '<td>' + rep.ttfb + ' ms</td>\n'
			+ '<td>' + dl + ' ms</td>\n'
			+ '<td>' + rep.time + ' ms</td>\n'
			+ '<td>' + this.bytesize(rep.size) + '</td>\n'
			+ '<td>' + this.bytesize((rep.size/dl)*1000) + '/s</td>\n'
			+ '<td>' + rep.parsetime + ' ms</td>\n'
			+ '</tr>\n';
	}
	$O += '\n'
		+ '</tbody>\n'
		+ '</table>\n'
		+ '</div>\n';
	return $O;
};
views.bytesize = function(data){
	var sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
	if (data == 0) return '0 Byte';
	var i = parseInt(Math.floor(Math.log(data) / Math.log(1024)));
	return Math.round(data / Math.pow(1024, i), 2) + '' + sizes[i];
};
if(typeof module!=='undefined'&&typeof module.exports!=='undefined'){module.exports.views=views;}