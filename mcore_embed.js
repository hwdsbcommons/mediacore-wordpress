var mcore = {};

(function($) {
	$(document).ready(function() {	
		$('body').append('<div id="mcore-overlay"></div><div id="mcore-embed" class="mcore-clearfix"><div class="mcore-header"><div class="mcore-pagination"><span class="mcore-btn mcore-prev"></span><span class="mcore-btn mcore-next"></span></div><div class="mcore-btn mcore-close"><span>Close</span></div><div class="mcore-title">MediaCore</div></div><form class="mcore-search" name="mcore-search"><div class="mcore-clear-search"></div><input type="text" class="mcore-search-field" value="Search" /></form><div class="mcore-content"></div><div class="mcore-message"><h2></h2><p></p></div><div class="mcore-loading"></div><div class="mcore-footer"></div></div>');

		mcore.mcoreEmbed = $('#mcore-embed');
		mcore.mcoreOverlay = $('#mcore-overlay');
		mcore.mcoreButton = $('.mceToolbar #content_mcore.mce_mcore');
		// MediaCore embed elements
		mcore.mcoreClose = mcore.mcoreEmbed.find('.mcore-close');
		mcore.mcorePrev = mcore.mcoreEmbed.find('.mcore-prev');
		mcore.mcoreNext = mcore.mcoreEmbed.find('.mcore-next');
		mcore.mcoreSearchForm = mcore.mcoreEmbed.find('.mcore-search');
		mcore.mcoreSearch = mcore.mcoreEmbed.find('.mcore-search-field');
		mcore.mcoreClearSearch = mcore.mcoreEmbed.find('.mcore-clear-search');
		mcore.contentPanel = mcore.mcoreEmbed.find('.mcore-content');
		mcore.footer = mcore.mcoreEmbed.find('.mcore-footer');
		mcore.message = mcore.mcoreEmbed.find('.mcore-message');
		mcore.loading = mcore.mcoreEmbed.find('.mcore-loading');

		mcore.url = parseUrl(global_mcore_url);
		mcore.visible = false;
		mcore.searching = false;
		mcore.pendingRequest = false;
		mcore.mediaPerPage = 10;
		mcore.jsonData = { 
			'limit' : mcore.mediaPerPage,
			'include_embed' : 1
		};

		$.ajaxSetup({
			beforeSend: function() {
		    	mcore.loading.show()
			},
			complete: function(){
		    	mcore.loading.hide()
			}
		});

		// Event functionality
		mcore.mcoreClose.click(function(){
			mcore.closeMcoreEmbed();	
		});

		mcore.mcorePrev.click(function(){
			mcore.prevPage();	
		});

		mcore.mcoreNext.click(function(){
			mcore.nextPage();	
		});

		mcore.mcoreSearch.focus(function(){
			if (this.value == 'Search') {
				this.value = '';
			}
		});

		mcore.mcoreSearch.blur(function(){
			if (this.value == '') {
				this.value = 'Search';
			}
		});

		mcore.mcoreSearch.keyup(function(){
			if (this.value == '' && mcore.searching) {
				mcore.mcoreClearSearch.hide();
				clearSearch();
			}
		});

		mcore.mcoreClearSearch.click(function(){
			if (mcore.searching) {
				mcore.mcoreSearch[0].value = '';
				$(this).hide();
				clearSearch();
			}
		});

		mcore.mcoreSearchForm.submit(function(){
			searchBox = mcore.mcoreSearch[0];
			if (searchBox.value != '' && searchBox.value != 'Search' && mcore.state != 'connection-error') {
				query = searchBox.value;
				mcore.jsonData['search'] = query;

				mcore.mcoreNext.removeClass('mcore-disabled');
				mcore.mcorePrev.addClass('mcore-disabled');

				mcore.clearContent();

				getMedia();
				
				mcore.currPage = 1;
				mcore.searching = true;

				mcore.mcoreClearSearch.show();
			}

			return false;
		});
	});
	
	//mcore.mcoreEmbed.resizable();
	
	mcore.openMcoreEmbed = function(){
		getMedia();
		mcore.mcoreOverlay.fadeIn(150);
		mcore.mcoreEmbed.fadeIn(150);
		mcore.visible = true;
		mcore.currPage = 1;
		mcore.mcoreSearch.focus();
	}
	
	mcore.closeMcoreEmbed = function() {
		mcore.mcoreOverlay.fadeOut('fast');
		mcore.mcoreEmbed.fadeOut('fast');
		mcore.visible = false;
		mcore.mcoreEmbed.removeClass('zero-state');
		mcore.mcoreEmbed.removeClass('connection-error');

		mcore.clearContent();
	}

	mcore.prevPage = function() {
		if (mcore.currPage != 1 
		&& mcore.state != 'connection-error' 
		&& mcore.pendingRequest == false ) {
			mcore.clearContent();

			mcore.jsonData['offset'] = (mcore.currPage - 2) * mcore.mediaPerPage;
			getMedia();
			delete mcore.jsonData['offset'];

			mcore.currPage--;
		}
	}

	mcore.nextPage = function() {
		if (mcore.currPage != mcore.totalPages 
		&& mcore.state != 'connection-error' 
		&& mcore.pendingRequest == false ) {
			mcore.clearContent();

			mcore.jsonData['offset'] = mcore.currPage * mcore.mediaPerPage;
			getMedia();
			delete mcore.jsonData['offset'];

			mcore.currPage++;
		}
	}

	mcore.renderPage = function() {
		if(mcore.mediaRows.length != 0){
			// Update pagination
			if (mcore.currPage == mcore.totalPages) {
				mcore.mcoreNext.addClass('mcore-disabled');
			}
			else {
				mcore.mcoreNext.removeClass('mcore-disabled');
			}
			if (mcore.totalMedia < mcore.mediaPerPage) {
				mcore.mcoreNext.addClass('mcore-disabled');
			}
			if (mcore.currPage == 1){
				mcore.mcorePrev.addClass('mcore-disabled');
			}
			else {
				mcore.mcorePrev.removeClass('mcore-disabled');
			}

			// Remove any previous messages
			mcore.mcoreEmbed.removeClass('zero-state');
			mcore.mcoreEmbed.removeClass('connection-error');

			// Inject content into page and add click events
			thresh = Math.min(mcore.mediaPerPage, mcore.mediaRows.length);
			var rows = [];
			for (i = 0; i < thresh; i++) {
				rows.push(mcore.mediaRows[i].html);
			}
			mcore.contentPanel.html(rows.join(''));
			for (i = 0; i < thresh; i++) {
				mcore.contentPanel.children('div').click(function() {
					if (!$(this).hasClass('clicked')){
						mediaClicked(this);
					}
				});
			}
		}
		else {
			mcore.mcoreNext.addClass('mcore-disabled');
			mcore.mcorePrev.addClass('mcore-disabled');
		}
		mcore.footer.text('Page ' + mcore.currPage + ' of ' + mcore.totalPages);
	}

	mcore.initContent = function(data){
		mcore.totalMedia = data.count;
		mcore.totalPages = Math.ceil(mcore.totalMedia / mcore.mediaPerPage);
		// Should always show one page even if there are no media items
		if (mcore.totalPages == 0) {
			mcore.totalPages = 1; 
			mcore.showMessage('zero-state');
		}
		mcore.mediaRows = [];

		if (mcore.data.media) {
			mediaItems = mcore.data.media;
			for(i=0;i<mediaItems.length;i++){
				mcore.mediaRows.push(newMediaRow(mediaItems[i], i));
			}
		}

		mcore.renderPage();
	}

	mcore.clearContent = function(data) {
		mcore.mediaRows = [];
		mcore.data = {};
		mcore.contentPanel.html('');
		mcore.mcoreEmbed.removeClass('zero-state');
		mcore.mcoreEmbed.removeClass('connection-error');
	}

	mcore.showMessage = function(state) {
		mcore.clearContent();
		mcore.mcoreEmbed.addClass(state);
		header = mcore.message.find('h2');
		paragraph = mcore.message.find('p');
		switch (state) {
			case 'zero-state':
				//Update text
				header.text('No media found');
				paragraph.html('Either you have no media in your MediaCore library, or your search <br />returned no results.');
				break;
			case 'connection-error':
				//Update text
				header.text('Unable to connect');
				paragraph.text('We were unable to establish a connection with the MediaCore site you have entered on the plugin settings page.');
				break;
		}
		mcore.mcorePrev.addClass('mcore-disabled');
		mcore.mcoreNext.addClass('mcore-disabled');
	}

	function newMediaRow(media, i) {
		mediaRow = {}
		mediaRow.media = media;
		mediaRow.mediaType = (media.type == 'video') ? 'mcore-video' : 'mcore-audio';
		mediaRow.thumbnail = '<div class="mcore-thumbnail"> \
								<img src="' + media.thumbs.s.url + '" /> \
								<div class="mcore-overlay"> \
									<span class="mcore-length">' + formatDuration(media.duration) + ' </span> \
									<span class="mcore-icon"></span> \
								</div> \
								<div class="mcore-border"></div> \
							</div>';
		mediaRow.title = '<h3>' + media.title + '</h3>';
		mediaRow.addBtn = '<span class="mcore-btn mcore-add-btn"> \
							<span><span class="mcore-icon"></span>Add \
						</span>';
		mediaRow.publishDate = '<span class="mcore-date">' + formatTime(media.publish_on) + '</span>';
		mediaRow.html = '<div class="mcore-media mcore-clearfix ' + mediaRow.mediaType + '" \
							id="' + i + '">' + mediaRow.thumbnail + '\
						<div class="mcore-info">' + mediaRow.title + mediaRow.publishDate + '\
						</div> \
				<div class="mcore-add">' + mediaRow.addBtn + '</div></div>';

		// Save values as dom elements instead of html strings
		//mediaRow.thumbnail = $(mediaRow.thumbnail);
		//mediaRow.title = $(mediaRow.title);
		//mediaRow.addBtn = $(mediaRow.addBtn);
		//mediaRow.publishDate = $(mediaRow.publishDate);
		//mediaRow.html = $(mediaRow.html);

		return mediaRow;
	}

	function mediaClicked(row){
		embed = mcore.mediaRows[row.id].media.embed;
		tinyMCE.get()[0].execCommand("mceInsertContent",false,embed);
		row = $(row);
		row.addClass('clicked');
		row.children('div').animate({opacity : 0.5}, {duration: 75, queue: false});
	}

	function getMedia() {
		mcore.pendingRequest = true;
		mcore.currentRequest = $.ajax({
			url : mcore.url,
			data: mcore.jsonData,
			crossDomain : true,
			dataType : 'jsonp',
			jsonpCallback: 'mcorejsonpcallback',
			timeout: 2500,
			error: function(xhr, status, error){
				mcore.showMessage('connection-error');
				console.log('Error connecting to ' + mcore.url);
				console.log(error);
				mcore.state = 'connection-error';
			},
			success: function() {
				mcore.state = 'connected';
			}
		});
		mcore.currentRequest.done(function(){
			mcore.pendingRequest = false;
		});
	}
	
	function clearSearch(){
		delete mcore.jsonData['search'];
		mcore.jsonData['offset'] = 0;
		mcore.currPage = 1;
		mcore.searching = false;
		mcore.clearContent();
		getMedia();
	}

	function parseUrl(url) {
		slash = url.indexOf('/');
		// incorrect url or no http:// (https://)
		if (slash != 5 && slash != 6) url = 'http://' + url;

		// Check if there's a trailing slash
		if (url.charAt(url.length-1) != '/') url += '/api/media';
		else url += 'api/media;';

		return url;
	}

	function formatTime(time) {
		temp = time.split(' ');
		timeString = temp[0] + 'T' + temp[1] + 'Z';
		return jQuery.timeago(timeString);
	}

	function formatDuration(duration) {
		hours = null;
		minutes = Math.floor(duration/60);
		if (minutes > 60) {
			hours = Math.floor(minutes/60);
			seconds = duration - (minutes * 60) - (hours * 360);
		}
		else {
			seconds = duration - (minutes * 60);
		}
		seconds = String('00' + seconds).slice(-2);
		minutes = String('00' + minutes).slice(-2);
		if (hours) {
			return hours + ':' + minutes + ':' + seconds;
		}
		else {
			return minutes + ':' + seconds;
		}
	}
})(jQuery);

function mcorejsonpcallback(data){
	mcore.data = data;
	mcore.initContent(data);
}

  
