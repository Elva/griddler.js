# griddler.js

Tiny, grid-based data editor in ~500 lines of pure Javascript.   
No jQuery required.  
https://elva.github.io/griddler.js

## Quick Start

```html
<!DOCTYPE html>
<html>
<head>
    <title>Book List</title>
    <link rel="stylesheet" type="text/css" href="griddler.css" />
</head>
<body>
    <div id="book-list"></div>

    <script src="griddler.js"></script>
    <script>

        var griddler = Griddler.create({
            containerId: 'book-list',
            columns: [
                { name: 'bookId', type: 'hidden' },
                { name: 'title',  th: 'Book' },
                { name: 'year',   th: 'Year' },
                { name: 'author', th: 'Author' }
            ],
            data: [
                { 
                    bookId: 7,
                    title: 'On the Road',
                    year: 1957,
                    author: 'Jack Kerouac'
                },
                { 
                    bookId: 8,
                    title: 'Fight Club',
                    year: 1999,
                    author: 'Chuck Palahniuk'
                },
                { 
                    bookId: 9,
                    title: 'The Dreamers',
                    year: 1988,
                    author: 'Gilbert Adair'
                }
            ]
        });


        griddler.on('update', function (rows) {
            // List of updated rows.
            console.log(rows);
        });

        griddler.on('delete', function (rows) {
            // List of deleted rows.
            console.log(rows);
        });

        griddler.on('save', function (updatedRows, deletedRows) {
            // Lists of updated and deleted rows.
            console.log(updatedRows, deletedRows);
        });
    </script>
</body>
</html>
```
