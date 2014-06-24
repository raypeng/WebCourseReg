// determine if all elements in array is unique
function is_unique(arr) {
	arr.sort();
	console.log(arr);
	for (var i = 0; i < arr.length - 1; i++) {
		if (arr[i] == arr[i + 1]) {
			return false;
		}
	}
	return true;
}

// get merged time list out of course and session list
function get_time_list(course_list, session_list) {
	var times = [];
	var code, session, title;
	for (var i = 0; i < course_list.length; i++) {
		code = course_list[i];
		title = code.substring(0, 4);
		session = session_list[i];
		times = times.concat(json_dict[title][code]['sessions'][session]);
	}
	return times;
}

// determine if time conflict occur
function no_conflict(course_list, session_list) {
	// already contain duplicate courses or dummy courses
	if (! is_unique(course_list.slice())) {
		return false;
	}
	return is_unique(get_time_list(course_list, session_list));
}

// show a flash message
function flash(text) {
	$('.flash').html(text);			
	$('.flash').css('visibility', 'visible');
	$('.flash').fadeIn(function() {
    	setTimeout(function() {
    		$('.flash').html('Can you see me?');
    		$('.flash').css('visibility', 'hidden');
    	}, 2000);
	});
}

jQuery(document).ready(function() {

	var titles = Object.keys(json_dict);
	var codes, sessions;
	var title, code, session;
	var add_show_table_button = true;
	titles.sort();

	// init empty course list
	var course_list = [];
	var session_list = [];
	
	// init course title dropdown
	$('#course_title').find('option').remove();
	for (var i in titles) {
		$('#course_title').append('<option value="' + titles[i] + '">' + titles[i] + '</option>');
	};

	// init course code dropdown
	$('#course_code').find('option').remove();
	codes = Object.keys(json_dict[titles[0]]);
	codes.sort();
	for (var i in codes) {
		$('#course_code').append('<option value="' + codes[i] + '">' + codes[i] + '</option>');
	};

	// init course session dropdown
	$('#course_session').find('option').remove();
	sessions = Object.keys(json_dict[titles[0]][codes[0]]['sessions']);
	sessions.sort();
	for (var i in sessions) {
		$('#course_session').append('<option value="' + sessions[i] + '">' + sessions[i] + '</option>');
	};

	// update code & session dropdown upon title changes
	$('#course_title').change(function() {
		title = $('#course_title').val();
		$('#course_code').find('option').remove();
		codes = Object.keys(json_dict[title]);
		codes.sort();
		for (var i in codes) {
			$('#course_code').append('<option value="' + codes[i] + '">' + codes[i] + '</option>');
		};
		code = $('#course_code').val();
		$('#course_session').find('option').remove();
		sessions = Object.keys(json_dict[title][code]['sessions']);
		sessions.sort();
		for (var i in sessions) {
			$('#course_session').append('<option value="' + sessions[i] + '">' + sessions[i] + '</option>');
		};
	});

	// update session dropdown upon code changes
	$('#course_code').change(function() {
		title = $('#course_title').val();
		code = $('#course_code').val();
		$('#course_session').find('option').remove();
		sessions = Object.keys(json_dict[title][code]['sessions']);
		sessions.sort();
		for (var i in sessions) {
			$('#course_session').append('<option value="' + sessions[i] + '">' + sessions[i] + '</option>');
		};
	});

	// validate new course upon possible time conflict
	$('.course_add_button').click(function() {
		code = $('#course_code').val();
		session = $('#course_session').val();
		course_list.push(code);
		session_list.push(session)
		if (no_conflict(course_list, session_list)) {
			console.log(course_list);
			console.log(session_list);
			$('#course_table').append('<tr><td class="course_entry_code">' + code + 
				'</td><td class="course_entry_session">' + session + 
				'</td><td><button class="course_delete_button">Delete</button></td></tr>');
			// if first course added show 'show table' button
			if (add_show_table_button) {
				add_show_table_button = false;
				$('#course_table').after('<br><button id="show_table">Show my timetable</button>');
			}
		} else {
			// prompt a flash message
			flash('Sorry, time conflict! :(');
			console.log('time conflict');
			course_list.pop();
			session_list.pop();
		}
	});

	// delete course from list via button
	$('.course_delete_button').live('click', function() {
		var course_to_delete = $(this).parent().parent().children('td').first().text();
		var index = course_list.indexOf(course_to_delete);
		course_list.splice(index, 1);
		session_list.splice(index, 1);
		$(this).parent().parent().remove();
		console.log(course_list);
		// remove 'show table' button if course list becomes empty
		if (course_list.length < 1) {
			$('#show_table').remove();
			add_show_table_button = true;
		}
	});

	// show table when 'show table' button is clicked
	$('#show_table').live('click', function() {
		var time_map = get_time_map(course_list, session_list);
		$('#show_schedule').html(render_html(time_map));
	});

});