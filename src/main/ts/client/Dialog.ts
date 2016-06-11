'use strict';
namespace wsproj.client {

  export var openDialog = function($content : any,
      buttons : string[], title : string = '') {

    if (typeof $content == 'string') {
      $content = $('<div></div>').css('margin', '4px 0px 8px 0px').
        text($content);
    }

    var $contentPane = $('<div></div>').append($content);

    if (buttons.length > 0) {
      var $buttonPane = $('<div></div>');
      var appendButton = function(label : string) {
        $buttonPane.append(createButton(label).on('click', function(event) {
          $win.data('controller').dispose(label);
        }) );
      };
      for (var i = 0; i < buttons.length; i += 1) {
        appendButton(buttons[buttons.length - 1 - i]);
      }
      $contentPane.append($buttonPane);
    }

    function mouseDownHandler(event : JQueryEventObject) {
      if ($(event.target).closest('.wsproj-window').length == 0) {
        $win.data('controller').dispose('');
      }
    }

    var $win = openWindow($contentPane, title).on('dispose', function(event) {
      $(document).off('mousedown', mouseDownHandler);
    });
    callLater(function() {
      $(document).on('mousedown', mouseDownHandler);
    });
    return $win;
  }
}
