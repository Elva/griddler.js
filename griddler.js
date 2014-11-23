(function () {

    //
    // GRIDDLER
    //


    //
    // Create a Griddler object.
    //
    function create(options) {
        if (!Array.isArray(options.columns)) {
            throw new Error('You should provide `columns` array for Griddler to work.');
        }

        var g = {
            containerEl: document.getElementById(options.containerId || 'griddler-container'),
            tableEl:     document.createElement('table'),
            columns:     options.columns,
            data:        options.data || []
        };
        
        g.tableEl.setAttribute('class', 'griddler-table');
        g.tableEl.appendChild(createTableHeader(g.columns));
        g.tableEl.appendChild(createTableRows(g.columns, g.data));

        eventify(g);
        setEventhandlers(g.tableEl);

        g.containerEl.setAttribute('class', options.containerCssClass || 'griddler-container');
        g.containerEl.appendChild(g.tableEl);

        return g;
    }

    //
    // Public interface.
    //
    window.Griddler = { 
        create: create 
    };

    //
    // Set event handlers on the Griddler table.
    //
    function setEventhandlers(tableEl) {
        // setDataCellEvents(tableEl);
        setCellSelectionEvents(tableEl);
        // setKeyboardEvents(tableEl);
    }







    //
    // TABLE HEADER
    //


    //
    // Create a table header with the provided columns array.
    //
    // <thead>
    //   <tr>
    //     <th></th>
    //     <th></th>
    //     <th></th>
    //   </tr>
    // </thead>
    //
    function createTableHeader(columns) {
        var thead = document.createElement('thead');
        var tr    = document.createElement('tr');

        tr.appendChild(createIndexHeaderCell());

        var length = columns.length;
        var i;
        var cellIndex;
        var column;

        for (i = 0, cellIndex = 1; i < length; i += 1) {
            column = columns[i];

            if (column.type !== 'hidden') {
                tr.appendChild(createHeaderCell(column.th, cellIndex));
                cellIndex += 1;
            }
        }

        thead.appendChild(tr);
 
        return thead;
    }

    //
    // Create an empty <th> element for "index" column.
    //
    function createIndexHeaderCell() {
        var th = document.createElement('th');
        th.setAttribute('class', 'gth gth-index');
        return th;
    }

    //
    // Create a <th> element with title.
    //
    function createHeaderCell(title, cellIndex) {
        var th = document.createElement('th');

        th.setAttribute('class', 'gth gth-' + cellIndex);
        th.appendChild(document.createTextNode(title));

        return th;
    }







    //
    // TABLE ROWS
    //


    //
    // Create a table body with provided data.
    //
    // <tbody>
    //   <tr>
    //     <th></th>
    //     <th></th>
    //     <th></th>
    //   </tr>
    //   <tr>
    //     <th></th>
    //     <th></th>
    //     <th></th>
    //   </tr>
    // </tbody>
    //
    function createTableRows(columns, data) {
        var tbody = document.createElement('tbody');

        var columnsLength = columns.length;
        var dataLength = data.length;
        var i;
        var j;
        var rowIndex;
        var cellIndex;
        var row;
        var column;
        var tr;
        var name;
        var value;

        for (i = 0, rowIndex = 1; i < dataLength; i += 1, rowIndex += 1) {
            row = data[i];

            tr = document.createElement('tr');
            tr.appendChild(createIndexRowCell(rowIndex));

            for (j = 0, cellIndex = 1; j < columnsLength; j += 1) {
                column = columns[j];
                name   = column.name;
                value  = row[name];

                if (column.type === 'hidden') {
                    tr.appendChild(createHiddenDataCell(name, value));
                } else {
                    tr.appendChild(createDataCell(name, value, rowIndex, cellIndex));
                    cellIndex += 1;
                }
            }

            tbody.appendChild(tr);
        }

        return tbody;
    }

    //
    // Create a <td> element which is used as "index" cell and has a delete button inside it.
    //
    function createIndexRowCell(rowIndex) {
        var td = document.createElement('td');

        td.setAttribute('class', 'gtd gtd-index');
        td.appendChild(document.createTextNode(rowIndex));
        td.appendChild(createDeleteButton());

        return td;
    }

    //
    // Create a <span> element which will be used as row deletion button.
    //
    function createDeleteButton() {
        var span = document.createElement('span');

        span.setAttribute('class', 'gtr-delete-button');
        span.setAttribute('title', 'Delete Row');
        span.appendChild(document.createTextNode('x'));

        return span;
    }

    //
    // Create a hidden <td> data cell element.
    //
    function createHiddenDataCell(name, value) {
        var td = document.createElement('td');

        td.setAttribute('class', 'gtd gtd-hidden');
        td.setAttribute('data-name', name);
        td.setAttribute('data-value', value);

        return td;
    }

    //
    // Create a <td> data cell element.
    // These are the element the user can select and copy/paste.
    //
    function createDataCell(name, value, rowIndex, cellIndex) {
        var td = document.createElement('td');

        td.setAttribute('class', 'gtd gtd-visible gtr-' + rowIndex + ' gtd-' + cellIndex);
        td.setAttribute('data-row', rowIndex);
        td.setAttribute('data-cell', cellIndex);
        td.setAttribute('data-name', name);
        td.setAttribute('data-value', value);
        td.appendChild(document.createTextNode(value));

        return td;
    }







    //
    // SELECTION
    //
    var selection = {
        selecting: false,
        startRow:  0,
        startCell: 0,
        endRow:    0,
        endCell:   0
    };


    //
    // Set selection events.
    //
    function setCellSelectionEvents(tableEl) {
        disableSelectionOnHeaderAndIndexCells(tableEl);
        
        tableEl._cells = tableEl._cells || tableEl.getElementsByClassName('gtd-visible');

        var length = tableEl._cells.length;
        var i;
        var cell;

        for (i = 0; i < length; i += 1) {
            cell = tableEl._cells[i];

            cell.addEventListener('mousedown', function (e) {
                var td = this;

                console.log(this);

                // Disbale browser's default selection.
                e.preventDefault();

                // Start the selection.
                selection.selecting = true;

                // Set row/cell index values.
                selection.startRow  = selection.endRow  = parseInt(td.getAttribute('data-row'),  10);
                selection.startCell = selection.endCell = parseInt(td.getAttribute('data-cell'), 10);

                selectCells(tableEl, selection);
            });

            cell.addEventListener('mouseover', function (e) {
                // Handle mousover only if user is selecting cells.
                if (selection.selecting) {
                    var td = this;
     
                    selection.endRow  = parseInt(td.getAttribute('data-row'), 10);
                    selection.endCell = parseInt(td.getAttribute('data-cell'), 10);

                    selectCells(tableEl, selection);
                }
            });
        }

        // Finish selection on mouseup event.
        document.addEventListener('mouseup', function (e) {
            selection.selecting = false;
        });
    }

    //
    // Disable selection on <th> elements and on index <td> elements
    //
    function disableSelectionOnHeaderAndIndexCells(tableEl) {
        var headerCells = tableEl.getElementsByClassName('gth');
        var indexCells  = tableEl.getElementsByClassName('gtd-index');
        var i;

        function preventMousedown(e) {
            e.preventDefault();
        }

        for (i = 0; i < headerCells.length; i += 1) {
            headerCells[i].addEventListener('mousedown', preventMousedown);
        }

        for (i = 0; i < indexCells.length; i += 1) {
            indexCells[i].addEventListener('mousedown', preventMousedown);
        }
    }

    //
    // Figure out which cells are selected based on row/cell index values 
    // and set corresponding CSS class to each.
    //
    function selectCells(tableEl, selection) {
        var length = tableEl._cells.length;
        var i;
        var cell;
        var classNames;

        for (i = 0; i < length; i += 1) {
            cell = tableEl._cells[i];

            if (cell) {
                classNames = cell.getAttribute('class');

                if (classNames.indexOf('gtd-selected') !== -1) {
                    cell.setAttribute('class', classNames.replace('gtd-selected', ''));
                }
            }
        }

        var rowIndexes  = orderIndexes(selection.startRow, selection.endRow);
        var cellIndexes = orderIndexes(selection.startCell, selection.endCell);

        for (var rowIndex = rowIndexes.start; rowIndex <= rowIndexes.end; rowIndex += 1) {
            for (var cellIndex = cellIndexes.start; cellIndex <= cellIndexes.end; cellIndex += 1) {
                var cellSelector = '.gtr-' + rowIndex + '.gtd-' + cellIndex;
                var cells = tableEl.querySelectorAll(cellSelector);

                for (i = 0; i < cells.length; i += 1) {
                    cell = cells[i];
                    classNames = cell.getAttribute('class');

                    if (classNames.indexOf('gtd-visible') !== -1) {
                        cell.setAttribute('class', classNames + ' gtd-selected');
                    }
                }
            }
        }
    }

    //
    // Take two indexes (numbers) and return them in order from smaller to bigger.
    // If they're equal, just return them.
    //
    // This is used for handling different directions during the selection:
    // If user selects rows from bottom to top, selection.endRow (b) will be smaller than selection.startRow (a)
    // If user selects cells from right to left, selection.endCell (b) will be smaller than selection.startCell (a)
    // In above cases, we need to reverse the order so we can properly do for() loop over rows and cells.
    //
    function orderIndexes(a, b) {
        return (a > b) ? { start: b, end: a } : { start: a, end: b };
    }







    //
    // HELPERS
    //


    //
    // Add simple event emitting functionality to an object.
    //
    function eventify(obj) {
        obj._events = [];

        obj.on = function (eventName, callback) {
            this._events[eventName] = this._events[eventName] || [];
            this._events[eventName].push(callback);
        };

        obj.fire = function (eventName, data, context) {
            var events = this._events[eventName];
            var length = events.length;
            var i;

            for (i = 0; i < length; i += 1) {
                events[i].call(context || this, data);
            }
        };
    }

    //
    // Format a string.
    //
    // str('Hello {0} and {1}', 'Lola', 'Nicole')
    // => Hello Lola and Nicole
    //
    function strFormat(s) {
        var values = [].slice.call(arguments, 1);
        var length = values.length;
        var i;
        var regex;

        for (i = 0; i < length; i += 1) {
            regex = new RegExp('\\{' + i + '\\}', 'gi');
            s = s.replace(regex, values[i]);
        }

        return s;
    }

})();