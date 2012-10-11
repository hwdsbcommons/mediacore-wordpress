<?php
/*
	Plugin Name: MediaCore
	Plugin URI: http://mediacore.com
	Description: MediaCore's plugin allows you to embed any videos publicly accessible on your MediaCore site.
	Version: 1.1
	Author: MediaCore
	Author URI: http://mediacore.com
	License: GPL2
	
	
	Copyright 2012  MediaCore  (email: info@mediacore.com)

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License, version 2, as 
    published by the Free Software Foundation.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program; if not, write to the Free Software
    Foundation, Inc., 51 Franklin St, Fifth Floor, Boston, MA  02110-1301  USA
*/

function mcore_embed_js($plugin_array) {
   $plugin_array['mcore'] = plugins_url().'/mediacore/mcore_embed_button.js';
   return $plugin_array;
} 


function mcore_embed_button($buttons) {
    array_push($buttons, 'mcore');
    return $buttons;
}

function mcore_embed_tinymce_init($options) {
	// Without this, the allowfullscreen attributes will be stripped by TinyMCE,
	// breaking HTML5 fullscreen in our player.
	$iframeRule = 'iframe[src|width|height|frameborder|allowfullscreen|mozallowfullscreen|webkitallowfullscreen]';
	if (isset($options['extended_valid_elements'])) {
		$options['extended_valid_elements'] .= ',' . $iframeRule;
	} else {
		$options['extended_valid_elements'] = $iframeRule;
	}
	return $options;
}

function mcore_embed_init() {
	if (is_admin()) {
		// Ensure that the user is allowed to post the iframe tag in a page/blog post.
		// Most admins don't appear to need this, but better to be explicit.
		$allowedposttags['iframe'] = array(
			'src' => array(),
			'width' => array(),
			'height' => array(),
			'frameborder' => array(),
			'allowfullscreen' => array(),
			'mozallowfullscreen' => array(),
			'webkitallowfullscreen' => array()
		);

		add_filter('mce_buttons', 'mcore_embed_button', 0);
		add_filter('mce_external_plugins', 'mcore_embed_js');
		add_filter('tiny_mce_before_init', 'mcore_embed_tinymce_init');

		wp_enqueue_script('jquery');
    	wp_deregister_script( 'timeago' );
    	wp_register_script( 'timeago', 'http://timeago.yarp.com/jquery.timeago.js');
    	wp_enqueue_script( 'timeago' );
		
		$mcore_style_url =  plugins_url() . '/mediacore/mcore_embed.css';
		wp_register_style('mcore_embed_style', $mcore_style_url);
		wp_enqueue_style('mcore_embed_style');
		wp_register_script('mcore_embed.js', plugins_url() . '/mediacore/mcore_embed.js', array('jquery'));
		wp_enqueue_script('mcore_embed.js');
	}
}

function mcore_embed_head_init() {
	if (is_admin()){
		$mcore_url = get_option('mcore_url');
		echo '<script type="text/javascript">var global_mcore_url = "' . $mcore_url . '";</script>';	
	}
}

function mcore_options_page(){

	$mcore_url = get_option('mcore_url');
    $hidden_field_name = 'mcore_submit_hidden';

    $mcore_settings_style_url =  plugins_url() . '/mediacore/mcore_embed_settings.css';
	wp_enqueue_style('mcore_embed_settings_style', $mcore_settings_style_url);

    ?>

	<div class="wrap">
		<div class="icon32" id="mcore-logo"></div>
		<h2>MediaCore</h2>
		<?php
		    if (isset($_POST[ $hidden_field_name ]) && $_POST[ $hidden_field_name ] == 'Y') {
		    	if(isset($_POST[ 'mcore_url' ])) {
		    		$new_url = $_POST[ 'mcore_url' ];
				    update_option('mcore_url', $new_url);
		?>
				    <div id="message" class="updated fade">
						<p>
							<strong><?php _e('MediaCore URL updated to: ' . $new_url , 'att_trans_domain' ); ?></strong>
						</p>
					</div>
		<?php
		    	}
		    }
		    $mcore_url = get_option('mcore_url');
		?>
		<form name="att_img_options" method="post" action="<?php echo str_replace( '%7E', '~', $_SERVER['REQUEST_URI']); ?>">
  			<input type="hidden" name="<?php echo $hidden_field_name; ?>" value="Y">
  			<p>MediaCore's plugin allows you to embed any videos publicly accessible on your mediacore site. Simply enter your MediaCore domain below and click the MediaCore icon in the Wordpress text editor to view your MediaCore library. You can then easily and quickly embed your MediaCore media in Wordpress pages and posts.</p>
  			<h3>MediaCore URL</h3>
			<p>Your current MediaCore URL is: <input type="text" name="mcore_url" class="mcore-url" value="<?php echo $mcore_url ?>"></input></p>
			<p>To change your URL, just click in the blue box and enter your MediaCore domain.</p>
  			<p class="submit">
  				<input type="submit" value="Save Changes" name="submit" id="submit" class="button-primary" />
  			</p>
  		</form>
	</div>
<?php
	
}

function mcore_embed_init_options(){
	add_options_page('MediaCore Media Embed', 'MediaCore', 8, 'mediacore', 'mcore_options_page');
}
	
//add_action('plugins_loaded', 'mcore_embed_init');
add_action('admin_init', 'mcore_embed_init');
add_action('admin_head', 'mcore_embed_head_init');
add_action('admin_menu', 'mcore_embed_init_options');


/* 
	Implement the shortcode API; takes the shortcode attributes and turns them
	into the correct iframe embed code. i.e.:

	[mediacore link="http://demo.mediacore.tv/media/bctia-demoday-2012" width="560px" height="315px"]

*/
function mcore_shortcode_handler($atts) {
        extract( shortcode_atts( array(
                'link' => 'http://demo.mediacore.tv/media/introducing-the-new-mediacore',
                'width' => '560px',
                'height' => '315px'
        ), $atts ) );

        $embedcode = "<iframe src=\"" . $link . "/embed_player?iframe=True\"";
        $embedcode .= " width=\"" . $width . "\"";
        $embedcode .= " height=\"" . $height . "\"";
        $embedcode .= " mozallowfullscreen=\"mozallowfullscreen\"";
        $embedcode .= " webkitallowfullscreen=\"webkitallowfullscreen\"";
        $embedcode .= " allowfullscreen=\"allowfullscreen\"";
        $embedcode .= " scrolling=\"no\"";
        $embedcode .= " frameborder=\"0\"";
        $embedcode .= "></iframe>";
        return $embedcode;
}
add_shortcode( 'mediacore', 'mcore_shortcode_handler' );

?>
