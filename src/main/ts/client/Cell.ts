'use strict';
namespace wsproj.client {

  export function createCell(
    column : DataColumn, applyDecoration : ($target : JQuery) => void
  ) {
    return setupCell(createCellInternal(createCellStyle(column) ),
      applyDecoration);
  }

  export function setupCell(
    $td : JQuery, applyDecoration : ($target : JQuery) => void
  ) {

    var _value = '';
    var _title = '';
    var _comment = '';
    var _readonly = false;
    var _eventEnabled = true;
    var _css = parseStyle($td.attr('style') );

    var _$commentSymbol : JQuery = null;

    function setValue(value : string) {
      value = value || '';
      if (_value != value) {
        _value = value;
        _$label.text(_value || NBSP);
        applyDecoration(_$label);
        triggerCellStateChange();
      }
    }

    function getValue() {
      return _value;
    }

    function setTitle(title : string) {
      if (_title != title) {
        _title = title;
        _$label.attr('title', _title);
      }
    }

    function setComment(comment : string) {
      comment = comment || '';
      if (_comment != comment) {
        _comment = comment;
        showCommentSymbol(!!_comment);
      }
    }

    function showCommentSymbol(visible : boolean) {
      if (visible) {
        if (_$commentSymbol == null) {
          _$commentSymbol = createCommentSymbol();
          _$td.append($('<div></div>').
            css('float', 'right').
            css('position', 'relative').
            append(_$commentSymbol) );
        } else {
          _$commentSymbol.css('display', '');
        }
      } else {
        if (_$commentSymbol != null) {
          _$commentSymbol.css('display', 'none');
        }
      }
    }

    function getComment() {
      return _comment;
    }

    function setReadonly(readonly : boolean) {
      if (_readonly != readonly) {
        _readonly = readonly;
        triggerCellStateChange();
      }
    }

    function isReadonly() {
      return _readonly;
    }

    function getAlign() {
      return _css['text-align'];
    }

    function setCss(key : string, value : string) {
      value = value || '';
      _css[key] = _css[key] || '';
      if (_css[key] != value) {
        _css[key] = value;
        _$td.css(key, value);
      }
    }

    function setEventEnabled(eventEnabled : boolean) {
      _eventEnabled = eventEnabled;
    }

    function triggerCellStateChange() {
      if (_eventEnabled) {
        _$td.trigger('cellStateChange');
      }
    }

    var _$td = $td.data('controller', {
        setValue : setValue,
        getValue : getValue,
        setTitle : setTitle,
        setEventEnabled : setEventEnabled,
        setComment : setComment,
        getComment : getComment,
        setReadonly : setReadonly,
        isReadonly : isReadonly,
        getAlign : getAlign,
        setCss : setCss
      });

    var _$label = $(_$td.children()[0]);

    return _$td;
  }

  function createCommentSymbol() {
    return setSVGSize(createSVGElement('svg'), 5, 5).
      css('position', 'absolute').css('right',
        -styleConsts.cellPadding + 'px').css('top', '0px').
      append(createSVGElement('path').
        attr('d', 'M 0 0 L 5 0 L 5 5 Z').
        attr('stroke', 'none').attr('fill', '#ff0000') );
  }

  var cellCache : { [style : string] : JQuery } = {};

  function createCellInternal(style : string) {
    var $cellFactory : JQuery = cellCache[style];
    if (!$cellFactory) {
      $cellFactory = $(createCellHTML(style) );
      cellCache[style] = $cellFactory;
    }
    return $cellFactory.clone();
  }

  export function createCellHTML(style : string) {
    return '<td style="' + style + '"><span class="wsproj-label">' +
       NBSP + '</span></td>';
  }

  export function createCellStyle(column : DataColumn) {
    var align = column.dataType == 'number'? 'right' : 'left';
    var style = '';
    style += 'padding-left:' + styleConsts.cellPadding + 'px;';
    style += 'padding-right:' + styleConsts.cellPadding + 'px;';
    style += 'text-align:' + align + ';';
    if (column.minWidth) {
      style += 'min-width:' + column.minWidth + 'px;';
    }
    return style;
  }

  function parseStyle(style : string) {
    var css : { [key : string] : string } = {};
    var kvs = style.split(/;/g);
    for (var i = 0; i < kvs.length; i += 1) {
      var kv = kvs[i].split(/[:\s]+/g);
      if (kv.length == 2 && kv[0] && kv[1]) {
        css[kv[0]] = kv[1];
      }
    }
    return css;
  }
}
