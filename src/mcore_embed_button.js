(function() {
    tinymce.create('tinymce.plugins.mcore', {
        init : function(ed, url) {
            ed.addButton('mcore', {
                title : 'MediaCore',
                image : url+'/mcore-icon.png',
                onclick : function() {
                	mcore.openMcoreEmbed();
                }
            });
        },
        createControl : function(n, cm) {
            return null;
        },
        getInfo : function() {
            return {
                longname : "MediaCore Media Embed",
                author : 'MediaCore',
                authorurl : 'http://mediacore.com',
                infourl : 'http://mediacore.com',
                version : "1.0"
            };
        }
    });
    tinymce.PluginManager.add('mcore', tinymce.plugins.mcore);
})();