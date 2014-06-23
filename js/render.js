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
// {111: ('ACCT 1010<br>L1', 3), 112: null, 113: null}
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

// render html table according to time_map
function render_html() {

}