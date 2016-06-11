'use strict';
namespace wsproj.client {

  export function createOnlineStatusUI() {
    var s = 12;
    var r = 5;
    var $ui = setSVGSize(createSVGElement('svg'), s, s);
    var $cir = createSVGElement('circle').attr({
      cx: s / 2, cy: s / 2, r : r, stroke : 'none'})
    $ui.append($cir);
    function setOnline(online : boolean) {
      $cir.attr('fill', online? '#00ff00' : '#cccccc');
    }
    setOnline(false);
    return {
      $ui : $ui,
      setOnline : setOnline
    }
  }
}
