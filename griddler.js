/* 
    griddler
    Tiny, grid-based data editor.

    Lasha Tavartkiladze
    2014-11-24

    http://griddler.elva.org
*/


(function () {

    //
    // Create a Griddler object.
    //
    function create(options) {
        if (!Array.isArray(options.columns)) {
            throw new Error('You should provide `columns` array for Griddler to work.');
        }

        var g = {
            containerEl: document.getElementById(options.containerId || 'griddler-container'),
            buttonEl:    document.getElementById(options.buttonId || 'griddler-button'),
            tableEl:     document.createElement('table'),
            columns:     options.columns,
            data:        options.data || []
        };
        
        g.tableEl.setAttribute('class', 'griddler-table');
        g.tableEl.appendChild(createTableHeader(g.columns));
        g.tableEl.appendChild(createTableRows(g.columns, g.data));

        eventify(g);
        historify(g);
        setEventhandlers(g);

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
    function setEventhandlers(self) {
        setCellEditingEvents(self);
        setCellSelectionEvents(self);
    }

    //
    // Reference to a currently active Griddler instance,
    // in case there's more than one table on a page.
    //
    var activeInstance;







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
            tr.setAttribute('class', 'gtr-' + rowIndex);
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

        td.setAttribute('class', 'gtd gtd-visible gtd-' + cellIndex + ' gtr-' + rowIndex + '-gtd-' + cellIndex);
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


    //
    // Set selection events.
    //
    function setCellSelectionEvents(self) {
        disableDefaultSelection(self);

        var selection = self.selection = createSelectionObject();
        var cells     = self.cells = self.cells || self.tableEl.getElementsByClassName('gtd-visible');

        addEventListener(cells, 'mousedown', function (e) {
            selection.selecting = true;
            activeInstance = self;

            selection.startRow  = selection.endRow  = parseInt(this.getAttribute('data-row'),  10);
            selection.startCell = selection.endCell = parseInt(this.getAttribute('data-cell'), 10);

            selectCells(self);
        });

        addEventListener(cells, 'mouseover', function (e) {
            if (selection.selecting) {     
                selection.endRow  = parseInt(this.getAttribute('data-row'), 10);
                selection.endCell = parseInt(this.getAttribute('data-cell'), 10);

                selectCells(self);
            }
        });

        // Finish selection on mouseup event.
        document.addEventListener('mouseup', function (e) {
            selection.selecting = false;
        });
    }

    //
    // Create a selection object with optional values or empty otherwise.
    //
    function createSelectionObject(values) {
        values = values || {};

        return {
            selecting: false,
            startRow:  values.startRow  || 0,
            startCell: values.startCell || 0,
            endRow:    values.endRow    || 0,
            endCell:   values.endCell   || 0
        };
    }

    //
    // Disable browser's default selection on each <th> and <td>
    //
    function disableDefaultSelection(self) {
        var headerCells = self.tableEl.getElementsByClassName('gth');
        var dataCells   = self.tableEl.getElementsByClassName('gtd');

        addEventListener(headerCells, 'mousedown', preventDefaultAction);
        addEventListener(dataCells, 'mousedown', preventDefaultAction);
    }

    //
    // Single reference on a preventDefault() function.
    //
    function preventDefaultAction(e) {
        if (!this.getAttribute('contenteditable')) {
            e.preventDefault();
        }
    }

    //
    // Figure out which cells are selected based on row/cell index values 
    // and set corresponding CSS class to each.
    //
    function selectCells(self) {
        cssClass(self.cells).remove('gtd-selected');

        var rowIndexes  = orderIndexes(self.selection.startRow, self.selection.endRow);
        var cellIndexes = orderIndexes(self.selection.startCell, self.selection.endCell);

        var rowIndex;
        var cellIndex;
        var cells;

        for (rowIndex = rowIndexes.start; rowIndex <= rowIndexes.end; rowIndex += 1) {
            for (cellIndex = cellIndexes.start; cellIndex <= cellIndexes.end; cellIndex += 1) {
                cells = self.tableEl.getElementsByClassName('gtr-' + rowIndex + '-gtd-' + cellIndex);
                cssClass(cells).add('gtd-selected');
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
    // CELL EDITING
    //

    //
    // Set edit/update events for each data cell.
    //
    function setCellEditingEvents(self) {
        var cells = self.cells = self.cells || self.tableEl.getElementsByClassName('gtd-visible');
        var delButtons = self.tableEl.getElementsByClassName('gtr-delete-button');

        function clearOtherCells(currentCell) {
            var length = cells.length;
            var i;

            for (i = 0; i < length; i += 1) {
                if (cells[i] !== currentCell) {
                    removeCssClass(cells[i], 'gtd-editing');
                    cells[i].removeAttribute('contenteditable');
                    cells[i].blur();
                }
            }
        }

        addEventListener(cells, 'click', function (e) {
            clearOtherCells(this);
        });
 
        addEventListener(cells, 'dblclick', function (e) {
            clearOtherCells(this);

            addCssClass(this, 'gtd-editing');
            this.setAttribute('contenteditable', true);
            this.focus();
        });
 
        addEventListener(cells, 'blur', function (e) {
            removeCssClass(this, 'gtd-editing');
            this.removeAttribute('contenteditable');

            var attrData = this.getAttribute('data-value');
            var cellData = this.innerHTML;
 
            if (cellData !== attrData) {
                // Temporarily assing old data for history entry.
                this.innerHTML = attrData;
                self.history.add(self.tableEl.innerHTML);

                // Assign new data and fire the update event.
                this.setAttribute('data-value', cellData);
                this.innerHTML = cellData;

                var tr = this.parentNode;
                addCssClass(tr, 'gtr-updated');
                self.fire('update', this, [grabRowData(tr)]);
            }
        });

        addEventListener(delButtons, 'click', function (e) {
            if (confirm('Are you sure you want to delete this row?')) {
                var tr = this.parentNode.parentNode;
                addCssClass(tr, 'gtr-deleted');
                self.fire('delete', tr, [grabRowData(tr)]);
            }
        });

        if (self.buttonEl) {
            addEventListener(self.buttonEl, 'click', onSave);
        }
    }

    //
    // Select all key/value pairs from each cell and turn them into an object.
    //
    function grabRowData(tr) {
        if (!tr) { return; }

        var data  = {};
        var cells = tr.getElementsByClassName('gtd');

        var length = cells.length;
        var i;
        var elem;
        var name;

        for (i = 0; i < length; i += 1) {
            elem = cells[i];
            name = elem.getAttribute('data-name');

            if (name) {
                data[name] = elem.getAttribute('data-value');
            }
        }
 
        return data;
    }








    //
    // COPY/PASTE
    //


    //
    // Paste cells from source selection to the target selection.
    // This is a Excel like copy/paste algorithm and it needs REFACTORING!
    //
    function copyCellsFromSourceToTarget(self) {
        var source  = self.copiedSelection;
        var target  = self.selection;

        // How many times source rows fit in the target rows.
        var targetRowDiff = Math.abs(target.endRow - target.startRow) + 1;
        var sourceRowDiff = Math.abs(source.endRow - source.startRow) + 1;
        var rowDiffNum    = quotient(targetRowDiff, sourceRowDiff);

        // How many times source cells fit in the target cells.
        var targetCellDiff = Math.abs(target.endCell - target.startCell) + 1;
        var sourceCellDiff = Math.abs(source.endCell - source.startCell) + 1;
        var cellDiffNum    = quotient(targetCellDiff, sourceCellDiff);

        // Reorder indexes.
        var sourceRowIndexes  = orderIndexes(source.startRow, source.endRow);
        var sourceCellIndexes = orderIndexes(source.startCell, source.endCell);
        var targetRowIndexes  = orderIndexes(target.startRow, target.endRow);
        var targetCellIndexes = orderIndexes(target.startCell, target.endCell);

        var sourceRows  = dublicateRange(sourceRowIndexes.start, sourceRowIndexes.end, rowDiffNum);
        var sourceCells = dublicateRange(sourceCellIndexes.start, sourceCellIndexes.end, cellDiffNum);

        sourceRows.forEach(function (rowIndex) {
            var cIndex = targetCellIndexes.start;

            var row = self.tableEl.getElementsByClassName('gtr-' + targetRowIndexes.start);
            cssClass(row).add('gtr-updated');
            
            sourceCells.forEach(function (cellIndex) {
                var sourceCell = 'gtr-' + rowIndex + '-gtd-' + cellIndex;
                var sourceContent = self.tableEl.getElementsByClassName(sourceCell)[0].innerHTML;
                var targetCell = 'gtr-' + targetRowIndexes.start + '-gtd-' + cIndex;
                self.tableEl.getElementsByClassName(targetCell)[0].innerHTML = sourceContent;
                
                cIndex += 1;
            });
            targetRowIndexes.start += 1;
        });
    }

    //
    // Crete an array of numbers between provided range and dublicate it "n" times.
    //
    // For example: dublicateRange(2, 5, 3)
    // Will create a range [2, 3, 4, 5] and repeat it 3 times.
    // => [2, 3, 4, 5, 2, 3, 4, 5, 2, 3, 4, 5]
    //
    function dublicateRange(start, end, n) {
        var nums = [];

        while (n) {
            n -= 1;

            for (var i = start; i <= end; i += 1) {
                nums.push(i);
            }
        }

        return nums;
    }

    //
    // Get a quotient between two numbers.
    // If it's less then 1, return 1.
    //
    function quotient(a, b) {
        var q = parseInt(a / b, 10);
        return q && q >= 1 ? q : 1;
    }







    //
    // KEYBOARD EVENTS
    //


    //
    // Set global keyboard event handlers.
    //
    // Only way to differentiate on which table the event happend is
    // to track reference to an active table on a page.
    // That's what global var activeInstance; is all about.
    //
    document.addEventListener('keydown', function (e) {
        var key = String.fromCharCode(e.which).toLowerCase();

        var isCommandKey = e.metaKey || e.ctrlKey;
        var isShiftKey   = e.shiftKey;

        if (isCommandKey && isShiftKey && key === 'z') {
            e.preventDefault();
            onRedo();
        }
        else if (isCommandKey && key === 'z') {
            e.preventDefault();
            onUndo();
        }
        else if (isCommandKey && key === 'c') {
            e.preventDefault();
            onCopy();
        }
        else if (isCommandKey && key === 'v') {
            e.preventDefault();
            onPaste();
        }
        else if (isCommandKey && key === 's') {
            e.preventDefault();
            onSave();
        }
    });

    //
    // Copy command.
    //
    function onCopy() {
        var self = activeInstance;
        self.copiedSelection = createSelectionObject(self.selection);
    }

    //
    // Paste command.
    //
    function onPaste() {
        var self = activeInstance;
        self.history.add(self.tableEl.innerHTML);
        copyCellsFromSourceToTarget(self);
    }

    //
    // Undo command.
    //
    function onUndo() {
        var self = activeInstance;
        var newState = self.history.undo(self.tableEl.innerHTML);

        if (newState) {
            self.tableEl.innerHTML = newState;
            setEventhandlers(self);
        }
    }

    //
    // Redo command.
    //
    function onRedo() {
        var self = activeInstance;
        var newState = self.history.redo(self.tableEl.innerHTML);

        if (newState) {
            self.tableEl.innerHTML = newState;
            setEventhandlers(self);
        }
    }

    //
    // Save command.
    //
    function onSave() {
        if (activeInstance) {
            var self = activeInstance;

            var updatedRows = self.tableEl.getElementsByClassName('gtr-updated');
            var deletedRows = self.tableEl.getElementsByClassName('gtr-deleted');

            var dataUpdated = [];
            var dataDeleted = [];

            var updatedRowsLength = updatedRows.length;
            var deletedRowsLength = deletedRows.length;
            var i;

            for (i = 0; i < updatedRowsLength; i += 1) {
                dataUpdated.push(grabRowData(updatedRows[i]));
            }

            for (i = 0; i < deletedRowsLength; i += 1) {
                dataDeleted.push(grabRowData(deletedRows[i]));
            }

            self.fire('save', self.tableEl, dataUpdated, dataDeleted);
        }
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

        obj.fire = function (eventName, context) {
            var events = this._events[eventName];
            var dataArgs = [].slice.call(arguments, 2);

            if (events) {
                var length = events.length;
                var i;

                for (i = 0; i < length; i += 1) {
                    events[i].apply(context || this, dataArgs);
                }
            }
        };
    }

    //
    // Add history (undo/redo) capabilities to an obejct.
    //
    function historify(obj) {
        obj.history = {
            undoList: [],
            redoList: [],

            add: function (data) {
                this.undoList.push(data);
            },
            undo: function (current) {
                if (this.undoList.length > 0) {
                    this.redoList.push(current);
                    return this.undoList.pop();
                }
            },
            redo: function (current) {
                if (this.history.redoList.length > 0) {
                    this.history.undoList.push(current);
                    return this.history.redoList.pop();
                }
            },
            clean: function () {
                this.undoList = [];
                this.redoList = [];
            }
        };
    }

    //
    // Add event listener to a list of elements.
    //
    function addEventListener(elems, event, callback) {
        elems = (elems.length !== undefined) ? elems : [elems];

        for (var i = 0, length = elems.length; i < length; i += 1) {
            elems[i].addEventListener(event, callback);
        }
    }

    //
    // Add/Remove CSS class to a list of elements.
    //
    function cssClass(elems) {
        elems = (elems.length !== undefined) ? elems : [elems];

        return {
            add: function (className) {
                for (var i = 0, length = elems.length; i < length; i += 1) {
                    addCssClass(elems[i], className);
                }
            },
            remove: function (className) {
                for (var i = 0, length = elems.length; i < length; i += 1) {
                    removeCssClass(elems[i], className);
                }
            }
        };
    }

    //
    // Get a current CSS classes for an element.
    //
    function getCssClass(elem) {
        return elem.getAttribute('class').replace(/[\s]+/g, ' ');
    }

    //
    // Add a single CSS class to the element.
    //
    function addCssClass(elem, className) {
        if (elem.classList !== undefined) {
            elem.classList.add(className);
        } else {
            var currentClasses = getCssClass(elem);

            if (currentClasses.indexOf(className) === -1) {
                elem.setAttribute('class', currentClasses + ' ' + className);
            }
        }
    }

    //
    // Remove a single CSS class from elements.
    //
    function removeCssClass(elem, className) {
        if (elem.classList !== undefined) {
            elem.classList.remove(className);
        } else {
            var currentClasses = getCssClass(elem);

            if (currentClasses.indexOf(className) !== -1) {
                elem.setAttribute('class', currentClasses.replace(className, ''));
            }
        }
    }

})();