var views = views || {};
views.infog1 = function(data){
	var $O = '';
	$O += '<div id="infog1">\n'
		+ '<div id="infog1-visual">\n'
		+ '<div id="infog1-tip" style="visibility: hidden;">\n'
		+ '<span id="infog1-percentage"></span>\n'
		+ '<br/> of URLS begin with this path<br/>\n'
		+ '<span id="infog1-count"></span>\n'
		+ '</div>\n'
		+ '</div>\n'
		+ '<div id="infog1-path"></div>\n'
		+ '</div>\n';
	return $O;
};
views.kms = function(data){
	var $O = '';
	return $O;
};
views.results = function(data){
	var $O = '';
	this.chartData = [];
	$O += '<div class="content-head"></div>\n'
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
		var dl = Math.max(1, rep.requests[0].time - rep.requests[0].ttfb);
		var r = Math.ceil(rep.requests[0].ttfb/10) * 10;
		$O += '<tr>\n'
			+ '<td>' + rep.requests[0].status + '</td>\n'
			+ '<td>' + (rep.href.protocol=='https:'?'✔':'') + '</td>\n'
			+ '<td>\n'
			+ '<a href="' + rep.href.fullpath + '">\n'
			+ '<span class="domain">' + rep.href.host + '</span>\n'
			+ '<span class="path">' + rep.href.path + '</span>\n'
			+ '</a>\n'
			+ '</td>\n'
			+ '<td>' + rep.requests[0].ttfb + ' ms</td>\n'
			+ '<td>' + dl + ' ms</td>\n'
			+ '<td>' + rep.requests[0].time + ' ms</td>\n'
			+ '<td>' + this.bytesize(rep.requests[0].size) + '</td>\n'
			+ '<td>' + this.bytesize((rep.requests[0].size/dl)*1000) + '/s</td>\n'
			+ '<td>' + rep.requests[0].parsetime + ' ms</td>\n'
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