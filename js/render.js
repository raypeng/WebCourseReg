var header = '<table bgcolor="#ECE9D8" border="0" class="miniTimetable" align="center"><tr><td bgcolor="#FFFFCC" nowrap="nowrap"><div class="timetable"></div></td><td bgcolor="#C6E2FF" height="5" nowrap="nowrap" width="90"><div class="timetable">Mon</div></td><td bgcolor="#C6E2FF" height="5" nowrap="nowrap" width="90"><div class="timetable">Tue</div></td><td bgcolor="#C6E2FF" height="5" nowrap="nowrap" width="90"><div class="timetable">Wed</div></td><td bgcolor="#C6E2FF" height="5" nowrap="nowrap" width="90"><div class="timetable">Thu</div></td><td bgcolor="#C6E2FF" height="5" nowrap="nowrap" width="90"><div class="timetable">Fri</div></td></tr>';
// var colors = ['ffff66', '66ffff', '66ff66', 'ff99ff', '6699ff', 'cccccc', 'cc99ff', 'ffccff', '99cc99'];


// build time conversion table
// table['1'] = '09:00 - 09:20'
// table['28'] = '22:30 - 22:50'
function build_conversion() {
	var table = {};
	for (var i = 1; i < 29; i++) {
		table[i] = function(n) {
			var temp;
			if (n % 2 == 0) {
				temp = 8 + n / 2;
				temp = temp > 9 ? temp : '0' + temp;
				return temp + ':30 - ' + temp + ':50';
			} else {
				temp = 8.5 + n / 2;
				temp = temp > 9 ? temp : '0' + temp;
				return temp + ':00 - ' + temp + ':20';
			}
		}(i);
	}
	return table;
}

// break down session representation
// 'L1T2FLA3' -> {'lec':'L1', 'tut':T2F', 'lab':'LA3'}
function get_session_detail(session) {
	var lec_regex = /L\d+/;
	var tut_regex = /T\w+/;
	var lab_regex = /LA\w+/;
	var detail = {};
	if (session.match(lec_regex) != null) {
		detail['lec'] = session.match(lec_regex)[0];
	}
	if (session.match(lab_regex) != null) {
		detail['lab'] = session.match(lab_regex)[0];
		session = session.substring(0, session.match(lab_regex)[1]);
	}
	if (session.match(tut_regex) != null) {
		detail['tut'] = session.match(tut_regex)[0];
	}
	return detail;
}

// get mapping from time to course detail
// {111: ('ACCT 1010<br>L1', 3), 112: 'empty', 113: 'empty'}
function get_time_map(course_list, session_list) {
	var session_detail_list = session_list.map(get_session_detail);
	var time_map = {};
	var session_detail, course_info, title, code, session;
	var start_time, span, times;
	for (var i = 0; i < course_list.length; i++) {
		code = course_list[i];
		title = code.substring(0, 4);
		session = session_list[i];
		session_detail = session_detail_list[i];
		course_info = json_dict[title][code];
		['lec', 'tut', 'lab'].forEach(function(type) {
			var times = [];
			var obj = course_info[type][session_detail[type]];
			for (var x in obj) {
				times.push(obj[x]);
			}
			var start_index = 0;
			var course_html = code + '<br>' + session_detail[type];
			for (var j = 0; j < times.length; j++) {
				time_map[times[j]] = 'empty';
				if (times[j] + 1 != times[j + 1]) {
					time_map[times[start_index]] =
						[course_html, j - start_index + 1];
					start_index = j + 1;
				}
			}
			time_map[times[start_index]] = 
				(course_html, times.length - start_index + 1);
		});
	}
	return time_map;
}

// html code for time entry
function time_entry(t, table) {
	return '<td bgcolor="#FFE3BB" height="5" nowrap="nowrap" width="90">' +
        '<div class="timetable">' + table[t] + '</div></td>';
}

// html code for course entry
function course_entry(time, time_map, color) {
	if (time_map[time] == undefined) {
		return '<td bgcolor="#FFFFFF" height="5" nowrap="nowrap" width="90"></td>'
	} else if (time_map[time] != 'empty') {
		return '<td align="center" bgcolor="#' + 'FFFFFF' +
		'nowrap="nowrap" rowspan="' + time_map[time][1] +
		'" width="90"><div class="timetable"></div><div class="timetable">' +
        time_map[time][0] + '</div></td>';
	}
}

// render html table according to time_map
function render_html(time_map) {
	var table = build_conversion();
	var html = '' + header;
	var time;
	for (var t = 1; t < 29; t++) {
		html += '<tr>' + time_entry(t, table);
		for (var d = 1; d < 6; d++) {
			time = 100 * d + t;
			html += course_entry(time, time_map);
		}
		html += '</tr>';
	}
	html += '</table>';
	return html;
}