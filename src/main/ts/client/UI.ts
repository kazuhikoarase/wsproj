'use strict';
namespace wsproj.client {

  export function createSVGElement(tagName : string) {
    return $(document.createElementNS(
        'http:/' + '/www.w3.org/2000/svg', tagName) );
  }

  export function setSVGSize(svg : JQuery,
      width : number, height : number) {
    return svg.attr({
      version: '1.1',
      width: width, height: height,
      viewBox: '0 0 ' + width + ' ' + height
    });
  }

  export function createVerticalLabel($target : JQuery, text : string) {
    var svg = createSVGElement('svg');
    var $text = createSVGElement('text').text(text);
    svg.append($text);
    $target.append(svg);
    var bbox = (<any>$text[0]).getBBox();
    svg.remove();
    $text.attr('transform',
        'translate(' + -bbox.y + ',' + (bbox.width - bbox.x) + ')' +
        ' rotate(-90)');
    var w = bbox.height;
    var h = bbox.width;
    return setSVGSize(svg, w, h);
  }

  export function createButton(label : string) {
    return $('<span></span>').
      addClass('wsproj-button').
      css('margin', '0px 0px 0px 4px').
      css('display', 'inline-block').
      css('float', 'right').
      text(label);
  }

  export function createFilterButton() {
    var defaultColor = '#333333';
    var _filtered = false;
    var _sortOrder : string = null;
    var $path = createSVGElement('path').
      attr('stroke', 'none').attr('fill', defaultColor).
      attr('d', 'M 1 1 L 6 10 L 11 1 Z');
    function setFiltered(filtered : boolean) {
      _filtered = filtered;
      update();
    }
    function setSortOrder(sortOrder : string) {
      _sortOrder = sortOrder;
      update();
    }
    function update() {
      $btn.children().remove();
      if (_filtered) {
        $btn.append(createSVGElement('path').
          attr('stroke', 'none').attr('fill', defaultColor).
          attr('d', 'M 5 4 L 8 7 L 8 12 L 11 12 L 11 7 L 14 4 Z') );
        if (_sortOrder == null) {
          $btn.append(createSVGElement('path').
            attr('stroke', 'none').attr('fill', defaultColor).
            attr('d', 'M 0 8 L 3 12 L 6 8 Z') );
        }
      } else if (_sortOrder == null) {
        $btn.append(createSVGElement('path').
          attr('stroke', 'none').attr('fill', defaultColor).
          attr('d', 'M 1 4 L 7 11 L 13 4 Z') );
      } else {
        $btn.append(createSVGElement('path').
          attr('stroke', 'none').attr('fill', defaultColor).
          attr('d', 'M 4 5 L 9 11 L 14 5 Z') );
      }

      if (_sortOrder != null) {
        $btn.append(createSVGElement('path').
          attr('stroke', defaultColor).attr('fill', 'none').
          attr('d', 'M 3 2 L 3 12') );
        if (_sortOrder == SortOrder.ASC) {
          $btn.append(createSVGElement('path').
            attr('stroke', defaultColor).attr('fill', 'none').
            attr('d', 'M 1 5 L 3 2 L 5 5') );
        } else {
          $btn.append(createSVGElement('path').
            attr('stroke', defaultColor).attr('fill', 'none').
            attr('d', 'M 1 9 L 3 12 L 5 9') );
        }
      }
    }

    var $btn = setSVGSize(createSVGElement('svg'), 15, 15).
      attr('class', 'wsproj-dropdown-button').
      data('controller', {
        setFiltered: setFiltered,
        setSortOrder: setSortOrder
      });
    update();
    return $btn;
  }

  export function createSelector() {
    var $rect = createSVGElement('rect').
        attr({x: 0, y: 0, width: 12, height: 12}).
        attr('stroke-width', '1').attr('stroke', '#333333').
        attr('fill', 'none');
    var _selected = false;
    function setSelected(selected : boolean) {
      _selected = selected;
      $rect.attr('fill', _selected? '#999999' : 'none');
    }
    function isSelected() {
      return _selected;
    }
    return setSVGSize(createSVGElement('svg'), 12, 12).
      attr('class', 'wsproj-selector').
      append($rect).
      data('controller', {
        setSelected: setSelected,
        isSelected: isSelected
      });
  }

  export function createCheckbox() {
    var defaultColor = '#333333';
    var $path = createSVGElement('path').
        attr('d', 'M 2 5 L 5 9 L 10 3').
        attr('stroke-width', '2').attr('stroke', defaultColor).
        attr('fill', 'none');
    var _checked = true;
    function setColor(color : string) {
      $path.attr('stroke', color || defaultColor);
    }
    function setChecked(checked : boolean) {
      _checked = checked;
      $path.css('display', _checked? '' : 'none');
    }
    function isChecked() {
      return _checked;
    }
    return setSVGSize(createSVGElement('svg'), 12, 12).
      attr('class', 'wsproj-checkbox').
      append($path).
      append(createSVGElement('rect').
        attr({x: 0, y: 0, width: 12, height: 12}).
        attr('stroke-width', '1').attr('stroke', '#333333').
        attr('fill', 'none') ).
      data('controller', {
        setColor: setColor,
        setChecked: setChecked,
        isChecked: isChecked
      });
  }

  export function createMenu(items : any[]) {

    var $menu = $('<div></div>').
      addClass('wsproj-dropdown').
      css('position', 'absolute').
      css('cursor', 'default');

    $.each(items, function(i : number, item : any) {
      $menu.append($('<div></div>').
        text(item.label).
        addClass('wsproj-label').
        css('white-space', 'nowrap').
        css('padding', '2px 4px 2px 4px').
        on('mousedown', function(event) {
          event.preventDefault();
          $menu.trigger('menuItemSelected', item);
          dispose();
        }) );
    });

    function dispose() {
      if ($menu != null) {
        $('BODY').
          off('keydown', keydownHandler).
          off('mousedown', mousedownHandler);
        $menu.remove();
        $menu = null;
      }
    }
    function keydownHandler() {
      dispose();
    }
    function mousedownHandler() {
      dispose();
    }
    $('BODY').append($menu).
      on('keydown', keydownHandler).
      on('mousedown', mousedownHandler);
    return $menu;
  }

  export function createCheckboxUI(label : string,
      applyDecoration : ($target : JQuery) => void) {
    var $chk = createCheckbox().css('vertical-align', 'middle');
    var $label = $('<span></span>').
        css('margin', '0px 0px 0px 2px').
        css('vertical-align', 'middle').
        css('display', 'inline-block').
        css('white-space', 'nowrap').
        attr('title', label).
        text(label);
    applyDecoration($label);
    return $('<div></div>').
      addClass('wsproj-label').
      css('padding', '0px 2px 0px 2px').
      css('white-space', 'nowrap').
      append($chk).append($label).
      data('controller', $chk.data('controller') );
  }
}
