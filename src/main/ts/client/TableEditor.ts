'use strict';
namespace wsproj.client {

  function setVisible($ui : JQuery, visible : boolean) {
    $ui.css('display', visible? 'inline-block' : 'none');
  }

  interface CellController {
    getValue() : string
    setValue(value : string) : void
    isReadonly() : boolean
    getAlign() : string
    getComment() : string
  }

  export function createTableEditor($table : JQuery) {

    var _editing = false;
    var _enterField = false;

    var _$td : JQuery = null;
    var _$textField : JQuery = null;

    var _orgValue : string = '';
    var _readonly : boolean = false;
    var _$popup : JQuery = null;

    function controller($td : JQuery) : CellController {
      return $td.data('controller');
    }

    function showComment($cell : JQuery, comment : string) {

      var $target = $table.parent();

      function getOffset($cell : JQuery) {
        var o1 = $cell.offset();
        var o2 = $target.offset();
        o1.left -= o2.left;
        o1.top -= o2.top;
        return o1;
      }

      var off = getOffset($cell);
      var toff = getOffset($table);

      function createPopup(left : number, top : number) {

        var $label = $('<span></span>').
          addClass('wsproj-popup-label').
          css('position', 'absolute').
          css('padding', '0px 2px 0px 2px').
          css('display', 'inline-block').
          css('white-space', 'nowrap').
          css('background-color', styleConsts.commentBgColor).
          css('border', '1px solid #000000');

        parseLine(comment, function(line : string) {
          if (line == '\u0020') {
            $label.append('&#160;');
          } else if (line == '\t') {
            $label.append('&#160;&#160;&#160;&#160;');
          } else if (line == '\n') {
            $label.append($('<br/>') );
          } else {
            var $line = $('<span></span>').text(line);
            $label.append($line);
            //applyDecoration($line);
          }
        });

        var $line = setSVGSize(createSVGElement('svg'),
          left < 0? -left : left, top).
          css('position', 'absolute').append(createSVGElement('path').
            attr('d', left < 0?
                  'M 0 0 L ' + -left + ' ' + top :
                  'M 0 ' + top + ' L ' + left + ' 0').
            attr('fill', 'none').attr('stroke', '#000000') );

        if (_$popup != null) {
          _$popup.remove();
        }

        _$popup = $('<div></div>').
          css('position', 'absolute').
          css('left', (off.left + $cell.outerWidth() ) + 'px').
          css('top', off.top + 'px').
          append($('<div></div>').css('position', 'relative').
            append($line).append($label) );
        $target.append(_$popup);

        if (left < 0) {
          $line.css('top', -top + 'px').css('left', left + 'px');
          $label.css('top', -top + 'px').
            css('left', (-$label.outerWidth() + left + 1) + 'px');
        } else {
          $line.css('top', -top + 'px').css('left', '0px');
          $label.css('top', -top + 'px').
            css('left', (left - 1) + 'px');
        }
      }

      var dx = 14;
      var dy = 10;
      createPopup(dx, dy);

      var maxWidth = $target.parent().scrollLeft() +
        $target.parent().outerWidth();
      //var maxWidth = toff.left + $table.outerWidth();
      var $label = _$popup.find('.wsproj-popup-label');
      var d = maxWidth - (off.left + $cell.outerWidth() +
        dx + $label.outerWidth() );
      if (d < 0) {
        createPopup(-dx, $label.outerHeight() + dy);
      }
    }

    $table.on('mousedown', function(event) {
        var $target = $(event.target);
        var $td = $target.closest('TD');
        if ($td.length == 1 &&
            $target.closest('INPUT').length == 0 &&
            $target.closest('A').length == 0 &&
            event.which == 1) {
          event.preventDefault();
          beginEdit($td, true);
        }
      }).on('mouseover', function(event) {
        var $td = $(event.target).closest('TD');
        if ($td.length == 1) {
          var comment = controller($td).getComment();
          if (comment) {
            showComment($td, comment);
          }
        }
      }).on('mouseout', function(event) {
        var $td = $(event.target).closest('TD');
        if ($td.length == 1) {
          if (_$popup != null) {
            _$popup.remove();
            _$popup = null;
          }
        }
      });

    function cellStateChangeHandler(event : JQueryEventObject) {
      var ctrl = controller(_$td);
      _orgValue = ctrl.getValue();
      _readonly = ctrl.isReadonly();
      _$textField.val(_orgValue).prop('readonly', _readonly);
    }

/*
    function getCellPos($td : JQuery) {
      return {
        rowIndex : $td.parent().index(),
        colIndex : $td.index()
      };
    }
*/
    function beginEdit($td : JQuery, userOp : boolean) {

      if (_editing) {
/*
        var curPos = getCellPos(_$td);
        var newPos = getCellPos($td);
        if (curPos.rowIndex == newPos.rowIndex &&
            curPos.colIndex == newPos.colIndex) {
          console.log('remain...');
          return;
        }
*/
        endEdit();
      }

      if (_$td != null) {
        _$td.off('cellStateChange', cellStateChangeHandler);
        _$textField.remove();
      }

      _$td = $td;
      _$textField = createTextField();
      _$td.append(_$textField);
      _$td.on('cellStateChange', cellStateChangeHandler);

      var width = _$td.outerWidth() - styleConsts.cellPadding * 2 - 1;

      setEditing(true);

      _$td.trigger('cellStateChange');
      _$textField.css('text-align', controller(_$td).getAlign() ).
        css('width', width + 'px').
        focus().select();
      $td.trigger('beginEdit', { userOp : userOp });
    }

    function endEdit() {
      if (!_editing) { return; }
      setEditing(false);
      var value = removeInvalidChars(trim(_$textField.val() ) );
      if (value.length > MAX_CELL_VALUE) {
        value = value.substring(0, MAX_CELL_VALUE);
        _$textField.val(value);
      }
      if (_orgValue != value) {
        controller(_$td).setValue(value);
        _$td.trigger('valueChange', {value : value});
      }
      _$td.trigger('endEdit');
    }

    function setEditing(editing : boolean) {
      _editing = editing;
      _enterField = false;
      setVisible(_$textField, _editing);
      setVisible(_$td.children('.wsproj-label'), !_editing);
    }

   function createTextField() {
      return $('<input type="text"/>').
        addClass('wsproj-editor').
        css('display', 'none').
        on('blur change', function(event) {
          endEdit();
        }).on('mousedown', function(event) {
          if (_readonly) {
            return;
          }
          if (_editing) {
            _enterField = true;
          }
        }).on('keydown', function(event) {
          if (_readonly) {
            return;
          }
          if (!_editing) {
            return;
          }
          if (event.keyCode == DOM_VK.ESCAPE) {
            event.preventDefault();
            $(this).val(_orgValue).select();
            _enterField = false;
          }
          if (_enterField) {
            if (event.keyCode == DOM_VK.UP ||
                event.keyCode == DOM_VK.DOWN ||
                event.keyCode == DOM_VK.LEFT ||
                event.keyCode == DOM_VK.RIGHT) {
              event.stopPropagation();
            }
          } else {
            if (event.keyCode == DOM_VK.F2) {
              event.preventDefault();
              event.stopPropagation();
              var val = $(this).val();
              $(this).val('').val(val);
              _enterField = true;
            }
          }
        });
    }

    return {
      beginEdit : beginEdit,
      endEdit : endEdit
    }
  }
}
